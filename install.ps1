#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Install godot-claude agent into a Godot project.

.DESCRIPTION
    Copies the Claude Code agent files (.godot-claude/ + CLAUDE.md) into the
    root of a Godot 4.x project. This is everything Claude Code needs to
    act as an expert Godot development agent.

    Files installed:
      .godot-claude/CLAUDE.md  -> Agent instructions (auto-read by Claude Code)
      .godot-claude/ref/       -> Reference files (loaded on demand, not all at once)
      .godot-claude/memory/    -> Project memory stubs (megamemory used instead)
      .godot-claude/session/   -> Session continuity across /clear

.PARAMETER ProjectPath
    Path to the Godot project root (must contain project.godot).
    If not provided, prompts interactively.

.PARAMETER SkipMcp
    Skip .mcp.json creation.

.EXAMPLE
    pwsh install.ps1
    pwsh install.ps1 -ProjectPath "C:\Games\MyPlatformer"
#>

[CmdletBinding()]
param(
    [string]$ProjectPath,
    [switch]$SkipMcp
)

$ErrorActionPreference = "Stop"

# --- Colors (ANSI escape sequences -- PS 7+ only, graceful fallback for 5.x) ---
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $RST    = "`e[0m"
    $RED    = "`e[31m"
    $GREEN  = "`e[32m"
    $YELLOW = "`e[33m"
    $CYAN   = "`e[36m"
    $BOLD   = "`e[1m"
} else {
    $RST = ""; $RED = ""; $GREEN = ""; $YELLOW = ""; $CYAN = ""; $BOLD = ""
}

function Write-Header {
    Write-Host ""
    Write-Host "$($BOLD)$($CYAN)+==========================================+$($RST)"
    Write-Host "$($BOLD)$($CYAN)|   godot-claude - Claude Code Agent       |$($RST)"
    Write-Host "$($BOLD)$($CYAN)|   for Godot 4.x Game Development         |$($RST)"
    Write-Host "$($BOLD)$($CYAN)|                                          |$($RST)"
    Write-Host "$($BOLD)$($CYAN)|   Compatible with: Claude Code (CLI)     |$($RST)"
    Write-Host "$($BOLD)$($CYAN)+==========================================+$($RST)"
    Write-Host ""
}

function Write-Step  { param([string]$m) Write-Host "  $($GREEN)>$($RST) $m" }
function Write-Warn  { param([string]$m) Write-Host "  $($YELLOW)!$($RST) $m" }
function Write-Err   { param([string]$m) Write-Host "  $($RED)x$($RST) $m" }
function Write-Ok    { param([string]$m) Write-Host "  $($GREEN)ok$($RST) $m" }

# ==================================================================
Write-Header

# --- Open native folder picker dialog ---
function Open-FolderDialog {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = "Select your Godot project folder or a parent folder containing multiple projects"
    $dialog.RootFolder  = [System.Environment+SpecialFolder]::MyComputer
    $dialog.SelectedPath = (Get-Location).Path
    $dialog.ShowNewFolderButton = $false

    # ShowDialog needs a parent window handle; use a hidden form so it appears on top
    $form = New-Object System.Windows.Forms.Form
    $form.TopMost = $true
    $form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
    $form.Show()
    $form.Focus() | Out-Null

    $result = $dialog.ShowDialog($form)
    $form.Close()

    if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }
    return $null
}

# --- Resolve chosen directory: direct project or pick from sub-projects ---
function Resolve-ProjectPath {
    param([string]$Chosen)

    # Direct Godot project
    if (Test-Path (Join-Path $Chosen "project.godot")) {
        return $Chosen
    }

    # Parent directory -- find sub-projects up to 2 levels deep
    $subs = Get-ChildItem -Path $Chosen -Filter "project.godot" -Recurse -Depth 2 -ErrorAction SilentlyContinue |
            ForEach-Object { $_.DirectoryName } | Sort-Object

    if ($subs.Count -eq 0) {
        Write-Err "No project.godot found in: $Chosen"
        Write-Host "  Select a Godot project folder or a parent containing one."
        exit 1
    }

    if ($subs.Count -eq 1) {
        return $subs[0]
    }

    # Multiple projects -- let user pick
    Write-Host ""
    Write-Host "  $($BOLD)Multiple Godot projects found:$($RST)"
    Write-Host ""
    for ($i = 0; $i -lt $subs.Count; $i++) {
        Write-Host "    $($CYAN)$($i+1)$($RST). $($subs[$i])"
    }
    Write-Host ""
    $choice = Read-Host "  Choose [1-$($subs.Count)]"
    Write-Host ""

    if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $subs.Count) {
        return $subs[[int]$choice - 1]
    }
    Write-Err "Invalid choice."
    exit 1
}

