#!/usr/bin/env python3
"""
Python fallback for the jq snippets in jq-snippets.md.

Use when `jq` is not available on the host. Implements the same
operations the SKILL invokes during Phases 2–4. Python 3 stdlib only —
no external dependencies.

Each subcommand mirrors a specific jq snippet. See jq-snippets.md for
the canonical reference.

Usage:
  python3 jq-fallback.py severity     <scan.json>           # §1 — severity counts
  python3 jq-fallback.py totals       <scan.json>           # §2 — total + distinct counts
  python3 jq-fallback.py top5-ids     <scan.json>           # §3 — top-5 distinct vuln IDs (one per line)
  python3 jq-fallback.py top5-table   <scan.json>           # §4+§6 — top-5 markdown table
  python3 jq-fallback.py full-table   <scan.json>           # §5+§6 — full per-match markdown table
  python3 jq-fallback.py vuln         <scan.json> <id>      # §7 — trimmed per-vuln JSON (stdout)
  python3 jq-fallback.py related-cve  <scan.json> <id>      # §8 — first CVE in relatedVulnerabilities
  python3 jq-fallback.py empty-check  <scan.json>           # §9 — exit 0 if non-empty, 1 if empty

The sort key matches the jq snippets exactly:
  risk DESC  →  cvss_max DESC  →  severity-bucket ASC  →  id ASC
with null-safe fallbacks for missing fields.
"""

import json
import re
import sys


SEV_ORDER = ["Critical", "High", "Medium", "Low", "Negligible"]
SEV_RANK = {sev: i for i, sev in enumerate(SEV_ORDER)}


def _load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _cvss_max(vuln):
    scores = []
    for entry in (vuln.get("cvss") or []):
        m = (entry or {}).get("metrics") or {}
        s = m.get("baseScore")
        if isinstance(s, (int, float)):
            scores.append(s)
    return max(scores) if scores else 0


def _project(m):
    v = m.get("vulnerability") or {}
    a = m.get("artifact") or {}
    fix = v.get("fix") or {}
    return {
        "id": v.get("id"),
        "risk": v.get("risk") or 0,
        "severity": v.get("severity"),
        "cvss_max": _cvss_max(v),
        "description": v.get("description") or "",
        "purl": a.get("purl"),
        "fix_versions": fix.get("versions") or [],
        "fix_state": fix.get("state"),
    }


def _sort_key(rec):
    # matches jq: sort_by(-.risk, -.cvss_max, sev_rank(.severity), .id)
    return (
        -(rec.get("risk") or 0),
        -(rec.get("cvss_max") or 0),
        SEV_RANK.get(rec.get("severity"), 99),
        rec.get("id") or "",
    )


def _truncate(s, n):
    # mirror jq: gsub("\n";" ") | .[0:n]
    if s is None:
        return ""
    return str(s).replace("\n", " ")[:n]


def _md_table(rows, headers):
    out = ["| " + " | ".join(headers) + " |",
           "| " + " | ".join(["---"] * len(headers)) + " |"]
    for r in rows:
        cells = [str(c).replace("|", "\\|") for c in r]
        out.append("| " + " | ".join(cells) + " |")
    return "\n".join(out)


# --- subcommands ---------------------------------------------------------

def cmd_severity(scan):
    counts = {sev: 0 for sev in SEV_ORDER}
    for m in scan.get("matches", []):
        sev = (m.get("vulnerability") or {}).get("severity")
        if sev in counts:
            counts[sev] += 1
    for sev in SEV_ORDER:
        print(f"{sev}: {counts[sev]}")


def cmd_totals(scan):
    matches = scan.get("matches", [])
    ids = {(m.get("vulnerability") or {}).get("id")
           for m in matches
           if (m.get("vulnerability") or {}).get("id")}
    print(f"total_matches: {len(matches)}")
    print(f"distinct_vulns: {len(ids)}")


def cmd_top5_ids(scan):
    projected = [_project(m) for m in scan.get("matches", [])]
    seen = set()
    deduped = []
    for rec in sorted(projected, key=_sort_key):
        if rec["id"] and rec["id"] not in seen:
            seen.add(rec["id"])
            deduped.append(rec)
    for rec in deduped[:5]:
        print(rec["id"])


