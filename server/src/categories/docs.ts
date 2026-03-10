import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const docsCategory: CategoryDef = {
  name: "docs",
  description:
    "Code analysis, unused resources, signal flow, script references, circular deps",
  tools: [
    {
      name: "find_unused_resources",
      description:
        "Scan the project for resource files not referenced by any .tscn, .gd, or .tres file.",
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
          "find_unused_resources",
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
      name: "analyze_signal_flow",
      description:
        "Map all signal connections in the currently edited scene. Returns a graph showing emitters and receivers.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("analyze_signal_flow", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "find_script_references",
      description:
        "Find all places where a script, class_name, or resource is referenced across the project.",
      schema: {
        query: z
          .string()
          .describe(
            "Script path, class_name, or resource path to search for",
          ),
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
          "find_script_references",
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
      name: "detect_circular_dependencies",
      description:
        "Check for circular scene dependencies. Walks all .tscn files and builds a dependency graph.",
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
          "detect_circular_dependencies",
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
      name: "get_class_info",
      description:
        "Get class documentation: methods, properties, signals, enums, and inheritance chain.",
      schema: {
        class_name: z
          .string()
          .describe(
            "Godot class name (e.g. 'CharacterBody2D', 'AnimationPlayer')",
          ),
        include_inherited: z
          .boolean()
          .optional()
          .describe("Include inherited members (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_class_info", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "search_class_api",
      description:
        "Search across all Godot classes for methods, properties, or signals matching a query.",
      schema: {
        query: z
          .string()
          .describe("Search query (method, property, or signal name)"),
        type: z
          .string()
          .optional()
          .describe(
            "Filter: 'method', 'property', 'signal', 'class' (default: all)",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("search_class_api", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
