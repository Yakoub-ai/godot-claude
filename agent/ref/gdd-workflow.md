# Interactive GDD Workflow

Load this file when user says "start new game", "new project", or asks to create a game from scratch.

**Recommend model: Opus** (this is an architecture task requiring deep reasoning)

---

## Flow

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
| Pixel, side/top | 320×180 | viewport | Nearest |
| Pixel, isometric | 640×360 | viewport | Nearest |
| HD 2D | 1920×1080 | canvas_items | Linear |
| 3D | 1920×1080 | canvas_items | Linear |

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
Compile from entity specs — list all PixelLab tasks needed.

### Stage 8: Performance Budget
Set targets based on scope:
| Scope | Max Nodes | Max Draw Calls | Pooling Needed |
|-------|-----------|---------------|----------------|
| Small (<20 enemies) | 500 | 100 | No |
| Medium (20-100) | 1000 | 200 | Yes |
| Large (100+) | Manager pattern | 100 (MultiMesh) | Yes |

### Stage 9: Phase Plan
Create ordered build phases with acceptance criteria:
```
Phase 1: Core Movement (2-3 days)
- Player scene, movement script, test level
- Acceptance: Player can move and jump in test level

Phase 2: Core Combat (2-3 days)
- Weapon system, enemy AI, damage system
- Acceptance: Player can attack enemies, enemies can attack back
...
```

---

## Output

After all stages, generate:

1. **megamemory knowledge graph** — Record all GDD data as structured concepts:
   - `megamemory:create_concept(name="[Game Name]", kind="project", summary="...")`
   - Child concepts for: `tech_stack`, `entities`, `systems`, `art_plan`, `performance_budget`
   - Link related concepts (e.g., entities → systems that use them)

2. **GSD planning files** — Set up phase tracking:
   - Create `.planning/PROJECT.md` with game overview + phase summary
   - Create `.planning/ROADMAP.md` with numbered phases and acceptance criteria
   - Each phase maps to GDD Stage 9 phases

3. **Project scaffold** — Create folder structure via godot-engine-mcp

4. **Begin Phase 1** — Start implementation via `/gsd:execute-phase` or direct development
