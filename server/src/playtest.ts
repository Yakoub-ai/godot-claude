import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server, type Socket } from "node:net";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { join, delimiter } from "node:path";
import { platform } from "node:os";
import { findGodot, GODOT_SCRIPTS_DIR, UserError, ensureImported } from "./godot.js";
import { parseDiagnostics, formatDiagnostic, type Diagnostic } from "./diagnostics.js";

/**
 * Playtest sessions: the server launches the game itself with a harness script from outside the
 * project (nothing is written into the project), on a random localhost port, authenticated by a
 * one-time token passed only to that child process via its environment.
 */

export interface StartOptions {
  project: string;
  scene?: string;
  mode: "stepped" | "realtime";
  headless: boolean;
  resolution?: string;
  seed?: number;
}

export interface StepRequest {
  frames: number;
  actions?: unknown[];
  observe?: Record<string, unknown>;
  capture_every?: number;
}

const MAX_SESSIONS = 3;
const IDLE_TIMEOUT_MS = 10 * 60_000;
const MAX_LOG_LINES = 5000;

interface Pending {
  resolve: (v: Record<string, unknown>) => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
}

export class PlaytestSession {
  readonly id: string;
  readonly opts: StartOptions;
  private child: ChildProcess | null = null;
  private server: Server | null = null;
  private socket: Socket | null = null;
  private buf = "";
  private log: string[] = [];
  private reportedUpTo = 0;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private idleTimer: NodeJS.Timeout | null = null;
  private exited = false;
  exitCode: number | null = null;
  info: Record<string, unknown> = {};
  readonly startedAt = Date.now();

  constructor(id: string, opts: StartOptions) {
    this.id = id;
    this.opts = opts;
  }

