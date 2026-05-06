import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GodotConnection } from "./connection.js";
import { formatErrorForMcp } from "./utils/errors.js";
import { isPluginSupportedMethod } from "./utils/pluginSupport.js";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export type ToolContent = Array<
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
>;

export interface ToolResult {
  [key: string]: unknown;
  content: ToolContent;
  isError?: boolean;
}

export interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (
    params: Record<string, unknown>,
    godot: GodotConnection
  ) => Promise<ToolResult>;
}

export interface CategoryDef {
  name: string;
  description: string;
  tools: ToolDef[];
}

export class CategoryRegistry {
  private categories = new Map<string, CategoryDef>();
  private loaded = new Set<string>();
  private coreCategories = new Set<string>();
  private idleTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private toolToCategory = new Map<string, string>();
  private server: McpServer;
  private godot: GodotConnection;

  constructor(server: McpServer, godot: GodotConnection) {
    this.server = server;
    this.godot = godot;
  }

  register(def: CategoryDef, core = false): void {
    const supportedDef: CategoryDef = {
      ...def,
      tools: def.tools.filter((tool) => isPluginSupportedMethod(tool.name)),
    };

    if (supportedDef.tools.length === 0 && !core) {
      console.error(
        `[godot-engine-mcp] Skipping category '${def.name}' because the bundled Godot plugin has no supported handlers for it`
      );
      return;
    }

    this.categories.set(supportedDef.name, supportedDef);
    if (core) {
      this.coreCategories.add(supportedDef.name);
    }
    for (const tool of supportedDef.tools) {
      this.toolToCategory.set(tool.name, supportedDef.name);
    }
  }

  enableCategory(name: string): string[] {
    const def = this.categories.get(name);
    if (!def) {
      throw new Error(`Unknown category: ${name}. Use list_categories to see available categories.`);
    }

    if (this.loaded.has(name)) {
      this.resetIdleTimer(name);
      return def.tools.map((t) => t.name);
    }

    for (const tool of def.tools) {
      const godot = this.godot;
      this.server.tool(
        tool.name,
        tool.description,
        tool.schema,
        async (params) => {
          this.resetIdleTimer(name);
          if (!this.loaded.has(name)) {
            return {
              content: [{
                type: "text" as const,
                text: `Category '${name}' is disabled. Call enable_category with category='${name}' before using ${tool.name}.`,
              }],
              isError: true,
            };
          }
          try {
            return await tool.handler(params as Record<string, unknown>, godot);
          } catch (e) {
            return {
              content: [{ type: "text" as const, text: formatErrorForMcp(e) }],
              isError: true,
            };
          }
        }
      );
    }

    this.loaded.add(name);
    this.resetIdleTimer(name);
    console.error(`[godot-engine-mcp] Enabled category: ${name} (${def.tools.length} tools)`);
    return def.tools.map((t) => t.name);
  }

  disableCategory(name: string): void {
    if (this.coreCategories.has(name)) {
      throw new Error(`Cannot disable core category: ${name}`);
    }

    if (!this.loaded.has(name)) return;

    // MCP SDK doesn't support unregistering tools at runtime,
    // so we track state and return errors for disabled tools.
    // The tools remain registered but become no-ops that tell the agent to re-enable.
    this.loaded.delete(name);
    this.clearIdleTimer(name);
    console.error(`[godot-engine-mcp] Disabled category: ${name}`);
  }

  isCategoryLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  listCategories(): Array<{
    name: string;
    description: string;
    tools: number;
    loaded: boolean;
    core: boolean;
  }> {
    const result = [];
    for (const [name, def] of this.categories) {
      result.push({
        name,
        description: def.description,
        tools: def.tools.length,
        loaded: this.loaded.has(name),
        core: this.coreCategories.has(name),
      });
    }
    return result.sort((a, b) => {
      if (a.core && !b.core) return -1;
      if (!a.core && b.core) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  enableAllCore(): void {
    for (const name of this.coreCategories) {
      this.enableCategory(name);
    }
  }

  registerMetaTools(): void {
    this.server.tool(
      "list_categories",
      "List all available tool categories with descriptions, tool counts, and load status. Call this to discover what tools are available before enabling a category.",
      {},
      async () => {
        const categories = this.listCategories();
        const lines = categories.map((c) => {
          const status = c.loaded ? "[LOADED]" : "[available]";
          const core = c.core ? " (core)" : "";
          return `${status} ${c.name}${core} — ${c.description} (${c.tools} tools)`;
        });
        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }
    );

    this.server.tool(
      "enable_category",
      "Load a tool category to make its tools available. Call list_categories first to see what's available. Core categories are always loaded.",
      { category: z.string().describe("Category name to enable, e.g. 'animation'") },
      async ({ category }) => {
        try {
          const tools = this.enableCategory(category as string);
          return {
            content: [{
              type: "text" as const,
              text: `Enabled '${category}' — ${tools.length} tools now available:\n${tools.map((t) => `  • ${t}`).join("\n")}`,
            }],
          };
        } catch (e) {
          return {
            content: [{ type: "text" as const, text: (e as Error).message }],
            isError: true,
          };
        }
      }
    );

    this.server.tool(
      "disable_category",
      "Unload a non-core tool category to free up context. Core categories cannot be disabled.",
      { category: z.string().describe("Category name to disable") },
      async ({ category }) => {
        try {
          this.disableCategory(category as string);
          return {
            content: [{
              type: "text" as const,
              text: `Disabled '${category}'. Tools from this category are no longer active.`,
            }],
          };
        } catch (e) {
          return {
            content: [{ type: "text" as const, text: (e as Error).message }],
            isError: true,
          };
        }
      }
    );

    this.server.tool(
      "server_status",
      "Get godot-engine-mcp server status: connection state, loaded categories, port, version.",
      {},
      async () => {
        const loaded = [...this.loaded].sort();
        const available = [...this.categories.keys()].filter((n) => !this.loaded.has(n)).sort();
        const lines = [
          `godot-engine-mcp v1.0.0`,
          `Godot connection: ${this.godot.isConnected() ? "connected" : "disconnected"}`,
          `WebSocket port: ${this.godot.getPort()}`,
          `Loaded categories (${loaded.length}): ${loaded.join(", ") || "none"}`,
          `Available categories (${available.length}): ${available.join(", ") || "none"}`,
        ];
        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }
    );
  }

  private resetIdleTimer(name: string): void {
    if (this.coreCategories.has(name)) return; // Core never idles out

    this.clearIdleTimer(name);
    this.idleTimers.set(
      name,
      setTimeout(() => {
        console.error(`[godot-engine-mcp] Auto-disabling idle category: ${name}`);
        this.disableCategory(name);
      }, IDLE_TIMEOUT_MS)
    );
  }

  private clearIdleTimer(name: string): void {
    const timer = this.idleTimers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.idleTimers.delete(name);
    }
  }
}
