---
name: godogen
description: |
  This skill should be used when the user asks to "make a game", "build a game", "generate a game", or wants to generate or update a complete Godot pixel art game from a natural language description.
---

# Game Generator — Orchestrator

Generate and update pixel art Godot games from natural language. All art assets use **PixelLab MCP** exclusively.

## Capabilities

Read each sub-file from `${CLAUDE_SKILL_DIR}/` when you reach its pipeline stage.

| File | Purpose |
|------|---------|
| `visual-target.md` | Generate reference image via PixelLab anchoring art direction |
| `decomposer.md` | Decompose game into a development plan (`PLAN.md`) |
| `scaffold.md` | Design architecture and produce compilable Godot skeleton |
| `asset-planner.md` | Plan what pixel art assets the game needs |
| `asset-gen.md` | Generate assets via PixelLab MCP (characters, tilesets, props) |

## Pipeline

```
User request
    |
    +- Check if PLAN.md exists (resume check)
    |   +- If yes: read PLAN.md, STRUCTURE.md, MEMORY.md -> skip to task execution
    |   +- If no: continue with fresh pipeline below
    |
    +- Check if this is an EXISTING project (megamemory has concepts / project has scenes+scripts)
    |   +- If yes: read megamemory + analyze project -> generate incremental PLAN.md
    |   +- If no: full fresh pipeline
    |
    +- Generate visual target -> reference.png + ASSETS.md (art direction only)
    +- Decompose into tasks -> PLAN.md (each task maps to a GSD phase)
    +- Design architecture -> STRUCTURE.md + project.godot + stubs
    |
    +- Plan and generate pixel art assets -> ASSETS.md + updated PLAN.md with asset assignments
    |
    +- Create GSD phases in .planning/ROADMAP.md from PLAN.md tasks
    |
    +- For every task in PLAN.md:
    |   +- Set `**Status:** pending`
    |   +- Fill `**Targets:**` with concrete project-relative files expected to change
    |     (e.g. scenes/main.tscn, scripts/player_controller.gd, project.godot)
    |     inferred from task text + scene/script mappings in STRUCTURE.md
    |
    +- Show user a concise plan summary (game name, numbered task list)
    |
    +- Find next ready task (pending, deps all done)
    +- While a ready task exists:
    |   +- Update PLAN.md: mark task status -> in_progress
    |   +- Mark GSD phase in_progress
    |   +- Skill(skill="godot-task") with task block
    |   +- Mark task completed in PLAN.md OR replan based on the outcome, summarize to user
    |   +- Mark GSD phase completed
    |   +- megamemory:create_concept — record what was built
    |   +- git add . && git commit -m "Task N done"
    |   +- Find next ready task
    |
    +- Summary of completed game
```

PLAN.md task `**Status:**`: one of `pending`, `in_progress`, `done`, `done (partial)`, `skipped`.

## Running Tasks

Each task runs via `Skill(skill="godot-task")` which auto-forks into a sub-agent with clean context. Pass the full task block from PLAN.md as the skill argument:

```
Skill(skill="godot-task") with argument:
  ## N. {Task Name}
  - **Status:** in_progress
  - **Targets:** scenes/main.tscn, scripts/player_controller.gd
  - **Goal:** ...
  - **Requirements:** ...
  - **Verify:** ...
```

## Existing Project Flow

When the user has an existing project (not starting from scratch):
1. Call `megamemory:understand("project architecture and current state")`
2. Analyze existing scenes/scripts via godot-engine-mcp (`list_scenes`, `list_scripts`)
3. Understand what exists and what the user wants to add/change
4. Generate an incremental PLAN.md that preserves existing architecture
5. New features integrate with existing scenes, scripts, and signals
6. Add as new GSD phases in `.planning/ROADMAP.md`

## Mid-Pipeline Recovery

- **Reset scenes/scripts** — regenerate project skeleton when a task has corrupted or outgrown the architecture.
- **Rewrite the plan** — edit PLAN.md when a task reveals the approach is wrong or new requirements emerge.
- **Generate or regenerate assets** — create new assets or fix broken ones mid-run via PixelLab MCP.

## Visual QA

Visual QA runs inside godot-task — each task handles its own VQA cycle using Claude's native vision (reading captured PNGs directly). The task agent reports a VQA report alongside screenshots. **Never ignore a fail verdict** — always act on it before marking a task done.

- **pass/warning** — move on.
- **fail** — godot-task already attempted up to 3 fix cycles. Read its failure report (includes VQA issues and root cause hypothesis) and decide:
  - **Replan** — reset architecture, rewrite plan, and/or regenerate assets if the root cause is upstream.
  - **Escalate** — surface the issue to the user if you can't determine the right fix.

## GSD Integration

Each task in PLAN.md maps to a GSD phase:
1. After writing PLAN.md, create `.planning/ROADMAP.md` with phases matching tasks
2. Before executing a task: mark its GSD phase `in_progress`
3. After completing a task: mark its GSD phase `completed`
4. After completing a task: `megamemory:create_concept` to record what was built, patterns discovered, workarounds found

## Debugging

If a task reports failure or you suspect integration issues:
- Read `MEMORY.md` — task execution logs discoveries and workarounds
- Read screenshots in `screenshots/{task_folder}/`
- Use godot-engine-mcp `validate_script` to check cross-project compilation
- Run `play_scene` + `get_game_screenshot` to visually inspect
