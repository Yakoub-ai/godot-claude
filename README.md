# godot-claude

A Claude Code plugin for building 2D and 3D games in **Godot 4.4+**: design → build → test → playtest → ship.

- **MCP tools** that run Godot headlessly, so they work with or without the editor open, locally or in CI: project overview, whole-project check, scene read/edit through Godot's own serializer, version-exact API docs (offline), a zero-install test runner, and deterministic playtests that drive input and return screenshots Claude can see.
- **Skills** for the whole workflow: `game-design`, `godot-dev`, `godot-testing`, `godot-2d`, `godot-3d`, `godot-ui`, `game-feel`, `godot-assets`, `godot-release`.
- **Agents**: `godot-architect` (plans systems), `godot-reviewer` (code review), `playtester` (adversarial QA with evidence).
- **Hooks**: every `.gd`/`.tscn` Claude writes is compiled/loaded by Godot right away, and errors go straight back to Claude.

## Requirements

- Claude Code, Node.js 20+
- Godot 4.4 or newer (tested on 4.4.1, 4.5.2, 4.6.3, 4.7.2), either on `PATH` as `godot` or set via `GODOT_BIN=/path/to/Godot`. Use the same version as your editor.
- Linux servers/CI only: `xvfb` for screenshots (desktops just open a game window).

## Install

```
/plugin marketplace add Yakoub-ai/godot-claude
/plugin install godot-claude@godot-claude
```

Then run `claude` inside your Godot project folder. Nothing is copied into your project.

## Use

Just describe what you want. Some starting points:

| Say | What happens |
|---|---|
| "I have an idea for a game…" | `game-design`: pillars, core loop, scope, `design/GDD.md` + `design/ROADMAP.md` |
| "Plan the combat system" | `godot-architect` agent: scenes, scripts, signals, data, step-by-step plan |
| "Add a double jump" | `godot-dev` loop: plan → code/scene edits → check → tests → playtest |
| "Playtest the first level" | `playtester` agent drives the game and reports bugs with screenshots |
| "It feels floaty" | `game-feel`: tuning + juice, verified frame by frame |
| "Prepare a web build" | `godot-release` |

Skills can also be invoked directly, e.g. `/godot-claude:game-design`.

## MCP tools

| Tool | Purpose |
|---|---|
| `project_info` | Engine version, main scene, autoloads, input map, layers, files |
| `check` | Import + compile all scripts + load all scenes → errors with `file:line` |
| `scene_read` | Node tree, properties, connections of a `.tscn` (no game code runs) |
| `scene_edit` | Atomic, validated scene edits/creation saved by Godot itself |
| `api_docs` | Class reference for the installed Godot version, offline |
| `run_tests` | Built-in runner for `res://test/test_*.gd` (no add-on needed) |
| `playtest_start` / `playtest_step` / `playtest_stop` | Run the game, inject input on exact frames, observe state, get screenshots and runtime errors |

Playtests default to *stepped* mode: the game is frozen between steps, so `frames: 60` is exactly one second of game time and runs are reproducible.

## Security model

- Nothing is installed into your project, and nothing is added to `project.godot`, so no debug bridge can ship in an exported game.
- The playtest harness runs only in debug builds. It connects to a random localhost port opened by the server and must present a one-time 256-bit token, which is passed only to that game process. The server accepts exactly one authenticated connection.
- No remote code evaluation: input values are decoded by a strict allowlist (no `Object(...)` literals, `res://` paths only, with path traversal rejected).
- The server bundle is built from `server/src`, and CI fails if the committed bundle is stale. Dependencies are pinned.

## Development

```bash
cd server && npm ci && npm run build   # typecheck + bundle to server/dist
npm test                               # end-to-end tests against real Godot (GODOT_BIN)
../tests/check_strict.sh               # GDScript tools compile under all-warnings-as-errors
```

Layout: `server/` (TypeScript MCP server), `godot/` (GDScript run by the server: tools, playtest harness, test runner), `skills/`, `agents/`, `hooks/`, `tests/fixtures/` (sample projects).

## License

MIT. See [LICENSE](LICENSE).
