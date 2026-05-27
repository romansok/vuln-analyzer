#!/usr/bin/env bash
# install.sh — install the vuln-analyzer skill + agents into Claude Code or Cursor.
#
# Usage:
#   ./install.sh                        Install into ~/.claude (Claude Code, user-level — default)
#   ./install.sh --cursor               Install into ~/.cursor (Cursor, user-level)
#   ./install.sh --project /abs/path    Install into /abs/path/.claude (project-local)
#   ./install.sh --cursor --project P   Install into P/.cursor (project-local for Cursor)
#   ./install.sh --force                Overwrite existing same-named files (use on re-install)
#   ./install.sh --help                 Show this message
#
# Conflict policy: by default the script REFUSES to overwrite any agent or
# skill file at the destination that wasn't put there by a previous
# vuln-analyzer install. Other agents and skills (different names) are
# never touched.
#
# How re-install / upgrade works: the script leaves a sentinel file
# .vuln-analyzer.installed in the destination. If it finds that sentinel
# (or a SKILL.md whose name: line is vuln-analyzer) on a re-run, it treats
# the situation as an upgrade and overwrites without --force. Otherwise it
# bails and tells you which files would be clobbered.

set -euo pipefail

TOOL="claude"
TARGET="$HOME"
FORCE="0"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
  cat <<'EOF'
install.sh — install the vuln-analyzer skill + agents into Claude Code or Cursor.

Usage:
  ./install.sh                        Install into ~/.claude (Claude Code, user-level — default)
  ./install.sh --cursor               Install into ~/.cursor (Cursor, user-level)
  ./install.sh --project /abs/path    Install into /abs/path/.claude (project-local)
  ./install.sh --cursor --project P   Install into P/.cursor (project-local for Cursor)
  ./install.sh --force                Overwrite existing files at the destination (foreign files too)
  ./install.sh --help                 Show this message

Safety:
  By default the script REFUSES to overwrite files at the destination
  that weren't put there by a previous vuln-analyzer install. A prior
  vuln-analyzer install is detected via a sentinel file or the skill's
  own SKILL.md, and is treated as an upgrade — safe to overwrite.

  Other agents and skills (with different names) in the destination
  are NEVER touched, regardless of --force.

After install, restart your AI assistant. Try:
  analyze GHSA-whpj-8f3w-67p5
  scan ~/some/repo for vulnerabilities
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --cursor)   TOOL="cursor"; shift ;;
    --claude)   TOOL="claude"; shift ;;
    --project)  [ -n "${2:-}" ] || { echo "--project needs a path"; exit 2; }
                TARGET="$2"; shift 2 ;;
    --force|-f) FORCE="1"; shift ;;
    -h|--help)  usage; exit 0 ;;
    *)          echo "unknown arg: $1"; echo; usage; exit 2 ;;
  esac
done

if [ ! -d "$TARGET" ]; then
  echo "error: target directory not found: $TARGET" >&2
  exit 1
fi

DEST="$TARGET/.$TOOL"
SENTINEL="$DEST/.vuln-analyzer.installed"

echo "Installing vuln-analyzer"
echo "  tool:        $TOOL"
echo "  destination: $DEST"
echo ""

# --- detect prior vuln-analyzer install ----------------------------------

PRIOR_INSTALL="0"
if [ -e "$SENTINEL" ]; then
  PRIOR_INSTALL="1"
elif [ -f "$DEST/skills/vuln-analyzer/SKILL.md" ] && \
     grep -q '^name: vuln-analyzer$' "$DEST/skills/vuln-analyzer/SKILL.md" 2>/dev/null; then
  PRIOR_INSTALL="1"
fi

# --- conflict check (foreign files in the way) ---------------------------

CONFLICTS=""
if [ "$PRIOR_INSTALL" = "0" ]; then
  for agent_file in "$SCRIPT_DIR/agents/"*.md; do
    bn=$(basename "$agent_file")
    if [ -e "$DEST/agents/$bn" ]; then
      CONFLICTS="${CONFLICTS}    $DEST/agents/$bn"$'\n'
    fi
  done
  if [ -e "$DEST/skills/vuln-analyzer" ]; then
    CONFLICTS="${CONFLICTS}    $DEST/skills/vuln-analyzer/"$'\n'
  fi
fi

if [ -n "$CONFLICTS" ]; then
  if [ "$FORCE" != "1" ]; then
    cat <<EOF
⚠ The following targets already exist at the destination and were NOT
  put there by a previous vuln-analyzer install:

$CONFLICTS
To proceed, choose one:
  • Move/rename the files above, then re-run ./install.sh.
  • OR re-run with --force to overwrite them anyway (only these specific
    files are replaced — other agents/skills in the destination are
    NEVER touched).

Aborting without changes.
EOF
    exit 1
  else
    echo "⚠ --force: overwriting these foreign files:"
    printf "%s" "$CONFLICTS"
    echo ""
  fi
elif [ "$PRIOR_INSTALL" = "1" ]; then
  echo "↻ upgrading existing vuln-analyzer install"
  echo ""
fi

# --- install -------------------------------------------------------------

mkdir -p "$DEST/agents" "$DEST/skills"

cp "$SCRIPT_DIR/agents/"*.md "$DEST/agents/"
echo "  ✓ copied 4 agents -> $DEST/agents/"

rm -rf "$DEST/skills/vuln-analyzer"
cp -R "$SCRIPT_DIR/skills/vuln-analyzer" "$DEST/skills/"
echo "  ✓ copied skill 'vuln-analyzer' -> $DEST/skills/vuln-analyzer"

# write/update sentinel so future re-installs are recognized as upgrades
printf 'vuln-analyzer installed at %s\nfrom %s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "$SCRIPT_DIR" \
  > "$SENTINEL"

echo ""
echo "Done. Restart $TOOL, then try:"
echo "    analyze GHSA-whpj-8f3w-67p5"
echo "    scan ~/some/repo for vulnerabilities"

if [ "$TOOL" = "claude" ]; then
  echo ""
  echo "Optional — Claude Code only:"
  echo "  Pre-approve the common Bash commands + advisory hosts the skill"
  echo "  uses so you stop getting permission prompts. Copy or merge:"
  echo "    $SCRIPT_DIR/settings/claude-permissions.json"
  echo "  into:"
  echo "    $DEST/settings.json"
  echo "  (See INSTALL.md for details.)"
fi
