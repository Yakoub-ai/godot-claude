# What's available in which Godot version (4.4 → 4.7)

Check the project's target (`project_info` → `features`, e.g. "4.4") and the server's binary version before using a feature. Verified against the official class reference of each release; when unsure, `api_docs` is authoritative for the installed version.

## 4.4 (minimum supported)
- **Typed dictionaries**: `var d: Dictionary[String, int]`.
- **`.uid` files** next to scripts and shaders: commit them; move/rename files inside the editor (or move the `.uid` with the file).
- **Jolt Physics** built in for 3D: Project Settings → Physics → 3D → Physics Engine = "Jolt Physics" (the "DEFAULT" setting is still GodotPhysics3D). Recommended for new 3D projects.
- `@warning_ignore_start` / `@warning_ignore_restore`.
- `TileMapLayer` is the tile node (TileMap deprecated since 4.3).
- Physics interpolation available for 2D and 3D (`physics/common/physics_interpolation`).

## 4.5
- GDScript: **`@abstract`** classes and methods; **variadic functions** `func f(...args: Array)`; `@export_file_path`.
- `Resource.duplicate_deep()`, `Array.duplicate_deep()`, `Dictionary.duplicate_deep()`.
- Script backtraces without a debugger: `Engine.capture_script_backtraces()`, `ScriptBacktrace`; custom loggers via `OS.add_logger(Logger)`.
- Accessibility (screen readers): `Control.accessibility_*` properties, project setting `accessibility/general/accessibility_support`.
- `FoldableContainer` UI node; `SceneTree.scene_changed` signal; `Input.is_action_just_pressed_by_event()`.
- `Camera2D.limit_enabled`; `TileMapLayer.physics_quadrant_size` (merged tile collision for performance).
- Stencil buffer options on `BaseMaterial3D` (`stencil_mode`, outlines/x-ray), bent normal maps.
- `Viewport.oversampling` (crisper fonts/SVG when scaled), `DPITexture`.
- New skeleton modifiers: `CopyTransformModifier3D`, `AimModifier3D`, `BoneConstraint3D`...

## 4.6
- **IK** nodes for 3D skeletons: `TwoBoneIK3D`, `FABRIK3D`, `CCDIK3D`, `SplineIK3D`, `ChainIK3D`, joint limitations.
- `SceneTree.change_scene_to_node()`.
- `Control.pivot_offset_ratio`; `AnimationPlayer.is_animation_active()`.
- AgX tonemapper controls (`Environment.tonemap_agx_contrast/white`).
- Navigation engine selectable (`navigation/2d|3d/navigation_engine`).
- GDScript warning `missing_await`; per-directory warning rules (`debug/gdscript/warnings/directory_rules`).
- Joypad light control: `Input.set_joy_light()`.

## 4.7
- `Tween.tween_await()` (await a signal inside a tween sequence), `AwaitTweener`.
- `VirtualJoystick` node for touch controls.
- `AreaLight3D` (area lights).
- `DrawableTexture2D` (GPU-drawable textures), `BlitMaterial`.
- Control: `custom_maximum_size`, `offset_transform_*` (visual-only transforms for animating UI without breaking layout).
- Gamepad motion sensors and vibration queries on `Input` (`get_joy_gyroscope`, `has_joy_vibration`...).
- HDR output on supported displays (`display/window/hdr/request_hdr_output`).
- `Resource.copy_from_resource()`.

## Rules of thumb
- Writing for a project that targets 4.4 → avoid everything listed under 4.5+.
- Opening a project in a newer editor upgrades scene/resource files on save; don't mix editor versions in one team.
- Prefer the newest stable release for new projects unless a platform/add-on requires older.
