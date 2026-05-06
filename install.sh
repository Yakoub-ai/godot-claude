#!/usr/bin/env bash
# godot-claude installer for Linux/macOS
# Installs Claude Code agent files into a Godot project root.
#
# Usage:
#   ./install.sh                           # Interactive — prompts for path
#   ./install.sh /path/to/godot-project    # Direct install
#   ./install.sh --skip-mcp /path/to/proj  # Skip .mcp.json creation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

step()  { echo -e "  ${GREEN}▸${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()   { echo -e "  ${RED}✗${NC} $1"; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }

# Run a command with a timeout (seconds).
# On macOS, `timeout` may not exist, so fall back to perl.
run_with_timeout() {
    local timeout_secs="$1"; shift
    if command -v timeout &>/dev/null; then
        timeout "$timeout_secs" "$@"
    elif command -v gtimeout &>/dev/null; then
        gtimeout "$timeout_secs" "$@"
    else
        perl -e 'alarm shift; exec @ARGV' "$timeout_secs" "$@"
    fi
}

# Header
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   godot-claude — Claude Code Agent       ║${NC}"
echo -e "${BOLD}${CYAN}║   for Godot 4.x Game Development         ║${NC}"
echo -e "${BOLD}${CYAN}║                                          ║${NC}"
echo -e "${BOLD}${CYAN}║   Compatible with: Claude Code (CLI)     ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Parse args
SKIP_MCP=false
PROJECT_PATH=""
for arg in "$@"; do
    case $arg in
        --skip-mcp) SKIP_MCP=true ;;
        *)          PROJECT_PATH="$arg" ;;
    esac
done

# Detect WSL (Windows Subsystem for Linux)
is_wsl() {
    uname -r 2>/dev/null | grep -qiE 'microsoft|wsl'
}

# Open a native folder picker dialog, returns selected path via stdout
open_folder_dialog() {
    local title="Select Godot Project or Parent Directory"
    local selected=""

    if is_wsl; then
        # WSL: invoke PowerShell to show the Windows FolderBrowserDialog natively
        local ps_cmd="Add-Type -AssemblyName System.Windows.Forms; \$d=New-Object System.Windows.Forms.FolderBrowserDialog; \$d.Description='\$title'; \$d.ShowNewFolderButton=\$false; if(\$d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){ Write-Output \$d.SelectedPath }"
        local win_path
        win_path=$(powershell.exe -NoProfile -Command "$ps_cmd" 2>/dev/null | tr -d '\r') || true
        
        if [ -n "$win_path" ]; then
            selected=$(wslpath -u "$win_path" 2>/dev/null || echo "$win_path")
        fi

    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS — use AppleScript to launch a native Folder Picker dialog
        selected=$(osascript -e "tell application \"Finder\" to activate" -e "set myFolder to choose folder with prompt \"$title\"" -e "POSIX path of myFolder" 2>/dev/null) || true

    elif command -v zenity &>/dev/null; then
        # Linux — GNOME / GTK
        selected=$(zenity --file-selection --directory --title="$title" 2>/dev/null) || true

    elif command -v kdialog &>/dev/null; then
        # Linux — KDE
        selected=$(kdialog --getexistingdirectory "$HOME" --title "$title" 2>/dev/null) || true

    elif command -v yad &>/dev/null; then
        # Linux — yad (another GTK dialog)
        selected=$(yad --file --directory --title="$title" 2>/dev/null) || true
    else
        # Linux without a supported dialog tool: open current dir (if GUI) and fall back to manual
        if [ -n "${DISPLAY-}" ] || [ -n "${WAYLAND_DISPLAY-}" ]; then
            warn "No folder-picker tool found (zenity/kdialog/yad). Opening current directory and falling back to manual input."
            xdg-open . 2>/dev/null || true
        fi
    fi

    echo "$selected"
}

