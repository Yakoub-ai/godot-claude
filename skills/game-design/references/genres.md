# Genre playbook

For each genre: core systems, Godot building blocks, and the traps that sink first attempts.

## Platformer (2D)
- Systems: run/jump with coyote time (≈0.1 s), jump buffering (≈0.1 s), variable jump height (cut velocity on release), acceleration/deceleration curves, one-way platforms, checkpoints, hazards, camera with look-ahead and limits.
- Nodes: `CharacterBody2D`, `TileMapLayer` (+ terrain sets, one-way collision), `Camera2D` (limits, position smoothing), `AnimatedSprite2D`/`AnimationPlayer`, `Area2D` for hazards/pickups.
- Traps: floaty jumps (raise gravity when falling: ×1.5–2), levels built before movement feels good, tile size vs character size mismatch.

## Top-down action / twin-stick / Zelda-like
- Systems: 8-way or analog movement, dash with i-frames, melee hitbox/hurtbox, knockback, enemy AI states (idle/patrol/chase/attack), rooms/transitions, inventory/keys.
- Nodes: `CharacterBody2D`, `NavigationAgent2D` + `NavigationRegion2D` (or TileMapLayer navigation), `Area2D` hitboxes, Y-sort (`y_sort_enabled`) for depth.
- Traps: diagonal speed (normalize input vector), hitboxes active for too long, AI that walks into walls (use navigation).

## Arcade / shoot 'em up / bullet hell
- Systems: spawn waves from data (`WaveData` resources), pooled bullets, score/combo, difficulty curve, i-frames, screen shake.
- Nodes: `Area2D` bullets (not RigidBody), object pools, `Path2D` + `PathFollow2D` for enemy patterns, `GPUParticles2D`.
- Traps: instancing/freeing thousands of nodes per second (pool), unreadable bullets (contrast), no difficulty pacing.

## Puzzle
- Systems: grid/state model separate from visuals, undo stack, level data, win detection, level select/progression.
- Nodes: model in pure GDScript classes (easy to unit test), `TileMapLayer` or sprites as the view, Tweens for moves.
- Traps: logic tangled with animation (can't test or undo), levels hand-placed in scenes instead of data.

## Roguelike / roguelite
- Systems: run structure, procedural generation (rooms/graphs, seeded RNG), items/upgrades as Resources with modifiers, meta-progression, balancing.
- Nodes: `RandomNumberGenerator` with explicit seed (deterministic runs, reproducible bugs), Resources for items, `TileMapLayer.set_cell` for generated maps.
- Traps: global `randi()` everywhere (non-reproducible), upgrade systems with hard-coded `if` chains (use stat modifiers).

## RPG / adventure / narrative
- Systems: dialogue (data-driven: JSON/Resources or an add-on like Dialogic), quests/flags, inventory, stats & combat, save/load, NPC interaction.
- Nodes: `Area2D/3D` interactables, `CanvasLayer` dialogue UI, `RichTextLabel` (bbcode, visible_ratio typewriter), Resources for items/quests.
- Traps: content explosion (scope!), flags as scattered booleans (central state dictionary), saving node trees instead of data.

## 3D action / third-person / FPS
- Systems: character controller (camera-relative movement), camera rig (SpringArm3D for third-person; mouse look with captured mouse for FPS), weapons/abilities, enemy AI with navigation, hit detection (raycasts or Area3D), health/damage.
- Nodes: `CharacterBody3D`, `SpringArm3D` + `Camera3D`, `RayCast3D` / `PhysicsDirectSpaceState3D.intersect_ray`, `NavigationRegion3D` + `NavigationAgent3D`, `AnimationTree` with blend spaces, Jolt Physics.
- Traps: building art before the blockout plays well, camera clipping (SpringArm collision mask), unscaled imports (1 unit = 1 m), too many dynamic lights/shadows.

## Racing / vehicles
- Systems: vehicle physics (arcade: custom CharacterBody/RigidBody forces; sim: `VehicleBody3D`), track checkpoints & lap logic, AI racing lines (`Path3D`), camera chase.
- Traps: realistic physics that isn't fun (start arcade), tunneling at speed (continuous CD, thicker colliders).

## Strategy / management / builder
- Systems: grid or navmesh placement, resource economy, unit selection & commands, simulation tick separate from rendering, save/load of large state, UI-heavy.
- Nodes: `GridMap` (3D) or `TileMapLayer`, camera pan/zoom, selection rectangles (Control), `MultiMeshInstance` for many units, `NavigationServer` queries.
- Traps: simulation in `_process` per unit (tick manager), UI built ad hoc (plan the HUD), no time controls for testing.

## Casual mobile / hyper-casual
- Systems: one-touch input, short sessions, juice, progression, ads/IAP (plugins).
- Nodes: `Control` + `TouchScreenButton` / `VirtualJoystick` (4.7+), stretch mode `canvas_items` with aspect `expand`, safe areas.
- Traps: desktop-only testing (test touch and aspect ratios early), heavy shaders on low-end GPUs (use the Mobile/Compatibility renderer).
