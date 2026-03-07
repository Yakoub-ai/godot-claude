# godot-claude

Claude AI tooling for Godot game development. Includes the `godot-dev` skill, MCP server configuration, and project setup scripts.

## What's in here

| Path | Purpose |
|------|---------|
| `skill/SKILL.md` | The `godot-dev` Claude skill — loaded by Claude before any Godot work |
| `skill/references/` | Reference docs for MCP tools, Godot docs paths, PixelLab pipelines |
| `skill/references/project-template.md` | Template for per-project reference files |
| `.mcp.json.example` | MCP server config template — copy to your project as `.mcp.json` |
| `install.sh` | Install/update the skill globally for all projects |
| `docs/per-project-setup.md` | How to configure a new Godot project to use these tools |

## Three MCP Servers

| Server | What it does |
|--------|-------------|
| **Godot MCP Pro** | Direct engine integration — 172 tools to create/edit scenes, scripts, nodes, run the game |
| **Godot Docs MCP** | Official Godot documentation lookup (1,500+ doc files) |
| **PixelLab** | AI pixel art generation — characters, animations, tilesets |

## Quick Setup (new project)

```bash
# 1. Install/update the skill globally
./install.sh

# 2. Copy MCP config to your project
cp .mcp.json.example /path/to/your/godot-project/.mcp.json

# 3. Set PixelLab API key (get one from pixellab.ai)
export PIXELLAB_API_KEY=your_key_here

# 4. Add to your project's CLAUDE.md (see docs/per-project-setup.md)
```

## Updating

Pull latest, then reinstall:
```bash
git pull
./install.sh
```

## Per-project reference files

Create a `skill/references/your-project.md` (see `project-template.md`) so Claude always
has project-specific context loaded when invoking the skill. Add the file to this repo if
you want it available across machines.
