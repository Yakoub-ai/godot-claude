# Error Patterns & Auto-Fixes

Load this file when debugging errors. Check here FIRST before searching docs.

---

## Parse Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Expected ":" after parameter name` | Missing type annotation or colon | Add `: Type` after parameter |
| `Unexpected token "Identifier"` | Missing `var`, `func`, or wrong indentation | Check scope and keywords |
| `Expected end of statement` | Extra characters or missing newline | Split into separate statements |
| `Could not find type "X"` | Class not defined or wrong name | Add `class_name` or check spelling (case-sensitive) |
| `Invalid operands "X" and "Y"` | Type mismatch in expression | Cast types or fix operation |
| `Too many arguments for "X()"` | Wrong number of args | Check docs for correct signature |
| `Not enough arguments for "X()"` | Missing required args | Check docs for correct signature |

## Runtime Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid get index 'X' (on base: 'Nil')` | Null reference — node not found | Check node path, use `@onready`, verify scene tree |
| `Node not found: "X"` | Wrong node path | Use `$NodeName` or `get_node()` with correct path |
| `Invalid call. Nonexistent function 'X'` | Method doesn't exist on type | Check docs for correct method name |
| `Parameter "X" has no type` | Missing type hint (warning) | Add type annotation |
| `Stack overflow` | Infinite recursion | Check state machine transitions, signal loops |
| `Out of bounds` | Array index invalid | Check `array.size()` before access |

## Signal Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Signal "X" not found` | Signal name typo or not declared | Check `signal` declarations |
| `Cannot connect to "X"` | Target method doesn't exist | Verify method name and target node path |
| `Signal already connected` | Duplicate `connect()` call | Use `is_connected()` guard or `connect(..., CONNECT_ONE_SHOT)` |
| `Method expected 0 args, signal provides 1` | Signature mismatch | Match method parameters to signal signature |

## Export Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `@export type not supported` | Unsupported export type | Use basic types or Resource subclasses |
| `@export_range requires numeric type` | Non-numeric with range | Change to int/float |
| `Resource type invalid` | Wrong resource class | Extend from Resource, use `class_name` |

## Physics Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Body entered but no collision shape` | Missing CollisionShape2D | Add CollisionShape2D with shape resource |
| `Area has no collision shape` | Area2D without shape | Add CollisionShape2D child |
| `Bodies not colliding` | Layer/mask mismatch | Check collision layers and masks |
| `move_and_slide not working` | Not in `_physics_process` | Move to `_physics_process(delta)` |

## Resource Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Resource not found: "res://..."` | File missing or wrong path | Check file exists at path, case-sensitive |
| `Cannot load resource` | Corrupt or wrong format | Re-import or recreate resource |
| `Cyclic dependency` | Two resources reference each other | Break cycle with lazy loading or signals |

## Performance Warnings

| Warning | Cause | Fix |
|---------|-------|-----|
| `Lots of draw calls` | Too many separate sprites | Use MultiMeshInstance2D or texture atlas |
| `High node count` | 1000+ nodes | Use Manager pattern, reduce tree size |
| `Physics process running on inactive` | Off-screen entities processing | Use `VisibleOnScreenNotifier2D` to disable |
| `Slow _process` | Heavy computation per frame | Use timers, reduce work, cache results |

---

## Debug Workflow

```
1. Read the EXACT error message
2. Search this file for the error text
3. If found → apply the fix
4. If not found → check .godot-claude/memory/errors.md for project-specific errors
5. If still not found → look up relevant class in Godot Docs MCP
6. Apply fix → validate_script → play_scene → verify
7. Document new error in .godot-claude/memory/errors.md
```

## Common Fix Patterns

### Null Reference Fix
```gdscript
# ❌ Crashes if node doesn't exist
var enemy: Node2D = get_node("Enemy")
enemy.take_damage(10)

# ✅ Safe access
var enemy: Node2D = get_node_or_null("Enemy")
if enemy:
    enemy.take_damage(10)
```

### Signal Connection Guard
```gdscript
# ❌ Crashes on duplicate connect
player.health_changed.connect(_on_health_changed)

# ✅ Safe connect
if not player.health_changed.is_connected(_on_health_changed):
    player.health_changed.connect(_on_health_changed)
```

### Type Cast Safety
```gdscript
# ❌ Crashes if wrong type
var body: CharacterBody2D = area.get_overlapping_bodies()[0]

# ✅ Safe cast
var bodies: Array[Node2D] = area.get_overlapping_bodies()
if bodies.size() > 0 and bodies[0] is CharacterBody2D:
    var body: CharacterBody2D = bodies[0] as CharacterBody2D
```

---

## Godot Engine Quirks

These are not bugs — they are engine behaviors that silently cause incorrect results unless you know the workaround.

| Quirk | Workaround |
|-------|-----------|
| MultiMeshInstance3D loses mesh after pack+save | Use individual instances instead |
| `_ready()` skipped in `_initialize()` | Call init methods manually after `add_child()` |
| Camera2D has no `current` property | Use `make_current()` after node is in tree |
| `--write-movie` frame 0 renders before `_process()` | Pre-position camera in `_initialize()` |
| Collision bitmask vs UI index confusion | Layer 1=1, Layer 2=2, Layer 3=4 (powers of 2) |
| GLB `material_override` doesn't serialize | Use procedural ArrayMesh for custom materials |
| `_process()` in SceneTree scripts returns bool | Must be `func _process(delta: float) -> bool:` |
| `await` advances movie frame counter | Use frame counter in `_physics_process()` instead |
| Items spawned in active Area2D get signal same frame | Use spawn immunity timer (~0.8s) |
| Collision state can't change in callbacks | Use `set_deferred("disabled", false)` |
