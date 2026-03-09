# Scene Architecture & Node Design

Load this file when designing scene trees, choosing node types, or planning system architecture.

---

## Scene Tree Design Principles

1. **One script per scene root** — children use signals to communicate up
2. **Composition over inheritance** — build complex nodes from simple scenes
3. **Flat is better than deep** — minimize tree depth for performance
4. **Group similar entities** — use container Node2D nodes (Enemies, Projectiles, VFX)
5. **Keep under 1,000 nodes per scene** — use `analyze_scene_complexity` to audit

---

## Standard Project Layout

```
res://
├── project.godot
├── scenes/
│   ├── levels/          # Level scenes
│   ├── characters/      # Player, enemy, NPC scenes
│   ├── ui/              # Menu, HUD, dialog scenes
│   └── components/      # Reusable component scenes
├── scripts/
│   ├── autoloads/       # Global singletons
│   ├── resources/       # Resource class definitions
│   └── components/      # Reusable script components
├── assets/
│   ├── sprites/         # Sprite sheets, individual frames
│   ├── audio/           # SFX and music
│   ├── fonts/           # Custom fonts
│   └── shaders/         # .gdshader files
└── data/
    └── configs/         # .tres resource data files
```

---

## Architecture Patterns by Scale

### Small Game (< 20 scenes)
```
Main (Node2D) — autoload for global state
├── Level scenes load/unload
├── Player scene is child of level
└── UI overlay via CanvasLayer
```

### Medium Game (20-100 scenes)
```
GameManager (Autoload) — state machine for game flow
SceneManager (Autoload) — scene transitions, loading
AudioManager (Autoload) — centralized audio
├── Levels use PackedScene instantiation
├── Entity scenes are self-contained
└── Signal bus for cross-system communication
```

### Large Game (100+ scenes)
```
GameManager (Autoload) — game state, save/load
SceneManager (Autoload) — async loading, transitions
EventBus (Autoload) — global signal bus
AudioManager (Autoload) — bus routing, pooling
ResourceCache (Autoload) — preloaded resources
├── Manager nodes per domain (EnemyManager, ProjectileManager)
├── Object pooling for frequently spawned entities
├── Chunk-based level loading
└── Component system for entity behaviors
```

---

## Entity Design Pattern

```
CharacterBody2D (root — has main script)
├── CollisionShape2D (physics shape)
├── AnimatedSprite2D (visuals)
├── HurtboxComponent (Area2D — receives damage)
│   └── CollisionShape2D
├── HitboxComponent (Area2D — deals damage)
│   └── CollisionShape2D
├── HealthComponent (Node — manages HP)
├── StateMachine (Node — manages states)
└── NavigationAgent2D (optional — pathfinding)
```

Each component is a reusable scene that can be attached to any entity.

---

## Manager Pattern (50+ similar objects)

Instead of individual `_process()` on each object:

```gdscript
class_name BulletManager
extends Node2D

var _active_bullets: Array[BulletData] = []
var _pool: Array[BulletData] = []
const POOL_SIZE: int = 200

func _ready() -> void:
    for i in POOL_SIZE:
        _pool.append(BulletData.new())

func spawn(pos: Vector2, dir: Vector2, speed: float) -> void:
    var bullet: BulletData = _pool.pop_back() if _pool.size() > 0 else BulletData.new()
    bullet.position = pos
    bullet.direction = dir
    bullet.speed = speed
    bullet.active = true
    _active_bullets.append(bullet)

func _physics_process(delta: float) -> void:
    for i in range(_active_bullets.size() - 1, -1, -1):
        var b: BulletData = _active_bullets[i]
        b.position += b.direction * b.speed * delta
        if _is_offscreen(b.position):
            b.active = false
            _pool.append(b)
            _active_bullets.remove_at(i)
```

---

## Signal Bus Pattern

```gdscript
# event_bus.gd (Autoload)
class_name EventBus
extends Node

signal player_died
signal enemy_killed(enemy_type: String, position: Vector2)
signal score_changed(new_score: int)
signal level_complete(level_id: int)
signal game_paused(is_paused: bool)
```

Any node can emit or listen without direct references:
```gdscript
EventBus.enemy_killed.emit("goblin", global_position)
EventBus.enemy_killed.connect(_on_enemy_killed)
```

---

## Physics Layer Convention

| Layer | Purpose |
|-------|---------|
| 1 | Environment (walls, floors) |
| 2 | Player |
| 3 | Enemies |
| 4 | Player projectiles |
| 5 | Enemy projectiles |
| 6 | Pickups/items |
| 7 | Triggers/zones |
| 8 | UI blockers |

Set via `set_physics_layers` MCP tool or in editor.

---

## When to Use Autoloads

| Use Autoload For | Don't Use Autoload For |
|-----------------|----------------------|
| Game state (lives, score, settings) | Level-specific logic |
| Scene transitions | Entity behavior |
| Audio management | Temporary data |
| Event bus / signal bus | UI management (use CanvasLayer) |
| Save/load system | Physics interactions |
| Input remapping | Visual effects |
