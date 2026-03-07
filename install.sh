#!/usr/bin/env bash
# Install / update all godot-claude components:
#   1. godot-dev Claude skill  → ~/.claude/skills/godot-dev/
#   2. godot-mcp-docs Docker   → builds image and registers globally in ~/.claude.json
#
# Run this after pulling updates to the repo.
# Requires: docker, python3/uv (for godot-mcp-docs), node (for godot-mcp-pro)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="$REPO_DIR/skill"
SKILL_DEST="$HOME/.claude/skills/godot-dev"
DOCS_MCP_DIR="$HOME/dev/godot-mcp-docs"
CLAUDE_JSON="$HOME/.claude.json"

echo "=== godot-claude installer ==="
echo ""

# ─── 1. Install skill ───────────────────────────────────────────────────────
echo "[1/3] Installing godot-dev skill..."
mkdir -p "$SKILL_DEST/references"
cp "$SKILL_SRC/SKILL.md" "$SKILL_DEST/SKILL.md"
cp "$SKILL_SRC/references/"*.md "$SKILL_DEST/references/"
echo "      Skill installed at $SKILL_DEST"

# ─── 2. Build godot-mcp-docs Docker image ───────────────────────────────────
echo ""
echo "[2/3] Building godot-mcp-docs Docker image..."
if [ ! -d "$DOCS_MCP_DIR" ]; then
  echo "      ERROR: godot-mcp-docs not found at $DOCS_MCP_DIR"
  echo "      Clone it first: git clone https://github.com/nihilantropy/godot-mcp-docs $DOCS_MCP_DIR"
  exit 1
fi

DOCKERFILE="$DOCS_MCP_DIR/deploy/Dockerfile"
if [ ! -f "$DOCKERFILE" ]; then
  echo "      ERROR: Dockerfile not found at $DOCKERFILE"
  exit 1
fi

docker build -f "$DOCKERFILE" -t godot-mcp-docs:local "$DOCS_MCP_DIR"
echo "      Docker image built: godot-mcp-docs:local"

# ─── 3. Register godot-mcp-docs globally in ~/.claude.json ──────────────────
echo ""
echo "[3/3] Registering godot-mcp-docs globally..."

if [ ! -f "$CLAUDE_JSON" ]; then
  echo "      ERROR: $CLAUDE_JSON not found. Open Claude Code first to create it."
  exit 1
fi

# Check if already registered
if python3 -c "
import json, sys
data = json.load(open('$CLAUDE_JSON'))
servers = data.get('mcpServers', {})
if 'godot-mcp-docs' in servers:
    existing = servers['godot-mcp-docs']
    expected = {'type': 'stdio', 'command': 'docker', 'args': ['run', '--rm', '-i', 'godot-mcp-docs:local']}
    if existing == expected:
        sys.exit(0)
    else:
        sys.exit(2)
sys.exit(1)
" 2>/dev/null; then
  echo "      Already registered and up to date."
elif python3 -c "
import json, sys
data = json.load(open('$CLAUDE_JSON'))
servers = data.get('mcpServers', {})
if 'godot-mcp-docs' in servers:
    sys.exit(2)
sys.exit(1)
" 2>/dev/null; then
  echo "      WARNING: godot-mcp-docs already registered with different config — skipping."
  echo "      Check $CLAUDE_JSON manually if needed."
else
  python3 - <<PYEOF
import json
with open('$CLAUDE_JSON', 'r') as f:
    data = json.load(f)
if 'mcpServers' not in data:
    data['mcpServers'] = {}
data['mcpServers']['godot-mcp-docs'] = {
    'type': 'stdio',
    'command': 'docker',
    'args': ['run', '--rm', '-i', 'godot-mcp-docs:local']
}
with open('$CLAUDE_JSON', 'w') as f:
    json.dump(data, f, indent=2)
print('      Registered godot-mcp-docs globally.')
PYEOF
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Done ==="
echo ""
echo "Remaining manual steps:"
echo ""
echo "  Godot MCP Pro:"
echo "    1. Get the source: https://github.com/godot-mcp-pro (or your local build)"
echo "    2. Install deps + build:  cd /path/to/godot-mcp-pro && npm install && npm run build"
echo "    3. Copy .mcp.json.example into your Godot project:"
echo "       cp $REPO_DIR/.mcp.json.example /path/to/project/.mcp.json"
echo "    4. Edit .mcp.json — set the correct path to build/index.js"
echo "    5. Open Godot with the MCP Pro plugin installed (required at runtime)"
echo ""
echo "  PixelLab:"
echo "    1. Get API key at https://pixellab.ai"
echo "    2. Add to .mcp.json: replace YOUR_PIXELLAB_API_KEY with your key"
echo "       (or set PIXELLAB_API_KEY env var and reference it as \${PIXELLAB_API_KEY})"
echo ""
echo "  Per-project CLAUDE.md:"
echo "    See docs/per-project-setup.md for the mandatory CLAUDE.md block"
echo ""
