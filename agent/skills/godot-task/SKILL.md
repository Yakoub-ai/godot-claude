---
name: godot-task
description: |
  Execute a single Godot development task — generate scenes and/or scripts, verify visually.
context: fork
---

# Godot Task Executor

All files below are in `${CLAUDE_SKILL_DIR}/`. Load progressively — read each file when its phase begins, not upfront.

| File | Purpose | When to read |
|------|---------|--------------|
| `quirks.md` | Known Godot gotchas and workarounds | Before writing any code |
| `gdscript.md` | GDScript syntax reference | Before writing any code |
| `scene-generation.md` | Building `.tscn` files via headless GDScript builders | Targets include `.tscn` |
| `script-generation.md` | Writing runtime `.gd` scripts for node behavior | Targets include `.gd` |
| `coordination.md` | Ordering scene + script generation | Targets include both `.tscn` and `.gd` |
| `test-harness.md` | Writing `test/test_{id}.gd` verification scripts | Before writing test harness |
| `capture.md` | Screenshot capture with MCP tools or headless fallback | Before capturing screenshots |
| `visual-qa.md` | Visual QA using Claude vision | `reference.png` exists and task has visual output |

## Documentation Lookup

**Primary:** Use `godot-mcp-docs` MCP server — `get_documentation_file("classes/class_{lowercase}.md")`

**Fallback 1:** Use `context7` MCP — `resolve-library-id("godot engine")` then `query-docs(libraryId, "your question")`

**Fallback 2:** Auto-generated offline docs — `${CLAUDE_SKILL_DIR}/doc_api/`:
- `_common.md` — Index of ~128 common Godot classes (one-line each)
- `_other.md` — Index of ~732 remaining Godot classes
- `{ClassName}.md` — Full API reference for a single Godot class

Bootstrap doc_api if missing: `bash ${CLAUDE_SKILL_DIR}/tools/ensure_doc_api.sh`

Execute a single development task from PLAN.md:

$ARGUMENTS

## Workflow

1. **Analyze the task** — read the task's **Targets** to determine what to generate:
   - `scenes/*.tscn` targets → generate scene builder(s) or use MCP tools
   - `scripts/*.gd` targets → generate runtime script(s)
   - Both → generate scenes FIRST, then scripts (scenes create nodes that scripts attach to)
2. **Import assets** — run `timeout 60 godot --headless --import` to generate `.import` files for any new textures or resources. Without this, `load()` fails.
3. **Generate scene(s)** — prefer godot-engine-mcp tools (`create_scene`, `add_node`, `update_property`, `attach_script`). Fall back to headless scene builders for complex cases.
4. **Generate script(s)** — write `.gd` files to `scripts/`
5. **Validate** — use `validate_script` MCP tool, or `timeout 60 godot --headless --quit` to check for parse errors
6. **Fix errors** — if Godot reports errors, read output, fix files, re-run. Repeat until clean.
7. **Generate test harness** — write `test/test_{task_id}.gd` implementing the task's **Verify** scenario.
8. **Capture screenshots** — prefer `play_scene` + `get_game_screenshot` via MCP. Fall back to headless `--write-movie` capture for CI/headless environments.
9. **Verify visually** — read captured PNGs directly (Claude's native vision) and check three things:
   - **Task goal:** does the screenshot match the **Verify** description?
   - **Visual consistency:** if `reference.png` exists, compare against it — color palette, scale proportions, camera angle, and visual density should be consistent.
   - **Visual quality & logic:** look for obvious bugs — geometry clipping, objects floating, wrong assets, text overflow, UI elements overlapping or cut off.
   Also check harness stdout for `ASSERT FAIL`.
   If any check fails, identify the issue, fix scene/script/test, and repeat from step 3.
10. **Visual QA** — run visual QA using Claude vision when applicable (reference.png exists).
11. **Store final evidence** — save screenshots in `screenshots/{task_folder}/` before reporting completion.

## Iteration Tracking

Steps 3-10 form an **implement → screenshot → verify → VQA** loop.

There is no fixed iteration limit — use judgment:
- If there is progress — even in small, iterative steps — keep going. Screenshots and file updates are cheap.
- If you recognize a **fundamental limitation** (wrong architecture, missing engine feature, broken assumption), stop early — even after 2-5 iterations. More loops won't help.
- The signal to stop is **"I'm making the same kind of fix repeatedly without convergence"**.

## Reporting to Orchestrator

Always end your response with:
- **Screenshot path:** `screenshots/{task_folder}/` and which frames best represent the result
- **What each screenshot shows** — one line per frame
- **VQA report:** summary of visual QA findings (or "skipped" if non-visual)

On failure, also include:
- What's still wrong
- What you tried and why it didn't fix it
- Your best guess at the root cause

The caller (godogen orchestrator) will decide whether to adjust the task, re-scaffold, or accept the current state.

## Commands

```bash
# Import new/modified assets (MUST run before scene builders):
timeout 60 godot --headless --import

# Compile a scene builder (produces .tscn):
timeout 60 godot --headless --script <path_to_gd_builder>

# Validate all project scripts (parse check):
timeout 60 godot --headless --quit 2>&1
```

**Or use MCP tools (preferred):**
```
validate_script(path)     # Check a specific script
play_scene(scene_path)    # Run a scene
get_game_screenshot()     # Capture current game view
```

**Error handling:** Parse Godot's stderr/stdout for error lines. Common issues:
- `Parser Error` — syntax error in GDScript, fix the line indicated
- `Invalid call` / `method not found` — wrong node type or API usage, look up the class in docs
- `Cannot infer type` — `:=` used with `instantiate()` or polymorphic math functions, see type inference rules
- Script hangs — missing `quit()` call in scene builder; kill the process and add `quit()`

## Project Memory

Read `MEMORY.md` before starting work — it contains discoveries from previous tasks (workarounds, Godot quirks, asset details, architectural decisions). After completing your task, write back anything useful you learned: what worked, what failed, technical specifics others will need.
