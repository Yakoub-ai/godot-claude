# Interactive GDD Workflow — `/godot-dev:start`

This workflow is triggered when the user runs `/godot-dev:start` or asks to "start a new Godot game project." Claude asks questions stage-by-stage, building a complete Game Design Document, then generates the project structure and begins development.

**Key rules:**
- Ask one stage at a time — don't overwhelm with all questions at once
- Offer sensible defaults based on genre (user can say "use defaults" to skip)
- After all stages, output a complete project reference `.md` file
- Use Godot MCP Pro to scaffold the project structure in the editor

---

## Stage 1: Game Concept

**Ask:**
1. What's your game idea? (1-3 sentence description)
2. Genre? (platformer / roguelite / top-down RPG / puzzle / action / tower defense / other)
3. Art style? (pixel art / hand-drawn / 3D / vector / other)
4. Camera perspective? (side-view / top-down / isometric / 3D third-person / 3D first-person)
5. What's the core loop? (What does the player do moment-to-moment?)

**Defaults by genre:**
| Genre | Art Style | Camera | Core Loop |
|-------|-----------|--------|-----------|
| Platformer | Pixel art | Side-view | Jump, avoid obstacles, reach goal |
| Roguelite | Pixel art | Top-down or isometric | Survive waves, collect upgrades, die and restart |
| Top-down RPG | Pixel art | Top-down | Explore, talk, fight, quest |
| Puzzle | Vector/minimal | Side-view or top-down | Solve environmental puzzles |
| Tower Defense | Pixel art | Top-down | Place towers, defend against waves |

**Output:** `game_concept` section of GDD.

---

## Stage 2: Technical Setup

**Ask:**
1. Target platform? (Desktop / Mobile / Web / All)
2. Renderer preference? (GL Compatibility for wide support / Vulkan for advanced effects)

**Auto-set based on answers:**
| Art Style + Camera | Viewport | Window | Stretch | Filter | Renderer |
|-------------------|----------|--------|---------|--------|----------|
| Pixel art, side-view | 320x180 or 640x360 | 1280x720 | viewport | Nearest | GL Compatibility |
| Pixel art, top-down | 320x180 or 640x360 | 1280x720 | viewport | Nearest | GL Compatibility |
| Pixel art, isometric | 640x360 | 1280x720 | viewport | Nearest | GL Compatibility |
| HD 2D | 1920x1080 | 1920x1080 | canvas_items | Linear | GL Compatibility |
| 3D | 1920x1080 | 1920x1080 | canvas_items | Linear | Vulkan |

**FPS target**: 60 (default for all).

**Output:** `display_config` and `technical` sections.

---

## Stage 3: Entities & Characters

**Ask:**
1. How many playable characters? (1 / 2-4 / 5+)
2. For each character: name, description (for PixelLab), unique ability
3. Sprite size? (16x16 / 32x32 / 48x48 / 64x64) — default based on viewport
4. Direction count? (1 for side-view / 4 for top-down / 8 for isometric)
5. Required animations? (idle, walk/run, attack, death — minimum set)
6. Enemy types? (describe each: name, behavior pattern, sprite size)
7. Any NPCs, bosses, or special entities?

**Defaults by genre:**
| Genre | Characters | Sprite Size | Directions | Animations |
|-------|-----------|-------------|------------|------------|
| Platformer | 1 | 32x32 | 1 (east, flip_h) | idle, run, jump, fall, attack, death |
| Roguelite | 3 | 48x48 | 8 | idle, walk, attack, death |
| Top-down RPG | 1 | 32x32 | 4 | idle, walk, attack, death |

**Output:** `characters`, `enemies` sections + PixelLab asset plan.

---

## Stage 4: Levels & Scenes

**Ask:**
1. Level structure? (linear progression / hub world / procedural / single arena)
2. How many distinct biomes/environments? (1-3 for prototype)
3. Tileset style? (describe ground, walls, platforms)
4. Scene hierarchy: What's the main gameplay scene structure?

**Default scene tree by genre:**
```
# Platformer
Node2D (Level)
├── TileMapLayer (terrain, collision layer 3)
├── CharacterBody2D (Player)
├── Camera2D
├── Node2D (Enemies)
├── Node2D (Collectibles)
├── CanvasLayer (HUD)
└── Node2D (SpawnPoints)

# Roguelite / VS-style
Node2D (Level)
├── TileMapLayer (ground, isometric or top-down)
├── CharacterBody2D (Player)
├── Camera2D
├── Node2D (Enemies)  # Y-sorted
├── Node2D (Projectiles)
├── Node2D (Pickups)
├── CanvasLayer (HUD)
└── Node2D (SpawnPoints)

# Top-down RPG
Node2D (Level)
├── TileMapLayer (ground)
├── TileMapLayer (walls, collision)
├── Node2D (Entities)  # Y-sorted
│   ├── CharacterBody2D (Player)
│   └── Node2D (NPCs)
├── Camera2D
├── CanvasLayer (HUD)
└── CanvasLayer (DialogueUI)
```