# --- Step 1: Get project path ---
if (-not $ProjectPath) {
    Write-Step "Opening folder picker..."
    $chosen = Open-FolderDialog

    if (-not $chosen) {
        # User cancelled -- fall back to typed input
        Write-Host ""
        Write-Warn "No folder selected. Enter path manually."
        Write-Host ""
        $chosen = Read-Host "  Project path"
        Write-Host ""
    }

    if (-not $chosen) { Write-Err "No directory selected."; exit 1 }
    $ProjectPath = Resolve-ProjectPath -Chosen $chosen
}

# Expand ~ and resolve
if ($ProjectPath.StartsWith("~")) {
    $ProjectPath = $ProjectPath -replace "^~", $HOME
}
$ProjectPath = [System.IO.Path]::GetFullPath($ProjectPath)

if (-not (Test-Path $ProjectPath)) {
    Write-Err "Path does not exist: $ProjectPath"
    exit 1
}

# --- Step 2: Validate Godot project ---
$godotFile = Join-Path $ProjectPath "project.godot"
if (-not (Test-Path $godotFile)) {
    Write-Err "No project.godot found in: $ProjectPath"
    Write-Host "  Make sure you point to the root of a Godot 4.x project."
    exit 1
}
Write-Ok "Godot project found: $ProjectPath"

# --- Step 3: Check Node.js ---
Write-Step "Checking Node.js..."
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Err "Node.js is not installed."
    Write-Host "  The godot-engine-mcp server requires Node.js 18+."
    Write-Host "  Install: $($CYAN)https://nodejs.org/$($RST)"
    exit 1
}
$nodeVersion = (node -v) -replace '^v', ''
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 18) {
    Write-Err "Node.js version is too old: v$nodeVersion (need 18+)"
    Write-Host "  Update: $($CYAN)https://nodejs.org/$($RST)"
    exit 1
}
Write-Ok "Node.js v$nodeVersion found"

# --- Step 4: Locate source files ---
$sourceDir = $PSScriptRoot
$agentSrc  = Join-Path $sourceDir "agent"
$claudeSrc = Join-Path $sourceDir "CLAUDE.md"
$addonsSrc = Join-Path $sourceDir "addons"

if (-not (Test-Path $agentSrc) -or -not (Test-Path $claudeSrc)) {
    Write-Err "Missing agent/ or CLAUDE.md in godot-claude repository."
    Write-Host "  Re-clone: git clone https://github.com/YOUR_ORG/godot-claude.git"
    exit 1
}

# --- Step 5: Build godot-engine-mcp server ---
$serverDir = Join-Path $sourceDir "server"
if (Test-Path $serverDir) {
    $buildNeeded = $true
    $buildIndex = Join-Path $serverDir "build\index.js"
    $srcIndex = Join-Path $serverDir "src\index.ts"
    if ((Test-Path $buildIndex) -and (Test-Path $srcIndex)) {
        $buildTime = (Get-Item $buildIndex).LastWriteTime
        $srcTime   = (Get-Item $srcIndex).LastWriteTime
        if ($buildTime -gt $srcTime) {
            $buildNeeded = $false
        }
    }
    if ($buildNeeded) {
        Write-Step "Building godot-engine-mcp server..."
        Push-Location $serverDir
        try {
            & npm ci --silent 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
            & npm run build 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
            Write-Ok "Server built successfully"
        } catch {
            Write-Err "Server build failed."
            Pop-Location
            exit 1
        }
        Pop-Location
    } else {
        Write-Ok "Server already built -- skipping"
    }
} else {
    Write-Err "Missing server/ directory in godot-claude repository."
    exit 1
}

# --- Step 6: Install .godot-claude/ ---
$targetDir = Join-Path $ProjectPath ".godot-claude"
Write-Step "Installing .godot-claude/ -> project root"

