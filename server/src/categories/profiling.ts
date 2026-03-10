import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const profilingCategory: CategoryDef = {
  name: "profiling",
  description:
    "Performance monitors, FPS, memory, frame profiling, bottleneck detection",
  tools: [
    {
      name: "get_performance_monitors",
      description:
        "Get all Godot performance monitors (FPS, memory, draw calls, physics, navigation, etc.)",
      schema: {
        category: z
          .string()
          .optional()
          .describe(
            "Filter: 'fps', 'memory', 'render', 'physics_2d', 'physics_3d', 'navigation'",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_performance_monitors",
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
      name: "get_editor_performance",
      description:
        "Get a quick performance summary (FPS, frame time, draw calls, memory usage).",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_editor_performance",
          {},
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "profile_frames",
      description:
        "Profile frame times over a duration. Returns min/max/avg frame time, FPS stats, and frame time histogram.",
      schema: {
        duration: z
          .number()
          .optional()
          .describe("Duration in seconds to profile (default: 1.0)"),
        sample_interval: z
          .number()
          .optional()
          .describe("Frames between samples (default: 1)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("profile_frames", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_memory_info",
      description:
        "Get detailed memory usage breakdown: static memory, dynamic memory, video memory, object counts by type.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_memory_info", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "detect_bottlenecks",
      description:
        "Analyze game performance over time and detect bottlenecks (CPU, GPU, physics, scripts). Returns categorized findings.",
      schema: {
        duration: z
          .number()
          .optional()
          .describe("Seconds to analyze (default: 2.0)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "detect_bottlenecks",
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
      name: "get_render_info",
      description:
        "Get rendering pipeline information: draw calls, vertices, objects, shader changes, material changes.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_render_info", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
