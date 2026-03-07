#!/usr/bin/env bash
# Install / update the godot-dev skill globally for all projects.
# Run this after pulling updates to the repo.

set -euo pipefail

SKILL_SRC="$(cd "$(dirname "$0")/skill" && pwd)"
SKILL_DEST="$HOME/.claude/skills/godot-dev"

echo "Installing godot-dev skill..."
echo "  Source : $SKILL_SRC"
echo "  Target : $SKILL_DEST"

mkdir -p "$SKILL_DEST/references"

cp "$SKILL_SRC/SKILL.md" "$SKILL_DEST/SKILL.md"
cp "$SKILL_SRC/references/"*.md "$SKILL_DEST/references/"

echo ""
echo "Done. Skill installed at $SKILL_DEST"
echo ""
echo "Next steps:"
echo "  1. Copy .mcp.json.example to your Godot project as .mcp.json"
echo "  2. Set PIXELLAB_API_KEY in your environment"
echo "  3. Open Godot — the MCP Pro plugin requires the editor to be running"
echo "  4. Create a per-project reference in skill/references/your-project.md"