def cmd_top5_table(scan):
    projected = [_project(m) for m in scan.get("matches", [])]
    # group by id, keep first record's fields, accumulate PURLs
    by_id = {}
    for rec in projected:
        vid = rec["id"]
        if not vid:
            continue
        if vid not in by_id:
            by_id[vid] = {**rec, "purls": []}
        if rec["purl"]:
            by_id[vid]["purls"].append(rec["purl"])
    for rec in by_id.values():
        rec["purls"] = sorted(set(rec["purls"]))

    headers = ["VulnID", "Risk", "Severity", "CVSS", "PURL(s)", "Fix", "Description"]
    rows = []
    for rec in sorted(by_id.values(), key=_sort_key)[:5]:
        purls = rec["purls"]
        if len(purls) <= 2:
            purl_str = ", ".join(purls)
        else:
            purl_str = ", ".join(purls[:2]) + f" …(+{len(purls) - 2})"
        fix = ", ".join(rec["fix_versions"]) if rec["fix_versions"] else "-"
        rows.append([
            rec["id"],
            rec["risk"],
            rec["severity"] or "",
            rec["cvss_max"],
            purl_str,
            fix,
            _truncate(rec["description"], 80),
        ])
    print(_md_table(rows, headers))


def cmd_full_table(scan):
    projected = [_project(m) for m in scan.get("matches", [])]
    headers = ["VulnID", "Risk", "Severity", "CVSS", "PURL", "Fix", "Description"]
    rows = []
    for rec in sorted(projected, key=_sort_key):
        fix = ", ".join(rec["fix_versions"]) if rec["fix_versions"] else "-"
        rows.append([
            rec["id"],
            rec["risk"],
            rec["severity"] or "",
            rec["cvss_max"],
            rec["purl"] or "",
            fix,
            _truncate(rec["description"], 120),
        ])
    print(_md_table(rows, headers))


def cmd_vuln(scan, vuln_id):
    # Slim schema — see jq-snippets.md §7 for what's kept vs dropped
    # and why. Stays in sync with the jq variant.
    ms = [m for m in scan.get("matches", [])
          if (m.get("vulnerability") or {}).get("id") == vuln_id]
    if not ms:
        print("null")
        return
    head = ms[0].get("vulnerability") or {}
    cvss_arr = head.get("cvss") or []
    cvss0 = cvss_arr[0] if cvss_arr else {}
    out = {
        "id": head.get("id"),
        "severity": head.get("severity"),
        "cvss_vector": cvss0.get("vector"),
        "cvss_score": (cvss0.get("metrics") or {}).get("baseScore"),
        "cwes": sorted({(c or {}).get("cwe")
                        for c in (head.get("cwes") or [])
                        if (c or {}).get("cwe")}),
        "fix": head.get("fix"),
        "advisory_urls": head.get("urls"),
        "data_source": head.get("dataSource"),
        "artifacts": [
            {
                "purl": (m.get("artifact") or {}).get("purl"),
                "name": (m.get("artifact") or {}).get("name"),
                "version": (m.get("artifact") or {}).get("version"),
                "type": (m.get("artifact") or {}).get("type"),
                "language": (m.get("artifact") or {}).get("language"),
                "locations": [
                    (loc or {}).get("path")
                    for loc in ((m.get("artifact") or {}).get("locations") or [])
                ],
            }
            for m in ms
        ],
    }
    print(json.dumps(out, indent=2))


def cmd_related_cve(scan, vuln_id):
    for m in scan.get("matches", []):
        if (m.get("vulnerability") or {}).get("id") != vuln_id:
            continue
        for rel in (m.get("relatedVulnerabilities") or []):
            rid = (rel or {}).get("id") or ""
            if rid.startswith("CVE-"):
                print(rid)
                return
    # nothing found — silent (matches jq behavior of empty output)


def cmd_empty_check(scan):
    sys.exit(0 if scan.get("matches") else 1)


SUBCOMMANDS = {
    "severity":     (cmd_severity, 0),
    "totals":       (cmd_totals, 0),
    "top5-ids":     (cmd_top5_ids, 0),
    "top5-table":   (cmd_top5_table, 0),
    "full-table":   (cmd_full_table, 0),
    "vuln":         (cmd_vuln, 1),
    "related-cve":  (cmd_related_cve, 1),
    "empty-check":  (cmd_empty_check, 0),
}


def main():
    argv = sys.argv[1:]
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        sys.exit(0)
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(2)

    cmd = argv[0]
    scan_path = argv[1]
    extra = argv[2:]

    if cmd not in SUBCOMMANDS:
        print(f"unknown subcommand: {cmd}\n", file=sys.stderr)
        print(__doc__, file=sys.stderr)
        sys.exit(2)

    fn, n_extra = SUBCOMMANDS[cmd]
    if len(extra) != n_extra:
        print(f"{cmd} expects {n_extra} extra arg(s), got {len(extra)}", file=sys.stderr)
        sys.exit(2)

    scan = _load(scan_path)
    fn(scan, *extra) if n_extra else fn(scan)


if __name__ == "__main__":
    main()
