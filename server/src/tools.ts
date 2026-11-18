import { parseDiagnostics, formatDiagnostic, type Diagnostic } from "./diagnostics.js";
import { ensureImported, findGodot, resPath, runTool, UserError, versionWarning } from "./godot.js";

/** Tool implementations that run one-shot headless Godot scripts. */

export async function projectInfo(project: string): Promise<Record<string, unknown>> {
  const { version } = await findGodot();
  await ensureImported(project);
  const r = await runTool<{ ok: boolean; info: Record<string, unknown> }>(project, "project_info", {});
  const warn = versionWarning(project, version);
  return { project, godot_binary_version: version.full, ...(warn ? { version_warning: warn } : {}), ...r.result.info };
}

export interface CheckReport {
  ok: boolean;
  summary: string;
  errors: string[];
  warnings: string[];
  failed_scenes: unknown[];
  missing_dependencies: unknown[];
}

export async function check(project: string, paths: string[] | undefined, includeAddons: boolean): Promise<CheckReport> {
  for (const p of paths ?? []) resPath(p, [".gd", ".tscn", ".scn"]);
  const importDiags = await ensureImported(project, true);
  const r = await runTool<{
    scripts_checked: number;
    scenes_checked: number;
    failed_scripts: { path: string }[];
    failed_scenes: { path: string; reason: string }[];
    missing_dependencies: unknown[];
  }>(project, "check", { paths: paths ?? [], include_addons: includeAddons }, 300_000);

  // Attribute errors between "@@GC_FILE" markers; drop generic "Failed to load script" echoes.
  const diags = attribute(r.output, "@@GC_FILE ").filter((d) => !/^Failed to (load|instantiate) script/.test(d.message));
  const all = dedupe([...importDiags, ...diags]);
  const errors = all.filter((d) => d.severity === "error").map(formatDiagnostic);
  const warnings = all.filter((d) => d.severity === "warning").map(formatDiagnostic);
  const res = r.result;
  const ok = errors.length === 0 && res.failed_scripts.length === 0 && res.failed_scenes.length === 0 && res.missing_dependencies.length === 0;
  return {
    ok,
    summary: `${res.scripts_checked} scripts, ${res.scenes_checked} scenes checked: ${ok ? "no problems" : `${res.failed_scripts.length} scripts and ${res.failed_scenes.length} scenes failed`}`,
    errors,
    warnings,
    failed_scenes: res.failed_scenes,
    missing_dependencies: res.missing_dependencies,
  };
}

function dedupe(ds: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  return ds.filter((d) => {
    const k = `${d.file}|${d.line}|${d.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Parses diagnostics and fills in a file for location-less ones from the nearest preceding marker. */
function attribute(output: string, marker: string): (Diagnostic & { context?: string })[] {
  const chunks = output.split(new RegExp(`^${marker.replace(/[@]/g, "\\$&")}`, "m"));
  const out: (Diagnostic & { context?: string })[] = [];
  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    const ctx = nl > 0 ? chunk.slice(0, nl).trim() : "";
    for (const d of parseDiagnostics(chunk)) {
      if (!d.file && ctx.startsWith("res://")) d.file = ctx;
      out.push(ctx ? { ...d, context: ctx } : d);
    }
  }
  return out;
}

export async function sceneRead(project: string, scene: string, properties: boolean): Promise<unknown> {
  resPath(scene, [".tscn", ".scn"]);
  await ensureImported(project);
  const r = await runTool<{ ok: boolean; error?: string }>(project, "scene_read", { scene, properties });
  if (!r.result.ok) throw new UserError(r.result.error ?? "scene_read failed");
  return r.result;
}

export async function sceneEdit(project: string, req: { scene: string; create?: unknown; overwrite?: boolean; ops: unknown[] }): Promise<unknown> {
  resPath(req.scene, [".tscn"]);
  for (const op of req.ops) {
    for (const key of ["scene", "script", "path"] as const) {
      const v = (op as Record<string, unknown>)[key];
      if (typeof v === "string") resPath(v);
    }
  }
  const { version } = await findGodot();
  await ensureImported(project);
  const r = await runTool<{ ok: boolean; error?: string }>(project, "scene_edit", req);
  const errors = r.diagnostics.filter((d) => d.severity === "error").map(formatDiagnostic);
  if (!r.result.ok) throw new UserError((r.result.error ?? "scene_edit failed") + (errors.length ? "\n" + errors.join("\n") : ""));
  const warn = versionWarning(project, version);
  return { ...r.result, ...(warn ? { version_warning: warn } : {}), ...(errors.length ? { engine_errors: errors } : {}) };
}

interface TestEntry {
  script: string;
  name: string;
  status: string;
  failures?: string[];
  [k: string]: unknown;
}

export async function runTests(project: string, opts: { dirs?: string[]; select?: string; name?: string; timeoutSec: number }): Promise<Record<string, unknown>> {
  for (const d of opts.dirs ?? []) resPath(d);
  await ensureImported(project);
  let run;
  try {
    run = await runTool<{ total: number; passed: number; failed: number; tests: TestEntry[]; skipped: unknown[]; files: number }>(
      project,
      "run_tests",
      { dirs: opts.dirs, select: opts.select ?? "", name: opts.name ?? "" },
      opts.timeoutSec * 1000,
      ["--fixed-fps", "60"]
    );
  } catch (e) {
    if (e instanceof UserError && /timed out/.test(e.message)) {
      throw new UserError(`${e.message}. A test probably awaits something that never happens (signal never emitted, infinite loop).`);
    }
    throw e;
  }
  // Runtime script errors printed while a test ran mark that test as an error.
  const byTest = new Map<string, Diagnostic[]>();
  for (const d of attribute(run.output, "@@GC_TEST ")) {
    if (d.severity !== "error" || !d.context) continue;
    byTest.set(d.context, [...(byTest.get(d.context) ?? []), d]);
  }
  const res = run.result;
  const lines: string[] = [];
  for (const t of res.tests) {
    const errs = byTest.get(`${t.script}::${t.name}`) ?? [];
    if (errs.length) {
      t.status = t.status === "passed" ? "error" : t.status;
      t.runtime_errors = errs.map(formatDiagnostic);
    }
    if (t.status !== "passed") {
      lines.push(`✗ ${t.script} :: ${t.name} [${t.status}]`);
      for (const f of t.failures ?? []) lines.push(`    ${f}`);
      for (const f of (t.runtime_errors as string[] | undefined) ?? []) lines.push(`    ${f}`);
    }
  }
  const loadErrs = [...byTest.entries()].filter(([k]) => k.endsWith("::<load>")).flatMap(([, v]) => v.map(formatDiagnostic));
  const passed = res.tests.filter((t) => t.status === "passed").length;
  const summary = res.files === 0
    ? "No tests found. Create res://test/test_<feature>.gd (see the godot-testing skill)."
    : `${passed}/${res.tests.length} passed in ${res.files} file(s)`;
  return {
    ok: res.files > 0 && passed === res.tests.length && loadErrs.length === 0,
    summary,
    ...(lines.length ? { failures: lines } : {}),
    ...(loadErrs.length ? { load_errors: loadErrs } : {}),
    ...(res.skipped.length ? { skipped: res.skipped } : {}),
    tests: res.tests.map((t) => `${t.status === "passed" ? "✓" : "✗"} ${t.script.replace(/^res:\/\//, "")} :: ${t.name}`),
  };
}
