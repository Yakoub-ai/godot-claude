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

---

## Type Inference Gotchas

`:=` infers the type from the right-hand side, but many built-in functions return `Variant`, causing type inference to fail or produce untyped variables.

**Functions that return Variant (do NOT use `:=`):**
- Math: `abs()`, `clamp()`, `min()`, `max()`, `floor()`, `ceil()`, `round()`
- Interpolation: `lerp()`, `smoothstep()`, `move_toward()`

```gdscript
# ❌ BAD — x is Variant, defeats static typing
var x := abs(y)
var clamped := clamp(speed, 0.0, MAX_SPEED)

# ✅ GOOD — explicit type annotation
var x: float = abs(y)
var clamped: float = clamp(speed, 0.0, MAX_SPEED)
```

**Other `:=` failures:**
- `load().instantiate()` — returns untyped: use `var model = scene.instantiate()` (not `:=`)
- Array/dictionary element access — `var item := inventory[0]` fails; use `var item: ItemType = inventory[0]`

---

## Scene Builder vs Runtime Script

| Aspect | Scene Builder | Runtime Script |
|--------|--------------|----------------|
| Extends | `SceneTree` | `Node`, `CharacterBody2D`, etc. |
| Runs when | Headless at build-time | When game plays |
| Entry point | `_initialize()` | `_ready()`, `_process()`, `_physics_process()` |
| `@onready` | NOT available | Available |
| `preload()` | NOT available | Available |
| Signal connections | NOT available | Connect in `_ready()` |
| Must call | `quit()` when done | Nothing — lifecycle managed by engine |

```gdscript
# Scene builder example (headless generation)
extends SceneTree

func _initialize() -> void:
    var root: Node3D = Node3D.new()
    # ... build scene programmatically ...
    var packed: PackedScene = PackedScene.new()
    packed.pack(root)
    ResourceSaver.save(packed, "res://scenes/generated.tscn")
    quit()
```

---

## Server API (500+ Objects)

For managing 500+ objects (bullets, particles, debris) without creating nodes, use the physics server APIs directly. This avoids scene tree overhead entirely.

```gdscript
# PhysicsServer2D for 500+ objects without nodes (bullets, particles):
var shape = PhysicsServer2D.circle_shape_create()
var body = PhysicsServer2D.body_create()
PhysicsServer2D.body_add_shape(body, shape)
# Custom drawing for server-managed objects:
func _draw() -> void:
    for bullet in bullets:
        draw_texture(bullet_tex, bullet.position)
```

When to use:
- **500+ bullets** — PhysicsServer2D + custom `_draw()`
- **500+ particles** — GPUParticles2D/3D or custom compute
- **500+ foliage/debris** — MultiMeshInstance2D/3D (no physics needed)

---

## Camera Patterns

```gdscript
# Smooth follow with first-frame snap
var _initialized: bool = false

func _physics_process(delta: float) -> void:
    var target_pos: Vector2 = target.global_position + offset
    if not _initialized:
        global_position = target_pos  # Snap on first frame
        _initialized = true
    else:
        global_position = global_position.lerp(target_pos, smooth_speed * delta)
```

**Camera-relative input (3D):** Remove pitch from camera basis so forward is always horizontal:
```gdscript
var cam_basis: Basis = camera.global_transform.basis
var forward: Vector3 = -cam_basis.z
forward.y = 0.0
forward = forward.normalized()
var right: Vector3 = cam_basis.x
right.y = 0.0
right = right.normalized()
var input_dir: Vector3 = forward * input.y + right * input.x
```

**Dynamic FOV for vehicles:**
```gdscript
camera.fov = lerp(camera.fov, base_fov + speed * fov_scale, 4.0 * delta)
```

---

## Movement Feel

**Walk/stop force asymmetry** — acceleration is faster than deceleration for responsive feel:
```gdscript
const ACCEL: float = 2000.0
const FRICTION: float = 1200.0

func _physics_process(delta: float) -> void:
    var input_x: float = Input.get_axis("move_left", "move_right")
    if abs(input_x) > 0.1:
        velocity.x = move_toward(velocity.x, input_x * MAX_SPEED, ACCEL * delta)
    else:
        velocity.x = move_toward(velocity.x, 0.0, FRICTION * delta)
    velocity.x = clampf(velocity.x, -MAX_SPEED, MAX_SPEED)
    move_and_slide()
```

**Analog input** — preserve analog magnitude for walk/run distinction:
```gdscript
var input_vec: Vector2 = Input.get_vector("move_left", "move_right", "move_up", "move_down")
var magnitude: float = minf(input_vec.length(), 1.0)
var direction: Vector2 = input_vec.normalized()
velocity = direction * magnitude * MAX_SPEED
```

---

## Advanced Tween Patterns

```gdscript
# Parallel tweens — animate multiple properties simultaneously
var tween: Tween = create_tween()
tween.tween_property(sprite, "modulate:a", 0.0, 0.5)
tween.parallel().tween_property(sprite, "scale", Vector2.ZERO, 0.5)
tween.parallel().tween_property(sprite, "position:y", -50.0, 0.5).as_relative()

# Method tween — call a method with interpolated values
tween.tween_method(_set_health_bar, 1.0, 0.0, 1.5)

# Relative motion — offset from current value
tween.tween_property(node, "position", Vector2(0, -20), 0.3).as_relative()

# Chained with callbacks
tween.tween_property(node, "modulate:a", 0.0, 0.3)
tween.tween_callback(node.queue_free)
```
