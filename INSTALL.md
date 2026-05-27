# Installing vuln-analyzer

This package adds one **skill** and four **agents** to Claude Code or
Cursor. Once installed, you can ask either tool to "scan for
vulnerabilities" or "analyze CVE-…" and the skill+agents take over.

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

The skill uses `jq` + `awk` + `bash` to extract data from the grype
JSON. These are POSIX tools — they're standard on macOS / Linux / WSL
but require a shim on bare Windows.

### Required binaries

```bash
bash --version         # 3.2+; pre-installed on macOS/Linux/WSL
date --version         # any (GNU or BSD); pre-installed
python3 --version      # 3.8+; pre-installed on macOS/Linux/most WSL distros
```

`jq` is **strongly recommended** but not strictly required — the SKILL
ships with a Python 3 stdlib-only fallback at
`.claude/skills/vuln-analyzer/references/jq-fallback.py` that implements
the same operations with byte-identical output. Install jq if you can:

| OS | Install command |
| --- | --- |
| macOS | `brew install jq` |
| Debian/Ubuntu | `sudo apt install jq` |
| Fedora/RHEL | `sudo dnf install jq` |
| Arch | `sudo pacman -S jq` |
| Windows WSL | use the Linux command for your WSL distro |

`awk` is needed only when the SKILL takes the jq path (the awk
one-liner converts TSV to Markdown). It's pre-installed on every
POSIX system. The Python fallback bundles this step internally — no
awk needed when jq is absent.

### grype MCP server

The skill calls a tool named `mcp__grype__scan`. You need the grype MCP
server configured in your client.

Install instructions:
**https://github.com/romansok/grype-mcp/blob/main/README-MCP.md**

Verify it's registered by asking Claude Code or Cursor: *"list available
MCP tools"* — you should see `mcp__grype__scan` (plus `analyze` and
`export`).

### Claude Code or Cursor

- **Claude Code**: install per https://docs.claude.com/claude-code
- **Cursor**: install per https://cursor.com

---

## 2. Install into Claude Code

You have two choices: project-local (the analyzer is available only
inside one specific project) or user-level (available from every
project).

### Option A — User-level (recommended for most users)

Drop the agents and skill into your home Claude config so they're
available from any project.

```bash
# from inside this package (vuln-analyzer/):
mkdir -p ~/.claude/agents ~/.claude/skills
cp .claude/agents/*.md ~/.claude/agents/
cp -R .claude/skills/vuln-analyzer ~/.claude/skills/
```

Restart Claude Code (`/exit`, then relaunch). Verify with:

```
> list my skills
```

You should see `vuln-analyzer` in the list, and the four agents
(`vulnerability-analyzer`, `reachability-analyzer`, `context-analyzer`,
`remediation-analyzer`) should show up in agent autocompletion.

### Option B — Project-local

Useful when you want the skill version-controlled with a particular
repo (so teammates pick it up via `git pull`).

```bash
# from inside this package (vuln-analyzer/):
TARGET=/absolute/path/to/your/repo
mkdir -p "$TARGET/.claude/agents" "$TARGET/.claude/skills"
cp .claude/agents/*.md "$TARGET/.claude/agents/"
cp -R .claude/skills/vuln-analyzer "$TARGET/.claude/skills/"
# optional — pre-approve the tools the skill uses:
cp .claude/settings.json "$TARGET/.claude/settings.json"  # merge if one exists
```

Open Claude Code from inside `$TARGET` to use it.

---

## 3. Install into Cursor

Cursor's skill / sub-agent paths converge with Claude Code's. As of
recent Cursor versions:

```bash
# user-level (any Cursor workspace):
mkdir -p ~/.cursor/agents ~/.cursor/skills
cp .claude/agents/*.md ~/.cursor/agents/
cp -R .claude/skills/vuln-analyzer ~/.cursor/skills/

# OR project-local:
TARGET=/absolute/path/to/your/repo
mkdir -p "$TARGET/.cursor/agents" "$TARGET/.cursor/skills"
cp .claude/agents/*.md "$TARGET/.cursor/agents/"
cp -R .claude/skills/vuln-analyzer "$TARGET/.cursor/skills/"
```

