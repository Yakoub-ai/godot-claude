# GDScript Patterns & Best Practices

Load this file when writing or reviewing GDScript code.

---

## Static Typing — MANDATORY

Every variable, parameter, return type, and array MUST be typed. This produces faster bytecode.

```gdscript
# Variables
var speed: float = 200.0
var health: int = 100
var enemies: Array[BaseEnemy] = []
var inventory: Dictionary = {}

# Functions — always type params and return
func get_nearest_enemy(pos: Vector2) -> BaseEnemy:
    ...

func _physics_process(delta: float) -> void:
    ...

# Exports
@export var max_health: int = 100
@export var move_speed: float = 300.0
@export var weapon_config: WeaponConfig

# Onready
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var collision: CollisionShape2D = $CollisionShape2D
```

---

## Script Structure Template

```gdscript
class_name MyClassName
extends ParentClass
## Brief description of what this node does.

# --- Signals ---
signal health_changed(new_health: int)
signal died

# --- Enums ---
enum State { IDLE, WALKING, ATTACKING, DEAD }

# --- Constants ---
const MAX_SPEED: float = 400.0

# --- Exports ---
@export var max_health: int = 100
@export var move_speed: float = 200.0

# --- Public variables ---
var current_state: State = State.IDLE
var velocity_component: Vector2 = Vector2.ZERO

# --- Private variables ---
var _health: int = 100
var _is_invincible: bool = false

# --- Onready ---
@onready var _sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var _anim_player: AnimationPlayer = $AnimationPlayer

# --- Built-in callbacks ---
func _ready() -> void:
    _health = max_health

func _physics_process(delta: float) -> void:
    _update_movement(delta)
    move_and_slide()

# --- Public methods ---
func take_damage(amount: int) -> void:
    if _is_invincible:
        return
    _health -= amount
    health_changed.emit(_health)
    if _health <= 0:
        _die()

# --- Private methods ---
func _update_movement(delta: float) -> void:
    pass

func _die() -> void:
    current_state = State.DEAD
    died.emit()
    queue_free()
```

---

## Node Type Selection

| Use Case | Node Type |
|----------|-----------|
| Player, enemies, NPCs (moving entities) | `CharacterBody2D` |
| Walls, floors, platforms (static geometry) | `StaticBody2D` |
| Hitboxes, hurtboxes, pickups, triggers | `Area2D` |
| Thrown items, debris (physics-driven) | `RigidBody2D` |
| HUD overlay | `CanvasLayer` → `Control` |
| Sprite animation | `AnimatedSprite2D` + `SpriteFrames` |
| Skeletal animation | `AnimationPlayer` |
| Camera | `Camera2D` (attach to player or separate) |

---

## Scene Organization

```
GameLevel (Node2D)
├── TileMap
├── Entities (Node2D)
│   ├── Player
│   └── Enemies (Node2D)
│       ├── Goblin1
│       └── Goblin2
├── Projectiles (Node2D)
├── Pickups (Node2D)
├── VFX (Node2D)
└── UI (CanvasLayer)
    └── HUD (Control)
```

**Rules:**
- One script per scene root
- Child nodes communicate via signals or parent method calls
- Use `Node2D` containers to group similar entities
- Use `PackedScene.instantiate()` for reusable entities

---

## Signals Over Direct References

```gdscript
# ✅ GOOD — loose coupling
signal health_changed(new_value: int)

func take_damage(amount: int) -> void:
    health -= amount
    health_changed.emit(health)

# In HUD script:
func _ready() -> void:
    player.health_changed.connect(_on_player_health_changed)

# ❌ BAD — tight coupling
func take_damage(amount: int) -> void:
    health -= amount
    get_node("../../UI/HUD").update_health(health)  # Fragile path!
```

---

## State Machines

```gdscript
enum State { IDLE, RUN, JUMP, FALL, ATTACK }
var state: State = State.IDLE

func _physics_process(delta: float) -> void:
    match state:
        State.IDLE:
            _process_idle(delta)
        State.RUN:
            _process_run(delta)
        State.JUMP:
            _process_jump(delta)
        State.FALL:
            _process_fall(delta)
        State.ATTACK:
            _process_attack(delta)
    move_and_slide()
```

---

## Resource Data Pattern

Use `.tres` files for data, not hardcoded values:

```gdscript
# weapon_config.gd
class_name WeaponConfig
extends Resource

@export var damage: int = 10
@export var fire_rate: float = 0.5
@export var projectile_speed: float = 600.0
@export var projectile_scene: PackedScene
```

Then create `.tres` files in the editor for each weapon variant.

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `get_node()` with hardcoded cross-scene paths | Use signals, groups, or autoloads |
| Dynamic typing in hot paths | Add type annotations everywhere |
| `load()` called every frame | Use `preload()` or cache in `_ready()` |
| Heavy computation in `_process()` | Use timers, signals, or `set_process(false)` |
| String formatting in `_process()` | Cache string results |
| Not calling `move_and_slide()` | Required after setting `velocity` on CharacterBody2D |

---

## Pixel Art Settings

- Texture filter: **Nearest** (Project → Rendering → Textures → Default Texture Filter)
- Stretch mode: **viewport** (Project → Display → Window → Stretch)
- Sprites face **East** by default, use `flip_h` for West
- Use `AnimatedSprite2D` + `SpriteFrames` for frame-by-frame animation
