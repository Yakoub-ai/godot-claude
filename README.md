# godot-claude

An AI agent for Godot 4.x game development, powered by Claude Code (CLI).

godot-claude installs into your Godot project and turns Claude Code into an expert game development collaborator. It provides direct engine control through 154 verified MCP tools, offline documentation for the full Godot API, persistent project memory, and structured development workflows — all from the command line.

---

## Features

| Capability | How It Works |
|-----------|--------------|
| **Build scenes and nodes** | 154 verified tools for direct Godot editor manipulation via WebSocket |
| **Write GDScript** | Script creation, editing, and validation with enforced static typing |
| **Architect games** | Interactive GDD workflow produces a structured development plan |
| **Debug errors** | 100+ known error patterns with automatic fixes, plus docs lookup |
| **Optimize performance** | Profiling tools, manager patterns, pooling, MultiMesh guidance |
| **Generate pixel art** | PixelLab MCP integration for characters, animations, tilesets |
| **Remember across sessions** | neural-memory knowledge graph persists architecture, decisions, and patterns |
| **Look up any Godot API** | 1,582 offline docs or cloud fallback via context7 |
| **Generate complete games** | Godogen pipeline: describe a game → get a playable pixel art game |
| **Track development phases** | GSD workflow for milestones, phases, and task execution |

---

## Architecture

```
                          Claude Code (CLI)
                                |
                    stdio (Model Context Protocol)
                                |
    +--------------+---------------+---------------+
    |              |               |               |
godot-engine   godot-mcp       neural-         PixelLab
  -mcp          -docs          memory          (cloud)
 (Node.js)    (Python)        (Python)        pixel art
  154 tools  1,582 docs     knowledge graph
    |              |               |
WebSocket    local file I/O    SQLite +
  :6505                       embeddings
    |
Godot Editor
  Plugin
 (GDScript)
    |
Godot 4.x
  Engine
```

### Game Generation Pipeline (godogen)

```
User: "make a pixel art platformer"
    |
    +- GDD workflow -> Visual Target & Decomposer -> PLAN.md
    +- Scaffold generates project architecture (STRUCTURE.md)
    +- Asset Pipeline generates assets (PixelLab, Gemini, Tripo3D)
    +- LPC Compositor creates layered character spritesheets
    +- Scene builders create .tscn files
    +- Scripts implement game logic
    +- Visual QA verifies via screenshots (Gemini Flash)
    +- Each task tracked as GSD phase
    → Playable game
```

### How it works

**godot-engine-mcp** is the core. It is a TypeScript MCP server that exposes 154 plugin-backed tools for controlling the Godot editor. Claude Code connects to it over stdio. Internally, it opens a WebSocket server on port 6505 and waits for the Godot editor to connect via a companion GDScript plugin. When Claude calls a tool (e.g., `create_scene`, `add_node`, `validate_script`), the server sends a JSON-RPC 2.0 request over WebSocket, the plugin executes it in the editor, and the result comes back.

Tools are organized into 19 active **categories**. Four core categories (scene, node, script, editor) are always available. The other 15 are loaded on demand — the agent calls `enable_category` when it needs animation tools, physics tools, etc. Categories auto-unload after 10 minutes of inactivity to keep the tool list manageable.

**godot-mcp-docs** provides offline access to the full Godot 4.x documentation — every class, tutorial, and guide. If it is not configured, the agent automatically falls back to **context7** (a cloud-based docs service built into Claude Code).

**PixelLab** is optional. It generates AI pixel art (characters, tilesets, animations) via API and integrates the results back into Godot as sprites and resources.

### Knowledge layer

The agent maintains context across sessions through two mechanisms:

- **neural-memory** — A three-layer knowledge graph (`.neural-memory/`) with semantic embeddings that indexes code, tracks bugs, and manages tasks. Uses 128-dimensional composite embeddings for semantic search across code, bug, and task nodes. Queried at session start and updated after each task.
- **Session files** — A slim handoff file (`.godot-claude/session/last-session.md`) that captures the current task, next steps, and blockers. Written before `/clear`, read after.

Reference files in `.godot-claude/ref/` (error patterns, GDScript conventions, performance guides) are loaded on demand — never all at once — to protect the context window.

---

## Prerequisites

Before installing, verify you have the following. The installer will check for these and tell you if anything is missing.

### Required

