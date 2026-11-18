// PostToolUse hook: after Claude writes/edits a .gd file, compile it with Godot and feed errors
// back (exit 2 + stderr). Hand-edited .tscn/.tres files are load-checked too. Silent when Godot is
// not installed or the file is outside a Godot project.
import { relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { findGodot, findProjectRoot, readStdinJson, run, scriptErrors } from "./lib.mjs";

const input = readStdinJson();
const file = input?.tool_input?.file_path;
if (typeof file !== "string" || !/\.(gd|tscn|tres)$/.test(file)) process.exit(0);

const root = findProjectRoot(file);
const godot = findGodot();
if (!root || !godot) process.exit(0);

const res = "res://" + relative(root, file).split(sep).join("/");
if (res.startsWith("res://..") || res.includes("/.godot/")) process.exit(0);

function checkScript() {
  return run(godot, ["--headless", "--path", root, "--check-only", "--script", res], 30_000);
}

let errors = [];
if (file.endsWith(".gd")) {
  let r = checkScript();
  errors = scriptErrors(r.out);
  // A brand-new class_name (or a new file it references) isn't in the class cache yet: import, retry.
  if (errors.some((e) => /not declared in the current scope|Could not find type|Identifier .* not declared|Could not resolve/.test(e))) {
    run(godot, ["--headless", "--path", root, "--import"], 120_000);
    r = checkScript();
    errors = scriptErrors(r.out);
  }
} else if (file.endsWith(".tscn")) {
  const here = dirname(fileURLToPath(import.meta.url));
  const tool = join(here, "..", "godot", "tools", "check.gd");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const dir = fs.mkdtempSync(join(os.tmpdir(), "godot-claude-hook-"));
  try {
    fs.writeFileSync(join(dir, "req.json"), JSON.stringify({ paths: [res] }), { mode: 0o600 });
    const r = run(godot, ["--headless", "--path", root, "--script", tool, "--", `--request=${join(dir, "req.json")}`, `--result=${join(dir, "res.json")}`], 60_000);
    errors = scriptErrors(r.out);
    try {
      const result = JSON.parse(fs.readFileSync(join(dir, "res.json"), "utf8"));
      for (const s of result.failed_scenes ?? []) errors.push(`${s.path}: ${s.reason}`);
      for (const m of result.missing_dependencies ?? []) errors.push(`${m.scene}: missing dependency ${m.dependency}`);
    } catch {
      /* no result */
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

if (errors.length) {
  process.stderr.write(`Godot reports problems in ${res}:\n${errors.slice(0, 20).map((e) => `- ${e}`).join("\n")}\nFix these before continuing.\n`);
  process.exit(2);
}
process.exit(0);
