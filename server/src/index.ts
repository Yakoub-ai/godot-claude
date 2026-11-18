import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { resolveProject, resPath, UserError, findGodot } from "./godot.js";
import { apiDocs } from "./docs.js";
import { check, projectInfo, runTests, sceneEdit, sceneRead } from "./tools.js";
import { startSession, getSession, stopSession, killAllSessions, formatDiagnostic } from "./playtest.js";

const VERSION = "2.0.0";

const server = new McpServer(
  { name: "godot", version: VERSION },
  {
    instructions:
      "Headless Godot 4.4+ tools. Typical loop: project_info → write code/scenes → check → run_tests → playtest_* → fix. " +
      "Prefer scene_edit over hand-writing .tscn files. Use api_docs before using an unfamiliar class or method. " +
      "All paths are res:// paths inside the project.",
  }
);

const projectArg = z.string().optional().describe("Path to the Godot project folder. Defaults to the current working directory (or its nearest parent with project.godot).");

function text(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 1) }] };
}

/** Wraps a handler: user-facing errors become isError results instead of protocol errors. */
function safe<A>(fn: (args: A) => Promise<CallToolResult>): (args: A) => Promise<CallToolResult> {
  return async (args: A) => {
    try {
      return await fn(args);
    } catch (e) {
      const msg = e instanceof UserError ? e.message : `Internal error: ${e instanceof Error ? e.stack ?? e.message : String(e)}`;
      return { content: [{ type: "text", text: msg }], isError: true };
    }
  };
}

server.registerTool(
  "project_info",
  {
    title: "Project info",
    description:
      "Summarize the Godot project: engine version, main scene, autoloads, input actions, physics layer names, window/stretch settings, renderer, addons, and lists of scenes/scripts/resources. Call this first in a session.",
    inputSchema: { project: projectArg },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ project }) => text(await projectInfo(resolveProject(project))))
);

server.registerTool(
  "check",
  {
    title: "Check project",
    description:
      "Compile every GDScript file and load every scene headlessly (runs an asset import first). Returns errors with res:// file:line, failed scenes, and missing dependencies. Run after every batch of code or scene changes; fix all errors before playtesting.",
    inputSchema: {
      project: projectArg,
      paths: z.array(z.string()).optional().describe("Only check these res:// .gd/.tscn files (default: whole project)."),
      include_addons: z.boolean().optional().describe("Also check res://addons (default false)."),
    },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ project, paths, include_addons }) => text(await check(resolveProject(project), paths, include_addons ?? false)))
);

server.registerTool(
  "scene_read",
  {
    title: "Read scene",
    description:
      "Read a .tscn without running any game code: node tree (paths relative to the root, types, scripts, groups, instanced sub-scenes), stored non-default properties, and signal connections.",
    inputSchema: {
      project: projectArg,
      scene: z.string().describe("res:// path of the scene"),
      properties: z.boolean().optional().describe("Include stored properties (default true)."),
    },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ project, scene, properties }) => text(await sceneRead(resolveProject(project), scene, properties ?? true)))
);

const opSchema = z
  .looseObject({
    op: z.enum(["add", "set", "remove", "rename", "move", "script", "connect", "disconnect", "groups"]),
  })
  .describe("One edit operation; see the tool description for fields.");

server.registerTool(
  "scene_edit",
  {
    title: "Edit or create scene",
    description: `Create or modify a .tscn using Godot's own serializer (correct UIDs, sub-resources, and ownership). All ops apply atomically: if one fails, nothing is saved. Game code (_ready/_process) never runs.
Node paths are relative to the scene root ("." = root, "Player/Sprite").
Ops:
- {op:"add", parent:".", type:"Sprite2D" | scene:"res://enemy.tscn", name?, props?, script?, groups?}  (type may be an engine class or a script class_name)
- {op:"set", node, props:{...}}
- {op:"remove", node} · {op:"rename", node, name} · {op:"move", node, parent, index?}
- {op:"script", node, path:"res://x.gd" | null}
- {op:"connect"|"disconnect", from, signal, to, method}   (saved as a persistent connection)
- {op:"groups", node, add?:[...], remove?:[...]}
Values: JSON numbers/bools/strings; arrays for vectors/colors ([x,y], [r,g,b,a]); Godot literals ("Vector3(0, 1, 0)", "Color(1, 0, 0)", "#ff8800"); {"$res":"res://tex.png"} to reference a resource file; {"$new":"RectangleShape2D","size":[32,32]} for a built-in sub-resource. Property names are validated (with suggestions).
Create a new scene with create:{type:"Node2D", name?, script?, props?} or create:{inherits:"res://base.tscn"}.`,
    inputSchema: {
      project: projectArg,
      scene: z.string().describe("res:// path ending in .tscn"),
      create: z
        .looseObject({ type: z.string().optional(), name: z.string().optional(), inherits: z.string().optional(), script: z.string().optional() })
        .optional()
        .describe("Create a new scene with this root instead of editing an existing one."),
      overwrite: z.boolean().optional().describe("Allow create to replace an existing file."),
      ops: z.array(opSchema).default([]),
    },
  },
  safe(async ({ project, scene, create, overwrite, ops }) =>
    text(await sceneEdit(resolveProject(project), { scene, ...(create ? { create } : {}), ...(overwrite ? { overwrite } : {}), ops }))
  )
);

