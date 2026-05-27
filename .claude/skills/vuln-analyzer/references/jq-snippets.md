# Canonical jq snippets

These are the **only** ways to read the cached grype JSON. The full JSON
never enters Claude's context — everything goes through jq in Bash.

Variables expected by the snippets:
- `$SCAN_JSON` — absolute path to the cached grype scan JSON.
- `$VULN_ID` — a specific vulnerability id (CVE-… or GHSA-…).
- `$OUT_DIR`  — absolute path of `vuln-analyzer/.cache/`.

---

## 1) Severity counts (always emits all 5 buckets, including zeros)

```bash
jq -r '
  . as $r
  | ["Critical","High","Medium","Low","Negligible"]
  | map(. as $s | {sev: $s, count: ([$r.matches[] | select(.vulnerability.severity == $s)] | length)})
  | .[]
  | "\(.sev): \(.count)"
' "$SCAN_JSON"
```

Expected output (illustrative, against a 181-match fixture):
```
Critical: 24
High: 84
Medium: 68
Low: 5
Negligible: 0
```

## 2) Total counts (matches + distinct vuln ids)

```bash
jq -r '
  "total_matches: \(.matches | length)\ndistinct_vulns: \([.matches[].vulnerability.id] | unique | length)"
' "$SCAN_JSON"
```

## 3) Top-5 distinct vuln IDs by the fallback sort key

Sort key: `risk DESC, cvss_max DESC, severity_rank ASC, id ASC`. Each
field has a null-safe fallback so an entry missing one metric still sorts.

```bash
jq -r '
  def sev_rank(s):
    if s == "Critical" then 0
    elif s == "High" then 1
    elif s == "Medium" then 2
    elif s == "Low" then 3
    elif s == "Negligible" then 4
    else 5 end;

  [.matches[]
   | {
       id: .vulnerability.id,
       risk: (.vulnerability.risk // 0),
       severity: .vulnerability.severity,
       cvss_max: ([.vulnerability.cvss[]?.metrics.baseScore] | max // 0),
       description: .vulnerability.description,
       purl: .artifact.purl,
       fix_versions: (.vulnerability.fix.versions // []),
       fix_state: .vulnerability.fix.state
     }
  ]
  | sort_by(-.risk, -.cvss_max, sev_rank(.severity), .id)
  | unique_by(.id)
  | sort_by(-.risk, -.cvss_max, sev_rank(.severity), .id)
  | .[0:5]
' "$SCAN_JSON"
```

Expected order for the fixture (first 5 distinct IDs):
1. `GHSA-whpj-8f3w-67p5` — risk 61.57
2. `GHSA-g644-9gfx-q4q4` — risk 34.12
3. `GHSA-c7hr-j4mj-j2w6` — risk 33.73
4. `GHSA-cchq-frgv-rjh5` — risk 4.74
5. `GHSA-jf85-cpcp-j695` — risk 2.89

## 4) Top-5 deduped inline table rows (one row per distinct vuln; PURL is comma-joined ≤2, then "…(+N)")

```bash
jq -r '
  def sev_rank(s):
    if s == "Critical" then 0
    elif s == "High" then 1
    elif s == "Medium" then 2
    elif s == "Low" then 3
    elif s == "Negligible" then 4
    else 5 end;

  def short_purls(purls):
    if (purls|length) <= 2 then (purls|join(", "))
    else ((purls[0:2]|join(", ")) + " …(+\((purls|length)-2))") end;

  [.matches[]
   | {
       id: .vulnerability.id,
       risk: (.vulnerability.risk // 0),
       severity: .vulnerability.severity,
       cvss_max: ([.vulnerability.cvss[]?.metrics.baseScore] | max // 0),
       purl: .artifact.purl,
       fix: ((.vulnerability.fix.versions // []) | join(", ")),
       desc: (.vulnerability.description | gsub("\n";" ") | .[0:80])
     }
  ]
  | group_by(.id)
  | map({
      id: .[0].id,
      risk: .[0].risk,
      severity: .[0].severity,
      cvss_max: .[0].cvss_max,
      purls: ([.[].purl] | unique),
      fix: .[0].fix,
      desc: .[0].desc
    })
  | sort_by(-.risk, -.cvss_max, sev_rank(.severity), .id)
  | .[0:5]
  | (["VulnID","Risk","Severity","CVSS","PURL(s)","Fix","Description"] | @tsv),
    (.[] | [.id, (.risk|tostring), .severity, (.cvss_max|tostring), short_purls(.purls), (if .fix == "" then "-" else .fix end), .desc] | @tsv)
' "$SCAN_JSON"
```

