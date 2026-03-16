# Godot Capture

Screenshot and video capture for Godot projects. Prefer **godot-engine-mcp** tools; fall back to headless capture.

The Godot project is the working directory. All paths below are relative to it.

## MCP Capture (Preferred)

Use godot-engine-mcp tools when the Godot editor is running:

```
1. play_scene("res://scenes/main.tscn")      # or specific scene
2. # Wait for scene to load and render
3. get_game_screenshot()                       # Capture current view
4. # Repeat get_game_screenshot() for multiple frames if needed
```

This is the simplest and most reliable capture method. It uses the actual editor renderer with full lighting, shadows, and effects.

## Headless Capture (Fallback)

For CI environments or when the editor is not running:

### GPU Detection (Linux only)

Run once per session:
```bash
GPU_DISPLAY=""
for lock in /tmp/.X*-lock; do
  d=":${lock##/tmp/.X}"; d="${d%-lock}"
  if DISPLAY=$d timeout 2 glxinfo 2>/dev/null | grep -qi nvidia; then
    GPU_DISPLAY=$d; break
  fi
done
```

### Screenshot Capture

Screenshots go in `screenshots/` (gitignored). Each task gets a subfolder.

```bash
MOVIE=screenshots/{task_folder}
rm -rf $MOVIE && mkdir -p $MOVIE
touch screenshots/.gdignore
if [ -n "$GPU_DISPLAY" ]; then
  timeout 30 DISPLAY=$GPU_DISPLAY godot --rendering-method forward_plus \
      --write-movie $MOVIE/frame.png \
      --fixed-fps 10 --quit-after {N} \
      --script test/test_task.gd 2>&1
else
  timeout 30 xvfb-run -a -s '-screen 0 1280x720x24' godot --rendering-driver vulkan \
      --write-movie $MOVIE/frame.png \
      --fixed-fps 10 --quit-after {N} \
      --script test/test_task.gd 2>&1
fi
```

### macOS Capture

macOS doesn't have xvfb. Use either:
1. **MCP capture** (preferred) — requires Godot editor running
2. **Direct headless** — may work with Metal renderer:
```bash
timeout 30 godot --write-movie screenshots/{task}/frame.png \
    --fixed-fps 10 --quit-after {N} \
    --script test/test_task.gd 2>&1
```

### Frame Rate and Duration

`--quit-after {N}` is the frame count. Choose based on scene type:
- **Static scenes** (decoration, terrain, UI): `--fixed-fps 1`. Adjust `--quit-after` for views needed.
- **Dynamic scenes** (physics, movement, gameplay): `--fixed-fps 10`. Low FPS breaks physics — `delta` becomes too large. Typical: 3-10s (30-100 frames).

**Timeout:** `timeout 30` is a safety net — `--quit-after` handles exit normally. Exit code 124 means timeout fired.