**[Claude Code](https://claude.ai/claude-code)** — the AI agent CLI.
```bash
npm install -g @anthropic-ai/claude-code
claude --version  # should print a version number
```

**[Godot 4.x](https://godotengine.org/download/)** — the game engine. Must be running with the companion plugin active for engine tools to work.
```bash
godot --version   # should print 4.x.x
```

**[Node.js 18+](https://nodejs.org/)** — runs the `godot-engine-mcp` server.
```bash
node --version    # should print v18.x.x or higher
```

### Recommended (enables more features)

**[Python 3.10+](https://python.org/)** — runs the offline documentation server, asset tools, and neural-memory.
```bash
python3 --version  # should print 3.10.x or higher
```

**[uv](https://docs.astral.sh/uv/)** — used to run the `neural-memory` MCP server. The installer will warn if it is missing.
```bash
# Install uv (macOS / Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify
uvx --version
```
> If `uv` is not installed, the installer will still complete but neural-memory won't start. Add it after and re-run the installer.

**[neural-memory-mcp](https://github.com/Yakoub-ai/neural-memory)** — the knowledge graph. The installer installs this automatically via pip if Python is available.
```bash
# Installed automatically, but you can verify manually:
python3 -c "import neural_memory; print('neural-memory OK')"
```

### Optional (unlocks game generation pipeline)

| Dependency | Purpose | How to get |
|-----------|---------|------------|
| [pandoc](https://pandoc.org/) | Converts Godot docs to Markdown (one-time build) | `brew install pandoc` / package manager |
| `PIXELLAB_API_KEY` | AI pixel art generation | [pixellab.ai](https://pixellab.ai) |
| `GOOGLE_API_KEY` | 2D asset generation & Visual QA via Gemini | [Google AI Studio](https://aistudio.google.com/) |
| `TRIPO3D_API_KEY` | Image-to-3D model conversion | [tripo3d.ai](https://tripo3d.ai) |
| [RTK](https://github.com/rtk-ai/rtk) | Token-optimized CLI proxy (60-90% token savings) | See RTK repo |

---

## Installation

### Step 1 — Clone the repository

```bash
git clone https://github.com/Yakoub-ai/godot-claude.git
cd godot-claude
```

### Step 2 — Run the installer

Point the installer at your Godot project directory. It will detect what's available and configure accordingly.

**Linux / macOS:**
```bash
./install.sh /path/to/your/godot-project
```

**Windows (PowerShell):**
```powershell
pwsh install.ps1 -ProjectPath "C:\Games\MyProject"
```
> Works with PowerShell 7+ (`pwsh`) or Windows PowerShell 5.1: `powershell -ExecutionPolicy Bypass -File install.ps1 -ProjectPath "C:\Games\MyProject"`

**Interactive mode** (folder picker opens if no path is given):
```bash
./install.sh
```

If you point it at a parent directory, it finds all `project.godot` files within two levels and lets you choose.

### Step 3 — What the installer sets up

The installer checks each component and tells you its status. Here's what it does and why:

| Step | What happens | Why it matters |
|------|-------------|----------------|
| **Node.js check** | Fails with instructions if Node < 18 | Required to build and run `godot-engine-mcp` |
| **Build godot-engine-mcp** | `npm ci && npm run build` in `server/` | Compiles the TypeScript MCP server — the core engine control layer |
| **Godot CLI check** | Warns if `godot` not on PATH | Needed for headless scene/script generation |
| **Python check** | Warns if Python 3 missing | Required for docs server, asset tools, and neural-memory |
| **neural-memory install** | `pip install neural-memory-mcp[vectors]` | Installs the knowledge graph with embedding support |
| **uv check** | Warns with install instructions if missing | `uvx` is how `.mcp.json` starts the neural-memory server |
| **RTK check** | Warns with install link if missing | Optional — saves tokens on verbose CLI commands |
| **Copy agent files** | Copies `agent/*` → `.godot-claude/` in your project | Installs reference docs, skills, and memory stubs |
| **Create CLAUDE.md** | Adds project-level `CLAUDE.md` if missing | Never overwrites yours — gives Claude project context |
| **Create `.mcp.json`** | Writes server config for all detected servers | Connects Claude Code to all MCP servers |
| **Create neural-memory config** | Writes `.neural-memory/config.json` with Godot patterns | Ensures `.gd`, `.tscn`, `.tres`, `.gdshader` files are indexed |
| **Update `.gitignore`** | Excludes memory, sessions, neural-memory, planning dirs | Prevents local agent state from being committed |

On re-install, your memory, session data, and project `CLAUDE.md` are preserved.

### Step 4 — Enable the Godot plugin

The installer copies the plugin automatically. You still need to activate it inside Godot:

1. Open your Godot project
2. Go to **Project → Project Settings → Plugins**
3. Find **godot_mcp** and set it to **Enable**

The Node.js MCP server opens a WebSocket listener on port `6505` and the Godot plugin connects back to it. Without the plugin enabled and the editor open, all engine tools (create scene, add node, play scene, etc.) will fail.

### Step 5 — Verify the installation

Run these checks to confirm everything is working:

```bash
# 1. MCP server builds without error
npm --prefix /path/to/godot-claude/server run build

# 2. neural-memory is importable
python3 -c "import neural_memory; print('neural-memory OK')"

# 3. uvx can find the neural-memory package
uvx --from neural-memory-mcp neural-memory --version 2>&1 | head -3

# 4. Claude Code picks up the MCP config
cd /path/to/your/godot-project
claude --mcp-debug 2>&1 | grep -E "neural-memory|godot-engine|godot-mcp"
```

Repository maintainers can run the static verifier before releasing or after changing tools:

```bash
./verify.sh          # Linux / macOS
pwsh verify.ps1     # Windows PowerShell
```

The verifier checks TypeScript build health, plugin command parity, license metadata, required docs, and whether offline Godot docs have been built.

If any check fails, the most common fixes:

| Problem | Fix |
|---------|-----|
| `uvx: command not found` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` then restart shell |
| `import neural_memory` fails | `pip install 'neural-memory-mcp[vectors]'` |
| `node build/index.js` fails | Re-run installer — it rebuilds via `npm ci && npm run build` |
| No MCP servers in Claude | Check `.mcp.json` exists at project root; re-run installer |
| Engine tools fail | Confirm Godot editor is open with `godot_mcp` plugin enabled |

### Step 6 — Start Claude Code

```bash
cd /path/to/your/godot-project
claude
```

Claude reads `.godot-claude/CLAUDE.md` on startup and becomes your Godot agent. On first run, say `neural index` to build the knowledge graph of your project.

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
    ├── memory/                    # Stubs (neural-memory used for persistent knowledge)
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
| `continue` | Resume from last session and neural-memory context |
| `status` | Show project state and development progress |
| `next phase` | Plan and begin the next development phase |
| `what's done` | List completed features and systems |
| `optimize` | Run the performance profiling workflow |
| `fix errors` | Enter the error detection and fixing loop |
| `make a game` | Godogen pipeline: GDD → assets → scenes → scripts → playable game |
| `generate game` | Same as "make a game" |
| `add enemies` | Incremental godogen: adds feature to existing project |

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

The godot-engine-mcp server organizes its 154 verified plugin-backed tools into 19 active categories. Four core categories are always loaded. The remaining 15 are loaded on demand via `enable_category` and automatically unloaded after 10 minutes of inactivity. TypeScript declarations that do not yet have bundled Godot plugin handlers are hidden by `server/src/utils/pluginSupport.ts` so Claude Code does not receive tools that would fail at runtime.

### Core categories (always loaded)

| Category | Tools | Description |
|----------|------:|-------------|
| scene | 10 | Open, save, create, list, and manage scenes |
| node | 14 | Add, remove, move, inspect, and modify nodes |
| script | 7 | Create, read, update, and validate GDScript files |
| editor | 10 | Editor state, screenshots, play/stop, file system |

### Extended categories (on-demand)

| Category | Tools | Description |
|----------|------:|-------------|
| animation | 14 | AnimationPlayer and AnimationTree control |
| audio | 6 | AudioStreamPlayer, buses, effects |
| batch | 8 | Bulk property and node operations |
| docs | 4 | In-engine project analysis and documentation lookup |
| input | 7 | Input map, actions, and event simulation |
| navigation | 5 | NavigationServer, agents, and pathfinding |
| particles | 5 | CPUParticles and GPUParticles configuration |
| physics | 6 | Physics bodies, shapes, layers, and raycasting |
| profiling | 2 | Performance monitor inspection |
| project | 10 | Project settings, autoloads, and exports |
| rendering | 12 | Viewports, environments, and shader management |
| resources | 4 | Load, save, inspect, and manage resources |
| runtime | 18 | Scene tree manipulation, signals, and game state |
| tilemap | 6 | TileMap and TileSet editing |
| ui | 6 | Control nodes, themes, and layout management |

### Meta-tools (4)

| Tool | Purpose |
|------|---------|
| `list_categories` | Show all categories with tool counts and load status |
| `enable_category` | Load an extended category to make its tools available |
| `disable_category` | Unload a non-core category to free context |
| `server_status` | Connection state, loaded categories, port, version |

**Total: 154 category tools + 4 meta-tools = 158 registered tools**

---

## MCP Servers

godot-claude uses four MCP servers, configured in `.mcp.json`:

### godot-engine-mcp (required)

The primary engine control server. Written in TypeScript, bundled in `server/`. Communicates with the Godot editor over WebSocket on port 6505.

- 154 verified tools across 19 active categories
- Requires the Godot editor to be running with the companion plugin enabled
- Built automatically by the installer

### godot-mcp-docs (recommended)

Offline documentation server for the complete Godot 4.x API. Written in Python, bundled in `docs-server/`. Provides two tools:

- `get_documentation_tree` — browse the full doc structure
- `get_documentation_file` — retrieve a specific doc (e.g., `classes/class_node2d.md`)

Covers 1,582 documentation files including all classes, tutorials, and guides. Requires a one-time build step (Python 3.10+, pandoc) that the installer can handle.

### neural-memory (included)

Three-layer knowledge graph that provides persistent project memory across sessions. Indexes code, tracks bugs, and manages tasks using 128-dimensional semantic embeddings stored in SQLite.

- `neural_index` — build the knowledge graph from the codebase
- `neural_query` — semantic search across code, bugs, and tasks
- `neural_update` — incremental re-index after changes
- `neural_add_bug` / `neural_add_task` / `neural_insight` — record findings manually

Data persists in `.neural-memory/` and survives context clears. Installed automatically by the installer via `pip install neural-memory-mcp[vectors]`.

### context7 (automatic fallback)

Cloud-based documentation lookup. Used automatically when godot-mcp-docs is not configured. No setup required — it is a built-in Claude Code MCP plugin.

### PixelLab (optional)

AI pixel art generation at [pixellab.ai](https://pixellab.ai). **Required for game generation pipeline** (godogen). Generates characters, animations, tilesets, and game props. Requires an API key configured in `.mcp.json`.

---

## Demo Prompts

Try these to see the game generation pipeline in action:

**Pixel art platformer:**
> "Make a pixel art platformer with a knight who can jump and attack slimes in a forest level"

**Top-down RPG:**
> "Build a top-down pixel art RPG with a village, NPCs you can talk to, and a dungeon with monsters"

**Arcade game:**
> "Generate a retro arcade game — the player is a spaceship dodging asteroids and shooting enemies"

**Amsterdam Cyclist:**
> "A 2D side-scrolling cyclist game through Amsterdam on a red bike lane — 4 horizontal lanes, dodge tourists who jump onto the bike lane. Three caricature types: Selfie Walker, Lost Map Reader, Tulip Hauler. Lane switching with W/S, distance and speed HUD."

---

## Context Management

The agent actively protects your context window to maintain coherence during long sessions:

- **At ~60% context usage** — warns you to consider running `/clear` soon
- **At ~80% context usage** — saves session state to `.godot-claude/session/last-session.md` and tells you to `/clear` now
- **After `/clear`** — reads the session file and queries neural-memory, then resumes where you left off

Session files are kept slim (current task, next steps, blockers). Detailed knowledge — architecture decisions, discovered patterns, error fixes — is stored in the neural-memory knowledge graph, which persists in `.neural-memory/` and survives context clears.

Reference files in `.godot-claude/ref/` are loaded on demand, never all at once. The agent reads only what the current task requires.

---

## Updating

Re-run the installer to update agent files and reference docs. Your project `CLAUDE.md`, neural-memory data, and session state are preserved automatically.

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
├── verify.sh / verify.ps1   # Static MCP/plugin/docs/license verifier
├── server/                  # godot-engine-mcp — TypeScript MCP server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   ├── connection.ts    # WebSocket connection to Godot
│   │   ├── registry.ts      # Category registration and lifecycle
│   │   ├── categories/      # Tool category definitions
│   │   │   ├── scene.ts
│   │   │   ├── node.ts
│   │   │   ├── script.ts
│   │   │   ├── editor.ts
│   │   │   └── ... (additional on-demand categories)
│   │   └── utils/           # Shared types, validation, errors
│   └── build/               # Compiled output (generated)
├── docs-server/             # godot-mcp-docs — Python MCP server
│   ├── main.py              # Server entry point
│   ├── pyproject.toml
│   ├── docs_converter/      # RST-to-Markdown converter
│   └── docs/                # Generated documentation (after build)
├── agent/                   # Agent files (copied to .godot-claude/)
│   ├── ref/                 # Reference documents
│   ├── skills/              # Game generation skills
│   │   ├── godogen/         # Orchestrator (SKILL.md, visual-target, decomposer, scaffold, assets)
│   │   └── godot-task/      # Task executor (SKILL.md, gdscript, quirks, scenes, scripts, VQA)
│   ├── tools/               # Python tools (rembg, spritesheet, doc converter)
│   ├── memory/              # Memory stubs
│   └── session/             # Session templates
```

---

## Credits

godot-claude is developed by Yakoub-ai. Redistributed projects, public demos, videos, repositories, and distributed games that materially use this software must include the credit: **Built with Yakoub-ai**.

The game generation pipeline (godogen) is adapted from [godogen](https://github.com/user/godogen), a standalone Claude Code skills system for autonomous game generation. The pipeline architecture — visual targeting, task decomposition, scaffold generation, asset planning, and visual QA — originates from that project.

---

## License

godot-claude is source-available for noncommercial use under the [Godot Claude Noncommercial Source License](LICENSE). Resale, paid redistribution, commercial hosting, paid marketplace listing, and use in commercial products or services require separate written permission from Yakoub-ai.

Required credit for public or redistributed work: **Built with Yakoub-ai**.
