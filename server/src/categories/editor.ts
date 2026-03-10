import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const editorCategory: CategoryDef = {
  name: "editor",
  description: "Editor errors, output log, screenshots, execute editor scripts",
  tools: [
    {
      name: "get_editor_errors",
      description: "Get recent errors from the editor log. Returns error messages, warnings, and script errors.",
      schema: {
        max_lines: z.number().optional().describe("Max log lines to scan (default: 50)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_editor_errors", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_output_log",
      description: "Read the editor Output panel contents. Captures all output including print() statements, warnings, and errors.",
      schema: {
        max_lines: z.number().optional().describe("Max lines from end (default: 100)"),
        filter: z.string().optional().describe("Filter lines containing substring"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_output_log", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "clear_output",
      description: "Clear the editor Output panel.",
      schema: {},
      handler: async (_params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("clear_output", {});
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_editor_screenshot",
      description: "Capture a screenshot of the editor 2D/3D viewport. Returns the image for visual inspection.",
      schema: {},
      handler: async (_params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_editor_screenshot", {}) as Record<string, unknown>;
        if (result && typeof result === "object" && "image_base64" in result) {
          return {
            content: [
              { type: "image" as const, data: result.image_base64 as string, mimeType: "image/png" },
              { type: "text" as const, text: `Editor screenshot: ${result.width}x${result.height}` },
            ],
          };
        }
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_game_screenshot",
      description: "Capture a screenshot of the running game. The game must be running (use play_scene first).",
      schema: {},
      handler: async (_params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_game_screenshot", {}) as Record<string, unknown>;
        if (result && typeof result === "object" && "image_base64" in result) {
          const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
            { type: "image" as const, data: result.image_base64 as string, mimeType: "image/png" },
            { type: "text" as const, text: `Game screenshot: ${result.width}x${result.height}${result.note ? ` — ${result.note}` : ""}` },
          ];
          return { content };
        }
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "compare_screenshots",
      description: "Pixel-diff two screenshots. Returns similarity metrics and a diff image highlighting changed pixels. Useful for visual regression testing.",
      schema: {
        image_a: z.string().describe("First image: file path or base64 PNG"),
        image_b: z.string().describe("Second image: file path or base64 PNG"),
        threshold: z.number().optional().describe("Color diff threshold 0-255 (default: 10)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("compare_screenshots", params) as Record<string, unknown>;
        const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];
        content.push({
          type: "text" as const,
          text: JSON.stringify({
            identical: result.identical,
            changed_pixels: result.changed_pixels,
            total_pixels: result.total_pixels,
            diff_percentage: result.diff_percentage,
            threshold: result.threshold,
            size: `${result.width}x${result.height}`,
          }, null, 2),
        });
        if (result.diff_image_base64 && !result.identical) {
          content.push({ type: "image" as const, data: result.diff_image_base64 as string, mimeType: "image/png" });
        }
        return { content };
      },
    },
    {
      name: "execute_editor_script",
      description: "Execute GDScript code in the editor context. Use _mcp_print(value) to capture output. The code runs inside a run() function with full editor API access.",
      schema: {
        code: z.string().describe("GDScript code. Use _mcp_print(value) to capture output. Runs inside run() with editor API access."),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("execute_editor_script", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_signals",
      description: "Get all signals defined on a node, including their connections. Shows signal name, connected methods, and flags.",
      schema: {
        node_path: z.string().describe("Node path to inspect"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_signals", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "reload_plugin",
      description: "Reload the godot-engine-mcp plugin (disable/re-enable). Connection will briefly drop.",
      schema: {},
      handler: async (_params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("reload_plugin", {});
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "reload_project",
      description: "Rescan the project filesystem and reload all scripts. Useful after external file changes.",
      schema: {},
      handler: async (_params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("reload_project", {});
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
