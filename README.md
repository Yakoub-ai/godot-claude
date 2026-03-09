# godot-claude

**An AI agent for Godot 4.x game development, powered by Claude Code.**

Installs directly into your Godot project. Claude Code becomes an expert collaborator that can design, build, debug, and optimize your game — using three MCP servers for engine control, documentation lookup, and asset generation.

---

## What It Does

| Capability | How |
|-----------|-----|
| **Architect** games from a text description | Interactive GDD workflow → project scaffold |
| **Write** GDScript with full static typing | Direct Godot editor integration via MCP Pro |
| **Build** scenes, nodes, physics, UI | 162 MCP tools for engine manipulation |
| **Debug** errors with 100+ known patterns | Error pattern database + docs lookup |
| **Optimize** performance with profiling | Manager pattern, pooling, MultiMesh guidance |
| **Generate** pixel art assets | PixelLab MCP integration |
| **Remember** your project across sessions | Persistent memory + session continuity |

---

## Requirements

- **Claude Code** (CLI) — this is the only supported interface
- **Godot 4.x** — with MCP Pro plugin installed and editor running
- **Node.js 18+** — for MCP server communication

Optional:
- **PixelLab API key** — for AI art generation (pixellab.ai)

---

## Install

### 1. Clone this repo (anywhere)

```bash
git clone https://github.com/YOUR_ORG/godot-claude.git
cd godot-claude
```

### 2. Run the installer, pointing at your Godot project

**Windows (PowerShell):**
```powershell
pwsh install.ps1 -ProjectPath "C:\Games\MyProject"
```

**Linux / macOS:**
```bash
./install.sh ~/games/my-project
```

Or run without arguments for interactive mode:
```bash
pwsh install.ps1
./install.sh
```

### 3. Start Claude Code in your project

```bash
cd C:\Games\MyProject
claude
```

That's it. Claude reads `CLAUDE.md` automatically and becomes your Godot agent.

---

## What Gets Installed

The installer copies these files into your **Godot project root**:

```
YourProject/
├── project.godot            # (already exists)
├── CLAUDE.md                # Agent brain — Claude Code reads this automatically
├── .mcp.json                # MCP server configuration
└── .godot-claude/
    ├── ref/                 # Reference files (7 files, loaded ON DEMAND)
    │   ├── mcp-tools.md     #   162 MCP Pro tool catalog
    │   ├── gdscript-patterns.md  #   Code patterns & best practices
    │   ├── scene-architecture.md #   Scene design & node selection
    │   ├── error-patterns.md     #   100+ error patterns with fixes
    │   ├── performance.md        #   Optimization patterns
    │   ├── pixellab.md           #   Asset generation pipeline
    │   ├── gdd-workflow.md       #   Interactive game creation stages
    │   └── docs-index.md         #   Godot docs MCP path index
    ├── memory/              # Project memory (grows over time)
    │   ├── project.md       #   Game concept, tech stack, current state
    │   ├── decisions.md     #   Architectural decision log
    │   ├── patterns.md      #   Discovered code patterns
    │   └── errors.md        #   Project-specific error solutions
    └── session/
        └── last-session.md  # Session state for /clear continuity
```

**Context efficiency:** The agent NEVER loads all reference files at once. It reads the file index in `CLAUDE.md` and loads only what the current task needs (max 2 files per task).

---

## Model Routing

Use the right model for the job to save cost and get better results:

| Task | Model | Command |
|------|-------|---------|
| Architecture, GDD, system design | **Opus** | `claude --model opus` |
| Development, bug fixing, features | **Sonnet** | `claude` (default) |
| Documentation, comments, READMEs | **Haiku** | `claude --model haiku` |
| Changelogs, version bumps | **Haiku** | `claude --model haiku` |

The agent will suggest switching models when it detects a mismatch.

---

## Context Management

The agent actively protects your context window:

- **~60% full** → Warns you: *"Context getting full. Consider `/clear` soon."*
- **~80% full** → Saves session state and tells you to `/clear` now
- **After `/clear`** → Reads `last-session.md` and picks up where you left off

Session summaries include: what was being worked on, what's done, what's next, key decisions, active files, and any blockers.

---

## Quick Start Commands

Once Claude Code is running in your project:

| Say This | What Happens |
|----------|-------------|
| `start new game` | Interactive 9-stage GDD → full project scaffold |
| `continue` | Resume from last session |
| `status` | Report current project state |
| `optimize` | Performance profiling workflow |
| `fix errors` | Error detection and fixing loop |

---

## MCP Servers

The agent uses three MCP servers (configured in `.mcp.json`):

| Server | Purpose | Tools |
|--------|---------|-------|
| **Godot MCP Pro** | Direct engine control — scenes, nodes, scripts, testing | 162 tools |
| **Godot Docs MCP** | Documentation lookup — classes, tutorials, best practices | 1,582 docs |
| **PixelLab** | AI pixel art — characters, animations, tilesets | Optional |

**Godot MCP Pro requires:**
1. Godot 4.x editor running
2. MCP Pro plugin installed and enabled in the editor

---

## Updating

Re-run the installer to update reference files. Your memory and session data are preserved automatically.

```powershell
pwsh install.ps1 -ProjectPath "C:\Games\MyProject"
```

---

## Project Structure

This repository (what you cloned):

```
godot-claude/
├── install.ps1      # Windows installer
├── install.sh       # Linux/macOS installer
├── CLAUDE.md        # Agent instructions (copied to project)
├── agent/           # Agent files (copied to project as .godot-claude/)
│   ├── ref/         # Reference files
│   ├── memory/      # Memory templates
│   └── session/     # Session templates
└── README.md        # This file
```

---

## License

MIT