## 5) Full per-match TSV (for the report file — one row per artifact location)

```bash
jq -r '
  def sev_rank(s):
    if s == "Critical" then 0
    elif s == "High" then 1
    elif s == "Medium" then 2
    elif s == "Low" then 3
    elif s == "Negligible" then 4
    else 5 end;

  .matches
  | map({
      id: .vulnerability.id,
      risk: (.vulnerability.risk // 0),
      severity: .vulnerability.severity,
      cvss: ([.vulnerability.cvss[]?.metrics.baseScore] | max // 0),
      purl: .artifact.purl,
      fix: ((.vulnerability.fix.versions // []) | join(", ")),
      desc: (.vulnerability.description | gsub("\n";" ") | .[0:120])
    })
  | sort_by(-.risk, -.cvss, sev_rank(.severity), .id)
  | (["VulnID","Risk","Severity","CVSS","PURL","Fix","Description"] | @tsv),
    (.[] | [.id, (.risk|tostring), .severity, (.cvss|tostring), .purl, (if .fix == "" then "-" else .fix end), .desc] | @tsv)
' "$SCAN_JSON"
```

## 6) Convert TSV → GitHub-flavored Markdown table (awk one-liner)

```bash
awk -F'\t' '
  NR==1 {
    n=NF;
    printf("|");
    for (i=1;i<=n;i++) printf(" %s |", $i);
    printf("\n|");
    for (i=1;i<=n;i++) printf(" --- |");
    printf("\n");
    next
  }
  {
    printf("|");
    for (i=1;i<=n;i++) {
      v=$i; gsub(/\|/,"\\|",v);
      printf(" %s |", v);
    }
    printf("\n")
  }
'
```

Use the table snippets piped through this:
```bash
jq -r '...snippet 4 or 5...' "$SCAN_JSON" | awk '...one-liner above...'
```

## 7) Per-vuln trimmed JSON (writes `.cache/vuln_<id>.json`)

> **Note on the `description` field below.** The grype JSON's `description` is typically a one-line label (e.g. `"vm2 Sandbox Escape vulnerability"`) — fine for the SKILL's human-readable table, **never used by the agents for analysis**. The lead `vulnerability-analyzer` agent fetches the real advisory text from `data_source`/`advisory_urls[]` into an in-memory `advisory_content` field and strips `description` before fanning out to sub-agents. We still emit `description` here because (a) it's harmless and (b) it's useful for human inspection of the cache file. See `.claude/agents/vulnerability-analyzer.md` §"Two kinds of 'description'".

```bash
jq --arg id "$VULN_ID" '
  .matches
  | map(select(.vulnerability.id == $id)) as $ms
  | if ($ms | length) == 0 then null
    else {
      id: $ms[0].vulnerability.id,
      severity: $ms[0].vulnerability.severity,
      risk: $ms[0].vulnerability.risk,
      description: $ms[0].vulnerability.description,
      cvss: $ms[0].vulnerability.cvss,
      epss: $ms[0].vulnerability.epss,
      cwes: $ms[0].vulnerability.cwes,
      fix: $ms[0].vulnerability.fix,
      advisory_urls: $ms[0].vulnerability.urls,
      data_source: $ms[0].vulnerability.dataSource,
      related: $ms[0].relatedVulnerabilities,
      artifacts: [$ms[] | {
        purl: .artifact.purl,
        name: .artifact.name,
        version: .artifact.version,
        type: .artifact.type,
        language: .artifact.language,
        locations: [.artifact.locations[]?.path]
      }]
    }
    end
' "$SCAN_JSON" > "$OUT_DIR/vuln_${VULN_ID}.json"
```

Note: the trimmed JSON includes `related[]` so the lead agent can recover
the Primary NVD CVSS when the main entry is GHSA-only.

## 8) Get the canonical CVE id when the match id is a GHSA

For URL building and advisory lookup, sub-agents often want the underlying
CVE if the match is a GHSA:

```bash
jq -r --arg id "$VULN_ID" '
  .matches[]
  | select(.vulnerability.id == $id)
  | .relatedVulnerabilities[]?
  | select(.id | startswith("CVE-"))
  | .id
' "$SCAN_JSON" | head -1
```

## 9) Empty-scan check (used in the SKILL's Phase-2 checkpoint)

```bash
jq -r '.matches | length' "$SCAN_JSON"
```
If `0` → SKILL prints "No vulnerabilities found." and STOPS.

---

## Python fallback (when jq is absent)

Wrapper script `references/jq-fallback.py` is **not** included by default
because jq is present on every recent macOS. If a future environment
lacks jq, replace the above with `python3 -c '...'` using `json.load`
and the standard library — no extra deps.
