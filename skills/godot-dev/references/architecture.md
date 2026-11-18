# Game architecture in Godot

## Scene composition

A scene is a reusable unit with one clear job. Build features by composing scenes:

```
Player (CharacterBody2D)            player.gd: input → movement, owns the state machine
├── Sprite (AnimatedSprite2D)
├── Collision (CollisionShape2D)
├── Hurtbox (Area2D)                components/hurtbox.tscn  → signal hit(damage)
├── Health (Node)                   components/health.gd     → signals changed, died
├── StateMachine (Node)             states as child nodes
└── Camera (Camera2D)
```

- The root script is the scene's API. Outsiders call its public methods and listen to its signals; they don't reach into children.
- Children never assume their parent's type unless they are private parts of the same scene. Components that can be reused expose `@export var target: Node` instead of `get_parent()`.
- Use `%UniqueName` for nodes the root script needs; renaming/moving them won't break paths.

## Communication rules

| Situation | Use |
|---|---|
| Parent → child | direct method call |
| Child → parent | signal |
| Siblings in a scene | parent wires them in `_ready` (`a.died.connect(b.on_target_died)`) |
| Unrelated systems (UI ↔ gameplay, achievements, audio) | event bus autoload with signals |
| Many objects of a kind | groups (`call_group`, `get_nodes_in_group`) |
| Shared config/data | Resources |

Event bus:
```gdscript
# game/events.gd (autoload "Events")
extends Node
signal enemy_killed(enemy: Node, points: int)
signal player_health_changed(current: int, maximum: int)
signal level_completed(level_id: StringName)
```
Keep it a list of signals only: no state, no logic.

## State machines

Enum + match for simple actors (≤ 5 states):
```gdscript
enum State { IDLE, RUN, JUMP, FALL, HURT }
var state: State = State.IDLE

func _physics_process(delta: float) -> void:
	match state:
		State.IDLE: _idle(delta)
		State.RUN: _run(delta)
		...

func _change_state(new_state: State) -> void:
	if new_state == state:
		return
	_exit_state(state)
	state = new_state
	_enter_state(state)
```
Node-based states (`State` base class with `enter/exit/physics_update`, a `StateMachine` node that delegates) for complex actors, bosses, and AI. Animation state belongs in `AnimationTree` (state machine / blend spaces), driven by gameplay state — not the other way round.

## Data-driven design

- Stats, items, abilities, enemy types, waves, dialogue, level metadata → custom `Resource` classes saved as `.tres`.
- Tables of content: a Resource with `@export var entries: Array[EnemyData]`.
- Designers (and you) tune `.tres` values without touching code; balance changes become data diffs.

## Game flow and scene management

```
Main (autoload "Game" or main scene)
├── current level/screen (swapped)
├── HUD (CanvasLayer)
├── PauseMenu (CanvasLayer, process_mode = ALWAYS)
└── Transition (CanvasLayer with fade)
```
- Change screens via one place (`Game.goto(scene_path)`) that fades, frees the old scene, loads the new one (use `ResourceLoader.load_threaded_request` for big levels), and restores state.
- Pause with `get_tree().paused = true`; nodes that must keep running (pause menu, music) use `process_mode = PROCESS_MODE_ALWAYS`.

## Save systems

- Save *state*, not nodes: collect plain data from objects in a `saveable` group (`func save_data() -> Dictionary` / `func load_data(d: Dictionary)`).
- Write JSON (`JSON.stringify`) or a Resource (`ResourceSaver.save`) to `user://save_<slot>.json`. Version the format (`"version": 2`) and migrate old saves.
- Never load untrusted `.tres`/`.res` save files from users: Resources can embed scripts. Use JSON for anything a player could share.

## Performance architecture

- Many identical things (bullets, particles of gameplay, grass): object pools or `MultiMeshInstance`; servers (`PhysicsServer2D`, `RenderingServer`) only when profiling proves nodes are the bottleneck.
- Spread expensive AI over frames (update N agents per frame, or timers at 5–10 Hz).
- Avoid `_process` on hundreds of idle nodes: disable processing (`set_process(false)`) when off-screen (`VisibleOnScreenNotifier2D/3D`).

## Multiplayer (if needed)

Decide early: authoritative server with `MultiplayerSpawner`/`MultiplayerSynchronizer` and `@rpc` functions. Keep gameplay state in data that can be synchronized; separate input collection from simulation so it can run on the server. Retrofitting multiplayer into a single-player architecture is expensive — flag it in design.
