---
name: godot-dev
description: Comprehensive Godot game development with three MCP server integrations. ALWAYS use this skill when the working directory contains a project.godot file OR when the CLAUDE.md identifies the project as a Godot game. Also triggers whenever the user mentions Godot, GDScript, game development, CharacterBody2D, scene tree, sprites, platformer, roguelite, enemies, weapons, waves, tilemaps, shaders, particles, or any Godot class name. Covers scene creation, node ops, scripting, physics, animation, audio, UI, navigation, particles, shaders, tilemaps, and runtime testing via Godot MCP Pro (162 tools). Also triggers for asset generation with PixelLab (pixel art characters, tilesets, animations) and Godot documentation lookup. Full pipeline: Godot docs → asset creation → engine integration.
---

# Godot Development — Triple MCP Integration

This skill integrates three MCP servers for comprehensive Godot game development:

| Server | Purpose | Tools |
|--------|---------|-------|
| **Godot MCP Pro** | Direct engine integration — scene editing, node ops, scripting, runtime testing | 162 tools |
| **Godot Docs MCP** | Official documentation lookup — class refs, tutorials, best practices | 1,582 doc files |
| **PixelLab** | AI pixel art generation — characters, animations, tilesets, props | Async pipeline |

## Decision Tree: Which MCP to Use

```
Need to know HOW something works in Godot?
  → Godot Docs MCP (get_documentation_file)

Need to DO something in the Godot editor?
  → Godot MCP Pro (create/edit/configure/test)

Need pixel art assets?
  → PixelLab (create_character, create_sidescroller_tileset, etc.)
```

---

## Project-Specific References

Check `references/` for project-specific files. If the current project matches one (e.g., `stress-killer.md`), read it first — project conventions override general patterns.

For platformer-specific patterns (movement physics, weapon systems, enemy AI), see `references/platformer-patterns.md`.

---

## Godot Docs MCP — Look It Up First

**Rule**: Before implementing with an unfamiliar class, look up its documentation.

### Tools
- `get_documentation_tree` — browse the full doc structure
- `get_documentation_file(path)` — fetch a specific doc

### Doc Path Patterns
- Class reference: `classes/class_{lowercase_name}.md` (e.g., `classes/class_characterbody2d.md`)
- Tutorials: `tutorials/{category}/` (2d, physics, animation, shaders, ui, audio, navigation, scripting)
- GDScript: `tutorials/scripting/gdscript/gdscript_basics.md`
- Best practices: `tutorials/best_practices/scene_organization.md`

### When to Look Up
- Unfamiliar class — check properties, methods, signals
- Exact property/method names — avoid guessing
- Enum values — get correct constant names
- Signal signatures — verify parameter types
- Shader built-ins — available uniforms and functions
- API changes between Godot versions

See `references/godot-docs-index.md` for the full path index.

---

## Godot MCP Pro — Engine Integration

172 tools organized into 14 domains. Use these to directly manipulate the Godot editor and running games.

### Domain Routing

| Domain | Key Tools | Use When |
|--------|-----------|----------|
| **Scene** | `create_scene`, `get_scene_tree`, `save_scene` | Creating/inspecting scenes |
| **Nodes** | `add_node`, `update_property`, `delete_node` | Building scene trees |
| **Scripts** | `create_script`, `edit_script`, `validate_script` | Writing GDScript |
| **Signals** | `connect_signal`, `find_signal_connections` | Wiring up communication |
| **Animation** | `create_animation`, `add_animation_track`, `set_animation_keyframe` | Animating properties |
| **Audio** | `add_audio_player`, `add_audio_bus` | Sound setup |
| **Physics** | `setup_collision`, `setup_physics_body`, `add_raycast` | Collision & physics |
| **Navigation** | `setup_navigation_region`, `setup_navigation_agent` | Pathfinding |
| **Particles** | `create_particles`, `apply_particle_preset` | Visual effects |
| **Shaders** | `create_shader`, `assign_shader_material`, `set_shader_param` | Custom rendering |
| **Resources** | `create_resource`, `create_theme` | Data & theming |
| **Tilemaps** | `tilemap_set_cell`, `tilemap_fill_rect` | Level geometry |
| **UI** | `find_ui_elements`, `set_anchor_preset` | Interface layout |
| **Runtime** | `play_scene`, `get_game_screenshot`, `simulate_action` | Testing & debugging |

See `references/godot-mcp-pro-tools.md` for the full 172-tool catalog with parameters.

### Essential Patterns

**Create-then-configure**: Create a node first, then set its properties:
```
1. add_node(parent, name, type)
2. update_property(node_path, property, value)  — repeat for each property
3. attach_script(node_path, script_path)         — if needed
```

**Use res:// paths**: All file paths in Godot MCP Pro use `res://` prefix:
```
res://scenes/levels/test_level.tscn
res://scripts/characters/base_character.gd
res://assets/characters/archie/idle/frame_001.png
```

**Validate after edit**: After modifying scripts, run `validate_script` to catch parse errors.

**Scene must be open**: Most node operations require the scene to be open in the editor. Use `open_scene` first.

**Editor vs Runtime tools**:
- Editor tools (`add_node`, `update_property`) modify the scene file
- Runtime tools (`get_game_node_properties`, `set_game_node_property`) modify the running game
- Use `play_scene` to start, `stop_scene` to stop
- `get_game_screenshot` captures the running game

