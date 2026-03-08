# Godot Documentation Index

Quick reference for navigating the Godot Docs MCP server (`godot-mcp-docs`).

## Tools

| Tool | Purpose |
|------|---------|
| `get_documentation_tree` | Browse the full doc tree structure |
| `get_documentation_file` | Fetch a specific doc file by path |

## Class References

Pattern: `classes/class_{lowercase_name}.md`

### Commonly Used Classes
```
classes/class_characterbody2d.md
classes/class_rigidbody2d.md
classes/class_staticbody2d.md
classes/class_area2d.md
classes/class_collisionshape2d.md
classes/class_animatedsprite2d.md
classes/class_animationplayer.md
classes/class_animationtree.md
classes/class_spriteframes.md
classes/class_camera2d.md
classes/class_tilemaplayer.md
classes/class_canvaslayer.md
classes/class_parallaxbackground.md
classes/class_parallaxlayer.md
classes/class_audiostreamplayer.md
classes/class_audiostreamplayer2d.md
classes/class_gpuparticles2d.md
classes/class_cpuparticles2d.md
classes/class_navigationagent2d.md
classes/class_navigationregion2d.md
classes/class_raycast2d.md
classes/class_shapecast2d.md
classes/class_label.md
classes/class_button.md
classes/class_control.md
classes/class_container.md
classes/class_hboxcontainer.md
classes/class_vboxcontainer.md
classes/class_texturerect.md
classes/class_progressbar.md
classes/class_lineedit.md
classes/class_shader.md
classes/class_shadermaterial.md
classes/class_resource.md
classes/class_packedscene.md
classes/class_tween.md
classes/class_timer.md
classes/class_node.md
classes/class_node2d.md
```

## Tutorial Categories

### 2D
```
tutorials/2d/          — 2D game development tutorials
tutorials/2d/2d_movement.md
tutorials/2d/2d_transforms.md
tutorials/2d/custom_drawing_in_2d.md
tutorials/2d/2d_lights_and_shadows.md
```

### Physics
```
tutorials/physics/      — Physics bodies, collision, raycasting
tutorials/physics/physics_introduction.md
tutorials/physics/collision_shapes_2d.md
tutorials/physics/using_character_body_2d.md
tutorials/physics/ray-casting.md
```

### Animation
```
tutorials/animation/    — AnimationPlayer, AnimationTree, tweens
tutorials/animation/introduction.md
tutorials/animation/animation_tree.md
```

### Shaders
```
tutorials/shaders/      — Shader language, visual shaders
tutorials/shaders/introduction_to_shaders.md
tutorials/shaders/shader_reference/canvas_item_shader.md
```

### UI
```
tutorials/ui/           — Control nodes, themes, layouts
tutorials/ui/gui_containers.md
tutorials/ui/custom_gui_controls.md
tutorials/ui/gui_theme_type_variations.md
```

### Audio
```
tutorials/audio/        — Audio buses, effects, playback
tutorials/audio/audio_buses.md
```

### Navigation
```
tutorials/navigation/   — Pathfinding, nav meshes
tutorials/navigation/navigation_introduction_2d.md
```

### Scripting
```
tutorials/scripting/    — GDScript, signals, groups
tutorials/scripting/gdscript/
tutorials/scripting/gdscript/gdscript_basics.md
tutorials/scripting/gdscript/gdscript_exports.md
tutorials/scripting/gdscript/gdscript_styleguide.md
```

### Best Practices
```
tutorials/best_practices/ — Scene organization, node patterns
tutorials/best_practices/scene_organization.md
tutorials/best_practices/godot_interfaces.md
```

### Performance
```
tutorials/performance/           — Performance optimization guides
tutorials/performance/using_multimesh.md
tutorials/performance/cpu_optimization.md
tutorials/performance/gpu_optimization.md
tutorials/performance/threads/using_multiple_threads.md
tutorials/3d/global_illumination/using_sdfgi.md
```

## When to Look Up Docs

- **Unfamiliar class**: Look up the class reference before using it
- **Property names**: When you need exact property/method names
- **Enum values**: For correct constant names (e.g., `TileSet.CELL_NEIGHBOR_*`)
- **Signal signatures**: When connecting signals, verify parameter types
- **Shader built-ins**: For available uniforms and functions in shader code
- **API changes**: When migrating patterns between Godot versions
