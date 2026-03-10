import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const debuggerCategory: CategoryDef = {
  name: "debugger",
  description:
    "Breakpoints, stack traces, variable inspection, step execution",
  tools: [
    {
      name: "set_breakpoint",
      description: "Set or remove a breakpoint in a GDScript file.",
      schema: {
        file: z
          .string()
          .describe("Script path (e.g. 'res://scripts/player.gd')"),
        line: z.number().describe("Line number"),
        enabled: z
          .boolean()
          .optional()
          .describe("Enable or disable (default: true)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_breakpoint", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_breakpoints",
      description:
        "Get all currently set breakpoints across all scripts.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_breakpoints", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "clear_breakpoints",
      description:
        "Clear all breakpoints, optionally filtered to a specific file.",
      schema: {
        file: z
          .string()
          .optional()
          .describe("Clear only in this file (default: all files)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("clear_breakpoints", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_stack_trace",
      description:
        "Get the current call stack when the game is paused at a breakpoint.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_stack_trace", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_stack_variables",
      description:
        "Get local and member variables at a specific stack frame when paused.",
      schema: {
        frame: z
          .number()
          .optional()
          .describe("Stack frame index (default: 0 = current)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_stack_variables",
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
      name: "debug_continue",
      description:
        "Continue game execution after hitting a breakpoint.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("debug_continue", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "debug_step",
      description: "Step execution when paused at a breakpoint.",
      schema: {
        mode: z
          .string()
          .optional()
          .describe("Step mode: 'into', 'over', 'out' (default: 'over')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("debug_step", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "evaluate_expression",
      description:
        "Evaluate a GDScript expression in the current debug context when paused.",
      schema: {
        expression: z
          .string()
          .describe("GDScript expression to evaluate"),
        frame: z
          .number()
          .optional()
          .describe("Stack frame context (default: 0)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "evaluate_expression",
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
      name: "get_debug_state",
      description:
        "Get the current debugger state: running, paused, breakpoint info, current line.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_debug_state", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "watch_expression",
      description:
        "Add or remove a watch expression that is evaluated each time the debugger pauses.",
      schema: {
        expression: z.string().describe("Expression to watch"),
        remove: z
          .boolean()
          .optional()
          .describe("Remove this watch (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "watch_expression",
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
