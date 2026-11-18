import { spawn, type SpawnOptions } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir, homedir, platform } from "node:os";
import { join, dirname, resolve, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDiagnostics, type Diagnostic } from "./diagnostics.js";

/** Root of the GDScript tool scripts shipped with the plugin (godot/). */
export const GODOT_SCRIPTS_DIR = (() => {
  const here = dirname(fileURLToPath(import.meta.url));
  // Bundled: server/dist/godot-mcp.mjs ; source: server/src/*.ts
  for (const c of [resolve(here, "../../godot"), resolve(here, "../godot")]) {
    if (existsSync(join(c, "lib", "common.gd"))) return c;
  }
  throw new Error("godot-claude: cannot locate the godot/ scripts directory");
})();

export class UserError extends Error {}

let cachedBinary: { path: string; version: GodotVersion } | null = null;

export interface GodotVersion {
  major: number;
  minor: number;
  patch: number;
  full: string;
}

function candidates(): string[] {
  const out: string[] = [];
  if (process.env.GODOT_BIN) out.push(process.env.GODOT_BIN);
  const names = platform() === "win32" ? ["godot.exe", "godot4.exe", "Godot.exe"] : ["godot", "godot4", "Godot"];
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (!dir) continue;
    for (const n of names) out.push(join(dir, n));
  }
  if (platform() === "darwin") {
    out.push("/Applications/Godot.app/Contents/MacOS/Godot", join(homedir(), "Applications/Godot.app/Contents/MacOS/Godot"));
  }
  return out;
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

export function parseVersion(text: string): GodotVersion | null {
  const m = /(\d+)\.(\d+)(?:\.(\d+))?\.[a-z0-9]+/i.exec(text.trim());
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3] ?? 0), full: text.trim().split(/\s+/).pop() ?? text.trim() };
}

/** Locates a Godot 4.4+ binary (GODOT_BIN, PATH, standard install locations). */
export async function findGodot(): Promise<{ path: string; version: GodotVersion }> {
  if (cachedBinary) return cachedBinary;
  const tried: string[] = [];
  for (const c of candidates()) {
    if (!isFile(c) || tried.includes(c)) continue;
    tried.push(c);
    const r = await runProcess(c, ["--headless", "--version"], { timeoutMs: 20_000 });
    const v = parseVersion(r.stdout.split("\n").filter(Boolean).pop() ?? "");
    if (r.code === 0 && v) {
      if (v.major !== 4 || v.minor < 4) {
        throw new UserError(`Godot ${v.full} at ${c} is not supported. godot-claude needs Godot 4.4 or newer.`);
      }
      cachedBinary = { path: c, version: v };
      return cachedBinary;
    }
  }
  throw new UserError(
    "Godot executable not found. Install Godot 4.4+ and either put it on PATH as `godot` or set GODOT_BIN to its full path " +
      "(e.g. in your shell profile or the MCP server env)."
  );
}

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

const MAX_OUTPUT = 2 * 1024 * 1024;

export function runProcess(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs: number; env?: NodeJS.ProcessEnv; abortOn?: (output: string) => boolean }
): Promise<ProcessResult & { aborted?: boolean }> {
  return new Promise((resolvePromise) => {
    const spawnOpts: SpawnOptions = { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true };
    const child = spawn(cmd, args, spawnOpts);
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let aborted = false;
    const check = () => {
      if (!aborted && opts.abortOn?.(stdout + "\n" + stderr)) {
        aborted = true;
        // Give the engine a moment to print the backtrace lines that follow.
        setTimeout(() => child.kill("SIGKILL"), 300);
      }
    };
    child.stdout?.on("data", (d: Buffer) => {
      if (stdout.length < MAX_OUTPUT) stdout += d.toString("utf8");
      check();
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (stderr.length < MAX_OUTPUT) stderr += d.toString("utf8");
      check();
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, opts.timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      resolvePromise({ code: -1, stdout, stderr: stderr + String(err), timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ code, stdout, stderr, timedOut, aborted });
    });
  });
}

// ── Project resolution & path safety ─────────────────────────────────────────

