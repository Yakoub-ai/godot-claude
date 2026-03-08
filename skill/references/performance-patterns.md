# Godot 4 Performance Patterns

GDScript optimization patterns for production-ready games. 2D-focused with brief 3D notes.

---

## Static Typing — Always Use It

Static typing produces faster bytecode in release builds. Every variable, parameter, and return type should be typed.

```gdscript
# BAD — dynamic typing (slow)
var speed = 200.0
var enemies = []
func get_nearest(pos):
    var best = null
    var best_dist = 999999
    for e in enemies:
        var d = pos.distance_to(e.global_position)

# GOOD — static typing (fast)
var speed: float = 200.0
var enemies: Array[BaseEnemy] = []
func get_nearest(pos: Vector2) -> BaseEnemy:
    var best: BaseEnemy = null
    var best_dist: float = 999999.0
    for e: BaseEnemy in enemies:
        var d: float = pos.distance_to(e.global_position)
```

### Typed Signals
```gdscript
signal health_changed(new_health: int, max_health: int)
signal enemy_died(enemy: BaseEnemy, position: Vector2)
```

### Typed Arrays and Dictionaries
```gdscript
var active_bullets: Array[Bullet] = []
var weapon_registry: Dictionary = {}  # Dictionary typing is limited — use comments
@export var spawn_points: Array[Marker2D] = []
```

---

## Process Function Guidelines

### Rule: Minimize Per-Frame Work

```gdscript
# BAD — heavy work every frame
func _process(delta: float) -> void:
    var nearest: BaseEnemy = _find_nearest_enemy()  # O(n) every frame
    _update_pathfinding()                            # expensive every frame
    _check_all_collisions()                          # redundant with physics

# GOOD — cooldown-gated expensive operations
var _target_update_timer: float = 0.0
const TARGET_UPDATE_INTERVAL: float = 0.2  # 5x per second, not 60x

func _process(delta: float) -> void:
    _target_update_timer -= delta
    if _target_update_timer <= 0.0:
        _target_update_timer = TARGET_UPDATE_INTERVAL
        _cached_target = _find_nearest_enemy()
```

### When to Use Each Process Function
- `_physics_process(delta)` — Movement, collision responses, physics queries. Runs at fixed rate (default 60Hz).
- `_process(delta)` — Visual updates, UI, non-physics animation. Runs every render frame.
- **Timer nodes** — Periodic tasks (AI decisions, spawn checks). Use `Timer` node or manual cooldown.
- **Signals** — Event-driven updates (health changed, enemy died). Zero per-frame cost.

### Conditional Processing
```gdscript
# Disable processing when not needed
func _on_enemy_died() -> void:
    set_process(false)
    set_physics_process(false)

# Re-enable when active
func activate() -> void:
    set_process(true)
    set_physics_process(true)
```

---

## Manager Pattern — Centralized Update Loops

Instead of 500 bullets each running `_process()`, one BulletManager updates them all.

```gdscript
class_name BulletManager extends Node2D

var _active_bullets: Array[Bullet] = []

func _physics_process(delta: float) -> void:
    var i: int = _active_bullets.size() - 1
    while i >= 0:
        var bullet: Bullet = _active_bullets[i]
        bullet.position += bullet.direction * bullet.speed * delta
        bullet.lifetime -= delta
        if bullet.lifetime <= 0.0 or _is_off_screen(bullet):
            _release_bullet(bullet, i)
        i -= 1

func spawn_bullet(pos: Vector2, dir: Vector2, speed: float) -> Bullet:
    var bullet: Bullet = _pool.get_object()
    bullet.position = pos
    bullet.direction = dir
    bullet.speed = speed
    bullet.lifetime = 5.0
    bullet.visible = true
    _active_bullets.append(bullet)
    return bullet

func _release_bullet(bullet: Bullet, index: int) -> void:
    bullet.visible = false
    _active_bullets.remove_at(index)
    _pool.release(bullet)
```

**When to use**: Any system with 50+ similar objects updating per frame — bullets, particles, XP gems, coins, environmental effects.

