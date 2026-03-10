# Godot Docs MCP Server

MCP server that serves the complete official Godot 4.x documentation for AI assistants.

## How It Works

1. Downloads the Godot docs from GitHub (RST format)
2. Converts to Markdown via pandoc
3. Serves via FastMCP over stdio

## Setup (one-time)

```bash
cd docs-server
pip install -r requirements.txt   # or: uv pip install -e .
sudo apt install pandoc            # or: brew install pandoc
python3 docs_converter/godot_docs_converter.py
tree docs/. > docs/docs_tree.txt
```

## Run

```bash
python3 main.py
```

## Tools

| Tool | Purpose |
|------|---------|
| `get_documentation_tree` | Browse the full doc structure |
| `get_documentation_file(path)` | Get specific doc content (e.g. `classes/class_node2d.md`) |

## Requirements

- Python 3.10+
- pandoc (system package)
- fastmcp >= 2.10.6
- pypandoc >= 1.15
