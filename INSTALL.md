# Installing vuln-analyzer

This package adds one **skill** and four **agents** to Claude Code or
Cursor. Once installed, your AI assistant can scan a codebase
(`scan for vulnerabilities`) or analyze a single advisory id
(`analyze CVE-…`) directly.

The whole install is one command:

```bash
./install.sh                  # Claude Code, user-level (default)
./install.sh --cursor         # Cursor, user-level
./install.sh --project /path  # Claude Code, project-local at /path/.claude
./install.sh --cursor --project /path   # Cursor, project-local at /path/.cursor
./install.sh --force          # Overwrite foreign files of the same name at the destination
```

**Conflict policy in one line:** `install.sh` refuses to overwrite any
agent or skill in the destination that wasn't put there by a previous
vuln-analyzer install. Other agents and skills (different names) are
**never** touched. See §2 for details.

---

## 1. Prerequisites

### Platform

A POSIX shell environment. Specifically:

| Platform | Status |
| --- | --- |
| macOS | ✅ Works out of the box. |
| Linux | ✅ Works out of the box. |
| Windows (WSL) | ✅ Use Claude Code / Cursor inside WSL. |
| Windows (native cmd / PowerShell) | ⚠️ Not supported. Use WSL or git-bash. |

### Required binaries

```bash
bash --version     # 3.2+; pre-installed on macOS / Linux / WSL
date --version     # any (GNU or BSD); pre-installed
python3 --version  # 3.8+; pre-installed on macOS / Linux / most WSL distros
```

`jq` is **strongly recommended** but not strictly required — the skill
ships with a Python-stdlib-only fallback at
`skills/vuln-analyzer/references/jq-fallback.py` that implements the
same operations with byte-identical output. Install jq if you can:

| OS | Install command |
| --- | --- |
| macOS | `brew install jq` |
| Debian/Ubuntu | `sudo apt install jq` |
| Fedora/RHEL | `sudo dnf install jq` |
| Arch | `sudo pacman -S jq` |
| Windows WSL | use the Linux command for your WSL distro |

`awk` is needed only when `jq` is present (the awk one-liner converts
TSV to Markdown). The Python fallback handles markdown internally —
no awk needed when jq is absent.

### grype MCP server

The skill calls a tool named `mcp__grype__scan`. You need the grype
MCP server configured in your AI assistant.

Install instructions:
**https://github.com/romansok/grype-mcp/blob/main/README-MCP.md**

Verify it's registered by asking your AI assistant: *"list available
MCP tools"* — you should see `mcp__grype__scan`.

### Claude Code or Cursor

- **Claude Code**: install per https://docs.claude.com/claude-code
- **Cursor**: install per https://cursor.com

---

## 2. Install

### Quick: user-level into Claude Code

```bash
git clone https://github.com/romansok/vuln-analyzer.git
cd vuln-analyzer
./install.sh
```

Output (target dir shown for confirmation):

```
Installing vuln-analyzer
  tool:        claude
  destination: /Users/you/.claude

  ✓ copied 4 agents -> /Users/you/.claude/agents/
  ✓ copied skill 'vuln-analyzer' -> /Users/you/.claude/skills/vuln-analyzer

Done. Restart claude, then try:
    analyze GHSA-whpj-8f3w-67p5
    scan ~/some/repo for vulnerabilities
```

Restart Claude Code (`/exit`, then relaunch).

### Cursor

```bash
./install.sh --cursor
```

Installs to `~/.cursor/agents/` and `~/.cursor/skills/vuln-analyzer/`
instead. Restart Cursor.

> ℹ️ Cursor's skill discovery may evolve. If your version doesn't pick
> the skill up at `~/.cursor/skills/`, check Cursor's current docs for
> the canonical skill / sub-agent path. The SKILL.md and agent .md
> files are portable — only the install location changes. You can
> re-target by editing `install.sh` or by copying the files manually.

### Project-local instead of user-level

When you want the skill checked-in with a specific repo (so teammates
get it via `git pull`):

