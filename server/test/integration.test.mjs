// End-to-end tests: drive the bundled MCP server over stdio against real Godot fixture projects.
// Requires a Godot 4.4+ binary (GODOT_BIN or `godot` on PATH). Run: npm run build && npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const fixtures = join(repo, "tests", "fixtures");
const work = mkdtempSync(join(tmpdir(), "gc-test-"));
const P2D = join(work, "platformer2d");
const P3D = join(work, "scene3d");
const BROKEN = join(work, "broken");
const canScreenshot = process.platform !== "linux" || !!process.env.DISPLAY || existsSync("/usr/bin/xvfb-run");

let client;

before(async () => {
  for (const name of ["platformer2d", "scene3d", "broken"]) {
    cpSync(join(fixtures, name), join(work, name), { recursive: true, filter: (s) => !s.includes(`${name}/.godot`) });
  }
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(repo, "server", "dist", "godot-mcp.mjs")],
    env: { ...process.env },
    stderr: "inherit",
  });
  client = new Client({ name: "godot-claude-tests", version: "1.0.0" });
  await client.connect(transport);
});

after(async () => {
  await client?.close();
  rmSync(work, { recursive: true, force: true });
});

async function call(name, args) {
  const r = await client.callTool({ name, arguments: args });
  const texts = r.content.filter((c) => c.type === "text").map((c) => c.text);
  const images = r.content.filter((c) => c.type === "image");
  let json = null;
  try {
    json = JSON.parse(texts[0]);
  } catch {
    /* not json */
  }
  return { isError: !!r.isError, text: texts.join("\n"), json, images };
}

test("lists the expected tools", async () => {
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["api_docs", "check", "playtest_start", "playtest_step", "playtest_stop", "project_info", "run_tests", "scene_edit", "scene_read"]);
});

test("project_info summarizes settings", async () => {
  const r = await call("project_info", { project: P2D });
  assert.equal(r.isError, false, r.text);
  assert.equal(r.json.main_scene, "res://scenes/main.tscn");
  assert.equal(r.json.autoloads[0].name, "GameState");
  assert.ok(r.json.input_actions.jump);
  assert.equal(r.json.layer_names["2d_physics/layer_2"], "player");
});

test("check passes on a clean project", async () => {
  const r = await call("check", { project: P2D });
  assert.equal(r.json.ok, true, r.text);
});

test("check reports parse errors with file:line and missing dependencies", async () => {
  const r = await call("check", { project: BROKEN });
  assert.equal(r.json.ok, false);
  assert.ok(r.json.errors.some((e) => e.includes("res://scripts/parse_error.gd:4")), r.text);
  assert.ok(r.json.missing_dependencies.some((d) => d.dependency === "res://scripts/gone.gd"), r.text);
});

test("scene_read returns nodes, props and groups", async () => {
  const r = await call("scene_read", { project: P2D, scene: "res://scenes/main.tscn" });
  const player = r.json.nodes.find((n) => n.path === "Player");
  assert.equal(player.script, "res://scripts/player.gd");
  assert.deepEqual(player.groups, ["player"]);
  const shape = r.json.nodes.find((n) => n.path === "Floor/Shape");
  assert.equal(shape.properties.shape.$new, "RectangleShape2D");
});

