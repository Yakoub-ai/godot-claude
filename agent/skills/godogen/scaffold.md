# Godot Scaffold Generator

Design game architecture and produce a compilable Godot project skeleton: `project.godot`, `STRUCTURE.md`, script stubs, and scene stubs. Defines *what exists and how it connects* — not behavior.

Works for both fresh projects and incremental changes (adding scenes/scripts, reimplementing subsystems).

## Workflow

1. **Read `reference.png`** — understand the visual target: camera angle, distance, FOV, lighting direction, environment structure, scene layout. Use this to inform architecture decisions (node hierarchy, camera setup).
2. **Read input** — game description (fresh) or change request (incremental).
3. **Assess project state:**
   - No project → create from scratch.
   - Existing project, fresh start requested → delete existing scenes/scripts.
   - Existing project, incremental change → read existing `STRUCTURE.md` and scripts. Identify what to add or replace. Preserve unchanged files.
4. **Design / update architecture** — scenes, scripts, signals, input actions.
5. **Write/update `project.godot`** — create or merge input mappings.
6. **Write `STRUCTURE.md`** — always the complete architecture, not a diff.
7. **Write script stubs** — for new scripts and any existing scripts the task explicitly asks to replace.
8. **Build scenes** — Use godot-engine-mcp tools where possible:
   - `create_scene` for new scenes
   - `add_node` for adding nodes to scenes
   - `update_property` / `batch_set_property` for setting properties
   - `create_script` + `attach_script` for script attachment
   - For complex scenes that MCP can't handle, fall back to headless scene builders:
     `timeout 60 godot --headless --script scenes/build_{name}.gd`
9. **Import assets** — `timeout 60 godot --headless --import 2>&1`. Ensures all assets are imported before scene builders reference them.
10. **Verify** — Use `validate_script` MCP tool to check all scripts. Fall back to `timeout 60 godot --headless --quit 2>&1` if needed. No `ERROR` or `Parser Error` lines. RID warnings are benign.
11. **Record in megamemory** — `megamemory:create_concept` with architecture summary.
12. **Git commit** — `git add -A && git commit -m "scaffold: project skeleton"`

## Output Files

### 1. `project.godot`

```ini
; Engine configuration file
; Do not edit manually

[application]

config/name="{ProjectName}"
run/main_scene="res://scenes/main.tscn"

[display]

window/size/viewport_width=320
window/size/viewport_height=180
window/stretch/mode="viewport"
window/stretch/aspect="keep"

[rendering]

; Pixel art settings:
textures/canvas_textures/default_texture_filter=0
2d/snap/snap_2d_transforms_to_pixel=true

[layer_names]

; Name collision layers used by the game:
2d_physics/layer_1="player"
2d_physics/layer_2="enemies"
; (add as needed)

[autoload]

; Singletons — asterisk prefix means script (not scene):
; GameManager="*res://scripts/game_manager.gd"

[input]

move_right={
"deadzone": 0.2,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":68,"key_label":0,"unicode":100)]
}
```

Key physical keycodes: W=87, A=65, S=83, D=68, Up=4194320, Down=4194322, Left=4194319, Right=4194321, Space=32, Enter=4194309, Escape=4194305, Shift=4194325, Ctrl=4194326, Alt=4194328.

Mouse buttons use InputEventMouseButton with button_index (1=left, 2=right) and matching button_mask.

### Viewport Presets (Pixel Art)

| Style | Viewport | Stretch | Filter |
|-------|----------|---------|--------|
| Small pixel art (NES-like) | 320×180 | viewport | Nearest |
| Medium pixel art (SNES-like) | 640×360 | viewport | Nearest |
| Large pixel art (GBA-like) | 480×270 | viewport | Nearest |

### 2. `STRUCTURE.md`

Complete architecture reference. Always written in full, even for incremental updates.

````markdown
# {Project Name}

## Dimension: 2D

## Input Actions

| Action | Keys |
|--------|------|
| move_right | D, Right |
| jump | Space |

## Scenes

### Main
- **File:** res://scenes/main.tscn
- **Root type:** Node2D
- **Children:** Player, TileMapLayer, Camera2D

### Player
- **File:** res://scenes/player.tscn
- **Root type:** CharacterBody2D

## Scripts

### PlayerController
- **File:** res://scripts/player_controller.gd
- **Extends:** CharacterBody2D
- **Attaches to:** Player:Player
- **Signals emitted:** died, scored
- **Signals received:** HurtBox.area_entered -> _on_hurt_entered

## Signal Map

- Player:HurtBox.area_entered -> PlayerController._on_hurt_entered

## Asset Hints

- Player character sprite (32x32 px, 4-frame walk cycle)
- Ground tileset (16x16 px tiles, grass/dirt/stone)
- Background (parallax, 320x180 px)
````

### 3. `.gitignore`

```
.claude
CLAUDE.md
assets
screenshots
.godot
*.import
```

### 3b. `screenshots/.gdignore`

```bash
mkdir -p screenshots && touch screenshots/.gdignore
```

### 4. Script stubs: `scripts/*.gd`

```gdscript
extends CharacterBody2D
## res://scripts/player_controller.gd

signal died
signal scored

@export var speed: float = 200.0
@export var jump_velocity: float = -300.0

func _ready() -> void:
	pass

func _physics_process(delta: float) -> void:
	pass

func _on_hurt_entered(area: Area2D) -> void:
	pass
```

### 5. Scene builders (fallback): `scenes/build_*.gd`

Only use headless scene builders when godot-engine-mcp tools can't handle the scene complexity. The MCP tools (`create_scene`, `add_node`, `update_property`, `attach_script`) should be preferred.

When scene builders are needed, use the template from `scene-generation.md` in the godot-task skill.

**CRITICAL: Build order matters.** Scenes that instantiate other scenes must be built AFTER their dependencies.

## UI Overlay Architecture

For HUD/menus, add to the main scene:

```
Main (Node2D)
├── ... game nodes ...
└── CanvasLayer (layer=1)
    └── Control (anchors_preset=15, full rect)
        ├── VBoxContainer or HBoxContainer
        │   ├── Label (score)
        │   ├── ProgressBar (health)
        │   └── Button (pause)
        └── ...
```

For pause menus, set `process_mode = Node.PROCESS_MODE_ALWAYS` on the CanvasLayer.

## Architecture Rules

1. **2D only** — pixel art games are always 2D. Use Node2D, CharacterBody2D, Area2D, Camera2D, etc.
2. **Declare all input actions** — anything used by scripts must appear in input table and project.godot.
3. **Signal contracts** — if script A emits signal X, receivers must list it in the signal map.

## Asset Hints in STRUCTURE.md

Assets are generated AFTER scaffold. Include an `## Asset Hints` section at the end of STRUCTURE.md listing what visual assets the architecture needs. The asset planner uses these to decide what to generate via PixelLab.

```markdown
## Asset Hints

- Player character sprite (32x32 px, idle + walk + attack animations)
- Enemy sprites (24x24 px, 2 types with idle + walk)
- Ground tileset (16x16 px, grass/dirt/stone/water)
- Background (parallax layers, 320x180 px)
- UI icons (16x16 px, heart, coin, key)
```

Be specific about type (character, tileset, prop, background), pixel size, and animation needs. The asset planner will use PixelLab's appropriate tool for each type.

## What NOT to Include

- Implementation details or behavior descriptions
- Task ordering
