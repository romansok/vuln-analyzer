# Output templates

Use these verbatim. Do not improvise layout — consistency matters more
than cleverness here.

---

## Inline scan summary (printed after Phase 2 succeeds)

```
**Scan**: <target>   |   **Total matches**: <N>   |   **Distinct vulns**: <M>
**Severity**: Critical <c>, High <h>, Medium <m>, Low <l>, Negligible <n>
```

## Inline top-5 table

| VulnID | Risk | Severity | CVSS | PURL(s) | Fix | Description |
| --- | --- | --- | --- | --- | --- | --- |
| GHSA-… | 61.57 | Critical | 9.8 | pkg:npm/vm2@3.9.17 | 3.9.18 | vm2 Sandbox Escape vulnerability |
| … |

Rules:
- Sorted by risk → cvss → severity bucket → id.
- One row per distinct vuln id. PURL column joins up to 2 PURLs with "…(+N)" suffix if more.
- Fix column shows `-` when no fix version is known.

## Report file body (`vulnerabilites_report_<YYMMDD_HHMMSS>.md`)

**The file contains ONLY a markdown table — no header, no preamble, no
footer.** One row per artifact location (matches grype's natural shape so
users see every place the vulnerable package landed).

Columns: `VulnID | Risk | Severity | CVSS | PURL | Fix | Description`.

The first two lines of the file are the table header and separator. No
other content.

## Lead-agent synthesis block

**Canonical specification: see [`vulnerability-analyzer.md`](../../../agents/vulnerability-analyzer.md) §"Step 6 — Synthesize one block".**

That file owns the layout, the `What to do` branches (`bump` /
`configure` / `no-fix-available`), the verdict mapping, and the
confidence heuristic. This templates file deliberately doesn't
duplicate them — one source of truth.

The SKILL never renders synthesis blocks itself; it only appends what
the lead agent returns. So no template lives here.

## Closeout paragraph (printed after all 5 syntheses)

```
**Where to start.** <Name 1–2 specific findings and exactly what to do first, in plain English. Reference the report file path: `<absolute/path/vulnerabilites_report_<ts>.md>`. If >5 vulns, mention how many remain in the file.>
```
