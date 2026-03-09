import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const scriptCategory: CategoryDef = {
  name: "script",
  description: "Create, read, edit, attach, validate GDScript files",
  tools: [
    {
      name: "list_scripts",
      description: "List all GDScript/C#/shader files in the project",
      schema: {
        path: z.string().optional().describe("Root path (default: res://)"),
        recursive: z.boolean().optional().describe("Search recursively (default: true)"),
      },
      handler: async (params, godot) => {
        const result = await godot.sendCommand("list_scripts", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "read_script",
      description: "Read the full content of a GDScript file",
      schema: {
        path: z.string().describe("Script path, e.g. 'res://scripts/player.gd'"),
      },
      handler: async (params, godot) => {
        const result = await godot.sendCommand("read_script", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "create_script",
      description: "Create a new GDScript file with content or a template",
      schema: {
        path: z.string().describe("Path for new script, e.g. 'res://scripts/enemy_ai.gd'"),
        content: z.string().optional().describe("Full script content. If empty, generates template."),
        extends: z.string().optional().describe("Base class (default: 'Node'). Used for template."),
        class_name: z.string().optional().describe("Class name. Used for template."),
      },
      handler: async (params, godot) => {
        const result = await godot.sendCommand("create_script", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "edit_script",
      description: "Edit a script via search-replace, full replace, or line insert",
      schema: {
        path: z.string().describe("Script path to edit"),
        replacements: z
          .array(
            z.object({
              search: z.string().describe("Text to find"),
              replace: z.string().describe("Replacement text"),
              regex: z.boolean().optional().describe("Use regex (default: false)"),
            })
          )
          .optional()
          .describe("Search-and-replace operations"),
        content: z.string().optional().describe("Full replacement content (replaces entire file)"),
        insert_at_line: z.number().optional().describe("Line number to insert at (0-indexed)"),
        text: z.string().optional().describe("Text to insert (with insert_at_line)"),
      },
      handler: async (params, godot) => {
        const result = await godot.sendCommand("edit_script", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "attach_script",
      description: "Attach a GDScript file to a node in the scene",
      schema: {
        node_path: z.string().describe("Target node path"),
        script_path: z.string().describe("Script path, e.g. 'res://scripts/player.gd'"),
      },
      handler: async (params, godot) => {
        const result = await godot.sendCommand("attach_script", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "detach_script",
      description: "Remove a script from a node",
      schema: {
        node_path: z.string().describe("Node path to remove script from"),
      },
      handler: async (params, godot) => {
        const result = await godot.sendCommand("detach_script", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "validate_script",
      description:
        "Validate a GDScript file by compiling it. Returns validity status. Use get_editor_errors for detailed error messages on failure.",
      schema: {
        path: z.string().describe("Script path to validate"),
      },
      handler: async (params, godot) => {
        const result = await godot.sendCommand("validate_script", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_open_scripts",
      description: "List all scripts currently open in the Godot script editor",
      schema: {},
      handler: async (params, godot) => {
        const result = await godot.sendCommand("get_open_scripts", {});
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
