# Visual Target

Generate a reference image of what the finished game looks like. Anchors art direction for scaffold, asset planner, and task agents. Uses **PixelLab MCP** exclusively.

## Workflow

1. Craft a prompt describing the game as a pixel art screenshot
2. Use PixelLab `create_map_object` to generate a reference scene image
3. Poll `get_map_object` every 10-15 seconds until complete
4. Save result as `reference.png`
5. Write art direction to `ASSETS.md`

## PixelLab Reference Generation

Use `create_map_object` with a wide description to generate the reference:

```
create_map_object(
  description: "Screenshot of a {genre} pixel art video game. {Key gameplay moment}. {Environment details}. {Art style}. In-game camera perspective, HUD visible.",
  width: 320,
  height: 180,
  style: "pixel_art"
)
```

Adjust width/height based on the game's viewport:
- 320x180 for small pixel art games
- 640x360 for medium pixel art
- 160x144 for Game Boy style

## Prompt

Must look like an in-game screenshot, not concept art:

```
Screenshot of a {genre} pixel art video game. {Key gameplay moment — peak action, not a menu}. {Environment details}. {Art style — be specific: palette size, pixel density, retro era reference}. In-game camera perspective, HUD visible.
```

Camera perspective should match the genre:
- Platformer → side-view
- RPG/roguelike → top-down
- Strategy → isometric

This image becomes the visual QA target — every stylistic choice you bake in here becomes a requirement downstream agents must deliver. Don't invent complexity the user didn't ask for; pick a style that serves the game, not one that looks impressive as concept art.

## Output

`reference.png` — pixel art reference image.

Write the art direction into `ASSETS.md` — the asset planner uses it as context when crafting individual asset prompts (not as a literal prefix):

```markdown
# Assets

**Art direction:** <the art style description — palette, pixel density, retro era, mood>
```
