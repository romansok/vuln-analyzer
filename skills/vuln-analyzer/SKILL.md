---
name: vuln-analyzer
description: Use when the user asks to scan a directory for vulnerabilities, find CVEs in a codebase, run grype on a project, or audit dependencies of a local repository. The skill scans local directories only — image refs, SBOMs, PURLs, and CPEs are rejected; for those, run grype directly or use the standalone vulnerability-analyzer agent with a specific advisory id. Ranks findings with grype's unified risk (falling back to CVSS and severity bucket), prints a top-5 markdown table inline, writes the full table to a timestamped report file when there are more than 5 findings, and dispatches the vulnerability-analyzer agent for each of the top 5 to produce a developer-readable analysis covering reachability, business impact, and remediation. Single entry point for "analyze the security of this codebase".
---

# vuln-analyzer — orchestrator

You are the conductor. You scan, rank, render, and dispatch. You
**never analyze** — that's the agents' job. Keep the JSON out of your
context.

This file is the highest authority. If anything else conflicts with
it, follow this file.

---

## Conventions used below

- `<skill_root>` = absolute path of the directory that contains this
  SKILL.md. After a typical install that's:
  - Claude Code user-level: `~/.claude/skills/vuln-analyzer/`
  - Cursor user-level:      `~/.cursor/skills/vuln-analyzer/`
  - Project-local equivalents of either.