server.registerTool(
  "api_docs",
  {
    title: "Godot API docs",
    description:
      "Official class reference for the exact installed Godot version (offline). query: \"CharacterBody2D\" (class overview), \"CharacterBody2D.move_and_slide\" (one member, searches ancestors), \"@GDScript\" / \"@GlobalScope\", or set search:true for free text (\"raycast 3d\"). First call may take ~10s to build the cache.",
    inputSchema: {
      query: z.string(),
      search: z.boolean().optional(),
      full: z.boolean().optional().describe("Do not truncate the class description."),
    },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ query, search, full }) => text(await apiDocs(query, { search: search ?? false, full: full ?? false })))
);

server.registerTool(
  "run_tests",
  {
    title: "Run tests",
    description:
      "Run the project's tests with godot-claude's built-in runner (nothing to install). Discovers res://test(s)/**/test_*.gd; each test is `func test_x(t) -> void` using t.eq / t.is_true / t.almost / t.instantiate(scene) / await t.physics_frames(n) / t.tap(action) / t.watch(obj, signal). Runtime script errors during a test fail it. See the godot-testing skill for the full API.",
    inputSchema: {
      project: projectArg,
      dirs: z.array(z.string()).optional().describe("Test roots (default res://test and res://tests)."),
      select: z.string().optional().describe("Only files whose path contains this text."),
      name: z.string().optional().describe("Only test methods whose name contains this text."),
      timeout_sec: z.number().int().min(5).max(1800).optional().describe("Default 300."),
    },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ project, dirs, select, name, timeout_sec }) =>
    text(await runTests(resolveProject(project), { ...(dirs ? { dirs } : {}), ...(select ? { select } : {}), ...(name ? { name } : {}), timeoutSec: timeout_sec ?? 300 }))
  )
);

// ── Playtesting ──────────────────────────────────────────────────────────────

server.registerTool(
  "playtest_start",
  {
    title: "Start playtest",
    description:
      "Launch the game (main scene or `scene`) under a harness that lets you drive it. mode 'stepped' (default) freezes the game between playtest_step calls, so each step advances exactly N frames at 60 fps: deterministic, fast, and the right choice for verification. 'realtime' lets it run freely. Windowed by default so screenshots work (uses xvfb on Linux servers); headless:true is faster but has no screenshots. Nothing is added to the project. Returns a session_id.",
    inputSchema: {
      project: projectArg,
      scene: z.string().optional().describe("res:// scene to run (default: project main scene)."),
      mode: z.enum(["stepped", "realtime"]).optional(),
      headless: z.boolean().optional(),
      resolution: z.string().regex(/^\d{2,5}x\d{2,5}$/).optional().describe("Window size, e.g. 1280x720."),
      seed: z.number().int().optional().describe("Seed the global RNG (games that call randomize() override this)."),
    },
  },
  safe(async ({ project, scene, mode, headless, resolution, seed }) => {
    if (scene) resPath(scene, [".tscn", ".scn"]);
    const s = await startSession({
      project: resolveProject(project),
      ...(scene ? { scene } : {}),
      mode: mode ?? "stepped",
      headless: headless ?? false,
      ...(resolution ? { resolution } : {}),
      ...(seed !== undefined ? { seed } : {}),
    });
    const diags = s.newDiagnostics();
    return text({
      session_id: s.id,
      ...s.info,
      ...(diags.length ? { errors_on_startup: diags.map(formatDiagnostic) } : {}),
      next: "playtest_step with frames/actions/observe; playtest_stop when done.",
    });
  })
);

