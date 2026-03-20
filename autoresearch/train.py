#!/usr/bin/env python3
"""
Autoresearch train (evaluate) script for Godot-Claude.
This script is run by the meta-agent to evaluate the current state of godot-claude skills.
It acts as the "fitness function" by invoking Claude Code in the sandbox.
"""
import time
import subprocess
import os

SANDBOX_DIR = "/tmp/godot_autoresearch_sandbox"
EVAL_PROMPT = "make a simple godot game with one scene containing a Sprite2D. Then stop and exit."
TIMEOUT_SECS = 300  # 5 minute budget per Karpathy's design

def score_run(log_output, elapsed_time):
    """
    Computes a score based on the run log. 
    Lower is better (like val_loss).
    Penalizes syntax errors and timeouts.
    """
    errors = log_output.lower().count("error")
    success = "task done" in log_output.lower() or "completed" in log_output.lower()
    
    base_score = elapsed_time
    error_penalty = errors * 50
    success_bonus = -100 if success else 200
    
    return base_score + error_penalty + success_bonus

def main():
    if not os.path.exists(SANDBOX_DIR):
        print(f"Error: Sandbox {SANDBOX_DIR} missing. Run prepare.py first.")
        return

    print(f"Starting Autoresearch evaluation run in {SANDBOX_DIR}...")
    start_time = time.time()
    
    try:
        # Run Claude Code CLI headless with the eval prompt
        # In a real environment, we would inject this to stdin or use a test fixture
        print(f"Running Claude evaluation with {TIMEOUT_SECS}s budget...")
        result = subprocess.run(
            ["claude", "-p", EVAL_PROMPT],
            cwd=SANDBOX_DIR,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECS
        )
        elapsed = time.time() - start_time
        final_score = score_run(result.stdout + result.stderr, elapsed)
        
        print(f"Run completed in {elapsed:.1f}s")
        print(f"--- SCORE (lower is better): {final_score:.2f} ---")
        
        # Save score for tracking
        with open("autoresearch_log.txt", "a") as f:
            f.write(f"Score: {final_score:.2f} | Time: {elapsed:.1f}s | Errors: {(result.stdout+result.stderr).lower().count('error')}\n")
            
    except subprocess.TimeoutExpired:
        elapsed = time.time() - start_time
        print(f"Run timed out after {TIMEOUT_SECS}s!")
        print(f"--- SCORE (lower is better): 9999.00 ---")
    except FileNotFoundError:
        print("Error: 'claude' CLI not found on this system. The pipeline requires '@anthropic-ai/claude-code' natively mounted to execute generative loops.")
        print("--- SCORE (lower is better): 10000.00 ---")
        
if __name__ == "__main__":
    main()
