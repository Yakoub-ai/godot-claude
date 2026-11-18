---
name: godot-ui
description: Game UI in Godot 4.4+ - HUDs, menus, pause screens, dialogs, inventories; Control layout with containers and anchors, themes, focus/gamepad navigation, responsive scaling, accessibility. Use when building or fixing any user interface.
---

# Game UI

## Structure

```
HUD (CanvasLayer, layer 10)
└── Root (MarginContainer, full rect anchors, theme = res://ui/theme.tres)
    └── VBoxContainer
        ├── TopBar (HBoxContainer): HealthBar, Spacer (size_flags_horizontal = EXPAND), ScoreLabel
        └── ...
PauseMenu (CanvasLayer, layer 20, process_mode = ALWAYS, hidden by default)
```
- UI lives on a `CanvasLayer` so it ignores the game camera.
- **Containers do layout** (VBox/HBox/Grid/Margin/Center/Panel/ScrollContainer, FoldableContainer 4.5+). Avoid hand-placed positions; use anchors presets for the root ("Full Rect") and size flags for children.
- `custom_minimum_size` for fixed-size elements; `size_flags_*` EXPAND/FILL to share space; stretch ratio for proportions.
- UI scripts don't contain game logic: they listen to signals (event bus / player signals) and call methods. Update on change, not every frame.

## Theme

One `Theme` resource (`res://ui/theme.tres`) set on the root Control: default font + size, Button/Panel StyleBoxFlat (corner radius, padding via content margins), colors. Use **theme type variations** (e.g. `HeaderLabel`, `DangerButton`) instead of per-node overrides. Pixel art: pixel font at integer sizes, nearest filtering.

## Scaling

Matches the project stretch settings: `canvas_items` + `expand` for HD (UI scales, more space on wider screens); test 16:9, 16:10, 21:9 and a phone aspect if relevant (`playtest_start` with different `resolution`). Respect safe areas on mobile (`DisplayServer.get_display_safe_area()`).

## Input and focus

- Every menu must work with keyboard/gamepad: call `grab_focus()` on the first button when a menu opens; set `focus_neighbor_*` where automatic order is wrong; visible focus style in the theme.
- `ui_accept`, `ui_cancel` (back/close), `ui_up/down/left/right` actions.
- Menus handle input in `_unhandled_input` / `gui_input`; game input must not fire while a menu is open (pause the tree or check state).
- Mouse: `mouse_filter = IGNORE` on decorative Controls that overlap the game, otherwise they eat clicks.

## Common pieces

- Health/progress: `TextureProgressBar` (art) or `ProgressBar`; tween value changes; show damage with a delayed "ghost" bar.
- Text: `Label` (`autowrap_mode`, `text_overrun_behavior`); `RichTextLabel` with bbcode for dialogue, `visible_ratio` tween for typewriter effect.
- Localization-ready: wrap user-facing strings in `tr()` (or set text keys) from the start if translation is planned; use CSV/PO translations.
- Screen transitions: a full-screen `ColorRect` on a top CanvasLayer, tween `modulate:a`.
- Buttons: connect `pressed`; add hover/press feedback (scale tween, sound).

## Accessibility (4.5+ has screen reader support)

Readable font sizes (≥ 24 px at 1080p for body text), contrast, don't rely on color alone, remappable controls (InputMap at runtime), subtitles, options for screen shake/flash reduction. Set `accessibility_name`/`accessibility_description` on important controls when targeting 4.5+.

## Verifying UI

Playtest screenshots at each target resolution; check overlap, cut-off text, alignment, focus highlight visible. Drive menus with actions (`{"tap": "ui_down"}`, `{"tap": "ui_accept"}`) and clicks (`{"click": [x, y]}`); observe Controls' `visible`/`text` and the `tree` to confirm the right screen is shown.
