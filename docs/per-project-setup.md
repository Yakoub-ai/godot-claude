# Per-Project Setup Guide

How to configure a Godot project to use the godot-claude tools.

## 1. MCP Servers

Copy `.mcp.json.example` from the root of this repo into your Godot project root as `.mcp.json`:

```bash
cp /path/to/godot-claude/.mcp.json.example /path/to/your-project/.mcp.json
```

Set the PixelLab API key (get one from pixellab.ai):

```bash
export PIXELLAB_API_KEY=your_key_here
# Or add to ~/.bashrc / ~/.zshrc for persistence
```

The Godot MCP Pro plugin must be installed and the Godot editor must be running for
engine-integration tools to work. Install the plugin from the Godot Asset Library or
follow the setup guide at the Godot MCP Pro repo.

## 2. CLAUDE.md — Mandatory skill invocation

Add this block to the top of your project's `CLAUDE.md` (create one if it doesn't exist):

```markdown
## MANDATORY: Always Use godot-dev Skill
This is a Godot project. Before ANY work — code changes, scene edits, debugging,
asset generation, documentation lookup — invoke the `godot-dev` skill. No exceptions.
```

Then add a game overview section so Claude has immediate context:

```markdown
## Game Overview
[Engine version, genre, core loop in 2-3 sentences. Key constraint: no gravity/platformer,
or 8-dir movement, or whatever is non-obvious.]
```

## 3. Per-Project Reference File

Create a project-specific reference in the skill's references directory:

```bash
cp /path/to/godot-claude/skill/references/project-template.md \
   /path/to/godot-claude/skill/references/your-project.md
```

Fill in the template, then run `install.sh` to deploy it to `~/.claude/skills/godot-dev/references/`.

The reference file is loaded by Claude when it invokes the `godot-dev` skill, giving it
project-specific context (scene paths, conventions, system architecture) without you
needing to re-explain every session.

## 4. Verify Everything Works

In a Claude Code session inside your project, type a Godot-related message. Claude should:
1. Automatically invoke the `godot-dev` skill
2. Have access to `mcp__godot-mcp-pro__*`, `mcp__godot-mcp-docs__*`, and `mcp__pixellab__*` tools

If MCP tools are missing, check that `.mcp.json` is in the project root and the Godot editor is open.
