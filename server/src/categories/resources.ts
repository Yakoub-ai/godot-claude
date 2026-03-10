import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const resourcesCategory: CategoryDef = {
  name: "resources",
  description:
    "Read, create, edit .tres resources, preview textures, list resource types",
  tools: [
    {
      name: "read_resource",
      description:
        "Read a .tres resource file and return its properties.",
      schema: {
        path: z
          .string()
          .describe("Path to resource (e.g. 'res://themes/main_theme.tres')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("read_resource", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "edit_resource",
      description:
        "Edit properties of an existing .tres resource file. Changes saved immediately.",
      schema: {
        path: z.string().describe("Path to resource"),
        properties: z
          .record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean()]),
          )
          .describe("Properties to set as key-value pairs"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("edit_resource", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "create_resource",
      description:
        "Create a new .tres resource file of a given type with optional initial properties.",
      schema: {
        path: z.string().describe("Path to save resource"),
        type: z
          .string()
          .describe("Resource type (e.g. 'StyleBoxFlat', 'LabelSettings')"),
        properties: z
          .record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean()]),
          )
          .optional()
          .describe("Initial properties"),
        overwrite: z
          .boolean()
          .optional()
          .describe("Overwrite if exists (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_resource", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_resource_preview",
      description:
        "Get a visual preview of an image or texture resource as a PNG.",
      schema: {
        path: z
          .string()
          .describe("Path to resource (e.g. 'res://assets/player.png')"),
        max_size: z
          .number()
          .optional()
          .describe("Max width/height in pixels (default: 256)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = (await godot.sendCommand(
          "get_resource_preview",
          params,
        )) as Record<string, unknown>;
        if (result && typeof result === "object" && "image_base64" in result) {
          return {
            content: [
              {
                type: "image" as const,
                data: result.image_base64 as string,
                mimeType: "image/png",
              },
              {
                type: "text" as const,
                text: `Preview of ${result.path}: ${result.width}x${result.height}`,
              },
            ],
          };
        }
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "duplicate_resource",
      description: "Duplicate a resource file to a new path.",
      schema: {
        source: z.string().describe("Source resource path"),
        destination: z.string().describe("Destination path"),
        overwrite: z
          .boolean()
          .optional()
          .describe("Overwrite if exists (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("duplicate_resource", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "list_resource_properties",
      description:
        "List all configurable properties of a Godot resource type with their defaults.",
      schema: {
        type: z
          .string()
          .describe(
            "Resource class name (e.g. 'StyleBoxFlat', 'Environment')",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "list_resource_properties",
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
      name: "get_resource_dependencies",
      description:
        "Get all resources that a given resource depends on (textures, scripts, sub-resources).",
      schema: {
        path: z.string().describe("Path to the resource file"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_resource_dependencies",
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
      name: "rename_resource",
      description:
        "Rename or move a resource file, optionally updating all references.",
      schema: {
        old_path: z.string().describe("Current resource path"),
        new_path: z.string().describe("New resource path"),
        update_references: z
          .boolean()
          .optional()
          .describe(
            "Update references in .tscn/.gd/.tres files (default: true)",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("rename_resource", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
