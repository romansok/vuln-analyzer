# vuln-analyzer

An agentic vulnerability analyzer for Claude Code (and Cursor). Runs a
Grype scan over a target, ranks findings by grype's unified risk, shows
a **top-5 table** in chat, and dispatches a four-agent analysis pipeline
for the **top 2** — reachability, contextualization, remediation, and a
synthesizing lead agent — to produce one developer-readable report per
vulnerability. Rows 3–5 are listed for awareness; ask the standalone
`vulnerability-analyzer` agent (e.g. `analyze GHSA-…`) for deep analysis
on any specific id.

> **Quick install:**
> ```
> git clone https://github.com/romansok/vuln-analyzer.git && cd vuln-analyzer
> ./install.sh              # Claude Code, user-level (default)
> ./install.sh --cursor     # Cursor, user-level
> ```
> See **[INSTALL.md](INSTALL.md)** for all options (project-local installs,
> permission-prompt suppression, Cursor caveats).

## Requirements

- **OS:** macOS, Linux, or Windows + WSL. Native Windows cmd / PowerShell
  is **not** supported — the skill uses POSIX shell tools.
- **Tools:** `bash` (3.2+), `date`, `python3` (3.8+) — all pre-installed on macOS / Linux / WSL.
  `jq` (1.6+) is strongly recommended; if it's missing, a bundled
  Python stdlib-only fallback (`jq-fallback.py`) handles the same
  operations with byte-identical output.
