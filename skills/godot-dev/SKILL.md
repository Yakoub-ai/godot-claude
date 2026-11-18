---
name: godot-dev
description: Core workflow and engineering standards for building games in Godot 4.4+ with the godot MCP tools. Use for any Godot task - writing GDScript, building scenes, adding features, fixing bugs, refactoring - in 2D or 3D projects.
---

# Godot development workflow

You are building a game in a Godot 4.4+ project. Work like a senior gameplay engineer: small verified steps, data-driven design, tests for logic, playtests for feel.

## The loop (every feature or fix)

1. **Orient** — `project_info` (once per session): engine version, main scene, autoloads, input actions, layers. Read the relevant scenes with `scene_read` and scripts with Read before changing them.
2. **Plan** — for anything bigger than a small change, write the plan first: which scenes/scripts change, which nodes, which signals. Bigger systems: use the `godot-architect` agent or `references/architecture.md`.
3. **Look up APIs** — `api_docs` for any class or method you're not 100% sure about in *this* engine version. Never guess API names; Godot 3 → 4 renamed a lot (see `references/gdscript.md` § Godot 3 habits).
4. **Build** — write scripts with Write/Edit; build or change scenes with `scene_edit` (not hand-written .tscn). Keep each step small enough to verify.
5. **Verify** — the PostToolUse hook compiles every .gd you write and reports errors: fix them immediately. Then `check` (whole project), `run_tests`, and for anything a player can see or feel, a playtest (`godot-testing` skill).
6. **Review** — before calling a feature done, re-read the diff against the standards below (or run the `godot-reviewer` agent for larger changes).

Do not claim something works until `check` is clean and you have tested or playtested it. Report what you verified and how.

## Engineering standards

**GDScript**
- Static typing everywhere: variables, parameters, return types, typed arrays (`Array[Enemy]`) and typed dictionaries (`Dictionary[StringName, int]`, 4.4+). Use `:=` only when the type is obvious from the right side.
- Order in a script: `class_name`, `extends`, doc comment, signals, enums, constants, `@export` vars, public vars, private vars (`_name`), `@onready` vars, built-in callbacks (`_ready`, `_process`...), public methods, private methods.
- Names: `snake_case` files/functions/vars, `PascalCase` classes/nodes, `UPPER_CASE` constants, signals in past tense (`died`, `health_changed`).
- `@export` for designer-tunable values (with `@export_range`, `@export_group`), never magic numbers in logic.
- `@onready var sprite: Sprite2D = $Sprite` or `%UniqueName` (scene-unique names) — no `get_node` in `_process`.
- Frame-rate independence: multiply by `delta`; movement/physics in `_physics_process`, visuals in `_process`.
- Details and patterns: `references/gdscript.md`.

**Architecture**
- Composition over inheritance: small reusable scenes/components (HealthComponent, Hitbox/Hurtbox) instead of deep class trees.
- "Call down, signal up": parents call methods on children; children emit signals. Siblings talk through the parent or a signal bus — never `get_parent().get_parent()`.
- Data in Resources (`class_name ItemData extends Resource`) — stats, levels, waves, dialogue — not hard-coded in scripts.
- Autoloads only for truly global services (game state, save, audio, scene transitions, event bus). Keep them thin.
- One responsibility per script; scenes that run on their own (press F6 on any scene and it works or fails loudly).
- Collision layers named in Project Settings and used consistently (world, player, enemies, pickups, hitboxes...).
- Full guide with state machines, save systems, scene management: `references/architecture.md`.

**Project layout** (feature-based for anything non-trivial)
```
res://
  game/            # autoloads, main scene, scene transitions
  actors/player/   # player.tscn, player.gd, player_states/
  actors/enemies/
  levels/
  ui/
  components/      # reusable nodes: health, hitbox, interactable...
  data/            # .tres resources and their scripts
  assets/          # art, audio, fonts (imported)
  test/            # test_*.gd
```

**Version control**: commit `.godot/`-excluded projects with `*.uid` and `*.import` files (4.4+ uses .uid files; they must be committed alongside scripts). Commit after each verified step.

## Tool notes

- `scene_edit` ops are atomic and validated; property typos come back with suggestions. Use `{"$new": "CircleShape2D", "radius": 8}` for sub-resources, `{"$res": "res://..."}` for files, `[x, y]` for vectors.
- `check` runs an import first, so it also catches broken asset references.
- If a tool says the server's Godot version differs from the project's, tell the user: saving with a newer engine upgrades file formats.
- Engine version matters: see `references/versions.md` for what exists in 4.4 / 4.5 / 4.6 / 4.7 before using newer features (e.g. variadic functions and `@abstract` need 4.5+).

## When things break

Read `references/debugging.md`: reading Godot errors, the usual suspects (null `@onready` in wrong scene, wrong node path, signals not connected, physics layers/masks, `_ready` order), and performance profiling.
