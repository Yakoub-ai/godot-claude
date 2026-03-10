# Godot Docs MCP — Path Index

Load this file when you need to look up Godot documentation.

---

## Docs Lookup Strategy

1. **Primary**: godot-mcp-docs (complete local docs — 1,582 files)
   - `get_documentation_file("classes/class_characterbody2d.md")`
   - `get_documentation_tree()` for browsing
2. **Fallback**: context7 (if godot-mcp-docs unavailable or not configured)
   - `resolve-library-id("godot engine", "GDScript game development")`
   - `query-docs(libraryId, "CharacterBody2D methods")`

**Rule**: Always look up docs before using unfamiliar classes. Never guess method names.

---

## Path Patterns

| Category | Path Pattern | Example |
|----------|-------------|---------|
| Class reference | `classes/class_{lowercase}.md` | `classes/class_characterbody2d.md` |
| 2D tutorials | `tutorials/2d/{topic}.md` | `tutorials/2d/2d_movement.md` |
| 3D tutorials | `tutorials/3d/{topic}.md` | `tutorials/3d/introduction_to_3d.md` |
| Physics | `tutorials/physics/{topic}.md` | `tutorials/physics/physics_introduction.md` |
| Animation | `tutorials/animation/{topic}.md` | `tutorials/animation/introduction.md` |
| Shaders | `tutorials/shaders/{topic}.md` | `tutorials/shaders/shader_reference.md` |
| UI/Control | `tutorials/ui/{topic}.md` | `tutorials/ui/gui_containers.md` |
| Audio | `tutorials/audio/{topic}.md` | `tutorials/audio/audio_buses.md` |
| Navigation | `tutorials/navigation/{topic}.md` | `tutorials/navigation/navigation_introduction.md` |
| GDScript | `tutorials/scripting/gdscript/{topic}.md` | `tutorials/scripting/gdscript/gdscript_basics.md` |
| Best practices | `tutorials/best_practices/{topic}.md` | `tutorials/best_practices/scene_organization.md` |
| Export | `tutorials/export/{topic}.md` | `tutorials/export/exporting_basics.md` |

---

## Frequently Used Classes

| Class | Doc Path |
|-------|----------|
| CharacterBody2D | `classes/class_characterbody2d.md` |
| RigidBody2D | `classes/class_rigidbody2d.md` |
| StaticBody2D | `classes/class_staticbody2d.md` |
| Area2D | `classes/class_area2d.md` |
| Camera2D | `classes/class_camera2d.md` |
| AnimatedSprite2D | `classes/class_animatedsprite2d.md` |
| AnimationPlayer | `classes/class_animationplayer.md` |
| AnimationTree | `classes/class_animationtree.md` |
| TileMap | `classes/class_tilemap.md` |
| TileSet | `classes/class_tileset.md` |
| NavigationAgent2D | `classes/class_navigationagent2d.md` |
| NavigationRegion2D | `classes/class_navigationregion2d.md` |
| Timer | `classes/class_timer.md` |
| AudioStreamPlayer | `classes/class_audiostreamplayer.md` |
| CanvasLayer | `classes/class_canvaslayer.md` |
| Control | `classes/class_control.md` |
| Label | `classes/class_label.md` |
| Button | `classes/class_button.md` |
| TextureRect | `classes/class_texturerect.md` |
| RayCast2D | `classes/class_raycast2d.md` |
| CollisionShape2D | `classes/class_collisionshape2d.md` |
| GPUParticles2D | `classes/class_gpuparticles2d.md` |
| CPUParticles2D | `classes/class_cpuparticles2d.md` |
| Sprite2D | `classes/class_sprite2d.md` |
| Node2D | `classes/class_node2d.md` |
| Node | `classes/class_node.md` |
| Resource | `classes/class_resource.md` |
| PackedScene | `classes/class_packedscene.md` |

---

## Tools

| Tool | Purpose |
|------|---------|
| `get_documentation_tree` | Browse full doc structure (returns tree of paths) |
| `get_documentation_file(path)` | Fetch specific doc content |
