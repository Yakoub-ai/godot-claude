import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, platform, tmpdir } from "node:os";
import { join } from "node:path";
import { findGodot, runProcess, runTool, UserError, type GodotVersion } from "./godot.js";

/** Version-exact Godot class reference, extracted from the editor's offline doc cache. */

interface DocMember {
  name: string;
  description?: string;
  type?: string;
  return_type?: string;
  default_value?: string;
  arguments?: { name: string; type?: string; default_value?: string }[];
  qualifiers?: string;
  enumeration?: string;
  value?: string;
  data_type?: string;
  is_bitfield?: boolean;
  is_deprecated?: boolean;
  deprecated_message?: string;
}

interface DocClass {
  name: string;
  inherits?: string;
  brief_description?: string;
  description?: string;
  methods?: DocMember[];
  properties?: DocMember[];
  signals?: DocMember[];
  constants?: DocMember[];
  theme_properties?: DocMember[];
  annotations?: DocMember[];
  operators?: DocMember[];
  constructors?: DocMember[];
  is_deprecated?: boolean;
  is_experimental?: boolean;
}

let loaded: { key: string; classes: Map<string, DocClass> } | null = null;

function godotCacheDir(): string[] {
  const home = homedir();
  if (platform() === "darwin") return [join(home, "Library", "Caches", "Godot")];
  if (platform() === "win32") return [join(process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"), "Godot")];
  return [join(process.env.XDG_CACHE_HOME ?? join(home, ".cache"), "godot")];
}

function ourCacheDir(): string {
  const base =
    platform() === "win32"
      ? join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "godot-claude")
      : platform() === "darwin"
        ? join(homedir(), "Library", "Caches", "godot-claude")
        : join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "godot-claude");
  mkdirSync(base, { recursive: true });
  return base;
}

async function loadDocs(): Promise<Map<string, DocClass>> {
  const { path, version } = await findGodot();
  const key = version.full;
  if (loaded?.key === key) return loaded.classes;

  const jsonPath = join(ourCacheDir(), `api-${key.replace(/[^\w.-]/g, "_")}.json`);
  if (!existsSync(jsonPath)) await buildDocs(path, version, jsonPath);
  const list = JSON.parse(readFileSync(jsonPath, "utf8")) as DocClass[];
  const classes = new Map(list.map((c) => [c.name, c]));
  loaded = { key, classes };
  return classes;
}

async function buildDocs(godot: string, v: GodotVersion, out: string): Promise<void> {
  const name = `editor_doc_cache-${v.major}.${v.minor}.res`;
  const find = () => godotCacheDir().map((d) => join(d, name)).find((p) => existsSync(p));
  let cache = find();
  if (!cache) {
    // Running the editor once (headless, on an empty throwaway project) generates the cache.
    const tmp = mkdtempSync(join(tmpdir(), "godot-claude-docs-"));
    try {
      writeFileSync(join(tmp, "project.godot"), "config_version=5\n");
      await runProcess(godot, ["--headless", "--editor", "--path", tmp, "--quit-after", "2"], { timeoutMs: 300_000 });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
    cache = find();
  }
  if (!cache) throw new UserError(`Could not generate Godot's doc cache (${name}). Open the Godot editor once and retry.`);
  const tmpProj = mkdtempSync(join(tmpdir(), "godot-claude-docs-"));
  try {
    writeFileSync(join(tmpProj, "project.godot"), "config_version=5\n");
    const r = await runTool<{ ok: boolean; error?: string }>(tmpProj, "docs_dump", { cache, out }, 120_000);
    if (!r.result.ok) throw new UserError(r.result.error ?? "docs dump failed");
  } finally {
    rmSync(tmpProj, { recursive: true, force: true });
  }
}

// ── BBCode → Markdown ────────────────────────────────────────────────────────

export function bbcodeToMarkdown(text: string | undefined): string {
  if (!text) return "";
  let s = text.replace(/\r/g, "");
  s = s.replace(/\[codeblocks\]([\s\S]*?)\[\/codeblocks\]/g, (_m, inner: string) => {
    const gd = /\[gdscript[^\]]*\]([\s\S]*?)\[\/gdscript\]/.exec(inner);
    return gd ? "\n```gdscript\n" + dedent(gd[1] ?? "") + "\n```\n" : "";
  });
  s = s.replace(/\[codeblock[^\]]*\]([\s\S]*?)\[\/codeblock\]/g, (_m, c: string) => "\n```gdscript\n" + dedent(c) + "\n```\n");
  s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/g, "`$1`");
  s = s.replace(/\[(?:b)\]([\s\S]*?)\[\/b\]/g, "**$1**").replace(/\[(?:i)\]([\s\S]*?)\[\/i\]/g, "*$1*");
  s = s.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/g, "$2 ($1)");
  s = s.replace(/\[(?:method|member|signal|constant|enum|annotation|theme_item|constructor|operator|param) ([^\]]+)\]/g, "`$1`");
  s = s.replace(/\[kbd\]([\s\S]*?)\[\/kbd\]/g, "`$1`");
  s = s.replace(/\[br\]/g, "\n").replace(/\[\/?(?:center|u|s|lb|rb|color[^\]]*|font[^\]]*)\]/g, "");
  s = s.replace(/\[([A-Z@][A-Za-z0-9_]*)\]/g, "`$1`");
  return s
    .split("\n")
    .map((l) => l.replace(/^\t+/, "").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dedent(code: string): string {
  const lines = code.replace(/^\n+|\s+$/g, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^\t*/.exec(l)?.[0].length ?? 0));
  return lines.map((l) => l.slice(indent).replace(/\t/g, "    ")).join("\n");
}