# Resolve the chosen directory: direct project or pick from sub-projects
resolve_project_path() {
    local chosen="$1"

    # Direct Godot project
    if [ -f "$chosen/project.godot" ]; then
        PROJECT_PATH="$chosen"
        return 0
    fi

    # Parent directory — find sub-projects
    local -a subs=()
    while IFS= read -r match; do
        subs+=("$(dirname "$match")")
    done < <(find "$chosen" -maxdepth 2 -name "project.godot" 2>/dev/null | sort)

    if [ ${#subs[@]} -eq 0 ]; then
        err "No project.godot found in: $chosen"
        echo "  Select a Godot project folder or a parent containing one."
        exit 1
    fi

    if [ ${#subs[@]} -eq 1 ]; then
        PROJECT_PATH="${subs[0]}"
        return 0
    fi

    # Multiple projects found — let user pick
    echo ""
    echo -e "  ${BOLD}Multiple Godot projects found:${NC}"
    echo ""
    for i in "${!subs[@]}"; do
        echo -e "    ${CYAN}$((i+1))${NC}. ${subs[$i]}"
    done
    echo ""
    read -rp "  Choose [1-${#subs[@]}]: " CHOICE
    echo ""

    if [[ "$CHOICE" =~ ^[0-9]+$ ]] && [ "$CHOICE" -ge 1 ] && [ "$CHOICE" -le "${#subs[@]}" ]; then
        PROJECT_PATH="${subs[$((CHOICE-1))]}"
    else
        err "Invalid choice."
        exit 1
    fi
}

# Get project path
if [ -z "$PROJECT_PATH" ]; then
    step "Opening folder picker…"
    CHOSEN="$(open_folder_dialog)"

    if [ -z "$CHOSEN" ]; then
        # No GUI available or user cancelled — fall back to typed input
        echo ""
        warn "No folder picker available (or cancelled). Enter path manually."
        echo ""
        read -rp "  Project path: " CHOSEN
        echo ""
    fi

    [ -z "$CHOSEN" ] && { err "No directory selected."; exit 1; }
    # Expand ~ before passing to resolve_project_path
    CHOSEN="${CHOSEN/#\~/$HOME}"
    resolve_project_path "$CHOSEN"
fi

# Expand ~ and resolve
PROJECT_PATH="${PROJECT_PATH/#\~/$HOME}"
PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd)" || {
    err "Path does not exist: $PROJECT_PATH"
    exit 1
}

# Validate
if [ ! -f "$PROJECT_PATH/project.godot" ]; then
    err "No project.godot found in: $PROJECT_PATH"
    echo "  Make sure you point to the root of a Godot 4.x project."
    exit 1
fi
ok "Godot project found: $PROJECT_PATH"

# Check Node.js
step "Checking Node.js…"
if ! command -v node &>/dev/null; then
    err "Node.js is not installed."
    echo "  The godot-engine-mcp server requires Node.js 18+."
    echo -e "  Install: ${CYAN}https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ] 2>/dev/null; then
    err "Node.js version is too old: $(node -v) (need 18+)"
    echo -e "  Update: ${CYAN}https://nodejs.org/${NC}"
    exit 1
fi
ok "Node.js $(node -v) found"

# Check Godot CLI
step "Checking Godot…"
GODOT_CMD=""
for cmd in godot godot4; do
    if command -v "$cmd" &>/dev/null; then GODOT_CMD="$cmd"; break; fi
done
if [ -n "$GODOT_CMD" ]; then
    GODOT_VER=$($GODOT_CMD --version 2>&1 | head -1)
    if echo "$GODOT_VER" | grep -q '^4\.'; then
        ok "Godot $GODOT_VER found"
    else
        warn "Godot found but version $GODOT_VER — need 4.x for headless scene generation"
    fi
else
    warn "Godot not found on PATH — headless scene/script generation won't work."
    echo -e "    The godot-task skill needs 'godot' CLI for: godot --headless --script ..."
    echo -e "    Add Godot to PATH or create an alias."
fi

# Check xvfb on Linux (needed for screenshot capture in headless environments)
if [[ "$OSTYPE" == "linux"* ]] && ! command -v xvfb-run &>/dev/null; then
    warn "xvfb-run not found — screenshot capture may fail in headless environments."
    echo -e "    Install: ${CYAN}sudo apt install xvfb${NC}"
fi

# Check Python dependencies
step "Checking Python…"
if command -v python3 &>/dev/null; then
    ok "Python3 $(python3 --version 2>&1 | cut -d' ' -f2) found"

    # Check/install neural-memory-mcp
    if ! python3 -c "import neural_memory" 2>/dev/null; then
        step "Installing neural-memory-mcp (project knowledge graph)…"
        if python3 -m pip install --quiet "neural-memory-mcp[vectors]" 2>&1; then
            ok "neural-memory-mcp installed"
        else
            warn "Failed to install neural-memory-mcp — install manually: pip install 'neural-memory-mcp[vectors]'"
        fi
    else
        ok "neural-memory-mcp already installed"
    fi

    # Check uvx (needed for .mcp.json neural-memory server)
    if ! command -v uvx &>/dev/null; then
        warn "uvx not found — neural-memory MCP server in .mcp.json uses uvx."
        echo -e "    Install uv: ${CYAN}curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
        echo -e "    Or change .mcp.json to use: python3 -m neural_memory"
    fi
else
    warn "python3 not found — asset generation tools and docs server require Python 3.10+"
fi

# Check RTK (optional — token-optimized CLI proxy)
step "Checking RTK…"
if command -v rtk &>/dev/null; then
    RTK_VER=$(rtk --version 2>&1 | head -1)
    ok "RTK $RTK_VER found — token-optimized CLI available"
else
    warn "RTK not found (optional) — saves 60-90% tokens on dev operations."
    echo -e "    Install: ${CYAN}https://github.com/rtk-ai/rtk${NC}"
fi

# Source files
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_SRC="$SOURCE_DIR/agent"
CLAUDE_SRC="$SOURCE_DIR/CLAUDE.md"
ADDONS_SRC="$SOURCE_DIR/addons"

if [ ! -d "$AGENT_SRC" ] || [ ! -f "$CLAUDE_SRC" ]; then
    err "Missing agent/ or CLAUDE.md in godot-claude repository."
    exit 1
fi

# Build godot-engine-mcp server
SERVER_DIR="$SOURCE_DIR/server"
if [ -d "$SERVER_DIR" ]; then
    BUILD_NEEDED=true
    if [ -f "$SERVER_DIR/build/index.js" ] && [ -f "$SERVER_DIR/src/index.ts" ]; then
        if [ "$SERVER_DIR/build/index.js" -nt "$SERVER_DIR/src/index.ts" ]; then
            BUILD_NEEDED=false
        fi
    fi

    if [ "$BUILD_NEEDED" = true ]; then
        step "Building godot-engine-mcp server…"
        if (cd "$SERVER_DIR" && npm ci --silent && npm run build) 2>&1; then
            ok "Server built successfully"
        else
            err "Server build failed. Check $SERVER_DIR for errors."
            exit 1
        fi
    else
        ok "Server already built — skipping"
    fi
else
    err "Missing server/ directory in godot-claude repository."
    exit 1
fi

# Install .godot-claude/
TARGET_DIR="$PROJECT_PATH/.godot-claude"
step "Installing .godot-claude/ → project root"

if [ -d "$TARGET_DIR" ]; then
    # Clear out old reference files to ensure clean update, but keep memory/session
    rm -rf "$TARGET_DIR/ref"
    cp -r "$AGENT_SRC/"* "$TARGET_DIR/"
else
    mkdir -p "$TARGET_DIR"
    cp -r "$AGENT_SRC/"* "$TARGET_DIR/"
fi
ok ".godot-claude/ installed"

# Install CLAUDE.md into .godot-claude/ (always update — this is the agent's instructions)
step "Installing CLAUDE.md → .godot-claude/"
cp "$CLAUDE_SRC" "$TARGET_DIR/CLAUDE.md"
ok "Godot agent instructions installed"

# Install addons
if [ -d "$ADDONS_SRC" ]; then
    step "Installing addons/ → project root"
    mkdir -p "$PROJECT_PATH/addons"
    cp -r "$ADDONS_SRC/"* "$PROJECT_PATH/addons/"
    ok "Godot plugin (addons/) installed"
fi

# Enable godot_mcp plugin in project.godot
if [ -d "$ADDONS_SRC" ]; then
    step "Enabling godot_mcp plugin in project.godot"
    PLUGIN_CFG="res://addons/godot_mcp/plugin.cfg"
    PROJECT_GODOT="$PROJECT_PATH/project.godot"

    if grep -q "\[editor_plugins\]" "$PROJECT_GODOT" 2>/dev/null; then
        if ! grep -q "$PLUGIN_CFG" "$PROJECT_GODOT" 2>/dev/null; then
            # Add to existing [editor_plugins] PackedStringArray
            if command -v python3 &>/dev/null; then
                python3 - "$PROJECT_GODOT" "$PLUGIN_CFG" << 'PYEOF'
import sys, re
path, plugin = sys.argv[1], sys.argv[2]
with open(path) as f: content = f.read()
def add_plugin(m):
    cur = m.group(1).strip()
    if cur:
        return f'enabled=PackedStringArray({cur}, "{plugin}")'
    return f'enabled=PackedStringArray("{plugin}")'
content = re.sub(r'enabled=PackedStringArray\((.*?)\)', add_plugin, content)
with open(path, 'w') as f: f.write(content)
PYEOF
                ok "Added godot_mcp to existing [editor_plugins]"
            else
                warn "python3 not found — add manually to project.godot: enabled=PackedStringArray(\"$PLUGIN_CFG\")"
            fi
        else
            ok "godot_mcp plugin already enabled in project.godot"
        fi
    else
        printf '\n[editor_plugins]\n\nenabled=PackedStringArray("res://addons/godot_mcp/plugin.cfg")\n' >> "$PROJECT_GODOT"
        ok "godot_mcp plugin enabled in project.godot"
    fi
fi

# Check API keys for asset generation
echo ""
if [ -z "${GEMINI_API_KEY-}" ] && [ -z "${GOOGLE_API_KEY-}" ]; then
    warn "GEMINI_API_KEY not set — asset generation (Gemini) and visual QA will not work."
    echo -e "    Get a key: ${CYAN}https://aistudio.google.com/apikey${NC}"
    echo -e "    Set it:    ${CYAN}export GEMINI_API_KEY=...${NC}"
    echo ""
fi

if [ -z "${PIXELLAB_API_KEY-}" ]; then
    warn "PIXELLAB_API_KEY not set — pixel art generation via PixelLab will be unavailable."
    echo -e "    Gemini and Tripo3D asset generation still work with their own API keys."
    echo -e "    Get a key: ${CYAN}https://pixellab.ai/${NC}"
    echo -e "    Set it:    ${CYAN}export PIXELLAB_API_KEY=pk_...${NC}"
    echo ""
fi

if [ -z "${TRIPO3D_API_KEY-}" ]; then
    warn "TRIPO3D_API_KEY not set — 3D model generation (image→GLB) will be unavailable."
    echo -e "    Get a key: ${CYAN}https://www.tripo3d.ai/${NC}"
    echo -e "    Set it:    ${CYAN}export TRIPO3D_API_KEY=...${NC}"
    echo ""
fi

# Optional: generate offline Godot API docs for godot-task skill
DOC_API_SCRIPT="$TARGET_DIR/tools/ensure_doc_api.sh"
if [ -f "$DOC_API_SCRIPT" ] && command -v python3 &>/dev/null && command -v git &>/dev/null; then
    if [ ! -d "$TARGET_DIR/skills/godot-task/doc_api" ] || [ ! -f "$TARGET_DIR/skills/godot-task/doc_api/_common.md" ]; then
        echo ""
        echo -e "  ${BOLD}Offline Godot API docs (one-time)${NC}"
        echo -e "  Generates per-class markdown API reference from Godot source."
        echo -e "  Used as offline fallback when MCP docs are unavailable."
        echo ""
        read -rp "  Generate offline API docs now? [y/N]: " GEN_DOCS
        echo ""
        if [[ "$GEN_DOCS" =~ ^[Yy] ]]; then
            step "Generating offline Godot API docs..."
            if bash "$DOC_API_SCRIPT" 2>&1; then
                ok "Offline API docs generated"
            else
                warn "Failed to generate API docs — godot-task will use MCP docs instead"
            fi
        fi
    fi
fi

# If no project CLAUDE.md exists, create a minimal one
if [ ! -f "$PROJECT_PATH/CLAUDE.md" ]; then
    step "Creating project CLAUDE.md"
    cat > "$PROJECT_PATH/CLAUDE.md" << 'TMPL'
# Project Instructions

<!-- Godot agent instructions are in .godot-claude/CLAUDE.md (loaded automatically) -->
<!-- Add your project-specific instructions below -->

## Project Overview
[Describe your game here]
TMPL
    ok "Project CLAUDE.md created (customize it for your game)"
else
    ok "Project CLAUDE.md already exists — not modified"
fi

# Create .mcp.json
MCP_FILE="$PROJECT_PATH/.mcp.json"
if [ "$SKIP_MCP" = false ] && [ ! -f "$MCP_FILE" ]; then
    step "Creating .mcp.json"

    # Docs server is bundled in the repo
    DOCS_PATH="$SOURCE_DIR/docs-server"

    # Check if docs have been built (one-time setup)
    DOCS_READY=false
    if [ -d "$DOCS_PATH/docs" ] && [ -f "$DOCS_PATH/docs/docs_tree.txt" ]; then
        DOCS_READY=true
    fi

    # Check Python + pandoc for docs server
    DOCS_AVAILABLE=false
    if command -v python3 &>/dev/null && [ -f "$DOCS_PATH/main.py" ]; then
        DOCS_AVAILABLE=true
        if [ "$DOCS_READY" = false ]; then
            echo ""
            echo -e "  ${BOLD}Godot docs setup (one-time)${NC}"
            echo -e "  The docs server needs to download and convert the Godot documentation."
            echo -e "  This requires pandoc and takes ~2 minutes."
            echo ""
            if command -v pandoc &>/dev/null; then
                read -rp "  Build docs now? [Y/n]: " BUILD_DOCS
                echo ""
                if [ -z "$BUILD_DOCS" ] || [[ "$BUILD_DOCS" =~ ^[Yy] ]]; then
                    step "Building Godot documentation..."
                    (cd "$DOCS_PATH" && python3 docs_converter/godot_docs_converter.py && find docs -type f | sort > docs/docs_tree.txt) 2>&1
                    if [ $? -eq 0 ]; then
                        ok "Godot docs built successfully"
                        DOCS_READY=true
                    else
                        warn "Docs build failed — agent will use offline doc_api for docs"
                    fi
                fi
            else
                warn "pandoc not installed — needed for docs conversion"
                echo -e "    Install: ${CYAN}sudo apt install pandoc${NC}  (Ubuntu/Debian)"
                echo -e "             ${CYAN}brew install pandoc${NC}       (macOS)"
                echo ""
            fi
        fi
    fi

    # Generate .mcp.json based on available services
    if [ "$DOCS_AVAILABLE" = true ] && [ -n "${PIXELLAB_API_KEY-}" ]; then
        cat > "$MCP_FILE" << EOF
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$SOURCE_DIR/server/build/index.js"],
      "env": { "GODOT_MCP_PORT": "6505" }
    },
    "godot-mcp-docs": {
      "command": "python3",
      "args": ["$DOCS_PATH/main.py"]
    },
    "neural-memory": {
      "command": "uvx",
      "args": ["--from", "neural-memory-mcp", "neural-memory"]
    },
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp/v1",
      "headers": {
        "Authorization": "Bearer \${PIXELLAB_API_KEY}"
      }
    }
  }
}
EOF
        ok ".mcp.json created (godot-engine-mcp + godot-mcp-docs + neural-memory + pixellab)"
    elif [ "$DOCS_AVAILABLE" = true ]; then
        cat > "$MCP_FILE" << EOF
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$SOURCE_DIR/server/build/index.js"],
      "env": { "GODOT_MCP_PORT": "6505" }
    },
    "godot-mcp-docs": {
      "command": "python3",
      "args": ["$DOCS_PATH/main.py"]
    },
    "neural-memory": {
      "command": "uvx",
      "args": ["--from", "neural-memory-mcp", "neural-memory"]
    }
  }
}
EOF
        if [ "$DOCS_READY" = true ]; then
            ok ".mcp.json created (godot-engine-mcp + godot-mcp-docs + neural-memory)"
        else
            ok ".mcp.json created (docs server configured but docs not built yet)"
        fi
    elif [ -n "${PIXELLAB_API_KEY-}" ]; then
        cat > "$MCP_FILE" << EOF
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$SOURCE_DIR/server/build/index.js"],
      "env": { "GODOT_MCP_PORT": "6505" }
    },
    "neural-memory": {
      "command": "uvx",
      "args": ["--from", "neural-memory-mcp", "neural-memory"]
    },
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp/v1",
      "headers": {
        "Authorization": "Bearer \${PIXELLAB_API_KEY}"
      }
    }
  }
}
EOF
        ok ".mcp.json created (godot-engine-mcp + neural-memory + pixellab)"
    else
        cat > "$MCP_FILE" << EOF
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$SOURCE_DIR/server/build/index.js"],
      "env": { "GODOT_MCP_PORT": "6505" }
    },
    "neural-memory": {
      "command": "uvx",
      "args": ["--from", "neural-memory-mcp", "neural-memory"]
    }
  }
}
EOF
        ok ".mcp.json created (godot-engine-mcp + neural-memory)"
    fi
