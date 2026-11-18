# Developing godot-claude

This repo is a Claude Code plugin (not a Godot project). Components:

- `server/src/*.ts` → MCP server, bundled to `server/dist/godot-mcp.mjs` (committed; plugins have no install step). Always `npm run build` after changing `server/src` and commit the bundle.
- `godot/` → GDScript the server runs with `godot --headless --path <project> --script <file>`. Must work on Godot 4.4+ (no 4.5+ APIs without `has_method` guards) and keep the `@warning_ignore_start(...)` line so user projects with strict warnings still compile it.
- `skills/`, `agents/`, `hooks/` → plugin content. Skill text must be accurate for 4.4–4.7; verify APIs with the `api_docs` tool or Godot's class reference.

Rules:
- Security first: nothing may be written into user projects except what a tool explicitly edits; no code evaluation from tool input; res:// paths validated server-side; playtest connections authenticated.
- Test on every supported version before merging: `GODOT_BIN=<4.4|4.5|4.7 binary> npm test` in `server/`, plus `tests/check_strict.sh`.
- Keep tools few and high-level; prefer improving an existing tool over adding a new one.
