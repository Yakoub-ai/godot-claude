# [Project Name] — Project Reference

**Engine:** Godot 4.x (GL Compatibility, GDScript)
**Genre:** [e.g. 2.5D isometric roguelite / 2D platformer / top-down RPG]
**Current milestone:** [e.g. v1.0 — initial prototype]

---

## What It Is

[1-3 sentence description of the game concept, core loop, and what makes it unique.]

---

## Phase Status

| Phase | Status |
|-------|--------|
| 1. [Name] | Not started / In Progress / Complete |

---

## Project Structure

```
scripts/
├── characters/
├── enemies/
├── systems/
└── ui/

scenes/
└── levels/

assets/
├── characters/    # {name}/{animation}/frame_NNN.png
├── enemies/
└── shaders/
```

---

## Architecture

### Movement
- [e.g. 8-directional isometric / side-scrolling with gravity / top-down]
- Input map: [list actions and keys]

### Core Systems
- [List key singleton/autoload scripts and their purpose]
- [List key signals between systems]

### Key Patterns
- [Weapon system behavior]
- [Enemy spawning approach]
- [XP/progression model]

---

## PixelLab Asset Pipeline

[Describe sprite sizes, directory conventions, animation list, direction count.]

```
assets/{category}/{name}/{animation}/frame_NNN.png
```

---

## Display Config

- Viewport: [e.g. 640x360]
- Window: [e.g. 1280x720]
- Stretch mode: viewport
- Texture filter: Nearest
- Renderer: GL Compatibility

---

## Performance Budget

- Target FPS: [60]
- Max nodes per scene: [e.g. 1000]
- Max concurrent enemies: [e.g. 200]
- Max concurrent projectiles: [e.g. 100]
- Draw call budget: [e.g. 100]
- Object pooling: [list pooled types — enemies, bullets, XP gems, etc.]
- Manager pattern: [list managed types — bullets, particles, etc.]

See `references/performance-patterns.md` for optimization code patterns.

---

## Conventions

- **Static typing on everything** — `var speed: float`, `func foo() -> void:`, `Array[Type]`
- `class_name` on all scripts
- `@export` for tunable values
- `@onready` for node refs
- Virtual methods prefixed with `_`
- Groups: [list groups used]