- `<ts>` = `$(date +%y%m%d_%H%M%S)`.
- `$SCAN_JSON` = `<skill_root>/.cache/grype_scan_<ts>.json`.
- `$OUT_DIR` = `<skill_root>/.cache`.
- `$REPORT` = `$(pwd)/vulnerabilites_report_<ts>.md` (cwd = user's
  invocation directory; spelling matches the user's spec).

All jq commands referenced here are written verbatim in
[references/jq-snippets.md](references/jq-snippets.md) — copy them; do
not reinvent. If `jq` is not on the host (`command -v jq` returns
non-zero), use the Python fallback at
[references/jq-fallback.py](references/jq-fallback.py) — same
operations, byte-identical output, Python 3 stdlib only. The mapping
from jq snippet to fallback subcommand is documented at the bottom of
`jq-snippets.md`. All output layouts are in
[references/output-templates.md](references/output-templates.md). The
field map is in [references/grype-schema-cheatsheet.md](references/grype-schema-cheatsheet.md).

Each phase below ends with one or more **CHECKPOINTS**. A checkpoint
is a verification gate: if it fails, do the documented thing
(typically STOP cleanly or ASK the user) — do not paper over it.

---

## Phase 0 — Verify prerequisites

Before doing anything else, confirm the grype MCP server is connected.
Inspect your current tool list — if `mcp__grype__scan` is **not**
among the tools available to you in this session, the scan can't run.

**CHECKPOINT 0 — grype MCP available.**
- ✅ `mcp__grype__scan` is in your tool list → proceed to Phase 1.
- ❌ Not available → print exactly this message and STOP. Do not
  proceed to Phase 1, do not ask follow-up questions.

  ```
  The vuln-analyzer skill needs the grype MCP server, which isn't connected to this Claude Code session.

  Two options:
    1. Install the grype MCP server, then re-run the skill.
       See INSTALL.md (Prerequisites → grype MCP server) or
       https://github.com/romansok/grype-mcp/.
    2. Skip the scan and analyze a specific vulnerability directly
       with the vulnerability-analyzer agent. It only needs a CVE,
       GHSA, OSV, SNYK, RUSTSEC, GO, DSA, RHSA, USN, … id, or an
       advisory URL — no MCP required.
       Example: "analyze CVE-2024-1234".
  ```

## Phase 1 — Resolve scan target (directory only)

**This skill scans local directories only.** Other grype target types
(container images, SBOM files, PURLs, CPEs) are out of scope — the
purpose here is repository / codebase audits. For non-directory scans
run grype directly, or use the standalone `vulnerability-analyzer`
agent with a specific advisory id.

Parse the user's prompt for a directory:
- a filesystem path → prefix with `dir:` and resolve to absolute.
- `dir:<path>` scheme → use as-is (resolve `<path>` to absolute).

If no directory was given AND the user's cwd looks like a project root
(presence of `package.json`, `go.mod`, `requirements.txt`,
`Cargo.toml`, `Gemfile`, `pom.xml`, …): use `dir:$(pwd)`.

**CHECKPOINT 1 — directory target resolved.**
- ✅ A `dir:<abs-path>` target is in hand → proceed to Phase 2.
- ❌ Target is a non-directory (image ref like `alpine:latest` or
  `registry/org/image:tag`, an `sbom:` path, a PURL like
  `pkg:npm/...`, a CPE) → STOP with exactly this message:

  ```
  This skill scans local directories only. For image / SBOM / PURL / CPE scans, run grype directly. For a specific advisory id, ask the vulnerability-analyzer agent directly: "analyze CVE-..." or "analyze GHSA-...".
  ```

- ❌ Target ambiguous (no directory in prompt **and** cwd doesn't
  look like a project) → **ask once**: *"Which directory should I
  scan?"* — do not guess.

Set `<ts>` now, before scanning. Echo back to the user the directory
you're about to scan so they can correct if needed:

```
Scanning: <resolved-dir-target>
```

## Phase 2 — Scan

Call the MCP tool:

```
mcp__grype__scan(target=<resolved>, output_format="json")
```

Write the JSON string the tool returns to `$SCAN_JSON` via the
**Write** tool. Do not pipe it through Bash (large strings through
Bash arguments are fragile and lose newlines).

**CHECKPOINT 2 — MCP call succeeded.**
- ✅ Tool returned a JSON-shaped string → proceed.
- ❌ Tool returned an error or empty string → surface the error
  verbatim to the user (one short paragraph) and STOP. Do **not** make
  up a result.

**CHECKPOINT 3 — JSON written and parses.**
- Run `jq -e 'has("matches")' "$SCAN_JSON" >/dev/null`.
- ✅ Exit 0 → proceed.
- ❌ Non-zero exit → print `Scan output is not valid grype JSON; aborting.` + the first 200 bytes of the file, then STOP.

**CHECKPOINT 4 — empty scan.**
- Run `jq '.matches | length' "$SCAN_JSON"`.
- If `0` → print exactly: `No vulnerabilities found in <target>.` and
  STOP. Do not proceed to Phases 3–5.
- Otherwise → proceed.

## Phase 3 — Summarize, rank, render

Run, in this order:

1. Severity counts → snippet §1 of `references/jq-snippets.md`.
2. Total counts → snippet §2.
3. Top-5 distinct vulns (table rows) → snippet §4, piped to the
   awk one-liner from snippet §6 → markdown table.
4. Full per-match table → snippet §5, piped to the awk one-liner from
   §6 → markdown table written to `$REPORT` **only if** total matches
   > 5. The report file contains **only** the markdown table — no
   header, no preamble, no footer.

**CHECKPOINT 5 — jq snippets ran clean.**
- Each `jq` invocation should exit 0. If any fails, run it once more
  isolated; if still failing, print the failed command + jq's stderr
  and STOP. (This indicates a schema drift in the grype output.)

**CHECKPOINT 6 — top-5 has ≥1 row.**
- It must (matches > 0 from Checkpoint 4). If it doesn't, that's a
  bug; print the snippet output for debugging and STOP.

**CHECKPOINT 7 — report file written and is a markdown table only (>5 case).**
- Verify the file exists and is non-empty: `[ -s "$REPORT" ]`.
- Verify the first line is a markdown table header:
  `head -1 "$REPORT" | grep -q '^| VulnID '`.
- Verify the second line is the markdown table separator:
  `head -2 "$REPORT" | tail -1 | grep -q '^| --- '`.
- ✅ All three pass → proceed.
- ❌ Missing / empty / not table-shaped → print
  `Couldn't write $REPORT as a table-only file; continuing with inline
  output only.` and proceed. (Don't abort Phase 4 over the artifact.)

Render inline, using the layouts from `references/output-templates.md`:
- the scan-summary line,
- the severity-count line,
- the top-5 markdown table,
- if `$REPORT` was written, a one-line pointer: `Full report: <abs path>`.

## Phase 4 — Deep analysis fan-out (top 5)

Extract the top-5 distinct vuln IDs (snippet §3). For each `$VULN_ID`,
in order:

1. Write its trimmed context file → snippet §7 →
   `$OUT_DIR/vuln_<VULN_ID>.json`.

   **CHECKPOINT 8 — context file written AND is a real object.**
   - `[ -s "$OUT_DIR/vuln_${VULN_ID}.json" ]` (file is non-empty), AND
   - `jq -e 'type == "object"' "$OUT_DIR/vuln_${VULN_ID}.json" >/dev/null`
     (content is a JSON object, not the literal `null` that snippet §7
     emits when the id-filter matched nothing).
   - ❌ Either fails → print `Skipping <VULN_ID>: context-file
     <missing | empty | not-an-object>.` and CONTINUE with the next
     id (do not abort the whole phase).

2. Dispatch **one** `Task` call:

   ```
   Task(
     subagent_type="vulnerability-analyzer",
     prompt=<<<
       Vulnerability id: <VULN_ID>
       Per-vuln context file: <skill_root>/.cache/vuln_<VULN_ID>.json
       Scan target (resolved): <resolved-target-from-Phase-1>
       Project root for reachability search: <abs path of the dir: scan target>     // always a real path; skill never passes "none"
       Return your final synthesis block (see references/output-templates.md
       "Lead-agent synthesis block"). The 3 sub-agents are yours to dispatch.
     >>>
   )
   ```

   **CHECKPOINT 9 — synthesis received.**
   - ✅ Returned a synthesis block starting with `### <VulnID>` →
     append it verbatim to your inline output.
   - ❌ Returned the validator's rejection sentence (shouldn't happen
     — we passed a real id) → log one line `Analyzer rejected
     <VULN_ID>: <returned text>.` and CONTINUE.
   - ❌ Task errored out → log one line `Analyzer failed for
     <VULN_ID>: <reason>.` and CONTINUE.

3. Do **not** issue the next Task until this one returns. (One
   vuln-analyzer at a time keeps live sub-agent concurrency at 3 — the
   parallel fan-out inside the analyzer.)

**CHECKPOINT 10 — all top-5 attempted.**
- Track the count of successes. If 0/5 succeeded, surface that as a
  one-line warning so the user knows the inline output is degraded.
- If 1+ succeeded, that's enough to proceed to Phase 5.

## Phase 5 — Closeout

Print the closeout paragraph from `references/output-templates.md`.
Name 1–2 specific findings to act on first, with the exact bump
version where applicable. Repeat the `$REPORT` path. If some
syntheses were skipped/failed, mention that.

**CHECKPOINT 11 — closeout rendered.** Always passes. End of phase.

---

## Checkpoint summary

| # | Phase | Gate | On fail |
| --- | --- | --- | --- |
| 0 | 0 | grype MCP available (`mcp__grype__scan` in tool list) | Print install-or-standalone message; stop |
| 1 | 1 | Target resolved | Ask user once |
| 2 | 2 | MCP call returned JSON | Stop with error |
| 3 | 2 | JSON parses & has `matches[]` | Stop with error |
| 4 | 2 | `matches.length > 0` | Stop cleanly ("no vulns") |
| 5 | 3 | All jq snippets exit 0 | Stop with diagnostics |
| 6 | 3 | Top-5 has ≥1 row | Stop (bug) |
| 7 | 3 | Report file written, header is a markdown table (>5 case) | Warn, continue |
| 8 | 4 | Context file per vuln is a JSON object (not `null`) | Skip this vuln, continue |
| 9 | 4 | Synthesis block returned | Log, continue |
| 10 | 4 | ≥1 of 5 succeeded | Warn, continue |
| 11 | 5 | Closeout rendered | — |

## Hard rules

- **Never read** `$SCAN_JSON` directly into context. Everything goes
  through jq in Bash. The trimmed `.cache/vuln_<id>.json` files are
  small enough to read; the full scan is not.
- **Never improvise layout.** Use `references/output-templates.md`.
- **Never invent jq queries.** Use `references/jq-snippets.md`.
- **Preserve the filename spelling**: `vulnerabilites_report_<ts>.md`
  (this is what the user specified — do not "correct" it).
- **Report file is table-only.** No prose, no header. Just the table.
- **>5 only** for the report file. If total matches ≤ 5, skip writing
  it; the inline top-5 already shows everything.
- **Stop on empty scan** — do not run Phases 3-5.
- **One agent, one job.** You never analyze. You only orchestrate.
- **Checkpoints are mandatory.** Do not skip them, do not silently
  swallow failures — surface what failed.
