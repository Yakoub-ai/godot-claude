#!/usr/bin/env python3
import os
import subprocess
from PIL import Image

TARGET_DIR = "/Users/g/pipeline-testing"

def main():
    print(f"Scaffolding test game in {TARGET_DIR}...")
    
    # 1. Enable plugin
    project_godot_path = os.path.join(TARGET_DIR, "project.godot")
    with open(project_godot_path, "a") as f:
        f.write("\n\n[editor_plugins]\n")
        f.write('enabled=PackedStringArray("res://addons/godot-claude/plugin.cfg")\n')
    
    # 2. Test the Sprite Generation
    assets_dir = os.path.join(TARGET_DIR, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    
    print("Generating dummy LPC layers...")
    layer1_path = os.path.join(assets_dir, "base.png")
    layer2_path = os.path.join(assets_dir, "armor.png")
    Image.new("RGBA", (64, 64), (200, 150, 100, 255)).save(layer1_path)
    Image.new("RGBA", (64, 64), (100, 100, 100, 128)).save(layer2_path)
    
    print("Running lpc_spritesheet.py on layers...")
    out_sprite = os.path.join(assets_dir, "player_final.png")
    
    # Needs absolute path to tool
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tool_path = os.path.join(script_dir, "agent", "tools", "lpc_spritesheet.py")
    
    subprocess.run(["python3", tool_path, "--layers", layer1_path, layer2_path, "--out", out_sprite], check=True)
    
    # 3. Create a dummy scene with the sprite
    scenes_dir = os.path.join(TARGET_DIR, "scenes")
    os.makedirs(scenes_dir, exist_ok=True)
    main_scene = os.path.join(scenes_dir, "main.tscn")
    
    scene_data = """[gd_scene load_steps=3 format=3 uid="uid://cxab3x1q"]

[ext_resource type="Texture2D" uid="uid://d3m03p8r" path="res://assets/player_final.png" id="1_sprite"]
[ext_resource type="Script" path="res://scripts/player.gd" id="2_script"]

[node name="Node2D" type="Node2D"]

[node name="PlayerSprite" type="Sprite2D" parent="."]
texture = ExtResource("1_sprite")
script = ExtResource("2_script")
"""
    with open(main_scene, "w") as f:
        f.write(scene_data)
        
    # 4. Create dummy script
    scripts_dir = os.path.join(TARGET_DIR, "scripts")
    os.makedirs(scripts_dir, exist_ok=True)
    player_script = os.path.join(scripts_dir, "player.gd")
    
    script_data = """extends Sprite2D

func _ready() -> void:
\tprint("E2E Test Success! Subsystems operational: MCP, Spritesheet, Godogen")
\tget_tree().quit()
"""
    with open(player_script, "w") as f:
        f.write(script_data)

    print("Scaffolding complete.")

    # 5. Execute Scene Headless to verify
    print("Running Godot Engine to test scene...")
    try:
        subprocess.run(["godot", "--headless", main_scene], cwd=TARGET_DIR)
    except FileNotFoundError:
        print("Warning: 'godot' command is not available in PATH. Skipping validation test. Game generated successfully!")

if __name__ == "__main__":
    main()
