# Per-Project Setup Guide

How to configure a Godot project to use all three MCPs with the godot-dev skill.

---

## Architecture Overview

| MCP | Scope | Config location |
|-----|-------|----------------|
| Godot MCP Pro | Per-project | `.mcp.json` in project root |
| PixelLab | Per-project | `.mcp.json` in project root |
| Godot Docs MCP | Global (all projects) | `~/.claude.json` via `install.sh` |

---

## Step 1 — Run the installer (one time per machine)

```bash
cd /path/to/godot-claude
./install.sh
```

This installs:
- The `godot-dev` Claude skill to `~/.claude/skills/godot-dev/`
- Builds the `godot-mcp-docs:local` Docker image
- Registers `godot-mcp-docs` globally in `~/.claude.json`

---

## Step 2 — Set up Godot MCP Pro

Godot MCP Pro is a Node.js server that connects to a running Godot editor.

**Build the server:**
```bash
git clone <godot-mcp-pro-source> ~/server  # or wherever you keep it
cd ~/server
npm install
npm run build
# Produces: ~/server/build/index.js
```

**Install the Godot plugin:**
The Godot editor needs the MCP Pro plugin installed and enabled. The editor must be
running for any `mcp__godot-mcp-pro__*` tools to work.

---

## Step 3 — Copy `.mcp.json` to your project

```bash
cp /path/to/godot-claude/.mcp.json.example /path/to/your-godot-project/.mcp.json
```

Edit `.mcp.json`:
1. Replace `PATH_TO_GODOT_MCP_PRO` with the actual path to your server build
2. Replace `YOUR_PIXELLAB_API_KEY` with your key from [pixellab.ai](https://pixellab.ai)

**Example for this machine:**
```json
{
  "mcpServers": {
    "godot-mcp-pro": {
      "command": "node",
      "args": ["/home/george/server/build/index.js"],
      "env": {
        "GODOT_MCP_PORT": "6505"
      }
    },
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_KEY_HERE"
      }
    }
  }
}
```

---

## Step 4 — Add mandatory CLAUDE.md block

Create or edit `CLAUDE.md` in your Godot project root. Add at the top:

```markdown
## MANDATORY: Always Use godot-dev Skill
This is a Godot project. Before ANY work — code changes, scene edits, debugging,
asset generation, documentation lookup — invoke the `godot-dev` skill. No exceptions.

## Game Overview
[Engine version, genre, core loop in 2-3 sentences.]
```

---

## Step 5 — Create a per-project reference file (recommended)

Copy the template and fill it in:
```bash
cp /path/to/godot-claude/skill/references/project-template.md \
   /path/to/godot-claude/skill/references/your-project.md
```

Then re-run `install.sh` to deploy it to `~/.claude/skills/godot-dev/references/`.

Claude loads this file when it invokes the `godot-dev` skill, giving it project-specific
context (scene paths, conventions, system architecture) every session automatically.

---

## Verify Everything Works

Open Claude Code in your Godot project directory. Send any Godot-related message.
Claude should:

1. Automatically invoke the `godot-dev` skill
2. Have `mcp__godot-mcp-pro__*` tools available (requires Godot editor open)
3. Have `mcp__godot-mcp-docs__*` tools available (Docker-based, no editor needed)
4. Have `mcp__pixellab__*` tools available (HTTP, always available)

If a tool category is missing, check:
- **godot-mcp-pro missing**: Is the Godot editor running? Is `.mcp.json` in the project root with the correct path?
- **godot-mcp-docs missing**: Did `install.sh` complete successfully? Is Docker running?
- **pixellab missing**: Is `.mcp.json` in the project root? Is the API key correct?
