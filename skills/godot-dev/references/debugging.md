# Debugging and performance

## Process

1. **Reproduce** — get it to fail deterministically: a failing test (`run_tests`) or a stepped playtest that shows it (`playtest_step` with the exact inputs and frame counts).
2. **Read the error fully** — file:line, the function, the backtrace. The first error is usually the cause; later ones are fallout.
3. **Form one hypothesis, test it** — observe the relevant node properties in a playtest before and after the suspected frame instead of guessing.
4. **Fix the cause, not the symptom** — no `if x != null` band-aids over a node that should exist.
5. **Lock it in** — add a test that would have caught it.

## Usual suspects

| Symptom | Likely cause |
|---|---|
| `Invalid access ... on a base object of type 'null instance'` | `@onready`/node path wrong, node renamed/moved, or accessed before `_ready` / after `queue_free` |
| `Node not found: "X"` | path relative to the wrong node; prefer `%Unique` names |
| Signal handler never runs | not connected (check `scene_read` connections), wrong signal name, or emitter freed |
| Body passes through walls / Area never detects | collision **layer** of one vs **mask** of the other; `monitoring` off; shape missing or zero-size; moving with `position +=` instead of `move_and_slide` |
| Jittery movement | moving physics bodies in `_process`; camera smoothing vs physics tick → enable physics interpolation or move camera in `_physics_process` |
| Character slides / can't climb | `floor_max_angle`, `floor_snap_length`, `up_direction` |
| Input fires twice or not at all | handled in both `_input` and `_process`; UI swallowing events (Control `mouse_filter`) |
| Works in editor, broken in export | `load()` with paths built at runtime that weren't exported; files outside `res://`; case-sensitive paths on Linux/Android |
| Parse error about unknown class | `class_name` not registered yet → `check` (runs import) |
| Exported vars reset | changed in the scene instance vs the base scene; resources shared between instances (use `resource_local_to_scene` or `duplicate()`) |

## Runtime inspection with playtest tools

```
playtest_start {mode: "stepped"}
playtest_step {frames: 60, observe: {nodes: ["Player"], groups: ["enemies"]}}
playtest_step {frames: 1, actions: [{set: "Player", props: {position: [500, 100]}}], observe: {...}}
playtest_step {frames: 5, actions: [{call: "Enemy", method: "debug_state"}]}
```
Steps print new errors and `print()` output; add temporary prints if needed, and remove them afterwards.

## Performance

Budget: 16.6 ms/frame at 60 fps (8.3 ms at 120). Measure before optimizing.

- Quick numbers in a playtest: `observe` returns fps (realtime mode). In-game: `Performance.get_monitor(Performance.TIME_PROCESS)`, `RENDER_TOTAL_DRAW_CALLS_IN_FRAME`, `OBJECT_NODE_COUNT`.
- Editor profiler / visual profiler (ask the user to run them) for function-level hotspots.
- CPU fixes: avoid per-frame allocations (new arrays/strings in `_process`), cache node references, reduce `_process` callers, spread AI updates, use `PhysicsDirectSpaceState` queries sparingly, pool spawned objects.
- GPU fixes (3D): fewer draw calls (merge meshes, MultiMesh, texture atlases), LOD / visibility ranges, occlusion culling, cheaper shadows (fewer shadow-casting lights, shorter distance), avoid excess transparency/overdraw; 2D: fewer unique materials, CanvasGroup sparingly, atlas textures.
- Memory/loading: `ResourceLoader.load_threaded_request` for big scenes, compressed textures (VRAM compression for 3D), stream music (`.ogg`).
