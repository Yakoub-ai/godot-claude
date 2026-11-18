---
name: godot-3d
description: Building 3D games in Godot 4.4+ - blockout with CSG, modelling and the Blender/GLB import pipeline, materials, lighting and environment, character controllers and camera rigs, Jolt physics, navigation, animation, and 3D performance. Use for any 3D game, level, model, or 3D character work.
---

# 3D in Godot

## Project setup

- Renderer: **Forward+** (desktop, best quality), **Mobile** (mobile/low-end), **Compatibility** (web/oldest hardware). Decide early; it's in `rendering/renderer/rendering_method`.
- Physics: set `physics/3d/physics_engine = "Jolt Physics"` (built in since 4.4; faster and more stable than the default GodotPhysics3D).
- Scale: **1 unit = 1 meter**. A human is ~1.8 units tall. Keep imports at real-world scale.
- Name the **3D physics layers** like in 2D (world, player, enemies, hitboxes, pickups, triggers).
- Consider `physics/common/physics_interpolation = true` for smooth motion at any frame rate (then move physics bodies only in `_physics_process`).

## Workflow: blockout → play → art

1. **Blockout (greybox)** with CSG nodes (`CSGBox3D`, `CSGCylinder3D`, `CSGPolygon3D`, `CSGCombiner3D` with `use_collision = true`) or simple `MeshInstance3D` + `StaticBody3D`. Build it with `scene_edit`. Use a grid/checker material so scale reads in screenshots.
2. **Play it**: playtest with the real controller and camera. Check distances, jump heights, sightlines, pacing. Iterate on the blockout — it's cheap.
3. **Art pass**: replace blocks with modelled assets. Bake CSG to meshes for performance (CSG is for prototyping; it's slow at runtime when changed and has more draw calls).

## Models and the import pipeline

- Preferred format: **glTF 2.0 (.glb)**. Godot can also import `.blend` directly when Blender is installed and configured in Editor Settings (it converts via glTF), and `.fbx` (via ufbx).
- Blender export checklist: apply transforms (Ctrl+A), +Y up handled by the exporter, origin at the object's base/pivot, real-world scale, triangulate optional, name meshes/materials meaningfully.
- Import hints by name suffix (in Blender object names): `-col` (generate static collision), `-convcol` (convex collision), `-colonly` (collision only, no mesh), `-navmesh`, `-noimp` (skip), `-loop` (looping animation), `-rigid` (rigid body).
- Advanced Import Settings (double-click the .glb) for per-mesh collision, LODs, materials extraction, animation slicing. Or: instance the .glb in a scene, "Make Local"/inherit, and add collision/scripts there — keep the .glb itself untouched so re-exports update cleanly (inherited scene pattern).
- Free asset sources with clear licenses: Kenney (CC0), Quaternius (CC0), Poly Haven (CC0 textures/HDRIs/models), ambientCG (CC0 PBR textures). Record licenses in `assets/CREDITS.md`.
- Procedural/simple meshes: `BoxMesh`, `CapsuleMesh`, `PlaneMesh`, `PrismMesh`, `TorusMesh`; `SurfaceTool`/`ArrayMesh` for generated geometry; `GridMap` + `MeshLibrary` for modular tile-based levels.

## Materials

- `StandardMaterial3D` for most things (albedo, roughness, metallic, normal map, emission). `ORMMaterial3D` when textures are packed (Occlusion-Roughness-Metallic).
- Stylized: `shading_mode = unshaded` or toon via a simple shader; outlines via inverted hull or stencil (4.5+).
- Transparency is expensive and sorts poorly; prefer alpha scissor (cutout) for foliage.
- Triplanar mapping for blockouts and terrain without UVs.

## Lighting and environment

- `WorldEnvironment` + `Environment`: sky (ProceduralSky or HDRI PanoramaSky), ambient light from sky, tonemap (Filmic/ACES/AgX), glow, SSAO/SSIL (Forward+), fog/volumetric fog.
- One `DirectionalLight3D` as the sun with shadows; keep shadow distance as short as the game allows.
- Static lighting: `LightmapGI` (bake) for best performance; dynamic GI: `VoxelGI` (small/medium scenes) or `SDFGI` (large open worlds, Forward+ only). `ReflectionProbe` for local reflections.
- Few shadow-casting omni/spot lights; they're the main GPU cost.

## Characters and cameras

```
Player (CharacterBody3D)          collision: CapsuleShape3D (height ~1.8, radius ~0.35)
├── Model (Node3D, the imported .glb instance) + AnimationTree
├── CameraPivot (Node3D, yaw)
│   └── SpringArm3D (pitch, length 4, collision mask = world)
│       └── Camera3D
└── Collision (CollisionShape3D)
```
- Camera-relative movement: `var dir := (camera_basis * Vector3(input.x, 0, input.y)); dir.y = 0; dir = dir.normalized()`.
- Rotate the model toward movement with `lerp_angle`/`basis.slerp`, not the body (keeps collision stable).
- FPS: Camera3D at eye height (~1.6), mouse look in `_unhandled_input` with `Input.mouse_mode = Input.MOUSE_MODE_CAPTURED`, clamp pitch.
- Hits: `RayCast3D` for hitscan, `Area3D` for melee/projectiles, `ShapeCast3D` for thick casts.
- Animation: `AnimationTree` with a state machine and `BlendSpace1D/2D` (idle/walk/run blending by speed). Root motion if animations drive movement. IK nodes (4.6+) for feet/hands/look-at.

## Navigation and AI

`NavigationRegion3D` (bake a navmesh from level geometry; re-bake when levels change, or bake at runtime for procedural levels) + `NavigationAgent3D` on enemies (`target_position`, `get_next_path_position()`, avoidance). Update targets at a few Hz, not every frame.

## Performance (3D)

- Draw calls: reuse meshes and materials, merge static geometry, `MultiMeshInstance3D` for foliage/crowds, texture atlases.
- `visibility_range_begin/end` (HLOD/LOD fades), automatic mesh LOD on import, `OccluderInstance3D` for occlusion culling in indoor levels.
- Shadows: limit casters (`cast_shadow = off` on small props), shadow distance, fewer shadowed lights.
- Physics: simple collision shapes (boxes/capsules/convex) instead of trimesh for moving objects; trimesh only for static level geometry.

## Verifying 3D work

Playtests with screenshots from the game camera; for layout checks, temporarily move the camera in a step (`{"set": "Camera", "props": {"position": [0, 20, 10], "rotation_degrees": [-60, 0, 0]}}`). Check: scale (does the player fit doors?), lighting (nothing pitch black or blown out), camera clipping through walls, z-fighting, objects floating above the floor. `capture_every` strips show animation blending and camera smoothness.
