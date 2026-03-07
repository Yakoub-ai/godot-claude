# PixelLab MCP Workflows

PixelLab is an AI pixel art generator available as an MCP server. All generation is **async** — tools return job IDs, poll with `get_*` tools until status is `complete`.

## MCP Setup

PixelLab uses HTTP transport with Bearer token auth:

```json
{
  "mcpServers": {
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp/v1",
      "headers": {
        "Authorization": "Bearer ${PIXELLAB_API_KEY}"
      }
    }
  }
}
```

Get API key from [pixellab.ai](https://www.pixellab.ai). Set `PIXELLAB_API_KEY` in environment.

## Core Workflow: Character Creation

### Step 1: Create Character
```
Tool: create_character
Params:
  description: "A nimble archer with green cloak and leather armor"
  directions: 4          (4 for side-scrollers, 8 for top-down)
  body_type: "humanoid"  (or "quadruped")
  size: 48               (match existing sprites: 32, 48, 64)
  outline: true          (match game art style)
```

Returns: `character_id`

### Step 2: Poll for Completion
```
Tool: get_character
Params:
  character_id: <id from step 1>
```

Poll every 10-15 seconds. Status transitions: `pending` → `processing` → `complete`.
On complete: response includes directional PNGs and download URLs.

### Step 3: Animate Character
```
Tool: animate_character
Params:
  character_id: <id>
  action: "walking"    (walking, running, attacking, dying, idle)
```

Animations take 2-5 minutes. Poll with `get_character`.

Template animation IDs provide consistent results — use them when available.

### Step 4: Download & Organize
Save frames following the convention:
```
assets/characters/{name}/{animation}/frame_001.png
assets/characters/{name}/{animation}/frame_002.png
...
assets/characters/{name}/east.png     (reference image)
assets/characters/{name}/north.png    (reference image)
```

East-facing only — use `flip_h` in engine for west-facing.

## Tileset Creation

### Sidescroller Tilesets
```
Tool: create_sidescroller_tileset
Params:
  description: "Mossy stone platforms in a forest setting"
  base_tile_id: <optional, chain for seamless transitions>
```

Generates 16-tile Wang tilesets for autotiling. Retrieve with `get_sidescroller_tileset` — set `include_example_map: true` for preview.

### Topdown Tilesets
```
Tool: create_topdown_tileset
Params:
  description: "Grass and dirt path tiles"
```

Same Wang tile approach but for top-down perspective.

## Map Objects (Props)

```
Tool: create_map_object
Params:
  description: "Wooden treasure chest with iron bands"
  perspective: "side"    (side for platformers, top for top-down)
```

Transparent background, ready for scene placement.

## Integration with Godot

### SpriteFrameLoader Pattern
Load frame PNGs at runtime into `SpriteFrames`:

```gdscript
static func load_character_frames(base_path: String, animations: Dictionary) -> SpriteFrames:
    var frames := SpriteFrames.new()
    for anim_name: String in animations:
        var folder: String = animations[anim_name]["folder"]
        var fps: float = animations[anim_name].get("fps", 10.0)
        var loop: bool = animations[anim_name].get("loop", true)
        frames.add_animation(anim_name)
        frames.set_animation_speed(anim_name, fps)
        frames.set_animation_loop(anim_name, loop)
        var dir := DirAccess.open(base_path.path_join(folder))
        if dir:
            dir.list_dir_begin()
            var files: Array[String] = []
            var file := dir.get_next()
            while file != "":
                if file.ends_with(".png"):
                    files.append(file)
                file = dir.get_next()
            files.sort()
            for f in files:
                var tex := load(base_path.path_join(folder).path_join(f))
                frames.add_frame(anim_name, tex)
    return frames
```

### Folder Conventions
```
assets/
├── characters/{name}/{animation}/frame_NNN.png
├── enemies/{name}/{animation}/frame_NNN.png
├── bosses/{name}/{animation}/frame_NNN.png
├── tilesets/{biome}/{tileset_name}/tile_NNN.png
├── props/{category}/{item}.png
├── projectiles/{name}/frame_NNN.png
└── ui/{element}.png
```

## Cross-MCP Chaining: PixelLab → Godot MCP Pro

After generating assets with PixelLab:
1. Download PNGs to project `assets/` directory
2. Use Godot MCP Pro to compose scenes:
   - `create_scene` — create character/enemy scene
   - `add_node` — add AnimatedSprite2D, CollisionShape2D
   - `attach_script` — attach behavior script
   - `update_property` — set sprite frames, collision shapes
3. Use Godot MCP Pro to test:
   - `play_scene` — run the scene
   - `get_game_screenshot` — verify visual result
