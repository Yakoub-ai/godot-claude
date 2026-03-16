# PixelLab — Asset Generation Pipeline

Load this file when the user needs game art assets.

---

## Overview

PixelLab generates AI pixel art via MCP. All operations are **async** — tools return job IDs, poll until complete.

## Setup

Requires `PIXELLAB_API_KEY` environment variable. If not set, tell the user:
1. Sign up at pixellab.ai
2. Get API key from dashboard
3. Set env var: `export PIXELLAB_API_KEY=pk_...` (or add to `.mcp.json`)

---

## Tool Reference

| Asset Type | Create Tool | Poll Tool | Key Params |
|------------|-------------|-----------|------------|
| Character | `create_character` | `get_character` | `description`, `width`, `height`, `style` |
| Animation | `animate_character` | `get_character` | `job_id`, `animation_type`, `frame_count` |
| Sidescroller tileset | `create_sidescroller_tileset` | `get_sidescroller_tileset` | `description`, `tile_size` |
| Top-down tileset | `create_topdown_tileset` | `get_topdown_tileset` | `description`, `tile_size` |
| Props/objects | `create_map_object` | `get_map_object` | `description`, `width`, `height` |

---

## Workflow

```
1. CREATE — Call create tool with description
   → Returns job_id

2. POLL — Call get tool every 10-15 seconds
   → Status: "processing" | "complete" | "failed"

3. DOWNLOAD — When complete, save PNGs to project:
   res://assets/characters/{name}/
   res://assets/tilesets/{name}/
   res://assets/props/{name}/

4. INTEGRATE — Load into Godot:
   - Characters → AnimatedSprite2D + SpriteFrames
   - Tilesets → TileSet resource
   - Props → Sprite2D
```

---

## Sprite Size Guide

| Viewport | Character Size | Tile Size |
|----------|---------------|-----------|
| 320×180 | 16×16 or 24×24 | 16×16 |
| 640×360 | 32×32 or 48×48 | 32×32 |
| 1280×720 | 64×64 or 96×96 | 64×64 |

---

## Animation Types

| Type | Frames | Use For |
|------|--------|---------|
| idle | 4-6 | Standing still |
| walk | 6-8 | Movement |
| run | 6-8 | Fast movement |
| attack | 4-6 | Melee/ranged attack |
| death | 4-6 | Death animation |
| jump | 3-4 | Jump arc (platformer) |
| fall | 2-3 | Falling (platformer) |

---

## Integration with godot-engine-mcp

After downloading assets:
```
1. create_scene("Player", "CharacterBody2D")
2. add_node("Player", "AnimatedSprite2D", "AnimatedSprite2D")
3. add_node("Player", "CollisionShape2D", "CollisionShape2D")
4. Import frames into SpriteFrames resource in editor
5. attach_script("Player", "res://scripts/characters/player.gd")
6. play_scene → verify sprites display correctly
```

---

## Art Direction Prompt Templates

When generating assets, include specific art direction in the `description` parameter:

**Characters:**
> "16-bit SNES-era warrior character, 5-color palette (dark blue, light blue, gold, white, black), 32x32 pixel density, front-facing idle pose"

**Tilesets:**
> "Forest tileset with grass, dirt, stone surfaces. Auto-tile compatible edges. Mossy details on stone. Earthy green-brown palette."

**Props:**
> "Medieval tavern interior props: wooden table, barrel, candle, bookshelf. Consistent warm lighting. 16x16 base grid."

**Backgrounds:**
> "3-layer parallax mountain landscape. Layer 1: distant snow peaks (muted blue). Layer 2: pine forest mid-ground. Layer 3: rocky foreground path. Sunset mood."

---

## Asset Categorization

Match asset types to the correct PixelLab tools:

| Category | Create Tool | Follow-up | Notes |
|----------|------------|-----------|-------|
| Characters | `create_character` | `animate_character` | Generate base sprite first, then animations |
| Tilesets | `create_sidescroller_tileset` or `create_topdown_tileset` | — | Match to camera perspective |
| Props | `create_map_object` | — | Use standard tile-aligned dimensions |
| Backgrounds | `create_map_object` | — | Use larger dimensions (320x180, 640x360) |

---

## ASSETS.md Integration

After generating assets, maintain an `ASSETS.md` manifest in the project root for tracking all generated art. Format:

```markdown
# Asset Manifest

## Characters
| Name | Description | Size | Path |
|------|------------|------|------|
| Player Knight | Blue-armored knight, 5-color palette | 32x32 | res://assets/characters/knight/ |
| Slime Enemy | Green bouncing slime | 16x16 | res://assets/characters/slime/ |

## Tilesets
| Name | Description | Size | Path |
|------|------------|------|------|
| Forest Ground | Grass/dirt/stone auto-tile set | 16x16 | res://assets/tilesets/forest/ |

## Props
| Name | Description | Size | Path |
|------|------------|------|------|
| Wooden Chest | Openable treasure chest | 16x16 | res://assets/props/chest/ |

## Backgrounds
| Name | Description | Size | Path |
|------|------------|------|------|
| Mountain Parallax | 3-layer sunset mountains | 320x180 | res://assets/backgrounds/mountain/ |
```

Update this file every time new assets are generated. The agent should read it before generating to avoid duplicates.

---

## Async Polling Best Practices

- **Poll interval:** Every 10-15 seconds. Do NOT poll faster — it wastes API calls and may rate-limit.
- **Parallel generation:** Launch multiple `create_*` calls in parallel, then poll all job IDs in a round-robin loop.
- **Handle failures:** If status returns `"failed"`, retry with adjusted params (simplify description, change dimensions). Log the failure reason.
- **Save immediately:** When a job completes, save the result to `res://` paths right away. Do not batch saves — a crash loses unsaved results.
- **Track job IDs:** Keep a local list of `{job_id, asset_name, tool_type}` to correlate poll results with intended assets.