if (Test-Path $targetDir) {
    # Remove old reference files but keep memory and session
    $refDir = Join-Path $targetDir "ref"
    if (Test-Path $refDir) {
        Remove-Item -Path $refDir -Recurse -Force
    }
    
    Copy-Item -Path "$agentSrc\*" -Destination $targetDir -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Copy-Item -Path "$agentSrc\*" -Destination $targetDir -Recurse -Force
}
Write-Ok ".godot-claude/ installed"

# --- Step 7: Install CLAUDE.md into .godot-claude/ (always update) ---
Write-Step "Installing CLAUDE.md -> .godot-claude/"
Copy-Item -Path $claudeSrc -Destination (Join-Path $targetDir "CLAUDE.md") -Force
Write-Ok "Godot agent instructions installed"

# Install addons
if (Test-Path $addonsSrc) {
    Write-Step "Installing addons/ -> project root"
    $projectAddons = Join-Path $ProjectPath "addons"
    if (-not (Test-Path $projectAddons)) {
        New-Item -ItemType Directory -Path $projectAddons -Force | Out-Null
    }
    Copy-Item -Path "$addonsSrc\*" -Destination $projectAddons -Recurse -Force
    Write-Ok "Godot plugin (addons/) installed"
}

# Enable godot_mcp plugin in project.godot
if (Test-Path $addonsSrc) {
    Write-Step "Enabling godot_mcp plugin in project.godot"
    $pluginCfg = "res://addons/godot_mcp/plugin.cfg"
    $godotContent = Get-Content $godotFile -Raw

    if ($godotContent -match '\[editor_plugins\]') {
        if ($godotContent -notmatch [regex]::Escape($pluginCfg)) {
            # Add to existing PackedStringArray
            $pythonCmd = $null
            foreach ($candidate in @("python3", "python")) {
                $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
                if ($cmd) {
                    $ver = & $candidate --version 2>&1
                    if ($ver -match 'Python 3') { $pythonCmd = $candidate; break }
                }
            }
            if ($pythonCmd) {
                $pyScript = @"
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
"@
                $tmpScript = [System.IO.Path]::GetTempFileName() + ".py"
                Set-Content -Path $tmpScript -Value $pyScript -Encoding UTF8
                & $pythonCmd $tmpScript $godotFile $pluginCfg
                Remove-Item $tmpScript -Force
                Write-Ok "Added godot_mcp to existing [editor_plugins]"
            } else {
                Write-Warn "python3 not found -- add manually to project.godot: enabled=PackedStringArray(`"$pluginCfg`")"
            }
        } else {
            Write-Ok "godot_mcp plugin already enabled in project.godot"
        }
    } else {
        Add-Content -Path $godotFile -Value "`n[editor_plugins]`n`nenabled=PackedStringArray(`"res://addons/godot_mcp/plugin.cfg`")"
        Write-Ok "godot_mcp plugin enabled in project.godot"
    }
}

# Check PixelLab API key
if (-not $env:PIXELLAB_API_KEY) {
    Write-Host ""
    Write-Warn "PIXELLAB_API_KEY not set -- game generation pipeline (godogen) won't be able to create assets."
    Write-Host "    Get a key: $($CYAN)https://pixellab.ai/$($RST)"
    Write-Host "    Set it:    $($CYAN)`$env:PIXELLAB_API_KEY = 'pk_...'$($RST)"
    Write-Host ""
}

# If no project CLAUDE.md exists, create a minimal one
$claudeDest = Join-Path $ProjectPath "CLAUDE.md"
if (-not (Test-Path $claudeDest)) {
    Write-Step "Creating project CLAUDE.md"
    @"
# Project Instructions

<!-- Godot agent instructions are in .godot-claude/CLAUDE.md (loaded automatically) -->
<!-- Add your project-specific instructions below -->

## Project Overview
[Describe your game here]
"@ | Set-Content -Path $claudeDest -Encoding UTF8
    Write-Ok "Project CLAUDE.md created (customize it for your game)"
} else {
    Write-Ok "Project CLAUDE.md already exists -- not modified"
}

# --- Step 8: Create .mcp.json ---
$mcpFile = Join-Path $ProjectPath ".mcp.json"
if (-not $SkipMcp -and -not (Test-Path $mcpFile)) {
    Write-Step "Creating .mcp.json"

    # Docs server is bundled in the repo
    $docsPath = Join-Path $sourceDir "docs-server"
    # Detect Python 3 -- Windows often has 'python' instead of 'python3'
    $pythonCmd = $null
    foreach ($candidate in @("python3", "python")) {
        $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($cmd) {
            $ver = & $candidate --version 2>&1
            if ($ver -match 'Python 3') {
                $pythonCmd = $candidate
                break
            }
        }
    }
    $docsAvailable = ($null -ne $pythonCmd) -and (Test-Path (Join-Path $docsPath "main.py"))
    $docsReady = (Test-Path (Join-Path $docsPath "docs")) -and (Test-Path (Join-Path $docsPath "docs\docs_tree.txt"))

    if ($docsAvailable -and -not $docsReady) {
        Write-Host ""
        Write-Host "  $($BOLD)Godot docs setup (one-time)$($RST)"
        Write-Host "  The docs server needs to download and convert the Godot documentation."
        Write-Host "  This requires pandoc and takes ~2 minutes."
        Write-Host ""
        if (Get-Command pandoc -ErrorAction SilentlyContinue) {
            $buildDocs = Read-Host "  Build docs now? [Y/n]"
            Write-Host ""
            if (-not $buildDocs -or $buildDocs -match '^[Yy]') {
                Write-Step "Building Godot documentation..."
                Push-Location $docsPath
                try {
                    & $pythonCmd docs_converter/godot_docs_converter.py
                    # Generate docs tree listing (cross-platform -- no 'tree' dependency)
                    Get-ChildItem -Path "docs" -Recurse -Name | Set-Content -Path "docs/docs_tree.txt" -Encoding UTF8
                    Write-Ok "Godot docs built successfully"
                    $docsReady = $true
                } catch {
                    Write-Warn "Docs build failed -- agent will use context7 for docs"
                }
                Pop-Location
            }
        } else {
            Write-Warn "pandoc not installed -- needed for docs conversion"
            Write-Host "    Install: $($CYAN)winget install pandoc$($RST)"
        }
    }

    # Generate .mcp.json based on available services
    $serverPath = (Join-Path $sourceDir "server\build\index.js").Replace('\', '/')
    $docsMainPath = (Join-Path $docsPath "main.py").Replace('\', '/')
    $hasPixelLab = [bool]$env:PIXELLAB_API_KEY

    if ($docsAvailable -and $hasPixelLab) {
        $mcpContent = @"
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$serverPath"],
      "env": { "GODOT_MCP_PORT": "6505" }
    },
    "godot-mcp-docs": {
      "command": "$pythonCmd",
      "args": ["$docsMainPath"]
    },
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp/v1",
      "headers": {
        "Authorization": "Bearer `${PIXELLAB_API_KEY}"
      }
    }
  }
}
"@
        $mcpContent | Set-Content -Path $mcpFile -Encoding UTF8
        Write-Ok ".mcp.json created (godot-engine-mcp + godot-mcp-docs + pixellab)"
    } elseif ($docsAvailable) {
        $mcpContent = @"
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$serverPath"],
      "env": { "GODOT_MCP_PORT": "6505" }
    },
    "godot-mcp-docs": {
      "command": "$pythonCmd",
      "args": ["$docsMainPath"]
    }
  }
}
"@
        $mcpContent | Set-Content -Path $mcpFile -Encoding UTF8
        if ($docsReady) {
            Write-Ok ".mcp.json created (godot-engine-mcp + godot-mcp-docs)"
        } else {
            Write-Ok ".mcp.json created (docs server configured but docs not built yet)"
        }
    } elseif ($hasPixelLab) {
        $mcpContent = @"
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$serverPath"],
      "env": { "GODOT_MCP_PORT": "6505" }
    },
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp/v1",
      "headers": {
        "Authorization": "Bearer `${PIXELLAB_API_KEY}"
      }
    }
  }
}
"@
        $mcpContent | Set-Content -Path $mcpFile -Encoding UTF8
        Write-Ok ".mcp.json created (godot-engine-mcp + pixellab)"
    } else {
        $mcpContent = @"
{
  "mcpServers": {
    "godot-engine-mcp": {
      "command": "node",
      "args": ["$serverPath"],
      "env": { "GODOT_MCP_PORT": "6505" }
    }
  }
}
"@
        $mcpContent | Set-Content -Path $mcpFile -Encoding UTF8
        Write-Ok ".mcp.json created (godot-engine-mcp only -- agent will use context7 for docs)"
    }
} elseif (Test-Path $mcpFile) {
    Write-Ok ".mcp.json already exists -- skipped"
}

