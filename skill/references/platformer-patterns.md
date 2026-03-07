# 2D Platformer Patterns for Godot 4

Condensed reference for physics-based 2D platformers in Godot 4 with GDScript.

---

## Movement Physics

### Core Movement

```gdscript
extends CharacterBody2D

@export var move_speed: float = 200.0
@export var jump_force: float = -400.0
@export var gravity_scale: float = 1.0
@export var max_fall_speed: float = 600.0
@export var acceleration: float = 1200.0
@export var friction: float = 1000.0
@export var coyote_time: float = 0.1
@export var jump_buffer_time: float = 0.133

var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta: float) -> void:
    _apply_gravity(delta)
    _handle_movement(delta)
    _handle_jump(delta)
    move_and_slide()
```

### Gravity
```gdscript
func _apply_gravity(delta: float) -> void:
    if not is_on_floor():
        velocity.y += gravity * gravity_scale * delta
        velocity.y = min(velocity.y, max_fall_speed)
```

### Horizontal Movement
```gdscript
func _handle_movement(delta: float) -> void:
    var input_dir := Input.get_axis("move_left", "move_right")
    if input_dir != 0.0:
        velocity.x = move_toward(velocity.x, input_dir * move_speed, acceleration * delta)
    else:
        velocity.x = move_toward(velocity.x, 0.0, friction * delta)
```

### Jump (Coyote + Buffer + Variable Height)
```gdscript
func _handle_jump(delta: float) -> void:
    if is_on_floor():
        coyote_timer = coyote_time
    else:
        coyote_timer -= delta

    if Input.is_action_just_pressed("jump"):
        jump_buffer_timer = jump_buffer_time
    jump_buffer_timer -= delta

    if jump_buffer_timer > 0.0 and coyote_timer > 0.0:
        velocity.y = jump_force
        coyote_timer = 0.0
        jump_buffer_timer = 0.0

    # Variable height: release early = shorter hop
    if Input.is_action_just_released("jump") and velocity.y < 0.0:
        velocity.y *= 0.5
```

## Character Abilities

Override `_handle_ability()` in base class:

- **Dash**: Horizontal burst with i-frames. Override velocity, set `is_invincible = true`.
- **Ground pound**: High downward velocity on descent, AOE on landing.
- **Float/glide**: Reduce gravity while holding jump during descent.

## Animation from Physics State

```gdscript
func _update_animation() -> void:
    if is_dead:
        _play_anim("death")
        return
    if not is_on_floor():
        _play_anim("jump" if velocity.y < 0 else "fall")
    elif abs(velocity.x) > 10.0:
        _play_anim("walk")
    else:
        _play_anim("idle")

func _update_facing() -> void:
    if velocity.x > 10.0:
        sprite.flip_h = false
    elif velocity.x < -10.0:
        sprite.flip_h = true
```

## Auto-Fire Weapon System

Weapons fire on cooldown — player controls positioning only.

```gdscript
class_name BaseWeapon extends Node2D

@export var damage: int = 10
@export var cooldown: float = 1.5
@export var attack_range: float = 200.0

var cooldown_timer: float = 0.0

func _process(delta: float) -> void:
    cooldown_timer -= delta
    if cooldown_timer <= 0.0 and _can_attack():
        _attack()
        cooldown_timer = cooldown
```

**Types**: Melee (arc in facing direction), Ranged (projectile to nearest enemy), Orbital (rotating Area2D).

### Targeting
```gdscript
static func get_nearest_enemy(from: Vector2, max_range: float, tree: SceneTree) -> BaseEnemy:
    var nearest: BaseEnemy = null
    var nearest_dist := max_range
    for node in tree.get_nodes_in_group("enemies"):
        var enemy := node as BaseEnemy
        if enemy and not enemy.is_dead:
            var dist := from.distance_to(enemy.global_position)
            if dist < nearest_dist:
                nearest_dist = dist
                nearest = enemy
    return nearest
```

## Enemy AI Patterns

Base: `CharacterBody2D`, group `"enemies"`, override `_update_ai()`.

- **Ground Chaser**: Move toward player, reverse at ledges (raycast)
- **Flying Chaser**: Move directly toward player, no gravity
- **Ranged Attacker**: Maintain distance, fire projectiles
- **Patroller**: Walk between points, aggro on proximity

### Death Flow
```gdscript
func die() -> void:
    is_dead = true
    velocity = Vector2.ZERO
    sprite.play("death")
    await sprite.animation_finished
    queue_free()
```

## Wave System

Signal-driven arena combat:

```gdscript
signal wave_started(wave_number: int)
signal wave_cleared(wave_number: int)
signal all_waves_cleared
```

Escalation: Wave 1 (single type) → 2 (two types) → 3 (three types) → 4 (miniboss + adds) → 5 (boss + support).

## XP & Kill Chain

**XP**: Instant on kill, no physical pickup. 15% scaling per level.

**Kill Chain**: Reward aggressive play with escalating bonuses at 5/10/15/20 kill thresholds. 3s timeout resets chain.

## Scene Tree Templates

### Character
```
CharacterBody2D
├── AnimatedSprite2D (ShaderMaterial: hit_flash.gdshader)
├── CollisionShape2D
├── Node2D (WeaponMount)
└── Area2D (HurtBox)
    └── CollisionShape2D
```

### Enemy
```
CharacterBody2D
├── AnimatedSprite2D (ShaderMaterial: hit_flash.gdshader)
├── CollisionShape2D
├── Area2D (HitBox)
│   └── CollisionShape2D
└── Area2D (DetectionRange)
    └── CollisionShape2D (CircleShape2D)
```

### Level
```
Node2D
├── TileMapLayer (collision layer 3)
├── CharacterBody2D (player)
├── Camera2D
├── CanvasLayer (UI)
└── Node2D (SpawnPoints)
```

## Collision Layers
```
Layer 1: Player
Layer 2: Enemies
Layer 3: Platforms
Layer 4: Projectiles
Layer 5: Pickups
```

## Visual Effects

### Hit Flash Shader
```gdshader
shader_type canvas_item;
uniform float flash_strength : hint_range(0.0, 1.0) = 0.0;
void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    COLOR = mix(tex, vec4(1.0, 1.0, 1.0, tex.a), flash_strength);
}
```

### Invincibility Flicker
```gdscript
if is_invincible:
    modulate.a = 1.0 if fmod(invincibility_timer, 0.15) > 0.075 else 0.4
```

## Display Config (Pixel Art)
- Viewport: 640x360, Window: 1280x720
- Stretch mode: viewport
- Texture filter: Nearest
- Renderer: GL Compatibility
