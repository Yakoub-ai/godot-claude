import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const batchCategory: CategoryDef = {
  name: "batch",
  description:
    "Bulk operations, scene analysis, cross-scene edits, project statistics",
  tools: [
    {
      name: "find_nodes_by_type",
      description:
        "Find all nodes of a given type in the current scene tree. Returns matching node paths, names, and properties. Use recursive=false to search only direct children of root.",
      schema: {
        type: z
          .string()
          .describe("Node class (e.g. 'Sprite2D', 'Label')"),
        recursive: z
          .boolean()
          .optional()
          .describe("Search recursively (default: true)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("find_nodes_by_type", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "find_signal_connections",
      description:
        "Find signal connections in the current scene. Optionally filter by signal name or node path. Returns source node, signal name, target node, and method for each connection.",
      schema: {
        signal_name: z
          .string()
          .optional()
          .describe("Filter by signal name"),
        node_path: z
          .string()
          .optional()
          .describe("Filter by node path"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "find_signal_connections",
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
      name: "batch_set_property",
      description:
        "Set a property on ALL nodes of a given type in the current scene. For example, set 'visible' to false on all Sprite2D nodes. Affects only the currently edited scene.",
      schema: {
        type: z.string().describe("Node type to target"),
        property: z.string().describe("Property name"),
        value: z
          .union([z.string(), z.number(), z.boolean()])
          .describe("Value to set"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("batch_set_property", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "find_node_references",
      description:
        "Search all project files (.gd, .tscn, .tres) for a text pattern. Returns matching file paths and line contents. Useful for finding where a node, resource, or variable is used.",
      schema: {
        pattern: z.string().describe("Text pattern to search"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("find_node_references", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_scene_dependencies",
      description:
        "Get all resource dependencies for a scene or resource file. Returns referenced scripts, textures, sub-scenes, materials, and other resources. Useful for understanding what a scene needs.",
      schema: {
        path: z
          .string()
          .describe(
            "Path to scene/resource (e.g. 'res://scenes/player.tscn')",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_scene_dependencies",
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
      name: "cross_scene_set_property",
      description:
        "Set a property on all nodes of a given type across ALL scene files in the project.",
      schema: {
        type: z.string().describe("Node type"),
        property: z.string().describe("Property name"),
        value: z
          .union([z.string(), z.number(), z.boolean()])
          .describe("Value to set"),
        path_filter: z
          .string()
          .optional()
          .describe("Directory to search (default: 'res://')"),
        exclude_addons: z
          .boolean()
          .optional()
          .describe("Exclude addons/ (default: true)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "cross_scene_set_property",
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
      name: "analyze_scene_complexity",
      description:
        "Analyze a scene's complexity: total node count, max nesting depth, nodes by type, scripts, potential issues.",
      schema: {
        path: z
          .string()
          .optional()
          .describe("Scene path (default: current scene)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "analyze_scene_complexity",
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
      name: "get_project_statistics",
      description:
        "Get overall project statistics: file counts by extension, total script lines, scene count, autoloads, plugins.",
      schema: {
        path: z
          .string()
          .optional()
          .describe("Root path (default: res://)"),
        include_addons: z
          .boolean()
          .optional()
          .describe("Include addons/ (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_project_statistics",
          params,
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
