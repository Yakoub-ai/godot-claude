// SessionStart hook: if the session is inside a Godot project, add a short orientation to context.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findGodot, findProjectRoot, readStdinJson, run } from "./lib.mjs";

const input = readStdinJson();
const root = findProjectRoot(input.cwd ?? process.cwd());
if (!root) process.exit(0);

let name = "";
let features = "";
try {
  const text = readFileSync(join(root, "project.godot"), "utf8");
  name = /config\/name="([^"]*)"/.exec(text)?.[1] ?? "";
  features = /config\/features=PackedStringArray\(([^)]*)\)/.exec(text)?.[1]?.match(/"(\d+\.\d+)"/)?.[1] ?? "";
} catch {
  /* unreadable */
}

const godot = findGodot();
let engine = "NOT FOUND — tell the user to install Godot 4.4+ and set GODOT_BIN (or put `godot` on PATH); MCP tools will not work until then.";
if (godot) {
  const r = run(godot, ["--headless", "--version"], 10_000);
  engine = (r.out.trim().split(/\s+/).pop() ?? "unknown") + ` (${godot})`;
}

const lines = [
  `Godot project detected: "${name}" at ${root}${features ? ` (targets Godot ${features})` : ""}.`,
  `Godot binary: ${engine}`,
  "godot-claude is active: use the `godot` MCP tools (project_info, check, scene_read/scene_edit, api_docs, run_tests, playtest_*) and the godot-dev skill for workflow and standards. For new games start with the game-design skill.",
];
process.stdout.write(lines.join("\n") + "\n");
