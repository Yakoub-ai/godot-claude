---
name: godot-release
description: Ship Godot 4.4+ games - export presets and templates, headless/CI exports, platform notes (Windows, macOS, Linux, Web, Android, iOS), performance budgets, versioning, pre-release checklist, and itch.io/Steam publishing basics. Use when preparing a build, setting up CI, exporting, or releasing.
---

# Export and release

## Export basics
- Export templates must match the editor version exactly (Editor → Manage Export Templates). Headless/CI: install templates into the Godot data dir (`~/.local/share/godot/export_templates/<version>/` on Linux).
- Presets live in `export_presets.cfg` (commit it; it must not contain secrets — keystore passwords etc. go in environment variables or `.godot/export_credentials.cfg`, which is not committed).
- Headless export:
  ```bash
  godot --headless --path . --export-release "Windows Desktop" build/windows/game.exe
  ```
  `--export-debug` for debug builds; `--export-pack` for a .pck only.
- Exclude dev-only files from exports with the preset's exclude filters (`test/*`, `design/*`, `*.md`).

## Platform notes
- **Web**: Compatibility renderer works most broadly; single-threaded export avoids SharedArrayBuffer/COOP-COEP header requirements (itch.io supports either); test audio start (needs user gesture); keep the download small.
- **Android**: Mobile or Compatibility renderer; Android SDK + JDK + debug/release keystores; test touch input and aspect ratios; Gradle build for plugins.
- **iOS / macOS**: built on macOS with Xcode; code signing and notarization for macOS distribution.
- **Desktop**: provide windowed/fullscreen and resolution/VSync options; remember controller support.

## Pre-release checklist
- [ ] `check` clean, `run_tests` green, full playtest of the main path with no errors.
- [ ] Performance: stable frame rate on the minimum target hardware (ask the user to test); no hitches on scene loads.
- [ ] Settings: volume per bus, fullscreen, keybinding remap (or at least a controls screen), and they persist (`user://settings.cfg` via `ConfigFile`).
- [ ] Save/load works across a restart; old save versions migrate or are handled.
- [ ] Pause works everywhere; no input leaks through menus; focus works with gamepad.
- [ ] Credits and licenses (`assets/CREDITS.md`, Godot's license notice: Godot is MIT — include its copyright/license text in the credits or a licenses screen).
- [ ] Version shown in-game (`application/config/version`), tagged in git.
- [ ] Debug-only code and cheats disabled in release (`OS.is_debug_build()`).
- [ ] Exported build tested outside the editor on each platform.

## CI (GitHub Actions sketch)
Run `check` and tests on every push (download Godot headless, then the same commands the MCP tools use); export on tags and upload artifacts. Pin the Godot version; cache export templates.

## Publishing
- **itch.io**: upload zips or use `butler push build/web user/game:web`. Fast iteration, good for playtests and jams.
- **Steam**: Steamworks partner account, app fee, store page weeks in advance, GodotSteam add-on for achievements/overlay.
- Gather feedback from real players early (itch.io playtest builds), not only at launch.
