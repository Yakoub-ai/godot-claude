---
name: godot-assets
description: Art and audio pipeline for Godot 4.4+ - sourcing (free/CC0 libraries, commissioning, AI generation via optional MCP servers), import settings for sprites, pixel art, sprite sheets, 3D models, textures, fonts and audio, organization and licensing. Use when adding, generating, importing or organizing game assets.
---

# Assets pipeline

## Decide the art strategy with the user (during design)
- What can they make or afford? Options: placeholder shapes (always first), free libraries, asset packs, commissioned art, AI-generated art, procedural.
- Lock the specs early: pixel art base resolution and tile size (e.g. 16×16 or 32×32), palette, character size in pixels; or for 3D: poly budget, texture resolution, style (PBR vs stylized/unlit).
- **Consistency beats fidelity**: one coherent style from one source/pack reads better than mixed high-quality assets.

## Sources (check every license; record it)
- 2D/3D/audio, CC0: Kenney, Quaternius, Poly Haven, ambientCG, OpenGameArt (license varies per asset), Freesound (license varies; attribution often required).
- Keep `assets/CREDITS.md` with asset, author, source URL, license. Never use assets without a clear license, and don't scrape copyrighted game art.
- AI generation: if the user has configured an image/sprite/3D generation MCP server (e.g. PixelLab for pixel art), use it for concepts and sprites, then post-process for consistency (palette, size, transparency). This plugin doesn't bundle generators or API keys; keys belong in the user's environment, never in the repo. Check the generator's terms for commercial use.

## Layout
```
assets/
  characters/<name>/   sprites, sheets, models
  environment/         tilesets, props
  ui/                  icons, panels, fonts
  audio/music, audio/sfx
  CREDITS.md
```
Lowercase snake_case file names (case-sensitive exports!). Don't rename/move assets outside the editor without moving their `.import`/`.uid` files.

## Import settings (Import dock; per-file `.import` files are committed)
- **Pixel art textures**: filter Nearest (project default or per-texture via CanvasItem `texture_filter`), mipmaps off, compression Lossless.
- **HD 2D**: Lossless/Lossy, mipmaps on if scaled down a lot.
- **3D textures**: VRAM Compressed (with mipmaps); normal maps detected/flagged as normal maps; set the right color space (albedo sRGB, data maps linear).
- **Sprite sheets**: `AnimatedSprite2D` → SpriteFrames → "Add frames from sprite sheet" (grid). Or `Sprite2D` with `hframes/vframes` + `frame` animated by AnimationPlayer. `AtlasTexture` for regions.
- **3D models**: see the `godot-3d` skill (glTF, name suffixes, inherited scenes).
- **Audio**: SFX as `.wav` (short, low latency), music as `.ogg` with Loop enabled in import; normalize loudness across files.
- **Fonts**: `.ttf/.otf`; pixel fonts with antialiasing off, hinting none, at integer sizes; MSDF for fonts that scale a lot.

After adding files, run `check` (it imports first) so the `.import` files exist and references resolve; then reference assets with `{"$res": "res://assets/..."}` in `scene_edit`.

## Placeholders that age well
Name placeholders like the final assets and keep them the same size/pivot, so swapping art is a file replacement, not a refactor. Colored shapes with clear meaning (player bright, danger red, pickup yellow) are better placeholders than random free art.
