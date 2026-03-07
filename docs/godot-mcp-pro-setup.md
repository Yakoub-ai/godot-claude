# Godot MCP Pro Setup Guide

Godot MCP Pro is a premium proprietary MCP server (162 tools) that connects Claude
directly to the Godot editor via a WebSocket bridge.

```
Claude Code ←─stdio/MCP─→ Node.js Server ←─WebSocket:6505─→ Godot Editor Plugin
```

---

## Prerequisites

- Godot 4.3+ (tested with 4.6)
- Node.js 18+
- The Godot MCP Pro package (proprietary — purchase at godot-mcp.abyo.net)

No API key or authentication required. The server communicates over localhost only.

---

## One-Time: Build the Server

The server is a Node.js TypeScript project. Build it once; it works for all projects.

```bash
cd /path/to/godot-mcp-pro-v1.5.0/server
npm install
npm run build
# Output: server/build/index.js
```

Or use `install.sh` with the `GODOT_MCP_PRO_SOURCE` env var — it will build automatically:

```bash
GODOT_MCP_PRO_SOURCE=/path/to/godot-mcp-pro-v1.5.0 ./install.sh
```

---

## Per-Project: Install the Godot Plugin

Every Godot project that will use MCP Pro needs the editor plugin:

```bash
cp -r /path/to/godot-mcp-pro-v1.5.0/addons/godot_mcp /path/to/your-project/addons/
```

Then enable it in the Godot editor:
**Project → Project Settings → Plugins → Godot MCP Pro → Enable**

You'll see an "MCP Server" tab appear in the bottom panel showing "Waiting for connection..."

---

## Per-Project: Configure .mcp.json

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "godot-mcp-pro": {
      "command": "node",
      "args": ["/absolute/path/to/server/build/index.js"],
      "env": {
        "GODOT_MCP_PORT": "6505"
      }
    }
  }
}
```

Copy from this repo's template and fill in the path:
```bash
cp .mcp.json.example /path/to/your-godot-project/.mcp.json
```

---

## Runtime Requirements

The Godot editor **must be open** with the plugin enabled for any `mcp__godot-mcp-pro__*`
tool to work. Claude connects through the running editor — it's not headless.

---

## Lite Mode

If your MCP client has a tool limit (Windsurf: 100, Cursor: ~40), use Lite mode:

```json
"args": ["/path/to/server/build/index.js", "--lite"]
```

Lite registers 76 core tools instead of 162 (covers project, scene, node, script, editor,
input, runtime, and input_map tools).

---

## Port Configuration

Default port: **6505**. If it's in use, change it:

```json
"env": { "GODOT_MCP_PORT": "6510" }
```

Also update line 3 of `addons/godot_mcp/plugin.gd`:
```gdscript
const PORT := 6510  # match your env var
```

The server auto-scans ports 6505–6509 if 6505 is unavailable.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Plugin doesn't appear | Check `addons/godot_mcp/plugin.cfg` exists inside your project |
| Connection fails | Verify Godot is running with plugin enabled; check MCP Server tab status |
| Tools timeout | Operations have 30s timeout; use `max_depth` param for large scans |
| Port conflict | Set `GODOT_MCP_PORT` to 6506–6509 |

---

## Tool Count: 162 Tools Across 25 Categories

| Category | Count |
|----------|-------|
| Project | 7 |
| Scene | 9 |
| Node | 14 |
| Script | 8 |
| Editor | 9 |
| Input | 7 |
| Runtime | 19 |
| Animation | 6 |
| TileMap | 6 |
| Theme/UI | 6 |
| Profiling | 2 |
| Batch/Refactor | 8 |
| Shader | 6 |
| Export | 3 |
| Resource | 6 |
| Physics | 6 |
| 3D Scene | 6 |
| Particle | 5 |
| Navigation | 6 |
| Audio | 6 |
| AnimationTree | 4 |
| State Machine | 3 |
| Blend Tree | 1 |
| Analysis | 4 |
| Testing/QA | 6 |
| **Total** | **162** |

Full tool reference: https://godot-mcp.abyo.net