elif [ -f "$MCP_FILE" ]; then
    ok ".mcp.json already exists — skipped"
fi

# Update .gitignore
GITIGNORE="$PROJECT_PATH/.gitignore"
if [ -f "$GITIGNORE" ]; then
    NEEDS_UPDATE=false
    for entry in ".godot-claude/memory/" ".godot-claude/session/" ".neural-memory/" ".planning/"; do
        if ! grep -q "$entry" "$GITIGNORE" 2>/dev/null; then
            NEEDS_UPDATE=true
            break
        fi
    done
    if [ "$NEEDS_UPDATE" = true ]; then
        step "Updating .gitignore"
        # Add missing entries
        if ! grep -q ".godot-claude/memory/" "$GITIGNORE" 2>/dev/null; then
            echo "" >> "$GITIGNORE"
            echo "# godot-claude (personal data — do not commit)" >> "$GITIGNORE"
            echo ".godot-claude/memory/" >> "$GITIGNORE"
            echo ".godot-claude/session/" >> "$GITIGNORE"
        fi
        if ! grep -q ".neural-memory/" "$GITIGNORE" 2>/dev/null; then
            echo "" >> "$GITIGNORE"
            echo "# Knowledge graph and planning (local state)" >> "$GITIGNORE"
            echo ".neural-memory/" >> "$GITIGNORE"
            echo ".planning/" >> "$GITIGNORE"
        fi
        ok ".gitignore updated"
    fi
