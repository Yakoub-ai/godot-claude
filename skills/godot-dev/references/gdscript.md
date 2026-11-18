# GDScript reference (Godot 4.4+)

## Script template

```gdscript
class_name Player
extends CharacterBody2D
## Player controller: run, jump, coyote time, jump buffering.

signal died
signal health_changed(current: int, maximum: int)

enum State { IDLE, RUN, JUMP, FALL }

const COYOTE_TIME := 0.1

@export_group("Movement")
@export var speed: float = 220.0
@export var jump_velocity: float = -420.0
@export_range(0.0, 1.0) var air_control: float = 0.6

var state: State = State.IDLE
var _coyote_timer: float = 0.0

@onready var _sprite: AnimatedSprite2D = %Sprite
@onready var _jump_sound: AudioStreamPlayer2D = %JumpSound


func _physics_process(delta: float) -> void:
	_apply_gravity(delta)
	_handle_jump(delta)
	move_and_slide()


func take_damage(amount: int) -> void:
	...


func _apply_gravity(delta: float) -> void:
	if not is_on_floor():
		velocity += get_gravity() * delta
```

## Typing

```gdscript
var enemies: Array[Enemy] = []
var scores: Dictionary[String, int] = {}          # 4.4+
var lookup: Dictionary[StringName, PackedScene] = {}
func find_target(from: Vector2, max_range: float = 300.0) -> Enemy:   # may return null
var body := area.get_overlapping_bodies()[0] as CharacterBody2D       # cast; null if wrong type
if node is Enemy:
	(node as Enemy).stun()
```
- Prefer `StringName` (`&"jump"`) for action names, groups, animation names.
- `Variant` only when truly dynamic (JSON, generic containers).
- Enable stricter warnings in serious projects: Project Settings → Debug → GDScript → `untyped_declaration` = Warn.

## Signals

```gdscript
signal coin_collected(value: int)
coin_collected.emit(5)
coin.collected.connect(_on_coin_collected)
button.pressed.connect(_on_button_pressed.bind(level_id))
await get_tree().create_timer(0.5).timeout
await animation_player.animation_finished
```
Connect in code (`_ready`) or with `scene_edit` `connect` op. Disconnect is automatic when either object is freed.

## Common patterns

**Timers without nodes**: `await get_tree().create_timer(t).timeout`; for repeated/cancelable use a `Timer` child.

**Tweens** (UI, juice, simple motion):
```gdscript
var tw := create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
tw.tween_property(self, "scale", Vector2.ONE * 1.2, 0.08)
tw.tween_property(self, "scale", Vector2.ONE, 0.12)
```
Kill an old tween before starting a new one on the same property (`if _tw: _tw.kill()`).

**Groups**: `add_to_group(&"enemies")`, `get_tree().get_nodes_in_group(&"enemies")`, `get_tree().call_group(&"enemies", &"alert")`.

**Spawning**: `const BulletScene := preload("res://actors/bullet/bullet.tscn")` → `var b := BulletScene.instantiate() as Bullet` → set properties → `get_tree().current_scene.add_child(b)` (or a dedicated container node). Set position *before* or right after `add_child` consistently.

**Deferred calls during physics**: changing collision shapes/monitoring inside physics callbacks → `set_deferred("disabled", true)` / `call_deferred()`.

**Freeing**: `queue_free()`; check `is_instance_valid(x)` before touching nodes that may have been freed.

**Input**: use the Input Map (actions), never raw keycodes in gameplay. `Input.get_axis(&"move_left", &"move_right")`, `Input.get_vector(...)` for 2D directions, `is_action_just_pressed` for edges. UI and pause menus: `_unhandled_input` so UI can consume events first.

**Custom resources**:
```gdscript
class_name WeaponData
extends Resource
@export var display_name: String
@export var damage: int = 10
@export var cooldown: float = 0.3
@export var projectile: PackedScene
```
Edit as `.tres` files; `duplicate()` (or `duplicate_deep()`, 4.5+) before mutating shared resources at runtime.

## Godot 3 habits that break in 4.x

| Godot 3 | Godot 4 |
|---|---|
| `KinematicBody2D`, `move_and_slide(velocity)` | `CharacterBody2D`, set `velocity` then `move_and_slide()` |
| `yield(obj, "signal")` | `await obj.signal` |
| `connect("sig", self, "_method")` | `sig.connect(_method)` |
| `export var`, `onready var` | `@export var`, `@onready var` |
| `Spatial`, `translation` | `Node3D`, `position` |
| `instance()` | `instantiate()` |
| `TileMap` (single node, layers) | `TileMapLayer` nodes (TileMap deprecated in 4.3) |
| `rand_range()` | `randf_range()` |
| `PoolStringArray` | `PackedStringArray` |
| `OS.get_ticks_msec()` | `Time.get_ticks_msec()` |
| `get_tree().change_scene("...")` | `get_tree().change_scene_to_file("...")` |
| `setget` | property `set(value):` / `get:` blocks |
| `tool` | `@tool` |

## Style

- Max ~300 lines per script; split by responsibility.
- Early returns over nested ifs.
- Comment *why*, not *what*; `##` doc comments on classes and public members (they show in the editor help).
- No `print` spam in committed code; use `push_warning`/`push_error` for real problems.