server.registerTool(
  "playtest_step",
  {
    title: "Step playtest",
    description: `Advance a playtest by \`frames\` (60 = 1 second), applying input actions on given frames, then observe.
actions (each may have "frame": offset within this step, default 0):
- {press:"jump"} {release:"jump"} {tap:"jump", hold?:n} — input-map actions (strength optional)
- {key:"Space"} (tap) or {key:"W", pressed:true/false} · {mouse_move:[x,y]} · {click:[x,y], button?:"right"}
- {call:"Player", method:"take_damage", args:[1]} · {set:"Player", props:{position:[100,200]}} · {change_scene:"res://..."}
observe: {nodes:["Player", {path:"/root/GameState", props:["score"]}], groups:["enemies"], tree:{root?, depth?}, autoloads:true, screenshot:true | {scale:0.5}}
capture_every: N also returns a screenshot every N frames (max 8) to judge motion/animation.
Node paths are relative to the current scene; use /root/Name for autoloads. Returns observations, screenshots, new errors and print output.`,
    inputSchema: {
      session_id: z.string(),
      frames: z.number().int().min(0).max(36000).default(1),
      actions: z.array(z.looseObject({ frame: z.number().int().min(0).optional() })).optional(),
      observe: z.looseObject({}).optional(),
      capture_every: z.number().int().min(0).optional(),
    },
  },
  safe(async ({ session_id, frames, actions, observe, capture_every }) => {
    const s = getSession(session_id);
    const logStart = s.logLength;
    const timeout = Math.max(30_000, s.opts.mode === "realtime" ? (frames / 60) * 1000 * 2 + 30_000 : frames * 20 + 30_000);
    const resp = await s.send({ cmd: "step", frames, actions: actions ?? [], observe: observe ?? {}, capture_every: capture_every ?? 0 }, timeout);
    if (resp.ok === false) throw new UserError(String(resp.error));
    const diags = s.newDiagnostics();
    const printed = s.printedLines(logStart).slice(-40);
    const content: CallToolResult["content"] = [];
    const body: Record<string, unknown> = {
      frames_advanced: resp.frames_advanced,
      observation: resp.observation,
      ...(resp.action_results ? { action_results: resp.action_results } : {}),
      ...(diags.length ? { errors: diags.map(formatDiagnostic) } : {}),
      ...(printed.length ? { printed } : {}),
    };
    if (observe?.screenshot && s.info.headless) body.screenshot_note = "Session is headless: no screenshots. Start without headless:true.";
    content.push({ type: "text", text: JSON.stringify(body, null, 1) });
    for (const f of (resp.frames as { frame: number; png: string }[] | undefined) ?? []) {
      if (!f.png) continue;
      content.push({ type: "text", text: `frame +${f.frame}:` });
      content.push({ type: "image", data: f.png, mimeType: "image/png" });
    }
    if (typeof resp.screenshot === "string" && resp.screenshot) {
      content.push({ type: "text", text: `final frame:` });
      content.push({ type: "image", data: resp.screenshot, mimeType: "image/png" });
    }
    return { content };
  })
);

server.registerTool(
  "playtest_stop",
  {
    title: "Stop playtest",
    description: "Stop a playtest session and get a summary of all errors and warnings it produced.",
    inputSchema: { session_id: z.string() },
  },
  safe(async ({ session_id }) => {
    const s = await stopSession(session_id);
    const all = s.allDiagnostics();
    return text({
      stopped: session_id,
      seconds: Math.round((Date.now() - s.startedAt) / 1000),
      errors: all.filter((d) => d.severity === "error").map(formatDiagnostic),
      warnings: all.filter((d) => d.severity === "warning").map(formatDiagnostic),
    });
  })
);

async function main(): Promise<void> {
  const shutdown = () => {
    killAllSessions();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", () => killAllSessions());
  process.stdin.on("close", shutdown);

  await server.connect(new StdioServerTransport());
  findGodot().catch((e: unknown) => console.error(`[godot-claude] ${e instanceof Error ? e.message : String(e)}`));
}

main().catch((e: unknown) => {
  console.error("[godot-claude] fatal:", e);
  process.exit(1);
});