else
    step "Creating .gitignore"
    cat > "$GITIGNORE" << 'EOF'
# Godot
.godot/

# godot-claude (personal data — do not commit)
.godot-claude/memory/
.godot-claude/session/

# Knowledge graph and planning (local state)
.neural-memory/
.planning/
EOF
    ok ".gitignore created"
fi

# Create neural-memory config with GDScript support
NM_DIR="$PROJECT_PATH/.neural-memory"
NM_CONFIG="$NM_DIR/config.json"
if [ ! -f "$NM_CONFIG" ]; then
    step "Creating neural-memory config with GDScript support…"
    mkdir -p "$NM_DIR"
    cat > "$NM_CONFIG" << 'EOF'
{
  "project_root": ".",
  "index_mode": "both",
  "languages": [
    "auto"
  ],
  "include_patterns": [
    "auto",
    "**/*.gd",
    "**/*.tscn",
    "**/*.tres",
    "**/*.cfg",
    "**/*.gdshader"
  ],
  "exclude_patterns": [
    "**/.git/**",
    "**/.godot/**",
    "**/.neural-memory/**",
    "**/node_modules/**",
    "**/build/**",
    "**/__pycache__/**",
    "**/.godot-claude/skills/godot-task/doc_api/**"
  ],
  "redaction": {
    "enabled": true,
    "builtin_patterns": true,
    "sensitive_var_patterns": [
      "(?i)(secret|password|passwd|pwd|token|api_key|apikey|auth|credential|private_key|access_key)"
    ],
    "custom_patterns": [],
    "whitelist_vars": []
  },
  "max_summary_short_chars": 200,
  "max_summary_detailed_chars": 1000,
  "staleness_threshold": 5,
  "importance_threshold": 0.2,
  "lsp_enabled": true,
  "lsp_servers": {}
}
EOF
    ok "neural-memory config created with GDScript/TSCN/TRES/gdshader indexing"
