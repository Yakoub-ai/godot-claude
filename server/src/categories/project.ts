import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const projectCategory: CategoryDef = {
  name: "project",
  description: "Project info, filesystem, search, settings, autoloads, UIDs",
  tools: [
    {
      name: "get_project_info",
      description:
        "Get project metadata including name, version, Godot version, main scene, and project structure overview.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_project_info", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_filesystem_tree",
      description:
        "Get the project file and directory tree. Returns paths, types, and sizes. Use filter to narrow results (e.g. '*.gd' for scripts only).",
      schema: {
        path: z
          .string()
          .optional()
          .describe("Root path (default: res://)"),
        filter: z
          .string()
          .optional()
          .describe("Glob filter (e.g. '*.gd')"),
        max_depth: z
          .number()
          .optional()
          .describe("Max depth (default: 10)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_filesystem_tree", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "search_files",
      description:
        "Search for files by name in the project. Returns matching file paths with metadata.",
      schema: {
        query: z.string().describe("Search query"),
        path: z
          .string()
          .optional()
          .describe("Root path to search from (default: res://)"),
        file_type: z
          .string()
          .optional()
          .describe("Extension filter (e.g. 'gd')"),
        max_results: z
          .number()
          .optional()
          .describe("Maximum number of results to return"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("search_files", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "search_in_files",
      description:
        "Search for text content inside project files (grep-like). Skips addons/ and .godot/ directories.",
      schema: {
        query: z.string().describe("Text to search"),
        path: z
          .string()
          .optional()
          .describe("Root path to search from (default: res://)"),
        regex: z
          .boolean()
          .optional()
          .describe("Treat query as regex pattern"),
        file_type: z
          .string()
          .optional()
          .describe("Extension filter (e.g. 'gd')"),
        max_results: z
          .number()
          .optional()
          .describe("Maximum number of results to return"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("search_in_files", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_project_settings",
      description:
        "Read project settings. Optionally filter by section prefix or get a specific key. Returns setting keys with their current values and types.",
      schema: {
        section: z
          .string()
          .optional()
          .describe("Section prefix (e.g. 'display/window')"),
        key: z
          .string()
          .optional()
          .describe("Specific key to retrieve"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_project_settings",
          params,
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_project_setting",
      description:
        "Set a project setting value. Use the full setting key path (e.g. 'display/window/size/viewport_width'). Changes are saved to project.godot.",
      schema: {
        key: z
          .string()
          .describe(
            "Setting key (e.g. 'display/window/size/viewport_width')",
          ),
        value: z
          .union([z.string(), z.number(), z.boolean()])
          .describe("Value to set"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_project_setting", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "uid_to_project_path",
      description:
        "Convert a Godot UID string to its corresponding resource path. UIDs are stable identifiers that survive file renames.",
      schema: {
        uid: z.string().describe("UID string (e.g. 'uid://abc123')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "uid_to_project_path",
          params,
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "project_path_to_uid",
      description:
        "Convert a resource path to its Godot UID. UIDs are stable identifiers that survive file renames.",
      schema: {
        path: z
          .string()
          .describe("Resource path (e.g. 'res://scenes/player.tscn')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "project_path_to_uid",
          params,
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "add_autoload",
      description:
        "Add an autoload singleton to the project. Autoloads are globally accessible scripts or scenes that persist across scene changes. Commonly used for game managers, audio systems, and global state.",
      schema: {
        name: z.string().describe("Autoload name (e.g. 'GameManager')"),
        path: z
          .string()
          .describe(
            "Path to script or scene (e.g. 'res://autoloads/game_manager.gd')",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_autoload", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "remove_autoload",
      description:
        "Remove an autoload singleton from the project. The underlying script or scene file is not deleted.",
      schema: {
        name: z.string().describe("Autoload name to remove"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_autoload", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