```bash
./install.sh --project /absolute/path/to/your/repo
# or for Cursor:
./install.sh --cursor --project /absolute/path/to/your/repo
```

This writes into `<path>/.claude/` or `<path>/.cursor/`. Then open
Claude Code / Cursor from inside that repo.

### What if the destination already has agents and skills?

The script is deliberately careful:

- **Agents and skills with names different from ours** (e.g. your own
  `code-reviewer.md`, your own skill called `my-things`) are **never**
  touched — neither by default nor with `--force`.
- **Agents named `vulnerability-analyzer.md`, `reachability-analyzer.md`,
  `context-analyzer.md`, `remediation-analyzer.md`, or a skill called
  `vuln-analyzer`** — the script first checks whether they came from a
  previous run of this same installer (it leaves a sentinel file
  `.vuln-analyzer.installed` in the destination, and also checks the
  SKILL.md's `name:` line). If so, the script treats the run as an
  **upgrade** and overwrites cleanly without asking. If the files were
  put there by something else (your own work, a different package),
  the script **aborts without changes** and lists the conflicts.
- Pass **`--force`** if you actually want to overwrite foreign files
  of the same name. Useful when you've forked or hand-modified our
  agents and now want to revert. Even with `--force`, only the
  named-collision files are replaced — everything else stays intact.

### Optional: skip permission prompts (Claude Code only)

By default, the skill triggers Claude Code's permission prompt on each
new Bash command (`jq`, `awk`, `date`, `python3`) and each new
WebFetch host. To pre-approve them, copy or merge:

```
settings/claude-permissions.json
```

into your Claude Code settings file:

- User-level: `~/.claude/settings.json`
- Project-local: `<project>/.claude/settings.json`

The reference file uses Claude Code's standard `permissions.allow`
schema. If your settings file already exists, merge the `allow` arrays
rather than overwriting.

(Cursor uses its own permission model — see Cursor's docs.)

---

## 3. Verify the install (smoke test)

### Test 1 — standalone analyzer

Open Claude Code or Cursor anywhere. Ask:

```
analyze GHSA-whpj-8f3w-67p5
```

You should see the `vulnerability-analyzer` agent kick in, validate
the GHSA id, fetch the GitHub advisory, and return a synthesis block
that looks like:

```
### GHSA-whpj-8f3w-67p5 — vm2 sandbox-escape vulnerability …
**Bug class:** CWE-74
**Impact in this codebase:** …
**Reachable?** Source not available — no project root provided.
**What to do:**
  1. Bump vm2 to 3.9.18.
  2. <workaround>
**Why it matters (10s explanation):** …
**Confidence:** Medium — would be High with a project to grep.
```

### Test 2 — full skill flow

Open Claude Code or Cursor in a real project (anything with a
`package.json`, `requirements.txt`, `go.mod`, etc.). Ask:

```
scan for vulnerabilities
```

The skill should:
1. Echo back the resolved target (e.g. `Scanning: dir:/path/to/repo`).
2. Print a severity-count summary.
3. Print a top-5 markdown table.
4. If there are more than 5 findings, write
   `vulnerabilites_report_<ts>.md` in your cwd.
5. Print a deep synthesis block for the **top 2** of those (rows 3-5
   are shown in the table for awareness but not deeply analyzed;
   ask the `vulnerability-analyzer` agent directly — *"analyze
   <id>"* — for a deep analysis on any specific row).
6. Print a closeout paragraph.

### Test 3 — rejection path

```
analyze hello
```

Should return one sentence rejecting the input and dispatch no
sub-agents.

```
scan alpine:latest
```

Should be rejected with: *"This skill scans local directories only.
For image / SBOM / PURL / CPE scans, run grype directly. …"*

---

## 4. Updating

```bash
cd vuln-analyzer
git pull
./install.sh                  # or --cursor / --project as before
```

`install.sh` detects the previous vuln-analyzer install (via the
`.vuln-analyzer.installed` sentinel file or the `name:` line in the
existing `SKILL.md`), reports `↻ upgrading existing vuln-analyzer
install`, and overwrites cleanly. **No `--force` needed for upgrades.**

---

## 5. Uninstalling

```bash
# Claude Code, user-level
rm -f ~/.claude/agents/{vulnerability,reachability,context,remediation}-analyzer.md
rm -rf ~/.claude/skills/vuln-analyzer
rm -f ~/.claude/.vuln-analyzer.installed

# Cursor, user-level
rm -f ~/.cursor/agents/{vulnerability,reachability,context,remediation}-analyzer.md
rm -rf ~/.cursor/skills/vuln-analyzer
rm -f ~/.cursor/.vuln-analyzer.installed
```

For project-local installs, replace `~/.claude` / `~/.cursor` with the
project's `<path>/.claude` / `<path>/.cursor`.

---

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `jq: command not found` | Install jq (see §1), or let the skill use the bundled Python fallback (slower first-time but identical results). |
| `mcp__grype__scan` not available | Install the grype MCP server. Confirm with "list MCP tools". |
| Skill doesn't show up after `./install.sh` | Restart the AI assistant. On macOS / Linux filenames are case-sensitive — verify nothing was renamed during cloning. |
| `./install.sh` errors on `--cursor` and Cursor isn't installed | The script just copies files; it doesn't check Cursor is installed. Install Cursor first, then re-run. |
| "Scanning: …" line never appears | The skill isn't routing — the user prompt may not match the description. Try the explicit phrasing: *"run the vuln-analyzer skill on this project"*. |
| Reachability returns `source-not-available` from a skill scan | Should not happen — the skill always passes a real `dir:` to reachability. If you see this, the standalone analyzer agent ran instead of the skill (e.g., the user asked "analyze CVE-…" rather than "scan for vulnerabilities"). |
| "This skill scans local directories only" rejection | You passed an image ref, SBOM, PURL, or CPE. Run grype directly, or use the standalone analyzer agent for a specific advisory id (e.g., "analyze CVE-2024-…"). |
| Report file isn't written | Total matches ≤ 5 — by spec the file is only written when matches > 5. |
| Filename `vulnerabilites_report_…` looks misspelled | Intentional — preserved verbatim from the spec. |
| Permission prompts on every Bash / WebFetch | Optional fix: copy `settings/claude-permissions.json` into your `settings.json` (see §2 "Optional: skip permission prompts"). |
| `install.sh` aborted with "targets already exist … NOT put there by a previous vuln-analyzer install" | You already have files with names matching ours (`{vulnerability,reachability,context,remediation}-analyzer.md` or a skill called `vuln-analyzer`) that the script didn't recognize as its own. Move/rename them, OR re-run with `--force` to overwrite them. Other files in the destination are untouched either way. |

---

## 7. Package contents (this repo)

```
vuln-analyzer/
├── README.md
├── INSTALL.md                                  ← you are here
├── LICENSE
├── install.sh                                  one-command installer for Claude Code or Cursor
├── agents/                                     four agents (lead + three sub-agents)
│   ├── vulnerability-analyzer.md
│   ├── reachability-analyzer.md
│   ├── context-analyzer.md
│   └── remediation-analyzer.md
├── skills/
│   └── vuln-analyzer/
│       ├── SKILL.md                            thin orchestrator; highest authority
│       └── references/
│           ├── jq-snippets.md                  canonical jq commands
│           ├── jq-fallback.py                  Python stdlib-only fallback
│           ├── output-templates.md             markdown layouts the SKILL renders
│           ├── grype-schema-cheatsheet.md      field map for the grype JSON
│           └── cwe/
│               ├── index.md
│               └── CWE-*.md                    19 seeded playbook entries
└── settings/
    └── claude-permissions.json                 optional; Claude-only permission allowlist
```

After install, the agents and skill live under either `~/.claude/` or
`~/.cursor/` (or a project-local equivalent). Runtime artifacts
(`.cache/grype_scan_*.json`, `.cache/vuln_*.json`,
`vulnerabilites_report_*.md`) are written outside this repo.
