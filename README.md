# godot-claude

An AI agent for Godot 4.x game development, powered by Claude Code (CLI).

godot-claude installs into your Godot project and turns Claude Code into an expert game development collaborator. It provides direct engine control through 209 MCP tools, offline documentation for the full Godot API, persistent project memory, and structured development workflows — all from the command line.

---

## Features

| Capability | How It Works |
|-----------|--------------|
| **Build scenes and nodes** | 209 tools for direct Godot editor manipulation via WebSocket |
| **Write GDScript** | Script creation, editing, and validation with enforced static typing |
| **Architect games** | Interactive GDD workflow produces a structured development plan |
| **Debug errors** | 100+ known error patterns with automatic fixes, plus docs lookup |
| **Optimize performance** | Profiling tools, manager patterns, pooling, MultiMesh guidance |
| **Generate pixel art** | PixelLab MCP integration for characters, animations, tilesets |
| **Remember across sessions** | megamemory knowledge graph persists architecture, decisions, and patterns |
| **Look up any Godot API** | 1,582 offline docs or cloud fallback via context7 |
| **Track development phases** | GSD workflow for milestones, phases, and task execution |

---

## Architecture

```
                          Claude Code (CLI)
                                |
                    stdio (Model Context Protocol)
                                |
          +---------------------+---------------------+
          |                     |                     |
  godot-engine-mcp      godot-mcp-docs          PixelLab
    (Node.js)              (Python)              (cloud)
     209 tools           1,582 docs            pixel art
          |                     |
   WebSocket :6505        local file I/O
          |                     |
  Godot Editor Plugin    docs/ directory
    (GDScript)           (RST → Markdown)
          |
    Godot 4.x Engine
```

### How it works

**godot-engine-mcp** is the core. It is a TypeScript MCP server that exposes 209 tools for controlling the Godot editor. Claude Code connects to it over stdio. Internally, it opens a WebSocket server on port 6505 and waits for the Godot editor to connect via a companion GDScript plugin. When Claude calls a tool (e.g., `create_scene`, `add_node`, `validate_script`), the server sends a JSON-RPC 2.0 request over WebSocket, the plugin executes it in the editor, and the result comes back.

Tools are organized into 23 **categories**. Four core categories (scene, node, script, editor) are always available. The other 19 are loaded on demand — the agent calls `enable_category` when it needs animation tools, physics tools, etc. Categories auto-unload after 10 minutes of inactivity to keep the tool list manageable.

**godot-mcp-docs** provides offline access to the full Godot 4.x documentation — every class, tutorial, and guide. If it is not configured, the agent automatically falls back to **context7** (a cloud-based docs service built into Claude Code).

**PixelLab** is optional. It generates AI pixel art (characters, tilesets, animations) via API and integrates the results back into Godot as sprites and resources.

### Knowledge layer

The agent maintains context across sessions through two mechanisms:

- **megamemory** — A SQLite-backed knowledge graph (`.megamemory/`) that stores architecture decisions, discovered patterns, error fixes, and project state as linked concepts. Queried at session start and updated after each task.
- **Session files** — A slim handoff file (`.godot-claude/session/last-session.md`) that captures the current task, next steps, and blockers. Written before `/clear`, read after.

Reference files in `.godot-claude/ref/` (error patterns, GDScript conventions, performance guides) are loaded on demand — never all at once — to protect the context window.

---

## Prerequisites

**Required:**

