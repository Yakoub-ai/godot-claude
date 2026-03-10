import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const pluginsCategory: CategoryDef = {
  name: "plugins",
  description: "Editor plugin management, enable/disable, plugin info",
  tools: [
    {
      name: "list_plugins",
      description:
        "List all editor plugins with their enabled/disabled status, version, and description.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("list_plugins", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "enable_plugin",
      description: "Enable an editor plugin by its folder name.",
      schema: {
        plugin: z
          .string()
          .describe("Plugin folder name (e.g. 'my_plugin')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("enable_plugin", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "disable_plugin",
      description: "Disable an editor plugin by its folder name.",
      schema: {
        plugin: z.string().describe("Plugin folder name"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("disable_plugin", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_plugin_info",
      description:
        "Get detailed information about an editor plugin: config, scripts, dependencies.",
      schema: {
        plugin: z.string().describe("Plugin folder name"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_plugin_info", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "create_plugin_scaffold",
      description:
        "Create a new editor plugin scaffold with plugin.cfg and main script.",
      schema: {
        name: z.string().describe("Plugin name (used for folder)"),
        description: z.string().optional().describe("Plugin description"),
        author: z.string().optional().describe("Author name"),
        version: z
          .string()
          .optional()
          .describe("Version string (default: '1.0')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "create_plugin_scaffold",
          params
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_addon_files",
      description:
        "List all files in an addon/plugin directory with optional extension filter.",
      schema: {
        plugin: z.string().describe("Plugin folder name"),
        filter: z
          .string()
          .optional()
          .describe("File extension filter (e.g. 'gd')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_addon_files", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