function firstSentence(text: string | undefined, max = 140): string {
  const md = bbcodeToMarkdown(text).replace(/```[\s\S]*?```/g, "").replace(/\s+/g, " ").trim();
  const m = /^(.+?[.!?])(\s|$)/.exec(md);
  const s = m?.[1] ?? md;
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function signature(m: DocMember): string {
  const args = (m.arguments ?? [])
    .map((a) => `${a.name}: ${a.type ?? "Variant"}${a.default_value !== undefined ? ` = ${a.default_value}` : ""}`)
    .join(", ");
  const q = m.qualifiers ? ` ${m.qualifiers}` : "";
  return `${m.name}(${args}) -> ${m.return_type ?? "void"}${q}`;
}

function deprecated(m: { is_deprecated?: boolean }): string {
  return m.is_deprecated ? " **[deprecated]**" : "";
}

// ── Queries ──────────────────────────────────────────────────────────────────

function chain(classes: Map<string, DocClass>, name: string): DocClass[] {
  const out: DocClass[] = [];
  let c = classes.get(name);
  while (c && out.length < 20) {
    out.push(c);
    c = c.inherits ? classes.get(c.inherits) : undefined;
  }
  return out;
}

function classSummary(classes: Map<string, DocClass>, c: DocClass, full: boolean): string {
  const anc = chain(classes, c.name).slice(1).map((x) => x.name);
  const parts: string[] = [];
  parts.push(`# ${c.name}${anc.length ? ` (inherits ${anc.join(" < ")})` : ""}${deprecated(c)}${c.is_experimental ? " **[experimental]**" : ""}`);
  parts.push(bbcodeToMarkdown(c.brief_description));
  const desc = bbcodeToMarkdown(c.description);
  if (desc) parts.push(full || desc.length < 1500 ? desc : desc.slice(0, 1500) + "… (pass full: true for the rest)");
  const line = (m: DocMember, body: string) => `- ${body}${deprecated(m)} — ${firstSentence(m.description)}`;
  if (c.properties?.length)
    parts.push("## Properties\n" + c.properties.map((p) => line(p, `${p.name}: ${p.type}${p.default_value !== undefined ? ` = ${p.default_value}` : ""}`)).join("\n"));
  if (c.methods?.length) parts.push("## Methods\n" + c.methods.map((m) => line(m, signature(m))).join("\n"));
  if (c.signals?.length)
    parts.push("## Signals\n" + c.signals.map((s) => line(s, `${s.name}(${(s.arguments ?? []).map((a) => `${a.name}: ${a.type}`).join(", ")})`)).join("\n"));
  if (c.constants?.length) {
    const groups = new Map<string, DocMember[]>();
    for (const k of c.constants) {
      const g = k.enumeration ?? "";
      groups.set(g, [...(groups.get(g) ?? []), k]);
    }
    const txt = [...groups].map(([g, ks]) => (g ? `- enum ${g}: ` : "- constants: ") + ks.map((k) => `${k.name}=${k.value}`).join(", ")).join("\n");
    parts.push("## Enums & constants\n" + txt);
  }
  if (c.theme_properties?.length)
    parts.push("## Theme properties\n" + c.theme_properties.map((t) => `- ${t.data_type} ${t.name}: ${t.type}${t.default_value ? ` = ${t.default_value}` : ""}`).join("\n"));
  if (c.annotations?.length) parts.push("## Annotations\n" + c.annotations.map((a) => line(a, signature(a).replace(/ -> void$/, ""))).join("\n"));
  if (anc.length) parts.push(`Inherited members: look up ${anc[0]} (or \"${c.name}.member\" searches ancestors).`);
  return parts.filter(Boolean).join("\n\n");
}

function memberDetail(classes: Map<string, DocClass>, cls: string, member: string): string | null {
  for (const c of chain(classes, cls)) {
    const kinds: [string, DocMember[] | undefined][] = [
      ["method", c.methods],
      ["property", c.properties],
      ["signal", c.signals],
      ["constant", c.constants],
      ["theme property", c.theme_properties],
      ["annotation", c.annotations],
    ];
    for (const [kind, list] of kinds) {
      const m = list?.find((x) => x.name === member);
      if (!m) continue;
      let head: string;
      if (kind === "method" || kind === "annotation") head = signature(m);
      else if (kind === "property") head = `${m.name}: ${m.type}${m.default_value !== undefined ? ` = ${m.default_value}` : ""}`;
      else if (kind === "signal") head = `signal ${m.name}(${(m.arguments ?? []).map((a) => `${a.name}: ${a.type}`).join(", ")})`;
      else if (kind === "constant") head = `${m.enumeration ? `${m.enumeration}.` : ""}${m.name} = ${m.value}`;
      else head = `${m.data_type} ${m.name}: ${m.type}`;
      const inherited = c.name !== cls ? ` (inherited from ${c.name})` : "";
      return `# ${c.name}.${m.name} — ${kind}${inherited}${deprecated(m)}\n\n\`${head}\`\n\n${bbcodeToMarkdown(m.description) || "(no description)"}${m.deprecated_message ? `\n\nDeprecated: ${bbcodeToMarkdown(m.deprecated_message)}` : ""}`;
    }
  }
  return null;
}

function search(classes: Map<string, DocClass>, query: string, limit = 25): string {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits: { score: number; text: string }[] = [];
  const score = (name: string, desc: string): number => {
    const n = name.toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (n === t) s += 10;
      else if (n.includes(t)) s += 4;
      else if (desc.includes(t)) s += 1;
      else return 0;
    }
    return s;
  };
  for (const c of classes.values()) {
    const cs = score(c.name, (c.brief_description ?? "").toLowerCase());
    if (cs) hits.push({ score: cs + 2, text: `${c.name} (class) — ${firstSentence(c.brief_description)}` });
    for (const [kind, list] of [
      ["method", c.methods],
      ["property", c.properties],
      ["signal", c.signals],
    ] as const) {
      for (const m of list ?? []) {
        const s = score(`${c.name}.${m.name}`, (m.description ?? "").toLowerCase());
        if (s) hits.push({ score: s, text: `${c.name}.${m.name} (${kind}) — ${firstSentence(m.description, 100)}` });
      }
    }
  }
  hits.sort((a, b) => b.score - a.score);
  if (!hits.length) return `No matches for "${query}".`;
  return `Top matches for "${query}":\n` + hits.slice(0, limit).map((h) => `- ${h.text}`).join("\n");
}

/** Entry point: "Class", "Class.member", or a free-text search. */
export async function apiDocs(query: string, opts: { search?: boolean; full?: boolean }): Promise<string> {
  const classes = await loadDocs();
  const q = query.trim();
  if (!q) throw new UserError("query is required");
  if (opts.search) return search(classes, q);
  const [cls, member] = q.split(/\.(.+)/);
  const c = classes.get(cls ?? "") ?? [...classes.values()].find((x) => x.name.toLowerCase() === (cls ?? "").toLowerCase());
  if (!c) return `No class "${cls}". ` + search(classes, q, 10);
  if (member) return memberDetail(classes, c.name, member) ?? `No member "${member}" in ${c.name} or its ancestors. ` + search(classes, `${c.name} ${member}`, 10);
  return classSummary(classes, c, !!opts.full);
}