else
    ok "neural-memory config already exists — skipped"
fi

# Done
echo ""
echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  ✓ Installation Complete${NC}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}How to use:${NC}"
echo -e "    ${CYAN}cd $PROJECT_PATH${NC}"
echo -e "    ${CYAN}claude${NC}                         # Start Claude Code (Sonnet default)"
echo ""
echo -e "  ${BOLD}First commands:${NC}"
echo -e "    ${CYAN}start new game${NC}                 # GDD workflow → full project scaffold"
echo -e "    ${CYAN}continue${NC}                       # Resume last session"
echo -e "    ${CYAN}status${NC}                         # Project state"
echo ""
echo -e "  ${BOLD}Game generation:${NC}"
echo -e "    ${CYAN}make a game${NC}                    # Describe a game → get a playable pixel art game"
echo -e "    ${CYAN}add enemies${NC}                    # Add features to existing project"
echo ""
echo -e "  ${BOLD}Model routing:${NC}"
echo -e "    Architecture / GDD:    ${CYAN}claude --model opus${NC}"
echo -e "    Development / Bugs:    ${CYAN}claude${NC}  (sonnet — default)"
echo -e "    Documentation:         ${CYAN}claude --model haiku${NC}"
echo ""
echo -e "  ${BOLD}Repository verification:${NC}"
echo -e "    ${CYAN}$SOURCE_DIR/verify.sh${NC}            # Static MCP/plugin/docs/license checks"
echo ""
