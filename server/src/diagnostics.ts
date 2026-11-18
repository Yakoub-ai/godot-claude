/** Parses Godot's console output (4.4+) into structured, de-duplicated diagnostics. */

export interface Diagnostic {
  severity: "error" | "warning";
  kind: string; // SCRIPT ERROR, USER ERROR, ERROR, WARNING, ...
  message: string;
  file?: string;
  line?: number;
  function?: string;
  backtrace?: string[];
  count: number;
}

const HEADER = /^(USER SCRIPT ERROR|USER ERROR|USER WARNING|SCRIPT ERROR|SCRIPT WARNING|ERROR|WARNING|Parse Error):\s?(.*)$/;
const AT = /^\s+at:\s+(.*?)\s*\(([^()]*?):(\d+)\)\s*$/;
const AT_LOOSE = /^\s+at:\s+(.*)$/;
const TRACE = /^\s+\[\d+\]\s+(.*)$/;

/** Engine/environment noise that is never actionable for game developers. */
const NOISE: RegExp[] = [
  /ALSA lib/,
  /audio_driver_alsa|All audio drivers failed|PulseAudio|init_output_device/,
  /ObjectDB instances leaked|instances? (was|were) leaked|resources still in use at exit/i,
  /Your video card drivers seem not to support|X11: |XOpenIM|xkbcommon|Xvfb|Couldn't open X display/,
  /vulkan|Vulkan|OpenGL API|GLES3|swrast|llvmpipe|libEGL|MESA/,
  /Could not create directory.*editor/,
  /^Godot Engine v/,
  /--fixed-fps/,
];

export function isNoise(message: string): boolean {
  return NOISE.some((r) => r.test(message));
}

export function parseDiagnostics(output: string): Diagnostic[] {
  const lines = output.split(/\r?\n/);
  const out: Diagnostic[] = [];
  const index = new Map<string, Diagnostic>();

  for (let i = 0; i < lines.length; i++) {
    const m = HEADER.exec(lines[i] ?? "");
    if (!m) continue;
    const kind = m[1] ?? "ERROR";
    let message = (m[2] ?? "").trim();
    const d: Diagnostic = { severity: /WARNING/.test(kind) ? "warning" : "error", kind, message, count: 1 };
    // Following indented lines: "at: func (file:line)" and optional backtrace.
    let j = i + 1;
    for (; j < lines.length; j++) {
      const l = lines[j] ?? "";
      if (!/^\s/.test(l) || l.trim() === "") break;
      const at = AT.exec(l);
      if (at && d.file === undefined) {
        d.function = at[1];
        d.file = at[2];
        d.line = Number(at[3]);
        continue;
      }
      const tr = TRACE.exec(l);
      if (tr) {
        (d.backtrace ??= []).push(tr[1] ?? "");
        continue;
      }
      if (AT_LOOSE.test(l) || /GDScript backtrace/.test(l)) continue;
    }
    i = j - 1;
    // Engine C++ locations (file.cpp/.h) are not useful; prefer res:// from the backtrace or message.
    if (d.file && !d.file.startsWith("res://")) {
      const fromTrace = d.backtrace?.map((t) => /\((res:\/\/[^:]+):(\d+)\)/.exec(t)).find(Boolean);
      if (fromTrace) {
        d.file = fromTrace[1];
        d.line = Number(fromTrace[2]);
      } else {
        delete d.file;
        delete d.line;
        delete d.function;
      }
    }
    if (!d.file) {
      const inMsg = /(res:\/\/[^\s"':)]+)(?::(\d+))?/.exec(message);
      if (inMsg) {
        d.file = inMsg[1];
        if (inMsg[2]) d.line = Number(inMsg[2]);
      }
    }
    if (isNoise(message)) continue;
    message = message.replace(/\s*\(Warning treated as error\.\)/, " (warning treated as error)");
    d.message = message;
    const key = `${d.severity}|${d.file ?? ""}|${d.line ?? ""}|${message}`;
    const prev = index.get(key);
    if (prev) {
      prev.count++;
      continue;
    }
    index.set(key, d);
    out.push(d);
  }
  return out;
}

export function formatDiagnostic(d: Diagnostic): string {
  const loc = d.file ? `${d.file}${d.line ? `:${d.line}` : ""}: ` : "";
  const times = d.count > 1 ? ` (x${d.count})` : "";
  return `${d.severity.toUpperCase()} ${loc}${d.message}${times}`;
}
