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

---

## Narrative Architecture

### NarrativeManager Autoload (required for all story games)

All story state lives here — never in scene scripts.

```gdscript
# scripts/autoloads/narrative_manager.gd
class_name NarrativeManager
extends Node

signal quest_started(quest_id: String)
signal quest_completed(quest_id: String)
signal flag_changed(flag_name: String, value: Variant)

var completed_quests: Array[String] = []
var active_quests: Array[String] = []
var flags: Dictionary = {}  # {key: Variant} — tracks choices and story state

func start_quest(quest_id: String) -> void:
    if quest_id not in active_quests:
        active_quests.append(quest_id)
        quest_started.emit(quest_id)

func complete_quest(quest_id: String) -> void:
    active_quests.erase(quest_id)
    if quest_id not in completed_quests:
        completed_quests.append(quest_id)
        quest_completed.emit(quest_id)

func set_flag(key: String, value: Variant) -> void:
    flags[key] = value
    flag_changed.emit(key, value)

func get_flag(key: String, default: Variant = null) -> Variant:
    return flags.get(key, default)

func is_quest_done(quest_id: String) -> bool:
    return quest_id in completed_quests

func save() -> Dictionary:
    return {"completed": completed_quests, "active": active_quests, "flags": flags}

func load_data(data: Dictionary) -> void:
    completed_quests = data.get("completed", [])
    active_quests = data.get("active", [])
    flags = data.get("flags", {})
```

---

### Custom Dialog System (no third-party plugin)

Use when game has simple dialog with no complex branching or portraits.

**Scene tree:**
```
CanvasLayer (layer=10)
└── PanelContainer (anchors: bottom, full width, ~25% height)
    ├── VBoxContainer
    │   ├── Label (speaker_name — bold)
    │   └── RichTextLabel (dialog_text — typewriter effect)
    └── Label (continue_hint — "Press E to continue")
```

**Dialog script:**
```gdscript
# scripts/ui/dialog_box.gd
class_name DialogBox
extends CanvasLayer

signal dialog_finished

@onready var speaker_label: Label = $PanelContainer/VBoxContainer/Label
@onready var text_label: RichTextLabel = $PanelContainer/VBoxContainer/RichTextLabel
@onready var hint_label: Label = $PanelContainer/HintLabel

var _lines: Array[Dictionary] = []  # [{speaker, text}]
var _current_line: int = 0
var _is_typing: bool = false

func show_dialog(lines: Array[Dictionary]) -> void:
    _lines = lines
    _current_line = 0
    show()
    get_tree().paused = true
    _show_line()

func _show_line() -> void:
    var line: Dictionary = _lines[_current_line]
    speaker_label.text = line.get("speaker", "")
    text_label.text = ""
    _is_typing = true
    hint_label.visible = false
    for char in line["text"]:
        text_label.text += char
        await get_tree().create_timer(0.03).timeout
    _is_typing = false
    hint_label.visible = true

func _unhandled_input(event: InputEvent) -> void:
    if not visible:
        return
    if event.is_action_pressed("interact"):
        if _is_typing:
            # Skip typewriter — show full line immediately
            text_label.text = _lines[_current_line]["text"]
            _is_typing = false
            hint_label.visible = true
        else:
            _current_line += 1
            if _current_line >= _lines.size():
                hide()
                get_tree().paused = false
                dialog_finished.emit()
            else:
                _show_line()
```

**NPC that triggers dialog:**
```gdscript
# scripts/characters/npc.gd
class_name NPC
extends StaticBody2D

@export var dialog_lines: Array[Dictionary] = [
    {"speaker": "Guard", "text": "Halt! Who goes there?"},
    {"speaker": "Guard", "text": "State your business."},
]

@onready var interact_area: Area2D = $InteractArea

func _ready() -> void:
    interact_area.body_entered.connect(_on_body_entered)
    interact_area.body_exited.connect(_on_body_exited)

var _player_nearby: bool = false

func _on_body_entered(body: Node) -> void:
    if body.is_in_group("player"):
        _player_nearby = true

func _on_body_exited(body: Node) -> void:
    if body.is_in_group("player"):
        _player_nearby = false

func _unhandled_input(event: InputEvent) -> void:
    if _player_nearby and event.is_action_pressed("interact"):
        var dialog_box: DialogBox = get_tree().get_first_node_in_group("dialog_box")
        if dialog_box:
            dialog_box.show_dialog(dialog_lines)
```

---

### Quest Tracker UI

```
CanvasLayer (layer=5)
└── VBoxContainer (top-right corner)
    └── (dynamic children — one Label per active quest objective)
```

```gdscript
# scripts/ui/quest_tracker.gd
class_name QuestTracker
extends CanvasLayer

@onready var container: VBoxContainer = $VBoxContainer

# Quest data — in production, load from resource files
var quest_objectives: Dictionary = {
    "quest_01": ["Find the lost sword", "Return to Elder"],
    "quest_02": ["Defeat 3 goblins"],
}

func _ready() -> void:
    NarrativeManager.quest_started.connect(_refresh)
    NarrativeManager.quest_completed.connect(_refresh)
    _refresh("")

func _refresh(_id: String) -> void:
    for child in container.get_children():
        child.queue_free()
    for quest_id in NarrativeManager.active_quests:
        var objectives: Array = quest_objectives.get(quest_id, [])
        for obj in objectives:
            var label := Label.new()
            label.text = "• " + obj
            container.add_child(label)
```

---

### Cutscene Pattern

For scripted sequences: use AnimationPlayer on a dedicated CutsceneDirector node.

**Scene tree:**
```
CutsceneDirector (Node — in main scene)
├── AnimationPlayer          # Controls all cutscene timelines
├── Camera3D (or Camera2D)   # Cutscene camera — set current during cutscene
└── CanvasLayer              # Dialog overlay during cutscene
    └── DialogBox
```

```gdscript
# scripts/cutscene_director.gd
class_name CutsceneDirector
extends Node

signal cutscene_finished(cutscene_id: String)

@onready var anim_player: AnimationPlayer = $AnimationPlayer
@onready var cutscene_camera: Camera3D = $Camera3D

var _active_game_camera: Camera3D = null

func play(cutscene_id: String, game_camera: Camera3D) -> void:
    _active_game_camera = game_camera
    _active_game_camera.current = false
    cutscene_camera.current = true
    get_tree().paused = false
    anim_player.play(cutscene_id)
    await anim_player.animation_finished
    _finish(cutscene_id)

func skip() -> void:
    if anim_player.is_playing():
        anim_player.stop()
        _finish(anim_player.current_animation)

func _finish(cutscene_id: String) -> void:
    cutscene_camera.current = false
    if _active_game_camera:
        _active_game_camera.current = true
    NarrativeManager.set_flag("cutscene_seen_" + cutscene_id, true)
    cutscene_finished.emit(cutscene_id)

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel") and anim_player.is_playing():
        skip()
```

**Triggering a cutscene from a scene:**
```gdscript
@onready var cutscene_director: CutsceneDirector = $CutsceneDirector
@onready var game_camera: Camera3D = $Camera3D

func _on_trigger_area_body_entered(body: Node) -> void:
    if body.is_in_group("player"):
        if not NarrativeManager.get_flag("cutscene_seen_intro", false):
            cutscene_director.play("cs_intro", game_camera)
```