---

## Object Pooling — Avoid instantiate/queue_free

Creating and destroying nodes is expensive. Pre-allocate and recycle.

```gdscript
class_name ObjectPool extends Node

var _available: Array[Node] = []
var _scene: PackedScene
var _parent: Node
var _pool_size: int

func _init(scene: PackedScene, parent: Node, initial_size: int = 20) -> void:
    _scene = scene
    _parent = parent
    _pool_size = initial_size

func warm() -> void:
    for i: int in _pool_size:
        var obj: Node = _scene.instantiate()
        obj.visible = false
        obj.set_process(false)
        obj.set_physics_process(false)
        _parent.add_child(obj)
        _available.append(obj)

func get_object() -> Node:
    var obj: Node
    if _available.size() > 0:
        obj = _available.pop_back()
    else:
        obj = _scene.instantiate()
        _parent.add_child(obj)
    obj.visible = true
    obj.set_process(true)
    obj.set_physics_process(true)
    return obj

func release(obj: Node) -> void:
    obj.visible = false
    obj.set_process(false)
    obj.set_physics_process(false)
    _available.append(obj)
```

**Usage**: Enemies (see `enemy_pool.gd` in stress-killer), bullets, XP gems, hit effects, damage numbers.

---

## MultiMeshInstance2D — Thousands of Identical Sprites

One draw call for thousands of identical objects (grass, debris, background elements).

```gdscript
class_name GrassField extends MultiMeshInstance2D

@export var grass_count: int = 5000
@export var spread: Vector2 = Vector2(2000, 2000)

func _ready() -> void:
    var mm: MultiMesh = MultiMesh.new()
    mm.transform_format = MultiMesh.TRANSFORM_2D
    mm.instance_count = grass_count
    mm.mesh = _create_quad_mesh()

    for i: int in grass_count:
        var t: Transform2D = Transform2D.IDENTITY
        t.origin = Vector2(
            randf_range(-spread.x, spread.x),
            randf_range(-spread.y, spread.y)
        )
        mm.set_instance_transform_2d(i, t)

    multimesh = mm
```

**When to use**: 100+ identical visual elements. NOT for objects needing individual collision or scripting — use Manager pattern for those.

---

## Spatial Optimization — Grid-Based Lookups

Avoid O(n²) distance checks. Partition space into a grid.

```gdscript
class_name SpatialGrid extends RefCounted

var _cell_size: float
var _grid: Dictionary = {}  # Vector2i → Array[Node2D]

func _init(cell_size: float = 128.0) -> void:
    _cell_size = cell_size

func _get_cell(pos: Vector2) -> Vector2i:
    return Vector2i(
        floori(pos.x / _cell_size),
        floori(pos.y / _cell_size)
    )

func update_entity(entity: Node2D, old_pos: Vector2, new_pos: Vector2) -> void:
    var old_cell: Vector2i = _get_cell(old_pos)
    var new_cell: Vector2i = _get_cell(new_pos)
    if old_cell != new_cell:
        _remove_from_cell(entity, old_cell)
        _add_to_cell(entity, new_cell)

func get_nearby(pos: Vector2, radius: float) -> Array[Node2D]:
    var results: Array[Node2D] = []
    var cell_radius: int = ceili(radius / _cell_size)
    var center: Vector2i = _get_cell(pos)
    for x: int in range(center.x - cell_radius, center.x + cell_radius + 1):
        for y: int in range(center.y - cell_radius, center.y + cell_radius + 1):
            var key: Vector2i = Vector2i(x, y)
            if _grid.has(key):
                for entity: Node2D in _grid[key]:
                    if pos.distance_squared_to(entity.global_position) <= radius * radius:
                        results.append(entity)
    return results
```

**When to use**: Weapon targeting with 50+ enemies, proximity checks, area queries. Replace `get_nodes_in_group()` + distance loop.

---

## Signal vs Polling