# --- Step 9: Update .gitignore ---
$gitignore = Join-Path $ProjectPath ".gitignore"
$ignoreEntries = @(".godot-claude/memory/", ".godot-claude/session/", ".megamemory/", ".planning/")

if (Test-Path $gitignore) {
    $content = Get-Content $gitignore -Raw
    $needsUpdate = $false
    foreach ($entry in $ignoreEntries) {
        if ($content -notmatch [regex]::Escape($entry)) { $needsUpdate = $true; break }
    }
    if ($needsUpdate) {
        Write-Step "Updating .gitignore"
        if ($content -notmatch [regex]::Escape(".godot-claude/memory/")) {
            Add-Content -Path $gitignore -Value "`n# godot-claude (personal data -- do not commit)`n.godot-claude/memory/`n.godot-claude/session/"
        }
        if ($content -notmatch [regex]::Escape(".megamemory/")) {
            Add-Content -Path $gitignore -Value "`n# Knowledge graph and planning (local state)`n.megamemory/`n.planning/"
        }
        Write-Ok ".gitignore updated"
    }
} else {
    Write-Step "Creating .gitignore"
    @"
# Godot
.godot/

# godot-claude (personal data -- do not commit)
.godot-claude/memory/
.godot-claude/session/

# Knowledge graph and planning (local state)
.megamemory/
.planning/
"@ | Set-Content -Path $gitignore -Encoding UTF8
    Write-Ok ".gitignore created"
}

