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

# Header
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   godot-claude — Claude Code Agent      ║${NC}"
echo -e "${BOLD}${CYAN}║   for Godot 4.x Game Development        ║${NC}"
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

# Open a native folder picker dialog, returns selected path via stdout
open_folder_dialog() {
    local title="Select Godot Project or Parent Directory"
    local selected=""

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS — AppleScript
        selected=$(osascript -e \
            'tell app "System Events" to set f to choose folder with prompt "'"$title"'"' \
            -e 'POSIX path of f' 2>/dev/null) || true

    elif command -v zenity &>/dev/null; then
        # Linux — GNOME / GTK
        selected=$(zenity --file-selection --directory --title="$title" 2>/dev/null) || true

    elif command -v kdialog &>/dev/null; then
        # Linux — KDE
        selected=$(kdialog --getexistingdirectory "$HOME" --title "$title" 2>/dev/null) || true

    elif command -v yad &>/dev/null; then
        # Linux — yad (another GTK dialog)
        selected=$(yad --file --directory --title="$title" 2>/dev/null) || true
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

# Source files
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_SRC="$SOURCE_DIR/agent"
CLAUDE_SRC="$SOURCE_DIR/CLAUDE.md"

if [ ! -d "$AGENT_SRC" ] || [ ! -f "$CLAUDE_SRC" ]; then
    err "Missing agent/ or CLAUDE.md in godot-claude repository."
    exit 1
fi

# Install CLAUDE.md
if [ -f "$PROJECT_PATH/CLAUDE.md" ]; then
    ok "CLAUDE.md already exists — skipped"
else
    step "Installing CLAUDE.md → project root"
    cp "$CLAUDE_SRC" "$PROJECT_PATH/CLAUDE.md"
    ok "CLAUDE.md installed"
fi

# Install .godot-claude/
TARGET_DIR="$PROJECT_PATH/.godot-claude"
step "Installing .godot-claude/ → project root"

if [ -d "$TARGET_DIR" ]; then
    # Preserve memory and session
    TEMP_BACKUP=$(mktemp -d)
    if [ -d "$TARGET_DIR/memory" ]; then
        warn "Preserving existing memory data"
        cp -r "$TARGET_DIR/memory" "$TEMP_BACKUP/memory"
    fi
    if [ -d "$TARGET_DIR/session" ]; then
        warn "Preserving existing session data"
        cp -r "$TARGET_DIR/session" "$TEMP_BACKUP/session"
    fi

    rm -rf "$TARGET_DIR"
    cp -r "$AGENT_SRC" "$TARGET_DIR"

    # Restore
    if [ -d "$TEMP_BACKUP/memory" ]; then
        rm -rf "$TARGET_DIR/memory"
        cp -r "$TEMP_BACKUP/memory" "$TARGET_DIR/memory"
    fi
    if [ -d "$TEMP_BACKUP/session" ]; then
        rm -rf "$TARGET_DIR/session"
        cp -r "$TEMP_BACKUP/session" "$TARGET_DIR/session"
    fi
    rm -rf "$TEMP_BACKUP"
else
    cp -r "$AGENT_SRC" "$TARGET_DIR"
fi
ok ".godot-claude/ installed"

# Create .mcp.json
MCP_FILE="$PROJECT_PATH/.mcp.json"
if [ "$SKIP_MCP" = false ] && [ ! -f "$MCP_FILE" ]; then
    step "Creating .mcp.json"
    cat > "$MCP_FILE" << 'EOF'
{
  "mcpServers": {
    "godot-mcp-pro": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/godot-mcp-pro"]
    },
    "godot-mcp-docs": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/godot-mcp-docs"]
    }
  }
}
EOF
    ok ".mcp.json created (PixelLab not included — add manually with API key)"
elif [ -f "$MCP_FILE" ]; then
    ok ".mcp.json already exists — skipped"
fi

# Update .gitignore
GITIGNORE="$PROJECT_PATH/.gitignore"
if [ -f "$GITIGNORE" ]; then
    if ! grep -q ".godot-claude/memory/" "$GITIGNORE" 2>/dev/null; then
        step "Updating .gitignore"
        echo "" >> "$GITIGNORE"
        echo "# godot-claude (personal data — do not commit)" >> "$GITIGNORE"
        echo ".godot-claude/memory/" >> "$GITIGNORE"
        echo ".godot-claude/session/" >> "$GITIGNORE"
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
EOF
    ok ".gitignore created"
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
echo -e "  ${BOLD}Model routing:${NC}"
echo -e "    Architecture / GDD:    ${CYAN}claude --model opus${NC}"
echo -e "    Development / Bugs:    ${CYAN}claude${NC}  (sonnet — default)"
echo -e "    Documentation:         ${CYAN}claude --model haiku${NC}"
echo ""
