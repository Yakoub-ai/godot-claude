import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";
import { coerceStringArray, coerceNumber } from "../utils/validation.js";

export const runtimeCategory: CategoryDef = {
  name: "runtime",
  description:
    "Running game inspection, live property editing, input simulation, frame capture",
  tools: [
    {
      name: "get_game_scene_tree",
      description:
        "Get the scene tree of the currently running game. Returns node hierarchy with types and properties. Use max_depth to limit traversal depth for large scenes. Requires a game to be running (use play_scene first).",
      schema: {
        max_depth: z
          .number()
          .optional()
          .describe("Max depth, -1=unlimited"),
        script_filter: z
          .string()
          .optional()
          .describe("Filter nodes by script path substring"),
        type_filter: z
          .string()
          .optional()
          .describe("Filter nodes by type name"),
        named_only: z
          .boolean()
          .optional()
          .describe("Only return nodes with explicit names"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_game_scene_tree", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_game_node_properties",
      description:
        "Get properties of a node in the running game. Specify an absolute node path (e.g. '/root/Main/Player') and optionally a list of specific properties to read. Without properties list, returns all properties.",
      schema: {
        node_path: z
          .string()
          .describe("Absolute node path (e.g. '/root/Main/Player')"),
        properties: coerceStringArray()
          .optional()
          .describe("Specific properties to read"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_game_node_properties",
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
      name: "set_game_node_property",
      description:
        "Set a property on a node in the running game. String values are auto-parsed for complex types like Vector2, Vector3, Color, etc. Changes take effect immediately in the running game.",
      schema: {
        node_path: z.string().describe("Absolute node path"),
        property: z.string().describe("Property name"),
        value: z
          .union([
            z.string(),
            z.number(),
            z.boolean(),
            z.record(z.string(), z.number()),
          ])
          .describe(
            "Value (strings auto-parsed for Vector2, Color, etc.)",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "set_game_node_property",
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
      name: "execute_game_script",
      description:
        "Execute GDScript code in the context of the running game. Use _mcp_print(value) to return output to the MCP client. The code runs in a temporary node attached to the scene tree.",
      schema: {
        code: z
          .string()
          .describe(
            "GDScript code. Use _mcp_print(value) for output.",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("execute_game_script", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "capture_frames",
      description:
        "Capture multiple screenshots at frame intervals from the running game. Returns image data for each frame. Use for visual debugging, animation verification, or game state inspection over time.",
      schema: {
        count: coerceNumber()
          .optional()
          .describe("Frames to capture (1-30, default: 5)"),
        frame_interval: coerceNumber()
          .optional()
          .describe("Frames between captures (default: 10)"),
        half_resolution: z
          .boolean()
          .optional()
          .describe("Halve resolution (default: true)"),
        node_data: z
          .object({
            node_path: z.string(),
            properties: coerceStringArray(),
          })
          .optional()
          .describe("Node data to capture per frame"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = (await godot.sendCommand(
          "capture_frames",
          params,
        )) as Record<string, unknown>;
        if (
          result &&
          typeof result === "object" &&
          "frames" in result &&
          Array.isArray(result.frames)
        ) {
          const content: Array<
            | { type: "text"; text: string }
            | { type: "image"; data: string; mimeType: string }
          > = [];
          const frameData = Array.isArray(result.frame_data)
            ? result.frame_data
            : null;
          for (let i = 0; i < result.frames.length; i++) {
            content.push({
              type: "image" as const,
              data: result.frames[i] as string,
              mimeType: "image/png",
            });
            if (frameData && frameData[i]) {
              content.push({
                type: "text" as const,
                text: `Frame ${i + 1}: ${JSON.stringify(frameData[i])}`,
              });
            }
          }
          content.push({
            type: "text" as const,
            text: `Captured ${result.count} frames (${result.width}x${result.height}${result.half_resolution ? ", half-res" : ""})`,
          });
          return { content };
        }
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "monitor_properties",
      description:
        "Record property values of a node over multiple frames. Useful for debugging physics, animations, or any time-varying properties. Returns sampled values at specified intervals.",
      schema: {
        node_path: z.string().describe("Absolute node path to monitor"),
        properties: coerceStringArray().describe(
          "Property names to record",
        ),
        frame_count: coerceNumber()
          .optional()
          .describe("Samples to collect (1-600, default: 60)"),
        frame_interval: coerceNumber()
          .optional()
          .describe("Frames between samples (default: 1)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("monitor_properties", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "start_recording",
      description:
        "Start recording input events in the running game. Events are captured until stop_recording is called. Use for creating reproducible test sequences or analyzing player input patterns.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("start_recording", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "stop_recording",
      description:
        "Stop recording input events and return the captured event list. The returned events can be passed to replay_recording to reproduce the input sequence.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("stop_recording", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "replay_recording",
      description:
        "Replay a previously recorded sequence of input events in the running game. Optionally adjust playback speed. Events should come from stop_recording output.",
      schema: {
        events: z
          .array(z.record(z.string(), z.unknown()))
          .describe("Array of recorded input events to replay"),
        speed: z
          .number()
          .optional()
          .describe("Playback speed multiplier (default: 1.0)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("replay_recording", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "find_nodes_by_script",
      description:
        "Find all nodes in the running game that have a specific script attached. Returns node paths and optionally their property values. Useful for locating all instances of a particular script.",
      schema: {
        script: z.string().describe("Script resource path (e.g. 'res://scripts/enemy.gd')"),
        properties: coerceStringArray()
          .optional()
          .describe("Properties to read from matched nodes"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("find_nodes_by_script", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_autoload",
      description:
        "Get properties of an autoload singleton in the running game. Autoloads are global nodes accessible by name (e.g. 'GameManager', 'AudioManager').",
      schema: {
        name: z.string().describe("Autoload name (e.g. 'GameManager')"),
        properties: coerceStringArray()
          .optional()
          .describe("Specific properties to read"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_autoload", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "find_ui_elements",
      description:
        "Find all visible UI Control elements in the running game. Optionally filter by type (Button, Label, LineEdit, etc.). Returns node paths, text content, and visibility state.",
      schema: {
        type_filter: z
          .string()
          .optional()
          .describe("Filter by Control type (e.g. 'Button', 'Label')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("find_ui_elements", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "click_button_by_text",
      description:
        "Click a button in the running game by its text label. Simulates a full press-release cycle. Use partial matching to find buttons with text that contains the search string.",
      schema: {
        text: z.string().describe("Button text to search for"),
        partial: z
          .boolean()
          .optional()
          .describe("Allow partial text matching (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("click_button_by_text", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "wait_for_node",
      description:
        "Wait until a node exists at the specified path in the running game. Useful for waiting on dynamically spawned nodes or scene transitions. Returns when the node appears or after timeout.",
      schema: {
        node_path: z.string().describe("Absolute node path to wait for"),
        timeout: z
          .number()
          .optional()
          .describe("Timeout in seconds (default: 5)"),
        poll_frames: z
          .number()
          .optional()
          .describe("Frames between checks (default: 10)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("wait_for_node", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "find_nearby_nodes",
      description:
        "Find nodes within a radius of a position in the running game. Supports 2D and 3D positions. Filter by type or group. Useful for spatial queries like finding enemies near the player.",
      schema: {
        position: z
          .union([
            z.string(),
            z.object({
              x: z.number(),
              y: z.number(),
              z: z.number().optional(),
            }),
          ])
          .describe(
            "Center position as node path or {x, y, z?} coordinates",
          ),
        radius: coerceNumber()
          .optional()
          .describe("Search radius (default: 100)"),
        type_filter: z
          .string()
          .optional()
          .describe("Filter by node type"),
        group_filter: z
          .string()
          .optional()
          .describe("Filter by group membership"),
        max_results: coerceNumber()
          .optional()
          .describe("Maximum results to return"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("find_nearby_nodes", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "navigate_to",
      description:
        "Get navigation information from the player to a target position or node in the running game. Returns path, distance, and direction data. Does not move the player — use move_to for autopilot.",
      schema: {
        target: z
          .union([
            z.string(),
            z.object({
              x: z.number(),
              y: z.number(),
              z: z.number(),
            }),
          ])
          .describe("Target as node path or {x, y, z} coordinates"),
        player_path: z
          .string()
          .optional()
          .describe("Player node path (auto-detected if omitted)"),
        camera_path: z
          .string()
          .optional()
          .describe("Camera node path (auto-detected if omitted)"),
        move_speed: coerceNumber()
          .optional()
          .describe("Movement speed for time estimation"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("navigate_to", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "move_to",
      description:
        "Autopilot the player to a target position or node in the running game. The player moves automatically along the navigation path. Use arrival_radius to set how close the player needs to get.",
      schema: {
        target: z
          .union([
            z.string(),
            z.object({
              x: z.number(),
              y: z.number(),
              z: z.number(),
            }),
          ])
          .describe("Target as node path or {x, y, z} coordinates"),
        player_path: z
          .string()
          .optional()
          .describe("Player node path (auto-detected if omitted)"),
        camera_path: z
          .string()
          .optional()
          .describe("Camera node path (auto-detected if omitted)"),
        arrival_radius: coerceNumber()
          .optional()
          .describe("Distance to consider arrived (default: 5)"),
        timeout: coerceNumber()
          .optional()
          .describe("Timeout in seconds (default: 30)"),
        run: z
          .boolean()
          .optional()
          .describe("Use run speed instead of walk (default: false)"),
        look_at_target: z
          .boolean()
          .optional()
          .describe("Face target while moving (default: true)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("move_to", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "batch_get_properties",
      description:
        "Get properties of multiple nodes in the running game in a single call. More efficient than calling get_game_node_properties multiple times. Returns properties for each requested node.",
      schema: {
        nodes: z
          .array(
            z.object({
              path: z.string().describe("Absolute node path"),
              properties: coerceStringArray()
                .optional()
                .describe("Properties to read (all if omitted)"),
            }),
          )
          .describe("Array of nodes with paths and optional property lists"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("batch_get_properties", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