  async start(): Promise<void> {
    const { path: godot, version } = await findGodot();
    await ensureImported(this.opts.project);
    const token = randomBytes(32).toString("hex");

    this.server = createServer();
    await new Promise<void>((res, rej) => {
      this.server!.once("error", rej);
      this.server!.listen(0, "127.0.0.1", () => res());
    });
    const addr = this.server.address();
    if (!addr || typeof addr === "string") throw new Error("failed to bind playtest port");

    // Decide how to get a display.
    let headless = this.opts.headless;
    let wrapper: string[] = [];
    let note: string | undefined;
    if (!headless && platform() === "linux" && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
      const xvfb = which("xvfb-run");
      if (xvfb) wrapper = [xvfb, "-a", "-s", "-screen 0 1920x1080x24"];
      else {
        headless = true;
        note = "No display and no xvfb-run: running headless (no screenshots). Install xvfb for visual playtests.";
      }
    }

    const args = ["--path", this.opts.project, "--audio-driver", "Dummy"];
    if (headless) args.unshift("--headless");
    if (this.opts.mode === "stepped") args.push("--fixed-fps", "60");
    if (this.opts.resolution) args.push("--resolution", this.opts.resolution);
    if (wrapper.length) args.push("--rendering-driver", "opengl3");
    args.push("--script", join(GODOT_SCRIPTS_DIR, "playtest", "harness.gd"), "--", `--mode=${this.opts.mode}`);
    if (this.opts.scene) args.push(`--scene=${this.opts.scene}`);
    if (this.opts.seed !== undefined) args.push(`--seed=${this.opts.seed}`);

    const cmd = wrapper.length ? wrapper[0]! : godot;
    const fullArgs = wrapper.length ? [...wrapper.slice(1), godot, ...args] : args;
    const env = { ...process.env, GC_PORT: String(addr.port), GC_TOKEN: token };
    this.child = spawn(cmd, fullArgs, { env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    const onData = (d: Buffer) => this.appendLog(d.toString("utf8"));
    this.child.stdout?.on("data", onData);
    this.child.stderr?.on("data", onData);
    this.child.on("exit", (code) => {
      this.exited = true;
      this.exitCode = code;
      this.failAll(new Error(`game exited (code ${code})`));
      this.cleanupNet();
    });
    this.child.on("error", (e) => this.appendLog(`spawn error: ${e.message}\n`));

    const hello = await this.acceptAuthenticated(token, 30_000);
    const ready = await this.waitFor((m) => m.type === "ready" || m.type === "fatal", 60_000);
    if (ready.type === "fatal") throw new UserError(String(ready.error));
    this.info = { engine: hello.engine, headless: hello.headless, mode: hello.mode, scene: ready.scene, godot_version: version.full, ...(note ? { note } : {}) };
    this.touch();
  }

  /** Accepts exactly one connection presenting the correct token; then stops listening. */
  private acceptAuthenticated(token: string, timeoutMs: number): Promise<Record<string, unknown>> {
    const expected = Buffer.from(token, "utf8");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new UserError("Game did not connect within 30s.\n" + this.logTail(40)));
      }, timeoutMs);
      const exitWatch = setInterval(() => {
        if (this.exited) {
          clearTimeout(timer);
          clearInterval(exitWatch);
          reject(new UserError(`Game exited before connecting (code ${this.exitCode}).\n` + this.logTail(40)));
        }
      }, 100);
      this.server!.on("connection", (sock) => {
        if (this.socket) {
          sock.destroy();
          return;
        }
        let first = "";
        const authTimer = setTimeout(() => sock.destroy(), 5000);
        const onFirst = (d: Buffer) => {
          first += d.toString("utf8");
          const nl = first.indexOf("\n");
          if (nl < 0) {
            if (first.length > 4096) sock.destroy();
            return;
          }
          sock.off("data", onFirst);
          clearTimeout(authTimer);
          let msg: Record<string, unknown>;
          try {
            msg = JSON.parse(first.slice(0, nl)) as Record<string, unknown>;
          } catch {
            sock.destroy();
            return;
          }
          const got = Buffer.from(String(msg.token ?? ""), "utf8");
          if (msg.type !== "hello" || got.length !== expected.length || !timingSafeEqual(got, expected)) {
            sock.destroy();
            return;
          }
          this.socket = sock;
          this.server?.close(); // no further connections accepted
          sock.on("data", (more: Buffer) => this.onData(more.toString("utf8")));
          sock.on("close", () => this.failAll(new Error("game connection closed")));
          sock.on("error", () => undefined);
          clearTimeout(timer);
          clearInterval(exitWatch);
          resolve(msg);
          this.onData(first.slice(nl + 1));
        };
        sock.on("data", onFirst);
        sock.on("error", () => undefined);
      });
    });
  }

  private waiters: { pred: (m: Record<string, unknown>) => boolean; resolve: (m: Record<string, unknown>) => void }[] = [];

  private unclaimed: Record<string, unknown>[] = [];

  private waitFor(pred: (m: Record<string, unknown>) => boolean, timeoutMs: number): Promise<Record<string, unknown>> {
    const queued = this.unclaimed.findIndex(pred);
    if (queued >= 0) return Promise.resolve(this.unclaimed.splice(queued, 1)[0]!);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new UserError("Timed out waiting for the game.\n" + this.logTail(40))), timeoutMs);
      const exitWatch = setInterval(() => {
        if (this.exited) {
          clearTimeout(timer);
          clearInterval(exitWatch);
          reject(new UserError(`Game exited (code ${this.exitCode}).\n` + this.logTail(40)));
        }
      }, 100);
      this.waiters.push({
        pred,
        resolve: (m) => {
          clearTimeout(timer);
          clearInterval(exitWatch);
          resolve(m);
        },
      });
    });
  }

  private onData(text: string): void {
    this.buf += text;
    let nl: number;
    while ((nl = this.buf.indexOf("\n")) >= 0) {
      const line = this.buf.slice(0, nl);
      this.buf = this.buf.slice(nl + 1);
      if (!line.trim()) continue;
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (typeof msg.id === "number" && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        clearTimeout(p.timer);
        p.resolve(msg);
        continue;
      }
      const w = this.waiters.findIndex((x) => x.pred(msg));
      if (w >= 0) this.waiters.splice(w, 1)[0]!.resolve(msg);
      else if (this.unclaimed.length < 50) this.unclaimed.push(msg);
    }
  }

  private appendLog(text: string): void {
    for (const line of text.split(/\r?\n/)) {
      if (line) this.log.push(line);
    }
    if (this.log.length > MAX_LOG_LINES) {
      const drop = this.log.length - MAX_LOG_LINES;
      this.log.splice(0, drop);
      this.reportedUpTo = Math.max(0, this.reportedUpTo - drop);
    }
  }

  logTail(n: number): string {
    return this.log.slice(-n).join("\n");
  }

  /** Errors/warnings printed since the last call. */
  newDiagnostics(): Diagnostic[] {
    const fresh = this.log.slice(this.reportedUpTo);
    this.reportedUpTo = this.log.length;
    return parseDiagnostics(fresh.join("\n"));
  }

  allDiagnostics(): Diagnostic[] {
    return parseDiagnostics(this.log.join("\n"));
  }

  /** Game print() output since `since` (non-diagnostic lines). */
  printedLines(since: number): string[] {
    return this.log.slice(since).filter((l) => !/^(\s|ERROR|WARNING|SCRIPT|USER|Godot Engine|ALSA)/.test(l));
  }

  get logLength(): number {
    return this.log.length;
  }

  get alive(): boolean {
    return !this.exited && !!this.socket;
  }

  async send(cmd: Record<string, unknown>, timeoutMs: number): Promise<Record<string, unknown>> {
    if (!this.alive) throw new UserError(`Session ${this.id} is not running (exit code ${this.exitCode}).\n` + this.logTail(30));
    this.touch();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new UserError(`Game did not answer within ${Math.round(timeoutMs / 1000)}s (it may be stuck in an infinite loop).\n` + this.logTail(30)));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.socket!.write(JSON.stringify({ ...cmd, id }) + "\n");
    });
  }

  private failAll(err: Error): void {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new UserError(`${err.message}.\n` + this.logTail(30)));
    }
    this.pending.clear();
  }

  private touch(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => void this.stop(), IDLE_TIMEOUT_MS);
    this.idleTimer.unref();
  }

  private cleanupNet(): void {
    this.socket?.destroy();
    this.socket = null;
    this.server?.close();
    this.server = null;
  }

  async stop(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.alive) {
      try {
        await this.send({ cmd: "quit" }, 3000);
      } catch {
        /* ignore */
      }
    }
    if (this.child && !this.exited) {
      await new Promise<void>((res) => {
        const t = setTimeout(() => {
          this.child?.kill("SIGKILL");
          res();
        }, 3000);
        this.child!.once("exit", () => {
          clearTimeout(t);
          res();
        });
      });
    }
    this.cleanupNet();
  }

  /** Synchronous best-effort kill (process exit). */
  kill(): void {
    if (this.child && !this.exited) this.child.kill("SIGKILL");
  }
}

