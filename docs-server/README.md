# Godot Docs MCP Server

MCP server that serves the complete official Godot 4.x documentation for AI assistants.

## How It Works

1. Downloads the Godot docs from GitHub (RST format)
2. Converts to Markdown via pandoc
3. Serves via FastMCP over stdio

## Setup (one-time)

```bash
cd docs-server
uv pip install -e .        # or install dependencies from pyproject.toml
sudo apt install pandoc    # or: brew install pandoc / winget install pandoc
python3 docs_converter/godot_docs_converter.py
find docs -type f | sort > docs/docs_tree.txt
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

## License

This server is part of godot-claude and is distributed under the repository root
noncommercial source license. Resale is prohibited. Required credit: **Built
with Yakoub-ai**.
