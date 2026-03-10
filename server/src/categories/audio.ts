import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const audioCategory: CategoryDef = {
  name: "audio",
  description: "Audio bus layout, effects, AudioStreamPlayer nodes",
  tools: [
    {
      name: "get_audio_bus_layout",
      description:
        "Get the full audio bus layout including all buses, their volumes, effects, send targets, and solo/mute state. Returns the complete AudioServer bus configuration.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_audio_bus_layout", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "add_audio_bus",
      description:
        "Add a new audio bus to the AudioServer. Configure volume, send target, solo, and mute state. Buses are used to group and process audio signals (e.g., Music, SFX, Ambient).",
      schema: {
        name: z.string().describe("Name for the new audio bus"),
        volume_db: z
          .number()
          .optional()
          .describe("Volume in decibels (default: 0)"),
        send: z
          .string()
          .optional()
          .describe("Send target bus name (default: Master)"),
        solo: z.boolean().optional().describe("Solo this bus"),
        mute: z.boolean().optional().describe("Mute this bus"),
        at_position: z
          .number()
          .optional()
          .describe("Insert position index (-1 for end)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_audio_bus", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_audio_bus",
      description:
        "Modify an existing audio bus. Change volume, solo/mute state, bypass effects, send target, or rename the bus. Identify the bus by its current name.",
      schema: {
        name: z.string().describe("Current name of the audio bus to modify"),
        volume_db: z.number().optional().describe("New volume in decibels"),
        solo: z.boolean().optional().describe("Solo state"),
        mute: z.boolean().optional().describe("Mute state"),
        bypass_effects: z
          .boolean()
          .optional()
          .describe("Bypass all effects on this bus"),
        send: z.string().optional().describe("New send target bus name"),
        rename: z.string().optional().describe("Rename the bus"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_audio_bus", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "add_audio_bus_effect",
      description:
        "Add an audio effect to a bus. Effect types include: Reverb, Delay, Chorus, Phaser, EQ, Compressor, Limiter, Amplify, Distortion, LowPassFilter, HighPassFilter, BandPassFilter, etc. Params are effect-specific key-value pairs.",
      schema: {
        bus: z.string().describe("Bus name to add the effect to"),
        effect_type: z
          .string()
          .describe(
            "Effect type name (e.g., 'Reverb', 'Delay', 'Compressor', 'EQ')",
          ),
        params: z
          .record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean()]),
          )
          .optional()
          .describe("Effect-specific parameters as key-value pairs"),
        at_position: z
          .number()
          .optional()
          .describe("Insert position in effect chain (-1 for end)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "add_audio_bus_effect",
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
      name: "add_audio_player",
      description:
        "Add an AudioStreamPlayer node to the scene tree. Supports AudioStreamPlayer (non-positional), AudioStreamPlayer2D (2D positional), and AudioStreamPlayer3D (3D positional). Configure stream source, volume, bus routing, and spatial properties.",
      schema: {
        node_path: z
          .string()
          .describe("Parent node path for the audio player"),
        name: z.string().describe("Name for the new audio player node"),
        type: z
          .string()
          .optional()
          .describe(
            "Player type: 'AudioStreamPlayer' (default), 'AudioStreamPlayer2D', or 'AudioStreamPlayer3D'",
          ),
        stream: z
          .string()
          .optional()
          .describe(
            "Audio stream resource path, e.g. 'res://audio/music.ogg'",
          ),
        volume_db: z
          .number()
          .optional()
          .describe("Volume in decibels (default: 0)"),
        bus: z
          .string()
          .optional()
          .describe("Target audio bus (default: Master)"),
        autoplay: z
          .boolean()
          .optional()
          .describe("Auto-play when scene starts"),
        max_distance: z
          .number()
          .optional()
          .describe("Max audible distance (2D/3D only)"),
        attenuation: z
          .number()
          .optional()
          .describe("Distance attenuation factor (2D/3D only)"),
        attenuation_model: z
          .number()
          .optional()
          .describe("Attenuation model enum (3D only)"),
        unit_size: z
          .number()
          .optional()
          .describe("Unit size for volume calculation (3D only)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_audio_player", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_audio_info",
      description:
        "Get audio setup information for a node subtree. Returns all AudioStreamPlayer nodes, their configurations, bus assignments, and playing state within the specified node hierarchy.",
      schema: {
        node_path: z
          .string()
          .describe("Root node path to inspect for audio nodes"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_audio_info", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "remove_audio_bus",
      description:
        "Remove an audio bus by name. The Master bus cannot be removed. Any buses sending to the removed bus will be redirected to Master.",
      schema: {
        name: z.string().describe("Name of the audio bus to remove"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_audio_bus", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "remove_audio_bus_effect",
      description:
        "Remove an audio effect from a bus by its index in the effect chain. Use get_audio_bus_layout to see current effect indices.",
      schema: {
        bus: z.string().describe("Bus name"),
        effect_index: z.number().describe("Effect index to remove"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "remove_audio_bus_effect",
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
