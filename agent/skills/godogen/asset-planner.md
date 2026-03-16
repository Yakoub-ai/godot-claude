# Asset Planner

Analyze a pixel art game, decide what assets it needs, and plan their generation via PixelLab MCP.

## Input

The caller provides:
- Game description from `PLAN.md` under **Game Description**
- For iterations: a specific task description (e.g., "add enemy sprites" or "create tileset for cave level")

## Setup

Read `${CLAUDE_SKILL_DIR}/asset-gen.md` for PixelLab MCP tool reference and workflow.

## Workflow

### 1. Analyze inputs → identify visual elements

Read `reference.png` — understand the visual composition: what sprites are visible, their proportions, the environment, foreground vs background layers.

Read `STRUCTURE.md` (especially **Asset Hints**) and `PLAN.md` (especially **Assets needed** per task). Cross-reference both with the reference image to build the complete asset list:
- **Characters**: player, enemies, NPCs — use `create_character` + `animate_character`
- **Tilesets**: ground, walls, platforms — use `create_sidescroller_tileset` or `create_topdown_tileset`
- **Props/objects**: items, decorations, obstacles — use `create_map_object`
- **Backgrounds**: parallax layers, title screens — use `create_map_object` with larger dimensions

### 2. Prioritize by visual impact

Generate the most visually important assets first:
1. Player character (with all needed animations)
2. Core tileset (ground/platforms)
3. Enemy sprites
4. Props and decorations
5. UI elements
6. Background/parallax layers

### 3. Understand art direction

Read the **Art direction** from `ASSETS.md` (written by visual-target). Use it as context when writing descriptions for PixelLab:
- Include palette references (e.g., "NES palette", "limited 16-color")
- Include pixel density (e.g., "16x16 character", "32x32 detailed")
- Include style era (e.g., "Game Boy style", "SNES RPG style")

### 4. Plan PixelLab generations

For each asset, determine the right PixelLab tool and parameters:

**Characters:**
```
create_character(
  description: "{character description in art style}",
  width: 32, height: 32,
  style: "pixel_art"
)
→ then animate_character(job_id, animation_type: "walk", frame_count: 6)
→ then animate_character(job_id, animation_type: "idle", frame_count: 4)
```

**Tilesets:**
```
create_sidescroller_tileset(  # or create_topdown_tileset
  description: "{tileset description}",
  tile_size: 16
)
```

**Props/Objects:**
```
create_map_object(
  description: "{object description in art style}",
  width: 32, height: 32,
  style: "pixel_art"
)
```

### 5. Size Guide

| Viewport | Character Size | Tile Size | Prop Size |
|----------|---------------|-----------|-----------|
| 320×180 | 16×16 or 24×24 | 16×16 | 8×8 to 16×16 |
| 640×360 | 32×32 or 48×48 | 32×32 | 16×16 to 32×32 |
| 1280×720 | 64×64 or 96×96 | 64×64 | 32×32 to 64×64 |

### 6. Write ASSETS.md

Every asset entry **must** include pixel dimensions — the coding agent needs exact sizes for SpriteFrames and TileSet configuration.

```markdown
# Assets

**Art direction:** <the art direction string>

## Characters

| Name | Description | Size | Animations | Path |
|------|-------------|------|------------|------|
| player | knight with sword | 32x32 px | idle(4), walk(6), attack(4) | res://assets/characters/player/ |
| slime | green slime enemy | 24x24 px | idle(4), walk(4), death(3) | res://assets/characters/slime/ |

## Tilesets

| Name | Description | Tile Size | Path |
|------|-------------|-----------|------|
| forest | grass, dirt, stone, water | 16x16 px | res://assets/tilesets/forest/ |

## Props

| Name | Description | Size | Path |
|------|-------------|------|------|
| coin | spinning gold coin | 16x16 px | res://assets/props/coin/ |
| chest | wooden treasure chest | 32x24 px | res://assets/props/chest/ |

## Backgrounds

| Name | Description | Size | Path |
|------|-------------|------|------|
| forest_bg | parallax forest layers | 320x180 px | res://assets/backgrounds/forest/ |
```

### 7. Update PLAN.md with asset assignments

After planning assets, read PLAN.md and add concrete asset assignments to each task that needs them:

```markdown
- **Assets:**
  - `player` character sprite (`res://assets/characters/player/`) — 32x32 px, AnimatedSprite2D
  - `forest` tileset (`res://assets/tilesets/forest/`) — 16x16 px tiles
```

### Common Mistakes

- **Generating oversized sprites** — a 64x64 character in a 320x180 viewport takes up 1/3 of the screen width. Match sizes to viewport.
- **Missing animations** — every character needs at least idle. Movement characters need walk. Combat characters need attack.
- **Wrong tileset type** — use `create_sidescroller_tileset` for platformers, `create_topdown_tileset` for top-down games.
- **Forgetting prop sizes** — items, coins, hearts etc. should be smaller than characters, not the same size.
