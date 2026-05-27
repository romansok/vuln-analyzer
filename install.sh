#!/usr/bin/env bash
# install.sh — install the vuln-analyzer skill + agents into Claude Code or Cursor.
#
# Usage:
#   ./install.sh                        Install into ~/.claude (Claude Code, user-level — default)
#   ./install.sh --cursor               Install into ~/.cursor (Cursor, user-level)
#   ./install.sh --project /abs/path    Install into /abs/path/.claude (project-local)
#   ./install.sh --cursor --project P   Install into P/.cursor (project-local for Cursor)
#   ./install.sh --help                 Show this message
#
# After install, restart your AI assistant. The skill `vuln-analyzer` is then
# available. Try: `analyze GHSA-whpj-8f3w-67p5` or `scan ~/some/repo for vulnerabilities`.

set -euo pipefail

TOOL="claude"
TARGET="$HOME"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
  cat <<'EOF'
install.sh — install the vuln-analyzer skill + agents into Claude Code or Cursor.

Usage:
  ./install.sh                        Install into ~/.claude (Claude Code, user-level — default)
  ./install.sh --cursor               Install into ~/.cursor (Cursor, user-level)
  ./install.sh --project /abs/path    Install into /abs/path/.claude (project-local)
  ./install.sh --cursor --project P   Install into P/.cursor (project-local for Cursor)
  ./install.sh --help                 Show this message

After install, restart your AI assistant. The skill `vuln-analyzer` is then
available. Try: `analyze GHSA-whpj-8f3w-67p5` or `scan ~/some/repo for vulnerabilities`.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --cursor)  TOOL="cursor"; shift ;;
    --claude)  TOOL="claude"; shift ;;
    --project) [ -n "${2:-}" ] || { echo "--project needs a path"; exit 2; }
               TARGET="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *)         echo "unknown arg: $1"; echo; usage; exit 2 ;;
  esac
done

if [ ! -d "$TARGET" ]; then
  echo "error: target directory not found: $TARGET" >&2
  exit 1
fi

DEST="$TARGET/.$TOOL"

echo "Installing vuln-analyzer"
echo "  tool:        $TOOL"
echo "  destination: $DEST"
echo ""

mkdir -p "$DEST/agents" "$DEST/skills"

cp "$SCRIPT_DIR/agents/"*.md "$DEST/agents/"
echo "  ✓ copied 4 agents -> $DEST/agents/"

# remove old skill dir if present so re-install is clean
rm -rf "$DEST/skills/vuln-analyzer"
cp -R "$SCRIPT_DIR/skills/vuln-analyzer" "$DEST/skills/"
echo "  ✓ copied skill 'vuln-analyzer' -> $DEST/skills/vuln-analyzer"

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