> ℹ️ Cursor's skill discovery may evolve. If the paths above don't work
> in your version, check Cursor's current docs for `Skills` and
> `Subagents`. The SKILL.md and agent .md files themselves are
> portable; only the install location changes.

Make sure the grype MCP server is also configured in Cursor's MCP
settings (it's the same MCP server config format as Claude Code).

---

## 4. Verify the install (smoke test)

### Test 1 — standalone analyzer

Open Claude Code / Cursor anywhere. Ask:

```
analyze GHSA-whpj-8f3w-67p5
```

You should see the `vulnerability-analyzer` agent kick in, validate the
GHSA id, fetch the GitHub advisory, and return a synthesis block that
looks like:

```
### GHSA-whpj-8f3w-67p5 — vm2 sandbox-escape vulnerability …
**Impact in this codebase:** …
**Reachable?** Source not available (no project root provided).
**What to do:**
  1. Bump vm2 to 3.9.18.
  2. <workaround>
**Why it matters (10s explanation):** …
**Confidence:** High …
```

### Test 2 — full skill flow

Open Claude Code / Cursor in a real project (anything with a
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
5. Print a synthesis block per top-5 finding.
6. Print a closeout paragraph.

### Test 3 — rejection path

```
analyze hello
```

Should return one sentence rejecting the input and dispatch no
sub-agents.

---

## 5. Updating

User-level install:

```bash
cp .claude/agents/*.md ~/.claude/agents/
cp -R .claude/skills/vuln-analyzer ~/.claude/skills/
```

(Or `cp -Rf` to overwrite without prompting.)

Project-local install: same pattern, target your project's `.claude/`
or `.cursor/`.

---

## 6. Uninstalling

```bash
# user-level
rm -f ~/.claude/agents/{vulnerability,reachability,context,remediation}-analyzer.md
rm -rf ~/.claude/skills/vuln-analyzer

# Cursor user-level
rm -f ~/.cursor/agents/{vulnerability,reachability,context,remediation}-analyzer.md
rm -rf ~/.cursor/skills/vuln-analyzer
```

---

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `jq: command not found` | Install jq (see Prerequisites). |
| `mcp__grype__scan` not available | Install the grype MCP server. Confirm with "list MCP tools". |
| Skill doesn't show up | Restart the client. Check the install path matches your client (Claude Code vs Cursor). Filenames matter (case-sensitive on Linux). |
| "Scanning: …" line never appears | The skill isn't routing — the user prompt may not match the description. Try the explicit phrasing: *"run the vuln-analyzer skill on this project"*. |
| Reachability returns `source-not-available` from a skill scan | Should not happen — the skill always passes a real `dir:` to reachability. If you see this, the standalone analyzer agent ran instead of the skill (e.g., the user asked "analyze CVE-…" rather than "scan for vulnerabilities"). |
| "This skill scans local directories only" rejection | You passed an image ref, SBOM, PURL, or CPE. Run grype directly, or use the standalone analyzer agent for a specific advisory id (e.g., "analyze CVE-2024-…"). |
| Report file isn't written | Total matches ≤ 5 — by spec the file is only written when matches > 5. |
| Filename `vulnerabilites_report_…` looks misspelled | Intentional — preserved verbatim from the spec. |

---

## 8. Package contents

```
vuln-analyzer/                                          (this package)
├── README.md
├── INSTALL.md                                          ← you are here
├── .claude/
│   ├── settings.json                                   permission allowlist (optional for project install)
│   ├── agents/
│   │   ├── vulnerability-analyzer.md
│   │   ├── reachability-analyzer.md
│   │   ├── context-analyzer.md
│   │   └── remediation-analyzer.md
│   └── skills/
│       └── vuln-analyzer/
│           ├── SKILL.md
│           └── references/
│               ├── jq-snippets.md
│               ├── output-templates.md
│               ├── grype-schema-cheatsheet.md
│               └── cwe/
│                   ├── index.md
│                   └── CWE-*.md                        19 CWE playbook entries
└── .cache/                                             created at first run; transient
```

All files except `.cache/` are version-controllable.