/** Finds the project root (directory containing project.godot), starting at `start` and walking up. */
export function resolveProject(start?: string): string {
  let dir = resolve(start ?? process.env.GODOT_PROJECT ?? process.cwd());
  if (isFile(dir) && dir.endsWith("project.godot")) dir = dirname(dir);
  for (;;) {
    if (isFile(join(dir, "project.godot"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new UserError(
    `No project.godot found in ${resolve(start ?? process.cwd())} or its parents. ` +
      "Pass `project` (path to the Godot project folder) or run Claude Code from inside the project."
  );
}

/** Validates a res:// path: no traversal, no backslashes, no control characters. */
export function resPath(p: string, exts?: string[]): string {
  if (typeof p !== "string" || !p.startsWith("res://")) throw new UserError(`Expected a res:// path, got "${p}"`);
  const rest = p.slice("res://".length);
  if (rest.split("/").some((seg) => seg === "..") || /[\\\0-\x1f]/.test(rest)) {
    throw new UserError(`Unsafe path "${p}": must stay inside the project`);
  }
  if (exts && !exts.some((e) => p.endsWith(e))) throw new UserError(`"${p}" must end with ${exts.join(" or ")}`);
  return p;
}

export function resToAbs(project: string, p: string): string {
  return join(project, resPath(p).slice("res://".length));
}

/** Reads the minimum engine version declared in project.godot (config/features), e.g. "4.4". */
export function projectEngineVersion(project: string): string | null {
  try {
    const text = readFileSync(join(project, "project.godot"), "utf8");
    const m = /config\/features=PackedStringArray\(([^)]*)\)/.exec(text);
    const v = m?.[1]?.match(/"(\d+\.\d+)"/);
    return v?.[1] ?? null;
  } catch {
    return null;
  }
}

export function versionWarning(project: string, v: GodotVersion): string | null {
  const pv = projectEngineVersion(project);
  if (!pv) return null;
  const [maj, min] = pv.split(".").map(Number);
  if (maj === v.major && min === v.minor) return null;
  return (
    `Project targets Godot ${pv} but the server is using ${v.major}.${v.minor} (${v.full}). ` +
    `Files saved by the server use ${v.major}.${v.minor}'s format. Set GODOT_BIN to the same version as your editor.`
  );
}

// ── Import tracking ──────────────────────────────────────────────────────────

const lastImport = new Map<string, number>();
const IMPORT_RELEVANT = /\.(gd|cs|png|jpe?g|webp|svg|bmp|tga|exr|hdr|glb|gltf|blend|fbx|obj|dae|wav|ogg|mp3|ttf|otf|woff2?|fnt|csv|tscn|tres)$/i;

function newestMtime(dir: string, depth = 0): number {
  let newest = 0;
  let entries: import("node:fs").Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (depth < 12 && !existsSync(join(full, ".gdignore"))) newest = Math.max(newest, newestMtime(full, depth + 1));
    } else if (IMPORT_RELEVANT.test(e.name)) {
      try {
        newest = Math.max(newest, statSync(full).mtimeMs);
      } catch {
        /* vanished */
      }
    }
  }
  return newest;
}

/**
 * Runs `godot --import` when assets or scripts changed since the last import, so new textures load
 * and new `class_name`s are registered before scripts are compiled.
 */
export async function ensureImported(project: string, force = false): Promise<Diagnostic[]> {
  const marker = join(project, ".godot", "global_script_class_cache.cfg");
  let last = lastImport.get(project) ?? 0;
  if (!last && existsSync(marker)) last = statSync(marker).mtimeMs;
  if (!force && last && newestMtime(project) <= last) return [];
  const { path } = await findGodot();
  const started = Date.now();
  const r = await runProcess(path, ["--headless", "--path", project, "--import"], { timeoutMs: 600_000 });
  lastImport.set(project, started);
  if (r.timedOut) throw new UserError("Godot import timed out after 10 minutes");
  return parseDiagnostics(r.stdout + "\n" + r.stderr).filter((d) => d.severity === "error");
}

// ── Running tool scripts ─────────────────────────────────────────────────────

export interface ToolRun<T> {
  result: T;
  diagnostics: Diagnostic[];
  output: string;
}

/** Runs godot/tools/<tool>.gd headlessly against a project with a JSON request; returns its JSON result. */
export async function runTool<T = Record<string, unknown>>(
  project: string,
  tool: string,
  request: unknown,
  timeoutMs = 120_000,
  extraArgs: string[] = []
): Promise<ToolRun<T>> {
  const { path } = await findGodot();
  const dir = mkdtempSync(join(tmpdir(), "godot-claude-"));
  try {
    const reqFile = join(dir, "request.json");
    const resFile = join(dir, "result.json");
    writeFileSync(reqFile, JSON.stringify(request ?? {}), { mode: 0o600 });
    const script = join(GODOT_SCRIPTS_DIR, "tools", `${tool}.gd`);
    // A script error inside our own tool scripts means _initialize() aborted and quit() will never run.
    const ownError = new RegExp(`(SCRIPT ERROR|Parse Error)[^\\n]*\\n[^\\n]*at: [^\\n]*${escapeRe(GODOT_SCRIPTS_DIR)}`);
    const r = await runProcess(
      path,
      ["--headless", "--path", project, ...extraArgs, "--script", script, "--", `--request=${reqFile}`, `--result=${resFile}`],
      { timeoutMs, abortOn: (out) => ownError.test(out) }
    );
    const output = r.stdout + "\n" + r.stderr;
    if (r.aborted) {
      throw new Error(`godot-claude tool script "${tool}" failed (please report this bug):\n` + parseDiagnostics(output).map((d) => `- ${d.message} ${d.file ?? ""}:${d.line ?? ""}`).join("\n"));
    }
    if (r.timedOut) throw new UserError(`Godot timed out after ${timeoutMs / 1000}s running ${tool}`);
    if (!existsSync(resFile)) {
      const diags = parseDiagnostics(output);
      throw new UserError(
        `Godot exited (code ${r.code}) without a result for ${tool}.\n` +
          (diags.length ? diags.map((d) => `- ${d.message}${d.file ? ` (${d.file}:${d.line})` : ""}`).join("\n") : output.slice(-2000))
      );
    }
    return { result: JSON.parse(readFileSync(resFile, "utf8")) as T, diagnostics: parseDiagnostics(output), output };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