**Output:** `levels`, `scene_hierarchy` sections.

---

## Stage 5: Core Systems

**Ask:**
1. Combat type? (auto-fire / manual attack / turn-based / real-time action / none)
2. Weapon system? (single weapon / multiple weapons / upgradeable / none)
3. Progression? (XP + levels / item collection / skill tree / upgrades between runs / none)
4. Spawning model? (wave-based / continuous / pre-placed / procedural)
5. UI needs? (health bar / score / inventory / dialogue / minimap / menus)
6. Audio? (music + SFX / SFX only / none for now)

**Auto-generate systems list:**
- Combat → `combat_system.gd`, collision layers, damage signals
- Weapons → `base_weapon.gd`, weapon factory, weapon types
- Progression → `xp_system.gd` or `upgrade_system.gd`
- Spawning → `wave_manager.gd` or `spawn_system.gd`
- UI → `health_bar.gd`, `score_display.gd`, `pause_menu.gd`
- Audio → audio bus layout, SFX autoload

**Output:** `core_systems` section.

---

## Stage 6: Input Map

**Suggest defaults based on genre, let user customize:**

| Action | Platformer | Top-down / Isometric | RPG |
|--------|-----------|---------------------|-----|
| move_left | A / Left | A / Left | A / Left |
| move_right | D / Right | D / Right | D / Right |
| move_up | — | W / Up | W / Up |
| move_down | — | S / Down | S / Down |
| jump | Space | — | — |
| attack | Left click | — | Left click |
| ability | R / Shift | R / Shift | E |
| interact | — | — | E / Space |
| pause | Escape | Escape | Escape |

**Output:** `input_map` section.

---

## Stage 7: Asset Generation Plan

**Compile from Stage 3 answers.** Generate a PixelLab task list:

```
Characters:
  - {name}: create_character(description, size, directions, body_type)
    Animations: animate_character(idle), animate_character(walk), ...

Enemies:
  - {name}: create_character(description, size, directions)
    Animations: animate_character(idle), animate_character(walk), animate_character(death)

Tilesets:
  - {biome}: create_sidescroller_tileset(description) or create_topdown_tileset(description)

Props:
  - {list}: create_map_object(description, perspective)
```

**Output:** `asset_pipeline` section with complete PixelLab command list.

---

## Stage 8: Performance Budget

**Auto-set based on genre and scale:**

| Genre | Max Nodes | Max Enemies | Draw Calls | Pooling Needed |
|-------|-----------|-------------|------------|----------------|
| Platformer | 500 | 20 | 50 | Projectiles |
| Roguelite (VS-style) | 1000 | 200 | 100 | Enemies, bullets, XP |
| Top-down RPG | 800 | 30 | 80 | None typically |
| Tower Defense | 1000 | 100 | 100 | Enemies, projectiles |

**Ask:** Does this budget look right for your game, or do you need higher limits?

**Output:** `performance_budget` section.

---

## Stage 9: Phase Plan

**Generate ordered build phases based on all answers:**

| Phase | Content | Acceptance Criteria |
|-------|---------|-------------------|
| 1: Foundation | Project setup, input map, base character movement | Character moves correctly, camera follows |
| 2: Core Mechanics | Combat system, first weapon, first enemy | Can damage and kill enemies |
| 3: Level & Spawning | Tileset, first level, spawn system | Enemies spawn and player navigates level |
| 4: Progression | XP/upgrades, level-up flow | Player gains power over time |
| 5: Content | Additional characters, enemies, weapons | Variety in gameplay |
| 6: UI & Audio | HUD, menus, SFX, music | Polished player-facing experience |
| 7: Polish | Particles, screen effects, juice | Game feels responsive |
| 8: Performance | Profiling, optimization pass | Meets performance budget targets |

Customize phases based on which systems the user chose.

**Output:** `phase_plan` section.

---

## Final Output

After all 9 stages, Claude:

1. **Writes** `references/{project-name}.md` — complete project reference following `project-template.md` format, including all GDD sections
2. **Creates project structure** via Godot MCP Pro:
   - `create_scene` for main level
   - Create directory structure (scripts/, scenes/, assets/)
   - `set_project_setting` for display config, input map, physics layers
3. **Begins Phase 1** — starts building the foundation:
   - Create base character scene + script
   - Set up camera
   - Configure input actions
   - Generate first character sprite via PixelLab (if configured)
4. **Applies performance patterns** from `references/performance-patterns.md` throughout:
   - Static typing in all generated scripts
   - Object pooling where budget requires it
   - Manager pattern for bulk entities
   - Profiling checkpoint at end of each phase

---

## Resuming

If the conversation is interrupted mid-workflow:
- Claude reads the partially-written project reference file
- Identifies which stage was last completed
- Continues from the next stage
- The project reference file serves as the persistent state
