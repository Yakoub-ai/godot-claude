#!/usr/bin/env bash
# Install / update all godot-claude components:
#   1. godot-dev Claude skill     → ~/.claude/skills/godot-dev/
#   2. godot-mcp-docs             → clones if needed, builds Docker image, registers globally
#   3. Prints checklist for Godot MCP Pro and PixelLab (manual one-time steps)
#
# Run this after pulling updates to the repo.
#
# Override defaults with environment variables:
#   GODOT_MCP_DOCS_DIR   path to godot-mcp-docs repo  (default: ~/dev/godot-mcp-docs)
#   GODOT_MCP_DOCS_REPO  git URL for godot-mcp-docs   (default: GitHub Nihilantropy fork)
#   CLAUDE_JSON          path to ~/.claude.json         (default: ~/.claude.json)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="$REPO_DIR/skill"
SKILL_DEST="${HOME}/.claude/skills/godot-dev"
DOCS_MCP_DIR="${GODOT_MCP_DOCS_DIR:-$HOME/dev/godot-mcp-docs}"
DOCS_MCP_REPO="${GODOT_MCP_DOCS_REPO:-https://github.com/Nihilantropy/godot-mcp-docs.git}"
CLAUDE_JSON="${CLAUDE_JSON:-$HOME/.claude.json}"

echo "=== godot-claude installer ==="
echo ""

# ─── 1. Install godot-dev skill ─────────────────────────────────────────────
echo "[1/3] Installing godot-dev skill..."
mkdir -p "$SKILL_DEST/references"
cp "$SKILL_SRC/SKILL.md" "$SKILL_DEST/SKILL.md"
cp "$SKILL_SRC/references/"*.md "$SKILL_DEST/references/"
echo "      ✓ Skill installed at $SKILL_DEST"

# ─── 2. Build godot-mcp-docs Docker image ───────────────────────────────────
echo ""
echo "[2/3] Setting up Godot Docs MCP (Docker)..."

# Auto-clone if not present
if [ ! -d "$DOCS_MCP_DIR" ]; then
  echo "      godot-mcp-docs not found at $DOCS_MCP_DIR — cloning..."
  git clone "$DOCS_MCP_REPO" "$DOCS_MCP_DIR"
  echo "      ✓ Cloned to $DOCS_MCP_DIR"
else
  echo "      Found at $DOCS_MCP_DIR"
fi

DOCKERFILE="$DOCS_MCP_DIR/deploy/Dockerfile"
if [ ! -f "$DOCKERFILE" ]; then
  echo "      ERROR: Dockerfile not found at $DOCKERFILE"
  exit 1
fi

echo "      Building Docker image (this takes a few minutes on first run)..."
docker build -f "$DOCKERFILE" -t godot-mcp-docs:local "$DOCS_MCP_DIR"
echo "      ✓ Docker image built: godot-mcp-docs:local"

# Register globally in ~/.claude.json
echo "      Registering globally in $CLAUDE_JSON..."

if [ ! -f "$CLAUDE_JSON" ]; then
  echo "      ERROR: $CLAUDE_JSON not found. Open Claude Code at least once first."
  exit 1
fi

python3 - <<PYEOF
import json, sys

with open('$CLAUDE_JSON', 'r') as f:
    data = json.load(f)

servers = data.setdefault('mcpServers', {})
target = {
    'type': 'stdio',
    'command': 'docker',
    'args': ['run', '--rm', '-i', 'godot-mcp-docs:local']
}

if servers.get('godot-mcp-docs') == target:
    print('      ✓ Already registered and up to date.')
    sys.exit(0)

servers['godot-mcp-docs'] = target

with open('$CLAUDE_JSON', 'w') as f:
    json.dump(data, f, indent=2)

print('      ✓ Registered godot-mcp-docs globally.')
PYEOF

# ─── 3. Summary: remaining manual steps ─────────────────────────────────────
echo ""
echo "[3/3] Checking Godot MCP Pro and PixelLab..."
echo ""

# Check if godot-mcp-pro server exists at the default location
MCP_PRO_DEFAULT="$HOME/server/build/index.js"
if [ -f "$MCP_PRO_DEFAULT" ]; then
  echo "      ✓ Godot MCP Pro found at $MCP_PRO_DEFAULT"
  MCP_PRO_READY=true
else
  echo "      ✗ Godot MCP Pro not found at $MCP_PRO_DEFAULT"
  MCP_PRO_READY=false
fi

# Check if .mcp.json exists in current directory
if [ -f ".mcp.json" ]; then
  echo "      ✓ .mcp.json found in current directory"
else
  echo "      ✗ No .mcp.json in current directory"
fi

echo ""
echo "=== Done ==="
echo ""

if [ "$MCP_PRO_READY" = false ]; then
  echo "MANUAL STEP — Godot MCP Pro server:"
  echo "  The server source is not publicly available on GitHub."
  echo "  If you have the source:"
  echo "    cd /path/to/godot-mcp-pro-source"
  echo "    npm install"
  echo "    npm run build"
  echo "  Then update .mcp.json with the correct path to build/index.js"
  echo "  Also install the MCP Pro plugin in the Godot editor (editor must run for tools to work)."
  echo ""
fi

echo "MANUAL STEP — Per-project .mcp.json:"
echo "  cp $REPO_DIR/.mcp.json.example /path/to/your-godot-project/.mcp.json"
echo "  Then edit it:"
echo "    - Set the correct path to Godot MCP Pro build/index.js"
echo "    - Set your PixelLab API key (get one at https://pixellab.ai)"
echo ""
echo "MANUAL STEP — Per-project CLAUDE.md:"
echo "  See $REPO_DIR/docs/per-project-setup.md"
echo ""
echo "Authentication summary:"
echo "  Godot MCP Pro  : no auth required"
echo "  Godot Docs MCP : no auth required"
echo "  PixelLab       : API key required → https://pixellab.ai"
echo ""