| Dependency | Version | Purpose |
|-----------|---------|---------|
| [Claude Code](https://claude.ai/claude-code) | Latest | The AI agent interface (CLI only — no other interface is supported) |
| [Godot](https://godotengine.org/) | 4.x | Game engine — editor must be running for engine tools to work |
| [Node.js](https://nodejs.org/) | 18+ | Runs the godot-engine-mcp server |

**Optional:**

| Dependency | Version | Purpose |
|-----------|---------|---------|
| [Python](https://python.org/) | 3.10+ | Runs the offline documentation server |
| [pandoc](https://pandoc.org/) | Any | Converts Godot docs from RST to Markdown (one-time build) |
| [PixelLab API key](https://pixellab.ai/) | -- | AI pixel art generation for game assets |

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/godot-claude.git
```

### 2. Run the installer

The installer targets your Godot project directory. You can pass the path as an argument or run interactively (a folder picker dialog will open on supported systems).

**Linux / macOS:**

```bash
cd godot-claude
./install.sh /path/to/your/godot-project
```

**Windows (PowerShell):**

```powershell
cd godot-claude
pwsh install.ps1 -ProjectPath "C:\Games\MyProject"
```

**Interactive mode** (no path argument):

```bash
./install.sh
# or
pwsh install.ps1
```

If you point the installer at a parent directory, it will find all `project.godot` files within two levels and let you choose.

### 3. What the installer does

1. Validates that the target directory contains `project.godot`
2. Checks that Node.js 18+ is installed
3. Builds the godot-engine-mcp server (`npm ci` + `npm run build` in `server/`)
4. Copies agent files to `.godot-claude/` in your project
5. Creates a project-level `CLAUDE.md` if one does not exist (never overwrites yours)
6. Optionally builds offline Godot docs (prompts if Python 3 and pandoc are available)
7. Creates `.mcp.json` with server configuration
8. Updates `.gitignore` to exclude local state (memory, sessions, megamemory)

On re-install, your memory, session data, and project `CLAUDE.md` are preserved.

### 4. Start Claude Code

```bash
cd /path/to/your/godot-project
claude
```

Claude reads `.godot-claude/CLAUDE.md` on startup and becomes your Godot agent.

---

## What Gets Installed

The installer places these files in your Godot project:

```
YourProject/
├── project.godot                  # (already exists)
├── CLAUDE.md                      # Your project-specific instructions (created if missing)
├── .mcp.json                      # MCP server configuration
└── .godot-claude/
    ├── CLAUDE.md                  # Agent brain — always updated by installer
    ├── ref/                       # Reference files (loaded on demand, not all at once)
    │   ├── mcp-tools.md           #   Tool catalog
    │   ├── gdscript-patterns.md   #   Code patterns and best practices
    │   ├── scene-architecture.md  #   Scene design and node selection
    │   ├── error-patterns.md      #   100+ error patterns with fixes
    │   ├── performance.md         #   Optimization patterns
    │   ├── pixellab.md            #   Asset generation pipeline
    │   ├── gdd-workflow.md        #   Interactive game creation stages
    │   └── docs-index.md          #   Godot docs path index
    ├── memory/                    # Stubs (megamemory used for persistent knowledge)
    └── session/
        └── last-session.md        # Session state for continuity across /clear
```

---

## Usage

### Quick commands

Once Claude Code is running in your project, use natural language:

| Say this | What happens |
|----------|-------------|
| `start new game` | Interactive 9-stage GDD workflow, then scaffolds the project |
| `continue` | Resume from last session and megamemory context |
| `status` | Show project state and development progress |
| `next phase` | Plan and begin the next development phase |
| `what's done` | List completed features and systems |
| `optimize` | Run the performance profiling workflow |
| `fix errors` | Enter the error detection and fixing loop |

### Model routing

Different tasks benefit from different models. The agent will suggest switching when it detects a mismatch.

| Task type | Recommended model | Command |
|-----------|-------------------|---------|
| Architecture, system design, GDD | Opus | `claude --model opus` |
| Development, features, bug fixes | Sonnet (default) | `claude` |
| Documentation, comments | Haiku | `claude --model haiku` |
| Changelogs, version bumps | Haiku | `claude --model haiku` |

---

## Tool Categories

The godot-engine-mcp server organizes its 209 tools into 23 categories. Four core categories are always loaded. The remaining 19 are loaded on demand via `enable_category` and automatically unloaded after 10 minutes of inactivity.

### Core categories (always loaded)

| Category | Tools | Description |
|----------|------:|-------------|
| scene | 10 | Open, save, create, list, and manage scenes |
| node | 14 | Add, remove, move, inspect, and modify nodes |
| script | 8 | Create, read, update, and validate GDScript files |
| editor | 10 | Editor state, screenshots, play/stop, file system |

### Extended categories (on-demand)

| Category | Tools | Description |
|----------|------:|-------------|
| animation | 14 | AnimationPlayer and AnimationTree control |
| audio | 8 | AudioStreamPlayer, buses, effects |
| batch | 8 | Bulk property and node operations |
| debugger | 10 | Breakpoints, stack inspection, remote debugging |
| docs | 6 | In-engine class and method documentation lookup |
| input | 8 | Input map, actions, and event configuration |
| localization | 8 | Translation files and locale management |
| navigation | 6 | NavigationServer, agents, and pathfinding |
| networking | 8 | Multiplayer, RPC, and network configuration |
| particles | 6 | CPUParticles and GPUParticles configuration |
| physics | 8 | Physics bodies, shapes, layers, and raycasting |
| plugins | 6 | Editor plugin management |
| profiling | 6 | Performance monitors and frame profiling |
| project | 10 | Project settings, autoloads, and exports |
| rendering | 12 | Viewports, environments, and shader management |
| resources | 8 | Load, save, inspect, and manage resources |
| runtime | 18 | Scene tree manipulation, signals, and game state |
| tilemap | 8 | TileMap and TileSet editing |
| ui | 9 | Control nodes, themes, and layout management |

### Meta-tools (4)

| Tool | Purpose |
|------|---------|
| `list_categories` | Show all categories with tool counts and load status |
| `enable_category` | Load an extended category to make its tools available |
| `disable_category` | Unload a non-core category to free context |
| `server_status` | Connection state, loaded categories, port, version |

**Total: 209 category tools + 4 meta-tools = 213 registered tools**

---

## MCP Servers

godot-claude uses three MCP servers, configured in `.mcp.json`:

### godot-engine-mcp (required)

The primary engine control server. Written in TypeScript, bundled in `server/`. Communicates with the Godot editor over WebSocket on port 6505.

- 209 tools across 23 categories
- Requires the Godot editor to be running with the companion plugin enabled
- Built automatically by the installer

### godot-mcp-docs (recommended)

Offline documentation server for the complete Godot 4.x API. Written in Python, bundled in `docs-server/`. Provides two tools:

- `get_documentation_tree` — browse the full doc structure
- `get_documentation_file` — retrieve a specific doc (e.g., `classes/class_node2d.md`)

Covers 1,582 documentation files including all classes, tutorials, and guides. Requires a one-time build step (Python 3.10+, pandoc) that the installer can handle.

### context7 (automatic fallback)

Cloud-based documentation lookup. Used automatically when godot-mcp-docs is not configured. No setup required — it is a built-in Claude Code MCP plugin.

### PixelLab (optional)

AI pixel art generation at [pixellab.ai](https://pixellab.ai). Generates characters, animations, tilesets, and game assets. Requires an API key configured in `.mcp.json`.

---

## Context Management

The agent actively protects your context window to maintain coherence during long sessions:

- **At ~60% context usage** — warns you to consider running `/clear` soon
- **At ~80% context usage** — saves session state to `.godot-claude/session/last-session.md` and tells you to `/clear` now
- **After `/clear`** — reads the session file and queries megamemory, then resumes where you left off

Session files are kept slim (current task, next steps, blockers). Detailed knowledge — architecture decisions, discovered patterns, error fixes — is stored in the megamemory knowledge graph, which persists in `.megamemory/` and survives context clears.

Reference files in `.godot-claude/ref/` are loaded on demand, never all at once. The agent reads only what the current task requires.

---

## Updating

Re-run the installer to update agent files and reference docs. Your project `CLAUDE.md`, megamemory data, and session state are preserved automatically.

```bash
cd godot-claude
git pull
./install.sh /path/to/your/godot-project
```

The installer will rebuild the server if source files have changed.

---

## Project Structure

```
godot-claude/
├── README.md               # This file
├── CLAUDE.md                # Agent instructions (copied to .godot-claude/)
├── install.sh               # Linux/macOS installer
├── install.ps1              # Windows PowerShell installer
├── server/                  # godot-engine-mcp — TypeScript MCP server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   ├── connection.ts    # WebSocket connection to Godot
│   │   ├── registry.ts      # Category registration and lifecycle
│   │   ├── categories/      # 23 tool category definitions
│   │   │   ├── scene.ts
│   │   │   ├── node.ts
│   │   │   ├── script.ts
│   │   │   ├── editor.ts
│   │   │   └── ... (19 more)
│   │   └── utils/           # Shared types, validation, errors
│   └── build/               # Compiled output (generated)
├── docs-server/             # godot-mcp-docs — Python MCP server
│   ├── main.py              # Server entry point
│   ├── pyproject.toml
│   ├── docs_converter/      # RST-to-Markdown converter
│   └── docs/                # Generated documentation (after build)
└── agent/                   # Agent files (copied to .godot-claude/)
    ├── ref/                 # Reference documents
    ├── memory/              # Memory stubs
    └── session/             # Session templates
```

---

## License

MIT
