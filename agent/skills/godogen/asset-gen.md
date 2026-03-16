# Asset Generator — PixelLab MCP

Generate pixel art assets via PixelLab MCP tools. All asset generation uses PixelLab exclusively — no other image generation service.

## PixelLab MCP Tool Reference

### Characters

**Create character:**
```
create_character(
  description: "a knight in silver armor with a blue cape, pixel art style",
  width: 32,
  height: 32,
  style: "pixel_art"
)
→ Returns job_id
→ Poll: get_character(job_id) every 10-15s until status: "complete"
```

**Animate character:**
```
animate_character(
  job_id: "<character_job_id>",
  animation_type: "walk",    # idle, walk, run, attack, death, jump, fall
  frame_count: 6
)
→ Returns animation job_id
→ Poll: get_character(animation_job_id) every 10-15s
```

### Tilesets

**Sidescroller tileset** (for platformers):
```
create_sidescroller_tileset(
  description: "forest ground with grass top, dirt middle, stone bottom, pixel art",
  tile_size: 16
)
→ Returns job_id
→ Poll: get_sidescroller_tileset(job_id) every 10-15s
```

**Top-down tileset** (for RPGs, roguelikes):
```
create_topdown_tileset(
  description: "dungeon floor tiles with stone, water, lava, cracks, pixel art",
  tile_size: 16
)
→ Returns job_id
→ Poll: get_topdown_tileset(job_id) every 10-15s
```

### Props and Objects

**Create map object:**
```
create_map_object(
  description: "a wooden treasure chest, pixel art style, slightly open with gold gleaming",
  width: 32,
  height: 24,
  style: "pixel_art"
)
→ Returns job_id
→ Poll: get_map_object(job_id) every 10-15s
```

## Async Polling Pattern

All PixelLab operations are async. Follow this pattern:

```
1. CALL create_* tool → get job_id
2. WAIT 10-15 seconds
3. CALL get_* tool with job_id
   - If status: "processing" → go to step 2
   - If status: "complete" → download/save result
   - If status: "failed" → retry creation with adjusted params
4. SAVE PNGs to project:
   res://assets/characters/{name}/
   res://assets/tilesets/{name}/
   res://assets/props/{name}/
   res://assets/backgrounds/{name}/
```

## Integration with Godot

After downloading assets from PixelLab:

**Characters → AnimatedSprite2D + SpriteFrames:**
- Import sprite sheet PNG
- Create SpriteFrames resource with animations (idle, walk, etc.)
- Configure frame count, FPS, loop settings
- Attach to AnimatedSprite2D node

**Tilesets → TileSet resource:**
- Import tileset PNG
- Create TileSet with tile_size matching generation
- Configure collision shapes, terrain connections
- Apply to TileMapLayer

**Props → Sprite2D:**
- Import PNG directly
- Use as Sprite2D texture
- Add CollisionShape2D if interactive

**Backgrounds → TextureRect or Sprite2D:**
- Import PNG
- For parallax: use ParallaxBackground + ParallaxLayer
- For static: TextureRect in CanvasLayer behind game

## Sprite Size Guide

| Viewport | Character | Tiles | Props | Background |
|----------|-----------|-------|-------|------------|
| 320×180 | 16-24 px | 16 px | 8-16 px | 320×180 px |
| 640×360 | 32-48 px | 32 px | 16-32 px | 640×360 px |
| 1280×720 | 64-96 px | 64 px | 32-64 px | 1280×720 px |

## Animation Types

| Type | Typical Frames | Use For |
|------|---------------|---------|
| idle | 4-6 | Standing still, breathing |
| walk | 6-8 | Movement |
| run | 6-8 | Fast movement |
| attack | 4-6 | Melee/ranged attack |
| death | 4-6 | Death animation |
| jump | 3-4 | Jump arc (platformer) |
| fall | 2-3 | Falling (platformer) |

## Background Removal

If PixelLab outputs assets with backgrounds that need transparency, use the bundled background removal tool:

```bash
python3 .godot-claude/tools/rembg_matting.py input.png -o output.png
```

Dependencies: `pip install -r .godot-claude/tools/requirements.txt`

## Sprite Sheet Processing

For manually created sprite sheets that need processing:

```bash
# Keep background, crop grid lines
python3 .godot-claude/tools/spritesheet_slice.py keep-bg input.png -o output.png

# Remove background from each frame
python3 .godot-claude/tools/spritesheet_slice.py clean-bg input.png -o output.png

# Split into individual PNGs
python3 .godot-claude/tools/spritesheet_slice.py split-clean input.png -o output_dir/ \
  --names "frame1,frame2,frame3,..."
```

## Tips

- Generate characters before their animations (need the character job_id first)
- Generate multiple assets in parallel — launch several create_* calls, then poll all of them
- Always verify generated assets by reading the PNGs before integrating into scenes
- PixelLab handles transparency natively for most character/prop generations
- Match sprite sizes to viewport — a 64px character in a 320px viewport is enormous
