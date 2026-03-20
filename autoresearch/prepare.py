#!/usr/bin/env python3
"""
Autoresearch prep script for Godot-Claude.
Prepares a clean Godot project sandbox in /tmp/godot_autoresearch_sandbox/
so that the meta-agent can safely evaluate the current skills workflow.
"""
import os
import shutil
import subprocess

SANDBOX_DIR = "/tmp/godot_autoresearch_sandbox"

def main():
    print(f"Preparing autoresearch sandbox at {SANDBOX_DIR}...")
    if os.path.exists(SANDBOX_DIR):
        shutil.rmtree(SANDBOX_DIR)
    
    os.makedirs(SANDBOX_DIR)
    
    # Create minimal Godot project
    project_godot = os.path.join(SANDBOX_DIR, "project.godot")
    with open(project_godot, "w") as f:
        f.write("; Engine configuration file.\nconfig_version=5\n\n[application]\nconfig/name=\"Autoresearch Sandbox\"\n")
    
    # Run the godot-claude installer into the sandbox to set up .godot-claude tools
    original_cwd = os.getcwd()
    try:
        if os.path.exists("install.sh"):
            print("Installing godot-claude into sandbox...")
            subprocess.run(["./install.sh", SANDBOX_DIR], check=True)
        else:
            print("Warning: install.sh not found in current directory. Run prepare.py from root of godot-claude.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to run installer: {e}")
    
    print("Sandbox preparation complete.")

if __name__ == "__main__":
    main()