- **Client:** Claude Code or Cursor with the [grype MCP server](https://github.com/romansok/grype-mcp/)
  configured.

## How to use (once installed)

1. Open Claude Code (or Cursor) in any project. The skill and the four
   agents work from any working directory once they're installed
   user-level (see [INSTALL.md](INSTALL.md)).

2. Ask in plain English. Any of these will trigger the skill:
   - *"Scan /Users/me/repo for vulnerabilities."*
   - *"Audit dependencies in this project."* (uses your cwd)
   - *"Run grype on /path/to/project."*
   - *"Check the security of this codebase."*

   The skill scans **local directories only.** If you pass an image
   ref, SBOM, PURL, or CPE it's politely rejected with a pointer to
   running grype directly. For a specific advisory id without
   scanning, ask the `vulnerability-analyzer` agent directly instead
   (see [Standalone analyzer](#standalone-analyzer) below).

3. To analyze a single vulnerability standalone (no scan):
   - *"Analyze CVE-2023-32314."*
   - *"Tell me about GHSA-whpj-8f3w-67p5."*
   - *"Explain https://github.com/advisories/GHSA-whpj-8f3w-67p5."*

## What you'll get

- **Inline in chat:**
  - Scan summary line — target, total matches, distinct vulns.
  - Severity counts — Critical / High / Medium / Low / Negligible (all five, including zeros).
  - **Top-5 markdown table** — sorted by risk, columns: `VulnID | Risk | Severity | CVSS | PURL(s) | Fix | Description`.
  - **One synthesis block per top-2 finding**, structured for fast triage:
    - **Bug class** — the CWE(s).
    - **Attack surface** — *who* can exploit this, *from where*, *with what access* (e.g. `network (unauthenticated remote)`, `api (admin token required)`, `local (must execute on the host)`). Copy-paste-ready into a Slack message.
    - **What an attacker gets** — concrete consequence (RCE on the worker, exfil the session cookie, DoS the request handler) — not the mechanism.
    - **Reachable in this codebase?** — verdict + file:line evidence when found.
    - **What to do** — the upgrade path (bump / config-toggle / no-upstream-fix).
    - **Workaround (always emitted)** — a concrete code or config snippet you can drop in **today** when bumping is blocked (peer-dep conflict, vendored fork, EOL framework, waiting on a PR review). Code block, language-fenced, plus the cost in one sentence.
    - **Why it matters (10s explanation)** — one-line example a generalist developer follows.
    - **Confidence** — High / Medium / Low + what would raise it.
    
    Rows 3–5 in the table are not deeply analyzed by default — ask the standalone `vulnerability-analyzer` agent (`analyze <id>`) for any of them on demand.

- **On disk (only if total findings > 5):**
  - `vulnerabilites_report_<YYMMDD_HHMMSS>.md` in your invocation cwd. Contains **only** the full per-match markdown table — every artifact location for every finding. The absolute path is printed in chat.

## Architecture

```
SKILL.md (orchestrator)
  ├─ Scans with mcp__grype__scan (output_format=json)
  ├─ Caches JSON; reads it only via jq snippets
  ├─ Ranks, renders, writes the report file
  └─ Dispatches 2 × Task(vulnerability-analyzer) IN PARALLEL — one for each of the top-2 vulns
         │
         ▼
     vulnerability-analyzer (lead)   ×2 concurrent instances
       1. Validates the input (CVE / GHSA / advisory URL).
       2. Resolves vuln context (cache file, fetched URL, or self-gathered).
       3. Extracts the vulnerable symbols (functions, classes, sinks,
          config toggles) from the advisory — this is what reachability
          needs to actually search for.
       4. Fans out 3 Task calls IN PARALLEL:
            • reachability-analyzer  — receives the extracted symbols and decides how/where to grep.
            • context-analyzer       — explains the bug class in plain English (uses local CWE playbook).
            • remediation-analyzer   — primary fix + ranked workarounds, informed by the symbols.
       5. Synthesizes one developer-readable block and returns it.

  The SKILL collects both returned blocks, then emits them inline in the
  risk-sorted order of the top-5 table — first the #1 row's synthesis,
  then the #2 row's. Two-tier parallelism (2 leads × 3 sub-agents each
  = 6 concurrent sub-agents) brings wall time down to roughly the
  slowest single chain.
```

## Repository layout

Tool-agnostic source — the `install.sh` script copies these into
`~/.claude/` or `~/.cursor/` (or a project-local equivalent) depending
on the flag you pass.

```
.
├── install.sh                                Installs into Claude Code or Cursor.
├── README.md
├── INSTALL.md
├── LICENSE
├── agents/                                   The four agents (lead + three sub-agents).
│   ├── vulnerability-analyzer.md
│   ├── reachability-analyzer.md
│   ├── context-analyzer.md
│   └── remediation-analyzer.md
├── skills/
│   └── vuln-analyzer/
│       ├── SKILL.md                          Thin orchestrator. Highest authority.
│       └── references/                       Read by the skill / agents on demand.
│           ├── jq-snippets.md                Canonical jq commands.
│           ├── jq-fallback.py                Python stdlib-only fallback for jq.
│           ├── output-templates.md           Exact markdown for tables and synthesis blocks.
│           ├── grype-schema-cheatsheet.md    Field map for the grype JSON.
│           └── cwe/                          One file per seeded CWE + an index.
│               ├── index.md
│               └── CWE-20.md … CWE-1321.md
└── settings/
    └── claude-permissions.json               Optional. Claude-only. Pre-approves common Bash + WebFetch hosts.
```

After install, the agents and skill live under your AI assistant's
config directory:

- Claude Code: `~/.claude/agents/*.md` and `~/.claude/skills/vuln-analyzer/`
- Cursor:      `~/.cursor/agents/*.md` and `~/.cursor/skills/vuln-analyzer/`

Runtime artifacts (`.cache/grype_scan_<ts>.json`, `.cache/vuln_<id>.json`)
are written under the installed skill dir at scan time; the
`vulnerabilites_report_<ts>.md` is written to the user's cwd. None of
these belong in this repo.

## Sort order

Findings are ordered by, in this priority:

1. `vulnerability.risk` — grype's unified score (fuses CVSS, EPSS, KEV, fix availability). Descending.
2. Max `cvss[].metrics.baseScore`. Descending.
3. Severity bucket: Critical → High → Medium → Low → Negligible.
4. Vuln id lexicographic (full determinism on ties).

The top 5 are distinct vuln ids — same id on multiple PURLs collapses to a single row in the inline table. The report file keeps every per-artifact row.

## Standalone analyzer

The lead agent (`vulnerability-analyzer`) works **outside the skill
flow** — invoke it directly any time you want a developer-grade
analysis of a single vulnerability, without running a scan first.

It accepts natural language:

```
analyze CVE-2024-1234
what does GHSA-whpj-8f3w-67p5 mean for us?
explain RUSTSEC-2024-0001
look at https://github.com/advisories/GHSA-xxxx-xxxx-xxxx
analyze https://security-tracker.debian.org/tracker/CVE-2024-1234
```

Validation order: **URL first, id second.** If the input contains a URL,
the host must be on the allowlist; the URL becomes the sole source of
truth. Otherwise the input must look like an advisory id — any token
of the shape `<PREFIX>-<identifier>` where the prefix is uppercase
letters.

Supported id prefixes (the agent recognizes the prefix and picks the
right database):

| Prefix | Source |
| --- | --- |
| `CVE-` | MITRE / NVD |
| `GHSA-` | GitHub Security Advisories |
| `OSV-` | OSV.dev |
| `SNYK-` | Snyk |
| `PYSEC-` | Python Packaging Advisory |
| `RUSTSEC-` | Rust Security Advisory |
| `GO-` | Go vuln DB |
| `DSA-`, `DLA-` | Debian Security / Long-Term |
| `RHSA-` | Red Hat Errata |
| `USN-` | Ubuntu Security Notice |
| `ALAS-` | Amazon Linux |
| `ELSA-` | Oracle Linux |
| `ALSA-` | AlmaLinux |
| (other) | falls back to OSV → WebSearch |

Behavior by input kind:

- **Bare id** → the agent picks the canonical fetch URL for that
  prefix, gathers context, extracts vulnerable symbols, and dispatches
  the three sub-agents. Reachability returns `source-not-available`
  because there's no project root to search — context + remediation
  still produce useful output.
- **Advisory URL** → that URL is treated as the **only** source of
  truth. No other lookups.
- **Invalid / unrecognized** → a single sentence of rejection. No
  sub-agents are dispatched.

When invoked by the skill (during a scan), the same agent receives a
structured prompt with a context-file path and a project root — it
follows the same flow, but reachability has real source to grep.

## Caveats and notes

- **Cross-platform.** The skill uses `jq`, `awk`, `bash`, and `date` —
  POSIX tools available out of the box on macOS / Linux / WSL. Native
  Windows isn't supported; use WSL or git-bash. See [INSTALL.md](INSTALL.md#1-prerequisites)
  for installer commands.
- **JSON stays out of context.** The full grype JSON is written to a
  `.cache/` dir under the installed skill and only read via `jq` from
  Bash. The model never loads it.
- **Directory scans only.** The skill targets local directories
  exclusively — image refs, SBOM files, PURLs, and CPEs are rejected
  at Phase 1 with a pointer to running grype directly. The standalone
  `vulnerability-analyzer` agent (invoked outside the skill) is the
  way to analyze a specific advisory id without a scan.
- **Reachability returns `source-not-available`** only in standalone
  mode (the agent was invoked outside the skill with no project root).
  Skill scans always have a real source tree.
- **Filename spelling.** `vulnerabilites_report_<ts>.md` preserves the
  spelling from the original spec (the maintainer is aware
  "vulnerabilities" is the standard spelling).
- **Gitignore.** Add `.cache/` and `vulnerabilites_*.md` to
  `.gitignore` if this directory becomes a git repo.

## Adding a new CWE to the playbook

In this repo:

```
1. Copy the template from skills/vuln-analyzer/references/cwe/index.md (bottom).
2. Save as skills/vuln-analyzer/references/cwe/CWE-<n>.md.
3. Add a row to skills/vuln-analyzer/references/cwe/index.md.
4. Re-run ./install.sh to publish the change to your installed location.
```

The context-analyzer reads only the files relevant to each scan, so the playbook can grow indefinitely without bloating context per run.
