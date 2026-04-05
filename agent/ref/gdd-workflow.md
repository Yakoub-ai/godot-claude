# Interactive GDD Workflow

Load this file when user says "start new game", "new project", or asks to create a game from scratch.

**Recommend model: Opus** (this is an architecture task requiring deep reasoning)

---

## For New Projects

Ask one stage at a time. Offer defaults. User can say "use defaults" to skip any stage.

### Stage 1: Game Concept
Ask:
1. Game idea (1-3 sentences)
2. Genre (platformer / roguelite / top-down RPG / puzzle / action / tower defense)
3. Art style (pixel art / hand-drawn / 3D / vector)
4. Camera (side-view / top-down / isometric / 3D)
5. Core loop (what does the player do moment-to-moment?)

### Stage 2: Technical Setup
Ask:
1. Target platform (Desktop / Mobile / Web / All)
2. Renderer (GL Compatibility for wide support / Vulkan for effects)

Auto-set from answers:
| Style + Camera | Viewport | Stretch | Filter |
|---------------|----------|---------|--------|
| Pixel, side/top | 320x180 | viewport | Nearest |
| Pixel, isometric | 640x360 | viewport | Nearest |
| HD 2D | 1920x1080 | canvas_items | Linear |
| 3D | 1920x1080 | canvas_items | Linear |

### Stage 3: Entities & Characters
Ask:
1. Playable characters (count, names, abilities)
2. Sprite size (16/32/48/64 — default from viewport)
3. Direction count (1 for side-view, 4 for top-down, 8 for isometric)
4. Animations needed (idle, walk, attack, death — minimum)
5. Enemy types (name, behavior, size)
6. Bosses/NPCs?

### Stage 4: Levels & Scenes
Ask:
1. How many levels/areas?
2. Level structure (linear / hub-world / procedural)
3. Biomes/themes?
4. Scene hierarchy (which scenes contain which)

### Stage 5: Core Systems
Ask:
1. Combat system? (melee / ranged / both / none)
2. Progression? (XP / upgrades / unlocks / none)
3. Spawning? (waves / placed / procedural)
4. UI needs? (HUD, menus, inventory, dialog)
5. Audio needs? (SFX categories, music style)

### Stage 6: Input Map
Auto-generate based on genre:
| Genre | Default Actions |
|-------|----------------|
| Platformer | move_left, move_right, jump, attack, dash |
| Roguelite | move_up/down/left/right, attack, dodge, interact |
| Top-down RPG | move_up/down/left/right, interact, menu, attack |

### Stage 7: Asset Plan
Compile from entity specs. Plan specific PixelLab generations with prompt templates:

For each character:
- `create_character` with art-directed description (palette, density, style era)
- List animations to generate via `animate_character`

For each tileset:
- `create_sidescroller_tileset` or `create_topdown_tileset`
- Include connectivity and surface type details in description

For props and backgrounds:
- `create_map_object` with dimensions matching the viewport scale
- Backgrounds: specify parallax layer count, mood, time of day

### Stage 8: Performance Budget
Set targets based on scope:
| Scope | Max Nodes | Max Draw Calls | Pooling Needed |
|-------|-----------|---------------|----------------|
| Small (<20 enemies) | 500 | 100 | No |
| Medium (20-100) | 1000 | 200 | Yes |
| Large (100+) | Manager pattern | 100 (MultiMesh) | Yes |

### Stage 9: Phase Plan
Create ordered build phases in `.planning/ROADMAP.md`:

```markdown
# ROADMAP

## Phase 1: Core Movement
- Player scene, movement script, test level
- Acceptance: Player can move in test level
- Est: 2-3 sessions

## Phase 2: Core Combat
- Weapon system, enemy AI, damage system
- Acceptance: Player and enemies can deal damage
- Est: 2-3 sessions

## Phase 3: Level Design
- First complete level with tilesets and layout
- Acceptance: Playable level from start to end
- Est: 2-3 sessions

## Phase 4: Game Loop
- Menus, win/lose conditions, progression
- Acceptance: Complete play loop from menu to game over
- Est: 2-3 sessions

## Phase 5: Polish
- Audio, VFX, UI refinement, bug fixes
- Acceptance: Release-ready quality
- Est: 2-3 sessions
```

Customize phases to the specific game. Each phase should be completable in 2-3 focused sessions.

---

## For Existing Projects

When the user has an existing project instead of starting from scratch:

1. Call `neural_status` — check knowledge graph health and existing index
2. If neural-memory has an index: `neural_query("project overview and current state")`
3. Analyze existing project structure via MCP: `get_project_info`, `list_scenes`, `list_scripts`
4. Identify what's already built vs. what's missing
5. Create an incremental plan that builds on existing work
6. Skip stages 1-2 (already decided), focus on missing systems and content
7. Generate ROADMAP.md with remaining phases only

---

## Output — Three Planning Documents

After all stages are complete, generate three files:

### 1. `.planning/PLAN.md`
Complete game design document with all decisions from stages 1-8:
- Concept, genre, art style, camera
- Technical setup and performance budget
- Entity list with abilities and behaviors
- System descriptions (combat, progression, spawning)
- Input map

### 2. `.planning/STRUCTURE.md`
Project folder structure and scene hierarchy:
```
res://
├── scenes/
│   ├── characters/
│   ├── levels/
│   ├── ui/
│   └── systems/
├── scripts/
│   ├── characters/
│   ├── systems/
│   └── ui/
├── assets/
│   ├── characters/
│   ├── tilesets/
│   ├── props/
│   └── audio/
└── resources/
```

### 3. `ASSETS.md`
Asset generation manifest (see `.godot-claude/ref/pixellab.md` for format):
- All characters with PixelLab prompts and target sizes
- All tilesets with style descriptions
- All props and backgrounds
- Tracks generation status: pending / generated / integrated

### 4. `.planning/ROADMAP.md`
Phase plan from Stage 9 with acceptance criteria.

---

## After GDD — Enter Build Pipeline

Once all documents are generated:

1. **Record to neural-memory:**
   - Run `neural_index` to auto-index the new project scaffold
   - Use `neural_add_task` to record each phase from ROADMAP.md

2. **Create project scaffold** via godot-engine-mcp:
   - Set project settings (viewport, stretch, filter)
   - Create folder structure from STRUCTURE.md
   - Set up input map from Stage 6

3. **Begin Phase 1** — start building immediately:
   - Read ROADMAP.md Phase 1 acceptance criteria
   - Generate required assets from ASSETS.md (PixelLab)
   - Implement scenes and scripts
   - Validate and test
   - Run `neural_update` to re-index completed work

---

## Direct Pipeline Entry

If the user already has planning docs (PLAN.md, STRUCTURE.md, ASSETS.md, ROADMAP.md), skip the Q&A stages entirely:

1. Read all planning docs
2. Run `neural_index` if not already indexed (check via `neural_status`)
3. Determine current phase from ROADMAP.md
4. Begin implementation directly

This supports workflows where the GDD was written outside the agent or in a previous session.
