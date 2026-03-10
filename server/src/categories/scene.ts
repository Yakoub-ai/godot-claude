import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const sceneCategory: CategoryDef = {
  name: "scene",
  description: "Scene tree inspection, creation, instancing, and playback",
  tools: [
    {
      name: "get_scene_tree",
      description:
        "Get the live scene tree of the currently edited scene. Returns the full node hierarchy with types, properties, and children. Use max_depth to limit traversal for large scenes.",
      schema: {
        max_depth: z
          .number()
          .optional()
          .describe("Max tree depth (-1 for unlimited)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_scene_tree", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_scene_file_content",
      description:
        "Read the raw .tscn file content of a scene. Returns the text-based scene format including sub-resources, nodes, and connections. Useful for understanding scene structure without opening it.",
      schema: {
        path: z
          .string()
          .describe("Scene path, e.g. 'res://scenes/main.tscn'"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_scene_file_content",
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
      name: "create_scene",
      description:
        "Create a new scene file with a specified root node type. The scene is saved to disk and can be opened or instanced afterward. Common root types: Node2D, Node3D, Control, CharacterBody2D, RigidBody2D, Area2D.",
      schema: {
        path: z
          .string()
          .describe("Path for new scene, e.g. 'res://scenes/enemy.tscn'"),
        root_type: z
          .string()
          .optional()
          .describe(
            "Root node type (default: Node2D). Examples: Node2D, Node3D, Control, CharacterBody2D",
          ),
        root_name: z
          .string()
          .optional()
          .describe("Root node name (defaults to filename)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_scene", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "open_scene",
      description:
        "Open a scene in the Godot editor. The scene becomes the active edited scene. Required before most node operations like adding children or modifying properties.",
      schema: {
        path: z.string().describe("Scene path to open"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("open_scene", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "delete_scene",
      description:
        "Delete a scene file from the project. This permanently removes the .tscn file from disk. Any other scenes that instance this scene will break.",
      schema: {
        path: z.string().describe("Scene file path to delete"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("delete_scene", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "add_scene_instance",
      description:
        "Instance an existing scene as a child node in the currently edited scene. The instanced scene appears as a single node that inherits all children and scripts from the source scene.",
      schema: {
        scene_path: z
          .string()
          .describe("Scene to instance, e.g. 'res://scenes/enemy.tscn'"),
        parent_path: z
          .string()
          .optional()
          .describe("Parent node path (default: root '.')"),
        name: z
          .string()
          .optional()
          .describe("Custom name for the instance"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_scene_instance", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "play_scene",
      description:
        "Run a scene in the Godot editor for testing. Use 'main' to play the project's main scene, 'current' for the active editor scene, or provide a specific scene file path.",
      schema: {
        mode: z
          .string()
          .optional()
          .describe(
            "'main' (default), 'current', or scene file path to play",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("play_scene", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "stop_scene",
      description:
        "Stop the currently playing scene. Use after play_scene to halt execution and return to the editor.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("stop_scene", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "save_scene",
      description:
        "Save the currently edited scene. Optionally provide a path to save as a new file (Save As). Without a path, saves to the scene's current file location.",
      schema: {
        path: z
          .string()
          .optional()
          .describe("Save-as path (defaults to current scene path)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("save_scene", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_scene_exports",
      description:
        "Get all @export variables from scripted nodes in a scene. Returns the exported properties with their types, values, and hints. Useful for understanding what can be configured on a scene's nodes.",
      schema: {
        path: z.string().describe("Scene path to inspect"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_scene_exports", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
