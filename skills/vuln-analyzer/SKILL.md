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
is an **internal verification gate**, not user-facing output.

- **On pass** — proceed to the next step. Say nothing about the
  checkpoint. The user should never see strings like `CHECKPOINT 1
  passed ✅` or `↳ checkpoint 2 OK` or any similar status line. The
  checkpoint numbers exist only in this file as documentation for
  you; they are not labels to echo.
- **On fail** — emit exactly the documented failure message for that
  checkpoint, then take the documented action (STOP / ASK / continue
  with a logged warning). Failure output is the only time a
  checkpoint surfaces to the user.

The only user-visible output of a phase is the explicit render it
documents (e.g., Phase 1's `Scanning: <target>` line, Phase 3's
severity counts and top-5 table, Phase 4's per-vuln synthesis
blocks, Phase 5's closeout). Everything else is silent verification.

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

## Phase 4 — Deep analysis fan-out (top 5, in parallel)

The five top vulns are independent — each gets its own context file
and its own advisory fetch, and there's no shared state. Run them
**concurrently**, not serially.

### Step 1 — Write all five context files first

Extract the top-5 distinct vuln IDs (snippet §3). For each
`$VULN_ID`, write its trimmed context to
`$OUT_DIR/vuln_<VULN_ID>.json` via snippet §7.

**CHECKPOINT 8 — every context file written AND is a real object.**
For each of the 5:
- `[ -s "$OUT_DIR/vuln_${VULN_ID}.json" ]` (file is non-empty), AND
- `jq -e 'type == "object"' "$OUT_DIR/vuln_${VULN_ID}.json" >/dev/null`
  (content is a JSON object, not the literal `null` that snippet §7
  emits when the id-filter matched nothing).
- ❌ Either fails → print `Skipping <VULN_ID>: context-file
  <missing | empty | not-an-object>.` and **drop that id from the
  dispatch set**. Continue building the others.

### Step 2 — Dispatch all surviving vulns in one message (parallel)

Issue all `Task(vulnerability-analyzer)` calls **in a single message
turn**, one per surviving id. The harness runs them concurrently.

Each Task prompt:

```
Task(
  subagent_type="vulnerability-analyzer",
  prompt=<<<
    Vulnerability id: <VULN_ID>
    Per-vuln context file: <skill_root>/.cache/vuln_<VULN_ID>.json
    Scan target (resolved): <resolved-target-from-Phase-1>
    Project root for reachability search: <abs path of the dir: scan target>
    Return your final synthesis block (see Step 6 of vulnerability-analyzer.md
    "Synthesize one block"). The 3 sub-agents are yours to dispatch.
  >>>
)
```

(Single-message multi-Task is the same pattern the lead agent itself
uses for its 3 sub-agents — same mechanism, applied here for the 5
top vulns.)

### Step 3 — Collect, then emit IN SORT ORDER

Wait for all dispatched Tasks to return. Then emit the synthesis
blocks **in the same risk-sorted order as the top-5 table** —
**not** in the order they happen to arrive back. The user reads the
table and the syntheses as a paired list; arrival-order would be
confusing.

**CHECKPOINT 9 — per-vuln synthesis received.** Evaluate each
returned Task independently:
- ✅ Returned a synthesis block starting with `### <VulnID>` →
  buffer it for the sort-ordered emit in Step 3.
- ❌ Returned the validator's rejection sentence (shouldn't happen
  — we passed a real id) → log one line `Analyzer rejected
  <VULN_ID>: <returned text>.` Buffer a small placeholder block for
  that id so the sort-ordered output still has all five rows
  accounted for.
- ❌ Task errored out → log one line `Analyzer failed for
  <VULN_ID>: <reason>.` Same placeholder treatment.

**CHECKPOINT 10 — overall success rate.**
- Track the count of full successes across the 5. If 0/5 succeeded,
  surface a one-line warning so the user knows the inline output is
  degraded.
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