**Batch operations**: Use `batch_set_property` to set multiple properties at once — faster than individual `update_property` calls.

**Project info**: Start with `get_project_info` to understand project structure, then `get_scene_tree` for specific scenes.

---

## PixelLab — Asset Generation

AI pixel art generator. All operations are **async** — tools return job IDs, poll until complete.

### Quick Reference
| Asset Type | Create Tool | Retrieve Tool |
|------------|-------------|---------------|
| Character | `create_character` | `get_character` |
| Animation | `animate_character` | `get_character` |
| Sidescroller tileset | `create_sidescroller_tileset` | `get_sidescroller_tileset` |
| Top-down tileset | `create_topdown_tileset` | `get_topdown_tileset` |
| Props/objects | `create_map_object` | `get_map_object` |

### Core Workflow
1. **Create**: Call create tool with description, size, style params
2. **Poll**: Call get tool every 10-15s until status = `complete`
3. **Download**: Save PNGs to `assets/{category}/{name}/`
4. **Integrate**: Load into Godot via SpriteFrameLoader or compose scenes via Godot MCP Pro

See `references/pixellab-workflows.md` for detailed pipeline and integration patterns.

### Setup Detection
If PixelLab MCP is not configured, guide the user:
1. Get API key from pixellab.ai
2. Set `PIXELLAB_API_KEY` environment variable
3. Add to `.mcp.json` (see references/pixellab-workflows.md for config)

---

## Cross-MCP Workflows

### 1. Asset-to-Scene Pipeline
```
PixelLab: create_character → animate → download PNGs
  ↓
Godot MCP Pro: create_scene → add_node(AnimatedSprite2D) → attach_script
  ↓
Godot MCP Pro: play_scene → get_game_screenshot → verify
```

### 2. Docs-Informed Implementation
```
Godot Docs: get_documentation_file("classes/class_navigationagent2d.md")
  ↓ (understand API)
Godot MCP Pro: setup_navigation_region → setup_navigation_agent
  ↓
Godot MCP Pro: create_script (using correct method names from docs)
```

### 3. Debug Loop
```
Godot MCP Pro: play_scene → get_game_screenshot
  ↓ (identify issue)
Godot Docs: look up relevant class/method
  ↓ (understand correct usage)
Godot MCP Pro: edit_script → validate_script → play_scene → verify
```

### 4. Scene Composition
```
Godot MCP Pro: create_scene → add_node (build tree)
  ↓
Godot MCP Pro: setup_collision → set_physics_layers
  ↓
Godot MCP Pro: connect_signal (wire up communication)
  ↓
Godot MCP Pro: save_scene
```

### 5. Test & Polish
```
Godot MCP Pro: play_scene → simulate_action → assert_node_state
  ↓
Godot MCP Pro: get_game_screenshot → compare_screenshots
  ↓
Godot MCP Pro: get_performance_monitors (check FPS, draw calls)
```

---

## Godot Best Practices

### Node Types
- `CharacterBody2D` for all moving entities (player, enemies)
- `StaticBody2D` for static geometry
- `Area2D` for hitboxes, hurtboxes, pickup zones, triggers
- `RigidBody2D` for physics-driven objects (debris, thrown items)

### Scene Organization
- Use `PackedScene.instantiate()` for reusable entities
- Keep scene tree clean: use Node2D containers (Enemies, Projectiles, VFX)
- `CanvasLayer` for HUD overlay
- One script per scene root — child nodes use signals or method calls

### Physics
- Process movement in `_physics_process()`, use `move_and_slide()`
- Export collision layer/mask values for editor tuning
- Use groups (`"enemies"`, `"player"`) with `get_tree().get_nodes_in_group()`

### Signals
- Prefer signals over direct references for loose coupling
- Define custom signals for game events: `died`, `health_changed`, `wave_complete`
- Connect in `_ready()` or via the editor

### Code Style
- `class_name` on all scripts
- `@export` for editor-tunable parameters
- `@onready` with `$NodeName` for node references
- Virtual methods prefixed with `_` (e.g., `_update_ai()`, `_attack()`)
- Enums for state machines, process in `_physics_process()`
- Never use `get_node()` with hardcoded paths across scenes

### Resources
- Use `.tres` Resource files for data definitions (weapon stats, enemy configs)
- `@export var config: WeaponConfig` for editor assignment

### Pixel Art
- `AnimatedSprite2D` with `SpriteFrames` for frame animation
- Texture filter: Nearest (no smoothing) — set in project settings
- Stretch mode: viewport for integer scaling
- East-facing sprites, `flip_h` for west

---

## MCP Setup

### .mcp.json Configuration

```json
{
  "mcpServers": {
    "godot-mcp-pro": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/godot-mcp-pro"]
    },
    "godot-mcp-docs": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/godot-mcp-docs"]
    },
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp/v1",
      "headers": {
        "Authorization": "Bearer ${PIXELLAB_API_KEY}"
      }
    }
  }
}
```

Note: Actual server commands may vary — check each server's installation docs for the correct `command` and `args`. The Godot MCP Pro server requires a running Godot editor instance with the MCP plugin installed.
