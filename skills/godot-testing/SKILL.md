---
name: godot-testing
description: Verify Godot games - unit/integration tests with the built-in runner (run_tests) and scripted, deterministic playtests with screenshots (playtest_start/step/stop). Use after implementing or changing gameplay, when fixing bugs (reproduce first), before milestones, or when the user asks to test or playtest.
---

# Testing and playtesting

Two layers, both required for gameplay work:
- **Tests** (`run_tests`) lock in logic and catch regressions: fast, repeatable, run after every change.
- **Playtests** (`playtest_*`) check what a player experiences: does it look right, feel right, and survive real input sequences?

## Writing tests

Files: `res://test/test_<feature>.gd`. Nothing to install — the runner is built into the plugin.

```gdscript
extends RefCounted
## Tests for the player controller.

func before_each(t) -> void:
	GameState.reset()   # optional hooks: before_all, before_each, after_each, after_all


func test_damage_reduces_health(t) -> void:
	var health := HealthComponent.new()
	health.max_health = 10
	health.take_damage(3)
	t.eq(health.current, 7)
	health.free()


func test_death_signal(t) -> void:
	var health := HealthComponent.new()
	var died = t.watch(health, "died")
	health.take_damage(999)
	t.eq(died.count, 1, "died emitted exactly once")
	health.free()


func test_player_jumps(t) -> void:
	var level: Node = t.instantiate("res://levels/test_level.tscn")   # added to the tree, auto-freed
	var player: Player = level.get_node("Player")
	await t.physics_frames(20)                     # let it land
	t.is_true(player.is_on_floor())
	t.tap("jump")                                  # input-map action; press + release next frame
	await t.physics_frames(5)
	t.lt(player.velocity.y, 0.0, "moving up after jump")
```

API of `t`: `eq, ne, is_true, is_false, is_null, not_null, almost(a, b, tolerance), gt, lt, has(container, item), fail(msg)`; `instantiate(path)`, `add(node)`; `await frames(n)`, `await physics_frames(n)`, `await seconds(s)`; `press(action, strength)`, `release(action)`, `tap(action)`; `watch(obj, signal)` → `.count`, `.args`. Autoloads are available. Tests run at a fixed 60 fps, headless. Runtime script errors inside a test fail it.

What to test:
- Pure logic (damage formulas, inventory, grid/puzzle rules, save data round-trips, procedural generation with a fixed seed) — the cheapest, most valuable tests. Design code so this logic lives in plain classes/Resources.
- Component behavior (health, hitbox → signal, state transitions).
- Short integration tests on small test scenes (character lands, picks up coin, door opens).
Don't test the engine (that `move_and_slide` moves) or exact pixel positions that change with tuning; assert behavior and ranges.

Bug fixes: write the failing test first, see it fail, then fix.

## Playtesting

Use `stepped` mode (default): the game is frozen between calls, so `frames: 60` is exactly one second of game time, and results are reproducible.

Procedure for a feature:
1. `playtest_start` (optionally `scene` to test one level or a test scene; `resolution` for UI checks).
2. Settle: `playtest_step {frames: 30, observe: {tree: {depth: 3}}}` — check the scene loaded as expected and there are no startup errors.
3. Drive the scenario with timed actions, e.g. run right for 1 s and jump halfway:
   ```json
   {"frames": 60, "actions": [{"press": "move_right"}, {"frame": 30, "tap": "jump"}, {"frame": 59, "release": "move_right"}],
    "observe": {"nodes": ["Player"], "screenshot": true}, "capture_every": 15}
   ```
4. Judge both data and pictures: positions/velocities/state in `observation`, and the screenshots (is it visible, readable, framed by the camera, animating, overlapping UI?). `capture_every` gives a strip of frames to judge motion and animation.
5. Try to break it: spam inputs, opposite directions, edge of the level, pause during an action, die during a transition, call methods to set up rare states (`{"set": "Player", "props": {"position": [x, y]}}`, `{"call": "/root/GameState", "method": "add_points", "args": [999]}`).
6. Check `errors` in every step result — any runtime error is a bug, even if the game "looks fine".
7. `playtest_stop` → summary of all errors/warnings. Report findings with evidence (frames, values, screenshots).

Use the `playtester` agent for a thorough, adversarial session on a milestone; it reports issues without editing code.

Feel checklist (what a human playtester notices): input latency and responsiveness, jump/arc/acceleration feel, camera framing and smoothness, readability (can you tell what's dangerous/interactive?), feedback on every action (animation, sound, particles), difficulty spikes, getting stuck, UI legibility at the target resolution.

Limits: screenshots need a display (automatic xvfb on Linux servers; a window appears on desktops). `headless: true` is faster but blind. Audio is muted (dummy driver). Real-time feel (frame pacing, input latency on real hardware) still needs a human — ask the user to play the build at milestones.
