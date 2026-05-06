#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const failures = [];
const warnings = [];

function rel(...parts) {
  return path.join(root, ...parts);
}

function pass(message) {
  console.log(`ok  ${message}`);
}

function fail(message) {
  failures.push(message);
  console.log(`ERR ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.log(`warn ${message}`);
}

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, predicate, out);
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function extractTsMethods() {
  const methods = new Set();
  for (const file of walk(rel("server", "src", "categories"), (p) => p.endsWith(".ts"))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/sendCommand\(\s*"([^"]+)"/g)) {
      methods.add(match[1]);
    }
  }
  return methods;
}

function commandBlock(text, start) {
  const ret = text.indexOf("return {", start);
  if (ret < 0) return "";
  const open = text.indexOf("{", ret);
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return "";
}

function extractPluginMethods() {
  const methods = new Set();
  const commandDir = rel("addons", "godot_mcp", "commands");
  for (const file of readdirSync(commandDir).filter((f) => f.endsWith(".gd"))) {
    const text = readFileSync(path.join(commandDir, file), "utf8");
    const start = text.indexOf("func get_commands()");
    if (start < 0) continue;
    const block = commandBlock(text, start);
    for (const match of block.matchAll(/"([A-Za-z0-9_]+)"\s*:/g)) {
      methods.add(match[1]);
    }
  }
  return methods;
}

function extractUnsupportedMethods() {
  const file = rel("server", "src", "utils", "pluginSupport.ts");
  const text = readFileSync(file, "utf8");
  const block = text.match(/UNSUPPORTED_PLUGIN_METHODS\s*=\s*new Set<string>\(\[([\s\S]*?)\]\)/);
  if (!block) {
    fail("Could not parse UNSUPPORTED_PLUGIN_METHODS");
    return new Set();
  }
  return new Set([...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
}

function sorted(values) {
  return [...values].sort();
}

function difference(a, b) {
  return new Set([...a].filter((x) => !b.has(x)));
}

console.log("godot-claude verification\n");

for (const required of [
  "README.md",
  "LICENSE",
  "CLAUDE.md",
  "server/package.json",
  "server/src/index.ts",
  "addons/godot_mcp/plugin.cfg",
  "addons/godot_mcp/websocket_server.gd",
  "docs-server/main.py",
]) {
  if (existsSync(rel(required))) pass(`${required} exists`);
  else fail(`${required} is missing`);
}

const tsMethods = extractTsMethods();
const pluginMethods = extractPluginMethods();
const unsupported = extractUnsupportedMethods();
const missingInPlugin = difference(tsMethods, pluginMethods);
const missingButNotDeclared = difference(missingInPlugin, unsupported);
const declaredButImplemented = new Set([...unsupported].filter((x) => pluginMethods.has(x)));
const declaredButNotTs = difference(unsupported, tsMethods);
const advertisedWorking = difference(tsMethods, unsupported);
const advertisedWithoutHandler = difference(advertisedWorking, pluginMethods);

if (missingButNotDeclared.size === 0) {
  pass(`all unsupported plugin methods are explicitly declared (${missingInPlugin.size})`);
} else {
  fail(`methods missing from plugin and not declared unsupported: ${sorted(missingButNotDeclared).join(", ")}`);
}

if (declaredButImplemented.size === 0) {
  pass("unsupported manifest does not hide implemented plugin methods");
} else {
  fail(`unsupported manifest hides implemented methods: ${sorted(declaredButImplemented).join(", ")}`);
}

if (declaredButNotTs.size === 0) {
  pass("unsupported manifest only names TypeScript MCP methods");
} else {
  fail(`unsupported manifest contains unknown TypeScript methods: ${sorted(declaredButNotTs).join(", ")}`);
}

if (advertisedWithoutHandler.size === 0) {
  pass(`advertised engine tools have plugin handlers (${advertisedWorking.size} active, ${unsupported.size} hidden)`);
} else {
  fail(`advertised tools without plugin handlers: ${sorted(advertisedWithoutHandler).join(", ")}`);
}

const pkg = JSON.parse(readFileSync(rel("server", "package.json"), "utf8"));
if (pkg.license === "SEE LICENSE IN ../LICENSE") pass("server package points to root license");
else fail("server/package.json license must be SEE LICENSE IN ../LICENSE");

const pyproject = readFileSync(rel("docs-server", "pyproject.toml"), "utf8");
if (pyproject.includes('license = { file = "../LICENSE" }')) pass("docs-server pyproject points to root license");
else fail("docs-server/pyproject.toml must point to root license");

const readme = readFileSync(rel("README.md"), "utf8");
if (readme.includes("Built with Yakoub-ai") && readme.includes("noncommercial")) {
  pass("README documents noncommercial license and Yakoub-ai credit");
} else {
  fail("README must document noncommercial license and Built with Yakoub-ai credit");
}

const license = readFileSync(rel("LICENSE"), "utf8");
if (license.includes("Noncommercial") && license.includes("No Resale") && license.includes("Built with Yakoub-ai")) {
  pass("root LICENSE includes noncommercial, no resale, and credit terms");
} else {
  fail("root LICENSE is missing required noncommercial/no-resale/credit terms");
}

if (!existsSync(rel("docs-server", "docs", "docs_tree.txt"))) {
  warn("docs-server docs are not built; install can still configure fallback docs, but offline docs MCP will be limited");
}

const build = spawnSync("npm", ["run", "build"], {
  cwd: rel("server"),
  encoding: "utf8",
  stdio: "pipe",
});
if (build.status === 0) {
  pass("TypeScript MCP server builds");
} else {
  fail(`TypeScript build failed:\n${build.stdout}${build.stderr}`);
}

console.log(`\nSummary: ${failures.length} failure(s), ${warnings.length} warning(s)`);
if (failures.length > 0) process.exit(1);
