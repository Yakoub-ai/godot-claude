#!/usr/bin/env bash
# Install / update all godot-claude components:
#   1. godot-dev Claude skill     → ~/.claude/skills/godot-dev/
#   2. Godot MCP Pro server       → builds from source if GODOT_MCP_PRO_SOURCE is set
#   3. godot-mcp-docs             → clones if needed, builds Docker image, registers globally
#
# Run this after pulling updates to the repo.
#
# Environment variable overrides:
#   GODOT_MCP_PRO_SOURCE   path to godot-mcp-pro-v1.5.0/ dir (skips Pro build if unset)
#   GODOT_MCP_DOCS_DIR     path to godot-mcp-docs repo       (default: ~/dev/godot-mcp-docs)
#   GODOT_MCP_DOCS_REPO    git URL for godot-mcp-docs         (default: GitHub Nihilantropy)
#   CLAUDE_JSON            path to ~/.claude.json              (default: ~/.claude.json)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="$REPO_DIR/skill"
SKILL_DEST="${HOME}/.claude/skills/godot-dev"
DOCS_MCP_DIR="${GODOT_MCP_DOCS_DIR:-$HOME/dev/godot-mcp-docs}"
DOCS_MCP_REPO="${GODOT_MCP_DOCS_REPO:-https://github.com/Nihilantropy/godot-mcp-docs.git}"
CLAUDE_JSON="${CLAUDE_JSON:-$HOME/.claude.json}"

# Auto-detect MCP Pro source at common location if not set
if [ -z "${GODOT_MCP_PRO_SOURCE:-}" ]; then
  DEFAULT_PRO="$HOME/godot-mcp/godot-mcp-pro-v1.5.0"
  if [ -d "$DEFAULT_PRO/server" ]; then
    GODOT_MCP_PRO_SOURCE="$DEFAULT_PRO"
  fi
fi

echo "=== godot-claude installer ==="
echo ""

# ─── 1. Install godot-dev skill ─────────────────────────────────────────────
echo "[1/3] Installing godot-dev skill..."
mkdir -p "$SKILL_DEST/references"
cp "$SKILL_SRC/SKILL.md" "$SKILL_DEST/SKILL.md"
cp "$SKILL_SRC/references/"*.md "$SKILL_DEST/references/"
echo "      ✓ Skill installed at $SKILL_DEST"

# ─── 2. Build Godot MCP Pro server ──────────────────────────────────────────
echo ""
echo "[2/3] Godot MCP Pro server..."

if [ -n "${GODOT_MCP_PRO_SOURCE:-}" ]; then
  SERVER_SRC="$GODOT_MCP_PRO_SOURCE/server"
  if [ ! -d "$SERVER_SRC" ]; then
    echo "      ERROR: server/ not found inside GODOT_MCP_PRO_SOURCE=$GODOT_MCP_PRO_SOURCE"
    exit 1
  fi
  echo "      Building from $SERVER_SRC ..."
  (cd "$SERVER_SRC" && npm install --silent && npm run build --silent)
  echo "      ✓ Built: $SERVER_SRC/build/index.js"
  MCP_PRO_BUILT="$SERVER_SRC/build/index.js"

  # Check if the addons plugin exists (needed per Godot project)
  PLUGIN_SRC="$GODOT_MCP_PRO_SOURCE/addons/godot_mcp"
  if [ -d "$PLUGIN_SRC" ]; then
    echo "      ℹ  Plugin at: $PLUGIN_SRC"
    echo "         Copy to each Godot project: cp -r $PLUGIN_SRC /your-project/addons/"
    echo "         Then enable: Project → Project Settings → Plugins → Godot MCP Pro"
  fi
else
  # Check if a pre-built server exists at common locations
  CANDIDATE="$HOME/server/build/index.js"
  if [ -f "$CANDIDATE" ]; then
    echo "      ✓ Pre-built server found at $CANDIDATE"
    MCP_PRO_BUILT="$CANDIDATE"
  else
    echo "      ✗ GODOT_MCP_PRO_SOURCE not set and no pre-built server found."
    echo "        Set GODOT_MCP_PRO_SOURCE=/path/to/godot-mcp-pro-v1.5.0 to build automatically."
    echo "        See docs/godot-mcp-pro-setup.md for manual instructions."
    MCP_PRO_BUILT=""
  fi
fi

# ─── 3. Build godot-mcp-docs Docker image + register globally ───────────────
echo ""
echo "[3/3] Setting up Godot Docs MCP (Docker)..."

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

echo "      Building Docker image (takes a few minutes on first run)..."
docker build -f "$DOCKERFILE" -t godot-mcp-docs:local "$DOCS_MCP_DIR"
echo "      ✓ Docker image built: godot-mcp-docs:local"

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

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "=== Done ==="
echo ""
echo "Authentication summary:"
echo "  Godot MCP Pro  : no auth required (localhost WebSocket)"
echo "  Godot Docs MCP : no auth required (Docker, local)"
echo "  PixelLab       : API key required → https://pixellab.ai"
echo ""
echo "Per-project steps still needed:"
echo ""
echo "  1. Copy .mcp.json.example to your Godot project:"
echo "       cp $REPO_DIR/.mcp.json.example /path/to/your-project/.mcp.json"

if [ -n "${MCP_PRO_BUILT:-}" ]; then
  echo "     Then set the server path in .mcp.json to:"
  echo "       $MCP_PRO_BUILT"
fi

echo ""
echo "  2. Copy the Godot plugin to your project (per project):"
if [ -n "${GODOT_MCP_PRO_SOURCE:-}" ]; then
  echo "       cp -r $GODOT_MCP_PRO_SOURCE/addons/godot_mcp /path/to/your-project/addons/"
else
  echo "       cp -r /path/to/godot-mcp-pro-v1.5.0/addons/godot_mcp /path/to/your-project/addons/"
fi
echo "     Then enable: Project → Project Settings → Plugins → Godot MCP Pro"
echo ""
echo "  3. Set PixelLab API key in .mcp.json"
echo ""
echo "  4. Add mandatory CLAUDE.md block — see $REPO_DIR/docs/per-project-setup.md"
echo ""
