# Performance Optimization

Load this file when dealing with performance issues or building systems that handle many objects.

---

## Profiling Workflow

```
1. get_performance_monitors → baseline FPS, draw calls, node count
2. Identify bottleneck type:
   - Low FPS + high draw calls → Rendering issue
   - Low FPS + high node count → Scene tree issue
   - Low FPS + normal draws/nodes → Script performance issue
3. Apply targeted fix (see below)
4. get_performance_monitors → verify improvement
```

**Targets:**
| Metric | Good | Acceptable | Bad |
|--------|------|-----------|-----|
| FPS | 60 | 45+ | <30 |
| Draw calls | <100 | <300 | 500+ |
| Node count | <500 | <1000 | 2000+ |
| Physics bodies | <200 | <500 | 1000+ |

---

## Fix: Too Many Draw Calls

**Symptom:** FPS drops, draw calls > 300

| Solution | When to Use |
|----------|-------------|
| **MultiMeshInstance2D** | 100+ identical visuals (grass, debris, particles) |
| **Texture Atlas** | Many small sprites → combine into one texture |
| **CanvasGroup** | Batch draw calls for grouped CanvasItems |
| **Reduce z-index layers** | Too many separate z-layers |

### MultiMesh Example
```gdscript
var multimesh: MultiMesh = MultiMesh.new()
multimesh.mesh = quad_mesh
multimesh.transform_format = MultiMesh.TRANSFORM_2D
multimesh.instance_count = 500
for i in 500:
    multimesh.set_instance_transform_2d(i, Transform2D(0, positions[i]))
```

---

## Fix: Too Many Nodes

**Symptom:** FPS drops, node count > 1000

| Solution | When to Use |
|----------|-------------|
| **Manager pattern** | 50+ similar entities (bullets, enemies, XP gems) |
| **Object pooling** | Frequently spawned/destroyed objects |
| **Flatten tree** | Unnecessary container nodes |
| **Off-screen disable** | Entities processing when invisible |

### Object Pool Example
```gdscript
class_name ObjectPool
extends Node

var _pool: Array[Node] = []
var _scene: PackedScene

func _init(scene: PackedScene, size: int) -> void:
    _scene = scene
    for i in size:
        var obj: Node = _scene.instantiate()
        obj.set_process(false)
        obj.set_physics_process(false)
        obj.visible = false
        _pool.append(obj)
        add_child(obj)

func get_object() -> Node:
    if _pool.size() > 0:
        var obj: Node = _pool.pop_back()
        obj.set_process(true)
        obj.set_physics_process(true)
        obj.visible = true
        return obj
    return _scene.instantiate()  # Overflow — create new

func return_object(obj: Node) -> void:
    obj.set_process(false)
    obj.set_physics_process(false)
    obj.visible = false
    _pool.append(obj)
```

---

## Fix: Slow Scripts

**Symptom:** FPS drops, draw calls and node count are normal

| Solution | When to Use |
|----------|-------------|
| **Static typing** | Dynamic types in hot paths |
| **Timer-based updates** | AI/targeting running every frame |
| **Spatial partitioning** | Lots of distance checks |
| **Cache calculations** | Same math repeated per frame |
| **set_process(false)** | Inactive entities still processing |

### Timer-Based AI
```gdscript
@onready var _ai_timer: Timer = $AITimer  # Set to 0.2s in editor

func _ready() -> void:
    _ai_timer.timeout.connect(_update_ai)

func _update_ai() -> void:
    # Runs 5x/sec instead of 60x/sec
    _find_nearest_target()
    _calculate_path()
```

### Off-Screen Disable
```gdscript
@onready var _notifier: VisibleOnScreenNotifier2D = $VisibleOnScreenNotifier2D

func _ready() -> void:
    _notifier.screen_entered.connect(func(): set_physics_process(true))
    _notifier.screen_exited.connect(func(): set_physics_process(false))
```

---

## Performance Checklist

Before shipping any feature, verify:
- [ ] All variables/functions statically typed
- [ ] No heavy computation in `_process()` / `_physics_process()`
- [ ] Pooling used for frequently spawned objects
- [ ] Manager pattern for 50+ similar entities
- [ ] Off-screen entities disabled
- [ ] No `load()` calls in hot paths (use `preload()`)
- [ ] No string formatting in per-frame code
- [ ] Collision layers/masks properly set (not everything vs everything)
- [ ] MultiMesh used for 100+ identical visuals
- [ ] Scene node count under 1,000