| Pattern | Use When | Cost |
|---------|----------|------|
| **Signal** | State changes (death, damage, level up) | Zero per-frame cost |
| **Polling in _process** | Continuous state (position, velocity) | Per-frame cost |
| **Timer + poll** | Periodic checks (target acquisition) | Amortized cost |

```gdscript
# BAD — polling for a one-time event
func _process(delta: float) -> void:
    if health <= 0:  # checked 60x/sec, fires once
        die()

# GOOD — signal-driven
func take_damage(amount: int) -> void:
    health -= amount
    health_changed.emit(health, max_health)
    if health <= 0:
        die()
```

---

## Memory & Loading

```gdscript
# BAD — loading same resource repeatedly
func spawn_enemy() -> void:
    var scene: PackedScene = load("res://scenes/enemies/chaser.tscn")  # disk read each time

# GOOD — preload at script level
const CHASER_SCENE: PackedScene = preload("res://scenes/enemies/chaser.tscn")

func spawn_enemy() -> void:
    var enemy: BaseEnemy = CHASER_SCENE.instantiate()
```

- Use `preload()` for resources referenced at compile time
- Use `load()` only for dynamic/runtime-determined paths
- Cache loaded resources in a Dictionary if loading dynamically
- Free unused resources: `ResourceLoader.load()` caches by default — call `Resource.unreference()` if needed

---

## Rendering Optimization (2D)

- **Texture atlases**: Combine small sprites into atlas sheets to reduce draw calls
- **VisibleOnScreenNotifier2D**: Disable processing for off-screen entities
- **CanvasGroup**: Batch draw calls for groups of CanvasItems
- **Z-index layers**: Minimize CanvasItem sort operations by grouping similar z-index
- **Viewport texture**: Render complex backgrounds once to a SubViewport, display as texture

```gdscript
# Disable processing when off-screen
func _ready() -> void:
    var notifier: VisibleOnScreenNotifier2D = $VisibleOnScreenNotifier2D
    notifier.screen_entered.connect(_on_screen_entered)
    notifier.screen_exited.connect(_on_screen_exited)

func _on_screen_entered() -> void:
    set_process(true)
    set_physics_process(true)

func _on_screen_exited() -> void:
    set_process(false)
    set_physics_process(false)
```

### 3D Notes (Brief)
- Enable **Occlusion Culling** in Project Settings for scenes with many occluders
- Use **SDFGI** for dynamic global illumination (Vulkan renderer only)
- Apply **LOD** (Level of Detail) on meshes for distance-based simplification
- Use **MultiMeshInstance3D** for foliage, rocks, debris

---

## Profiling Checklist (MCP Pro Tools)

Use these Godot MCP Pro tools to diagnose and fix performance issues:

1. **Baseline**: `get_performance_monitors` — record FPS, draw calls, node count, physics time
2. **Scene audit**: `analyze_scene_complexity` — check node counts, tree depth per scene
3. **Stress test**: `run_stress_test` — measure performance under load (many enemies, particles)
4. **Identify bottleneck**:
   - Low FPS + high draw calls → rendering issue → use MultiMesh, texture atlas, CanvasGroup
   - Low FPS + high physics time → physics issue → reduce collision shapes, simplify shapes
   - Low FPS + high script time → script issue → optimize _process, add cooldowns, use manager pattern
5. **Fix and re-measure**: `get_performance_monitors` — verify improvement
6. **Editor stats**: `get_editor_performance` — check editor-side overhead

---

## Performance Budgets

| Metric | 2D Pixel Art Target | 2D HD Target | 3D Target |
|--------|-------------------|-------------|-----------|
| FPS | 60 stable | 60 stable | 60 stable |
| Max nodes per scene | < 1,000 | < 2,000 | < 5,000 |
| Max enemies on screen | 100–200 | 50–100 | 30–50 |
| Draw calls | < 100 | < 200 | < 500 |
| Physics bodies | < 200 | < 100 | < 100 |
| Script _process calls | < 100 | < 50 | < 50 |

Use object pooling when entity count exceeds 50. Use MultiMesh when identical visual count exceeds 100. Use spatial partitioning when proximity queries involve 50+ entities.