function which(bin: string): string | null {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    const p = join(dir, bin);
    if (dir && existsSync(p)) return p;
  }
  return null;
}

// ── Registry ─────────────────────────────────────────────────────────────────

const sessions = new Map<string, PlaytestSession>();

export async function startSession(opts: StartOptions): Promise<PlaytestSession> {
  for (const [id, s] of sessions) if (!s.alive) sessions.delete(id);
  if (sessions.size >= MAX_SESSIONS) {
    throw new UserError(`Too many playtest sessions (${sessions.size}). Stop one with playtest_stop: ${[...sessions.keys()].join(", ")}`);
  }
  const id = "pt-" + randomBytes(3).toString("hex");
  const s = new PlaytestSession(id, opts);
  try {
    await s.start();
  } catch (e) {
    await s.stop();
    throw e;
  }
  sessions.set(id, s);
  return s;
}

export function getSession(id: string): PlaytestSession {
  const s = sessions.get(id);
  if (!s) throw new UserError(`No playtest session "${id}". Active: ${[...sessions.keys()].join(", ") || "none"}`);
  return s;
}

export async function stopSession(id: string): Promise<PlaytestSession> {
  const s = getSession(id);
  sessions.delete(id);
  await s.stop();
  return s;
}

export function killAllSessions(): void {
  for (const s of sessions.values()) s.kill();
  sessions.clear();
}

export { formatDiagnostic };
