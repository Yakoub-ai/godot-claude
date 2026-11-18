// Tests for the plugin hooks (PostToolUse GDScript check, SessionStart context).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const work = mkdtempSync(join(tmpdir(), "gc-hooks-"));
const proj = join(work, "p");
cpSync(join(repo, "tests", "fixtures", "platformer2d"), proj, { recursive: true, filter: (s) => !s.includes("/.godot") });

function hook(script, input) {
  const r = spawnSync(process.execPath, [join(repo, "hooks", script)], { input: JSON.stringify(input), encoding: "utf8", timeout: 120_000 });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

test.after(() => rmSync(work, { recursive: true, force: true }));

test("check hook passes valid scripts", () => {
  const r = hook("check-godot-file.mjs", { tool_name: "Edit", tool_input: { file_path: join(proj, "scripts", "player.gd") } });
  assert.equal(r.code, 0, r.stderr);
});

test("check hook blocks scripts with errors and reports file:line", () => {
  const f = join(proj, "scripts", "bad.gd");
  writeFileSync(f, 'extends Node\n\nfunc _ready() -> void:\n\tvar x: int = "s"\n');
  const r = hook("check-godot-file.mjs", { tool_name: "Write", tool_input: { file_path: f } });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /res:\/\/scripts\/bad\.gd:4/);
});

test("check hook resolves newly added class_name references", () => {
  writeFileSync(join(proj, "scripts", "coin.gd"), "class_name Coin\nextends Area2D\n");
  const f = join(proj, "scripts", "uses_coin.gd");
  writeFileSync(f, "extends Node\n\nvar coin: Coin\n");
  const r = hook("check-godot-file.mjs", { tool_name: "Write", tool_input: { file_path: f } });
  assert.equal(r.code, 0, r.stderr);
});

test("check hook ignores non-Godot files", () => {
  const r = hook("check-godot-file.mjs", { tool_name: "Write", tool_input: { file_path: join(work, "notes.txt") } });
  assert.equal(r.code, 0);
});

test("session-start hook describes the project only inside Godot projects", () => {
  const inside = hook("session-start.mjs", { cwd: proj });
  assert.match(inside.stdout, /Godot project detected: "Fixture Platformer 2D"/);
  const outside = hook("session-start.mjs", { cwd: work });
  assert.equal(outside.stdout, "");
});
