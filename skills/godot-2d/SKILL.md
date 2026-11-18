---
name: godot-2d
description: Building 2D games in Godot 4.4+ - project settings for pixel art vs HD, characters, TileMapLayer levels, cameras, 2D physics and layers, animation, lighting, parallax. Use when creating or working on any 2D game, level, or 2D character.
---

# 2D in Godot

## Project setup (do this first)

**Pixel art** (e.g. base 320×180 or 640×360):
- `display/window/size/viewport_width/height` = base resolution; `window_width/height_override` = e.g. 1280×720 for the window.
- `display/window/stretch/mode = "viewport"`, `aspect = "keep"` (or `"expand"` with care), `scale_mode = "integer"` for crisp pixels.
- `rendering/textures/canvas_textures/default_texture_filter = Nearest` (0).
- Keep sprites on whole pixels: `rendering/2d/snap/snap_2d_transforms_to_pixel = true` (and vertices) if you see shimmering.

**HD 2D**: viewport e.g. 1920×1080, `stretch/mode = "canvas_items"`, `aspect = "expand"`, linear filtering, mipmaps for scaled-down art.

Set these with Edit on `project.godot` (or ask the user to set them in Project Settings), then confirm with `project_info`.

Name the **2D physics layers** (Project Settings → Layer Names → 2D Physics): e.g. 1 world, 2 player, 3 enemies, 4 player_hitbox, 5 enemy_hitbox, 6 pickups, 7 triggers. A body's *layer* says what it is; its *mask* says what it collides with/detects.

## Characters

```
Player (CharacterBody2D)        collision_layer = player, collision_mask = world
├── Sprite (AnimatedSprite2D)   or Sprite2D + AnimationPlayer for complex animation
├── Collision (CollisionShape2D)  CapsuleShape2D/RectangleShape2D, slightly narrower than the art
├── Hurtbox (Area2D)
└── Camera (Camera2D)
```
- Movement with acceleration/friction (`velocity.x = move_toward(velocity.x, target, accel * delta)`), gravity via `get_gravity()`, `move_and_slide()`.
- Platformer feel: coyote time, jump buffer, variable jump height, higher fall gravity, max fall speed.
- Flip with `sprite.flip_h` (or scale.x on a visual-only child, never on the body).
- `AnimatedSprite2D` + `SpriteFrames` for frame animation; `AnimationPlayer` when you also animate hitboxes, sounds, properties; `AnimationTree` for blending/state machines.

## Levels with TileMapLayer

- One `TileSet` resource shared by several `TileMapLayer` nodes (e.g. Background, Ground, Decor, Foreground). `TileMap` is deprecated.
- In the TileSet: physics layers (collision polygons per tile), terrain sets for autotiling, navigation layers, custom data layers (e.g. `damage`, `surface_type`).
- Place tiles from code with `set_cell(coords, source_id, atlas_coords)` or `set_cells_terrain_connect()` for terrains — great for procedural levels and for Claude-built prototype levels.
- Y-sorting for top-down: `y_sort_enabled` on the layer and the parent; origins at the feet.
- Large maps: `physics_quadrant_size` (4.5+) to merge collision.

## Camera

- `Camera2D` as a child of the player for simple cases; for look-ahead/room cameras, a separate camera script that follows a target.
- `limit_left/top/right/bottom` to the level bounds; `position_smoothing_enabled` with a speed of ~5–10.
- Screen shake via a noise-driven offset that decays (see the `game-feel` skill).

## Physics bits

- `Area2D` for triggers, pickups, hitboxes (`body_entered`, `area_entered`). Toggle with `set_deferred("monitoring", false)`.
- `RigidBody2D` for physics props; don't set position directly — use forces/impulses or `_integrate_forces`.
- `AnimatableBody2D` for moving platforms (sync to physics).
- One-way platforms: `one_way_collision` on the shape (or tile).
- Raycasts: `RayCast2D` node, or `get_world_2d().direct_space_state.intersect_ray(PhysicsRayQueryParameters2D.create(a, b, mask))`.

## Visuals

- Draw order: tree order, `z_index`, `CanvasLayer` for UI/backgrounds; `y_sort_enabled` for top-down depth.
- Parallax: `Parallax2D` nodes (4.3+) with `scroll_scale`; repeat with `repeat_size`.
- Lighting: `PointLight2D`/`DirectionalLight2D` + `LightOccluder2D`; `CanvasModulate` for ambient darkness; normal maps on CanvasTexture for depth.
- Particles: `GPUParticles2D` (many) or `CPUParticles2D` (Compatibility renderer/simple); one-shot bursts for hits.
- Shaders: CanvasItem shaders for flash-on-hit, dissolve, outlines, palette swaps.

## Prototyping without art

Build levels from `ColorRect`/`Polygon2D` + collision shapes (or a simple placeholder TileSet), with clear color coding (player = bright, hazards = red, pickups = yellow). Lock in feel and level flow, then swap in art.

## Verifying 2D work

Playtest with screenshots at the real resolution (`resolution` = window size): check pixel crispness, camera framing, that nothing is cut off, and readability. For level layouts, a screenshot after `{"set": "Camera", "props": {"zoom": [0.5, 0.5]}}` shows more of the level.
