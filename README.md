# godot-claude

Claude AI tooling for Godot game development. Installs the `godot-dev` skill and
configures all three MCPs needed for full engine + docs + asset generation access.

## Three MCPs

| MCP | What it does | Scope |
|-----|-------------|-------|
| **Godot MCP Pro** | Direct engine integration — 172 tools to create/edit scenes, scripts, nodes, run and test the game | Per-project `.mcp.json` |
| **Godot Docs MCP** | Official Godot documentation lookup (1,500+ doc files, all classes and tutorials) | Global (all projects) |
| **PixelLab** | AI pixel art generation — characters, animations, tilesets, props | Per-project `.mcp.json` |

## What's in here

| Path | Purpose |
|------|---------|
| `skill/SKILL.md` | The `godot-dev` Claude skill — loaded before any Godot work |
| `skill/references/` | MCP tool catalogs, Godot doc paths, PixelLab pipeline, project template |
| `.mcp.json.example` | Per-project MCP config template (Godot MCP Pro + PixelLab) |
| `install.sh` | Installs skill + builds godot-mcp-docs Docker image + registers it globally |
| `docs/per-project-setup.md` | Full setup guide for new projects |

## Prerequisites

- **Docker** — for the Godot Docs MCP server
- **Node.js** — for the Godot MCP Pro server
- **Godot 4.x** with the MCP Pro plugin installed (editor must be open at runtime)
- **PixelLab API key** — from [pixellab.ai](https://pixellab.ai)

## Setup (new machine or first time)

### 1. Clone godot-mcp-docs (if you don't have it)
```bash
git clone https://github.com/nihilantropy/godot-mcp-docs ~/dev/godot-mcp-docs
```

### 2. Run the installer
```bash
./install.sh
```

This will:
- Install the `godot-dev` skill to `~/.claude/skills/godot-dev/`
- Build the `godot-mcp-docs:local` Docker image
- Register `godot-mcp-docs` globally in `~/.claude.json`

### 3. Build Godot MCP Pro server
```bash
cd /path/to/godot-mcp-pro
npm install && npm run build
```

### 4. Configure your Godot project
```bash
cp .mcp.json.example /path/to/your-project/.mcp.json
# Edit .mcp.json: set correct server path and PixelLab API key
```

See `docs/per-project-setup.md` for the full walkthrough including CLAUDE.md setup.

## Updating

```bash
git pull
./install.sh   # reinstalls skill + rebuilds Docker image
```

## Adding a new project reference

Create `skill/references/your-project.md` from the template, then reinstall:
```bash
cp skill/references/project-template.md skill/references/my-game.md
# Fill it in...
./install.sh
```

Claude loads the matching reference file automatically when working in that project.