# --- Done ---
Write-Host ""
Write-Host "$($BOLD)$($GREEN)==========================================$($RST)"
Write-Host "$($BOLD)$($GREEN)  Installation Complete$($RST)"
Write-Host "$($BOLD)$($GREEN)==========================================$($RST)"
Write-Host ""
Write-Host "  $($BOLD)What was installed:$($RST)"
Write-Host "    .godot-claude/CLAUDE.md  - Agent brain (Claude Code reads this automatically)"
Write-Host "    .godot-claude/ref/       - 7 reference files (loaded on demand, not all at once)"
Write-Host "    .godot-claude/skills/    - Game generation skills (godogen pipeline)"
Write-Host "    .godot-claude/tools/     - Python tools (sprite processing, doc conversion)"
Write-Host "    .godot-claude/session/   - Session state (survives /clear)"
Write-Host "    .mcp.json                - MCP server configuration"
Write-Host ""
Write-Host "  $($BOLD)How to use:$($RST)"
Write-Host "    $($CYAN)cd $ProjectPath$($RST)"
Write-Host "    $($CYAN)claude$($RST)                         # Start Claude Code (uses Sonnet by default)"
Write-Host ""
Write-Host "  $($BOLD)First commands to try:$($RST)"
Write-Host "    $($CYAN)start new game$($RST)                 # Interactive GDD then full project scaffold"
Write-Host "    $($CYAN)continue$($RST)                       # Resume from last session"
Write-Host "    $($CYAN)status$($RST)                         # See project state"
Write-Host ""
Write-Host "  $($BOLD)Game generation:$($RST)"
Write-Host "    $($CYAN)make a game$($RST)                    # Describe a game -> get a playable pixel art game"
Write-Host "    $($CYAN)add enemies$($RST)                    # Add features to existing project"
Write-Host ""
Write-Host "  $($BOLD)Use the right model for the job:$($RST)"
Write-Host "    Architecture / GDD:    $($CYAN)claude --model opus$($RST)"
Write-Host "    Development / Bugs:    $($CYAN)claude$($RST)  (sonnet - default)"
Write-Host "    Documentation:         $($CYAN)claude --model haiku$($RST)"
Write-Host "    Changelogs / Updates:  $($CYAN)claude --model haiku$($RST)"
Write-Host ""
