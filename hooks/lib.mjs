// Shared helpers for godot-claude hooks. Plain Node (no dependencies).
import { spawnSync } from "node:child_process";
import { existsSync, statSync, readFileSync } from "node:fs";
import { join, dirname, resolve, delimiter } from "node:path";
import { homedir, platform } from "node:os";

export function findProjectRoot(start) {
  let dir = resolve(start);
  try {
    if (statSync(dir).isFile()) dir = dirname(dir);
  } catch {
    dir = dirname(dir);
  }
  for (;;) {
    if (existsSync(join(dir, "project.godot"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function findGodot() {
  const c = [];
  if (process.env.GODOT_BIN) c.push(process.env.GODOT_BIN);
  const names = platform() === "win32" ? ["godot.exe", "godot4.exe", "Godot.exe"] : ["godot", "godot4", "Godot"];
  for (const d of (process.env.PATH ?? "").split(delimiter)) if (d) for (const n of names) c.push(join(d, n));
  if (platform() === "darwin") c.push("/Applications/Godot.app/Contents/MacOS/Godot", join(homedir(), "Applications/Godot.app/Contents/MacOS/Godot"));
  for (const p of c) {
    try {
      if (statSync(p).isFile()) return p;
    } catch {
      /* next */
    }
  }
  return null;
}

export function run(cmd, args, timeoutMs) {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: timeoutMs, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  return { code: r.status, out: (r.stdout ?? "") + "\n" + (r.stderr ?? ""), timedOut: r.error?.code === "ETIMEDOUT" };
}

export function readStdinJson() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

/** Extracts "SCRIPT ERROR"/"Parse Error" messages with res:// locations from Godot output. */
export function scriptErrors(output) {
  const lines = output.split(/\r?\n/);
  const errs = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(?:SCRIPT ERROR|USER SCRIPT ERROR|ERROR): (?:Parse Error: )?(.*)$/.exec(lines[i]);
    if (!m) continue;
    if (/^Failed to load script|ObjectDB|leaked/.test(m[1])) continue;
    const at = /at: .*\((res:\/\/[^:]+):(\d+)\)/.exec(lines[i + 1] ?? "");
    const msg = `${at ? `${at[1]}:${at[2]}: ` : ""}${m[1].replace(" (Warning treated as error.)", " (warning treated as error)")}`;
    if (!errs.includes(msg)) errs.push(msg);
  }
  return errs;
}
