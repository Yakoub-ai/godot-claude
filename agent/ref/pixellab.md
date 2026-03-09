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

## Integration with Godot MCP Pro

After downloading assets:
```
1. create_scene("Player", "CharacterBody2D")
2. add_node("Player", "AnimatedSprite2D", "AnimatedSprite2D")
3. add_node("Player", "CollisionShape2D", "CollisionShape2D")
4. Import frames into SpriteFrames resource in editor
5. attach_script("Player", "res://scripts/characters/player.gd")
6. play_scene → verify sprites display correctly
```