test("scene_edit applies ops atomically and validates input", async () => {
  const ok = await call("scene_edit", {
    project: P2D,
    scene: "res://scenes/main.tscn",
    ops: [
      { op: "add", parent: ".", type: "Area2D", name: "Coin", props: { position: [300, 280] }, groups: ["coins"] },
      { op: "add", parent: "Coin", type: "CollisionShape2D", name: "Shape", props: { shape: { $new: "CircleShape2D", radius: 12 } } },
      { op: "set", node: "Player", props: { speed: 250 } },
      { op: "connect", from: "Coin", signal: "body_entered", to: ".", method: "_on_coin_body_entered" },
    ],
  });
  assert.equal(ok.isError, false, ok.text);
  const tscn = readFileSync(join(P2D, "scenes", "main.tscn"), "utf8");
  assert.match(tscn, /\[node name="Coin" type="Area2D"/);
  assert.match(tscn, /speed = 250/);
  assert.match(tscn, /\[connection signal="body_entered" from="Coin"/);

  const typo = await call("scene_edit", { project: P2D, scene: "res://scenes/main.tscn", ops: [{ op: "set", node: "Player", props: { sped: 1 } }] });
  assert.equal(typo.isError, true);
  assert.match(typo.text, /did you mean: speed/);

  const before = readFileSync(join(P2D, "scenes", "main.tscn"), "utf8");
  const partial = await call("scene_edit", {
    project: P2D,
    scene: "res://scenes/main.tscn",
    ops: [{ op: "add", parent: ".", type: "Node2D", name: "Ghost" }, { op: "remove", node: "Nope" }],
  });
  assert.equal(partial.isError, true);
  assert.equal(readFileSync(join(P2D, "scenes", "main.tscn"), "utf8"), before, "failed batch must not write");

  const inject = await call("scene_edit", { project: P2D, scene: "res://scenes/main.tscn", ops: [{ op: "set", node: "Player", props: { position: 'Object(Node,"name":"x")' } }] });
  assert.equal(inject.isError, true);

  const codegen = await call("scene_edit", { project: P2D, scene: "res://scenes/main.tscn", ops: [{ op: "set", node: "Player", props: { script: { $new: "GDScript", source_code: "extends Node" } } }] });
  assert.equal(codegen.isError, true);
  assert.match(codegen.text, /Script resources from input is not allowed/);

  const resTraversal = await call("scene_edit", { project: P2D, scene: "res://scenes/main.tscn", ops: [{ op: "set", node: "Player/Visual", props: { material: { $res: "res://../../etc/passwd" } } }] });
  assert.equal(resTraversal.isError, true);

  const traversal = await call("scene_edit", { project: P2D, scene: "res://../evil.tscn", create: { type: "Node" }, ops: [] });
  assert.equal(traversal.isError, true);
  assert.match(traversal.text, /inside the project/);
});

test("scene_edit creates 3D scenes with sub-resources", async () => {
  const r = await call("scene_edit", {
    project: P3D,
    scene: "res://levels/arena.tscn",
    create: { type: "Node3D", name: "Arena" },
    ops: [
      { op: "add", parent: ".", type: "MeshInstance3D", name: "Floor", props: { mesh: { $new: "PlaneMesh", size: [20, 20] } } },
      { op: "add", parent: ".", type: "StaticBody3D", name: "Wall", props: { position: "Vector3(0, 1, -5)" } },
      { op: "add", parent: "Wall", type: "CollisionShape3D", name: "Shape", props: { shape: { $new: "BoxShape3D", size: [10, 2, 0.5] } } },
    ],
  });
  assert.equal(r.isError, false, r.text);
  const tscn = readFileSync(join(P3D, "levels", "arena.tscn"), "utf8");
  assert.match(tscn, /uid="uid:\/\//);
  assert.match(tscn, /PlaneMesh/);
});

test("api_docs: class, inherited member, search", async () => {
  const cls = await call("api_docs", { query: "CharacterBody2D" });
  assert.match(cls.text, /# CharacterBody2D \(inherits PhysicsBody2D/);
  assert.match(cls.text, /move_and_slide\(\) -> bool/);
  const member = await call("api_docs", { query: "CharacterBody2D.global_position" });
  assert.match(member.text, /inherited from Node2D/);
  const s = await call("api_docs", { query: "raycast 3d", search: true });
  assert.match(s.text, /RayCast3D/);
});

test("run_tests: passing suite", async () => {
  const r = await call("run_tests", { project: P2D });
  assert.equal(r.json.ok, true, r.text);
  assert.match(r.json.summary, /3\/3 passed/);
});

test("run_tests: failures and runtime errors are reported", async () => {
  const r = await call("run_tests", { project: BROKEN });
  assert.equal(r.json.ok, false);
  const fails = r.json.failures.join("\n");
  assert.match(fails, /test_fails \[failed\]/);
  assert.match(fails, /math: expected 3, got 2/);
  assert.match(fails, /test_runtime_error \[error\]/);
  assert.match(fails, /Invalid access to property or key 'missing'/);
});

test("playtest: stepped mode is deterministic and drives input", { timeout: 120_000 }, async () => {
  const start = await call("playtest_start", { project: P2D, headless: !canScreenshot });
  assert.equal(start.isError, false, start.text);
  const id = start.json.session_id;
  try {
    await call("playtest_step", { session_id: id, frames: 30 });
    const step = await call("playtest_step", {
      session_id: id,
      frames: 30,
      actions: [{ press: "move_right" }, { tap: "jump" }, { frame: 29, release: "move_right" }],
      observe: { nodes: [{ path: "Player", props: ["position", "jumps"] }, { path: "/root/GameState", props: ["score"] }], screenshot: canScreenshot },
      capture_every: canScreenshot ? 15 : 0,
    });
    assert.equal(step.isError, false, step.text);
    const player = step.json.observation.nodes.Player;
    assert.equal(player.jumps, 1);
    const x = Number(/Vector2\(([\d.]+)/.exec(player.position)[1]);
    assert.ok(x > 150, `player moved right (x=${x})`);
    if (canScreenshot) assert.ok(step.images.length >= 2, "screenshots returned");

    const call2 = await call("playtest_step", {
      session_id: id,
      frames: 1,
      actions: [{ call: "/root/GameState", method: "add_points", args: [5] }, { press: "nope" }],
      observe: { nodes: [{ path: "/root/GameState", props: ["score"] }], tree: { depth: 2 } },
    });
    assert.equal(call2.json.observation.nodes["/root/GameState"].score, 5);
    assert.match(call2.json.action_results[0].call, /add_points/);
    assert.match(call2.json.action_results[1].error, /unknown input action 'nope'/);

    const evil = await call("playtest_step", { session_id: id, frames: 1, actions: [{ call: ".", method: "set_script", args: [{ $new: "GDScript", source_code: "extends Node" }] }] });
    assert.match(evil.json.action_results[0].error, /not allowed/);
    assert.ok(call2.json.observation.tree.some((l) => l.includes("Player (CharacterBody2D)")));
  } finally {
    const stop = await call("playtest_stop", { session_id: id });
    assert.equal(stop.isError, false, stop.text);
  }
});

test("playtest: 3D scene renders a screenshot", { skip: !canScreenshot, timeout: 120_000 }, async () => {
  const start = await call("playtest_start", { project: P3D, resolution: "640x360" });
  assert.equal(start.isError, false, start.text);
  const id = start.json.session_id;
  try {
    const step = await call("playtest_step", { session_id: id, frames: 10, observe: { nodes: ["Box"], screenshot: true } });
    assert.equal(step.images.length, 1);
    assert.ok(Buffer.from(step.images[0].data, "base64").length > 2000, "non-trivial PNG");
    assert.notEqual(step.json.observation.nodes.Box.rotation_degrees, "Vector3(0, 0, 0)");
  } finally {
    await call("playtest_stop", { session_id: id });
  }
});

test("playtest: runtime errors surface in step results", { timeout: 120_000 }, async () => {
  const start = await call("playtest_start", { project: P2D, headless: true });
  const id = start.json.session_id;
  try {
    const r = await call("playtest_step", { session_id: id, frames: 1, actions: [{ call: "Player", method: "get_node", args: ["DoesNotExist"] }] });
    assert.ok((r.json.errors ?? []).some((e) => /DoesNotExist|not found/i.test(e)), r.text);
  } finally {
    await call("playtest_stop", { session_id: id });
  }
});

test("playtest rejects unsafe scene paths and unknown sessions", async () => {
  const bad = await call("playtest_start", { project: P2D, scene: "res://../x.tscn" });
  assert.equal(bad.isError, true);
  const none = await call("playtest_step", { session_id: "pt-nope", frames: 1 });
  assert.equal(none.isError, true);
});
