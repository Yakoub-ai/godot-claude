import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";
import { coerceNumber } from "../utils/validation.js";

export const inputCategory: CategoryDef = {
  name: "input",
  description: "Keyboard, mouse, action simulation, input map configuration",
  tools: [
    {
      name: "simulate_key",
      description:
        "Simulate a keyboard key press/release. Use duration to hold and auto-release.",
      schema: {
        keycode: z
          .string()
          .describe("Key constant (e.g. 'KEY_SPACE', 'KEY_W')"),
        pressed: z
          .boolean()
          .optional()
          .describe("true=press, false=release (default: true)"),
        duration: coerceNumber()
          .optional()
          .describe("Hold duration in seconds, then auto-release"),
        shift: z.boolean().optional(),
        ctrl: z.boolean().optional(),
        alt: z.boolean().optional(),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        if (params.duration !== undefined && (params.duration as number) > 0) {
          const { duration, ...keyParams } = params;
          await godot.sendCommand("simulate_key", {
            ...keyParams,
            pressed: true,
          });
          await new Promise((resolve) =>
            setTimeout(resolve, (duration as number) * 1000),
          );
          await godot.sendCommand("simulate_key", {
            ...keyParams,
            pressed: false,
          });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    event: {
                      keycode: params.keycode,
                      duration,
                      shift: params.shift,
                      ctrl: params.ctrl,
                      alt: params.alt,
                      auto_released: true,
                    },
                    sent: true,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
        const result = await godot.sendCommand("simulate_key", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "simulate_mouse_click",
      description: "Simulate a mouse button click at optional screen coordinates.",
      schema: {
        x: z.number().optional(),
        y: z.number().optional(),
        button: z
          .number()
          .optional()
          .describe("1=left, 2=right, 3=middle"),
        pressed: z.boolean().optional(),
        double_click: z.boolean().optional(),
        auto_release: z
          .boolean()
          .optional()
          .describe("Auto release after press (default: true)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("simulate_mouse_click", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "simulate_mouse_move",
      description:
        "Simulate mouse movement. Use relative_x/y for 3D camera rotation.",
      schema: {
        x: z.number().optional().describe("Absolute X"),
        y: z.number().optional().describe("Absolute Y"),
        relative_x: z
          .number()
          .optional()
          .describe("Relative X (camera yaw)"),
        relative_y: z
          .number()
          .optional()
          .describe("Relative Y (camera pitch)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("simulate_mouse_move", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "simulate_action",
      description:
        "Simulate an input action press/release (e.g. 'jump', 'move_left'). Actions must be defined in the Input Map.",
      schema: {
        action: z.string().describe("Action name (e.g. 'jump')"),
        pressed: z.boolean().optional(),
        strength: z.number().optional(),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("simulate_action", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "simulate_sequence",
      description:
        "Execute a sequence of input events with optional frame delays between them. Useful for testing combo inputs, movement patterns, or UI interaction flows.",
      schema: {
        events: z.array(
          z.object({
            type: z
              .string()
              .describe(
                "'key', 'mouse_button', 'mouse_motion', or 'action'",
              ),
            keycode: z.string().optional(),
            action: z.string().optional(),
            button: z.number().optional(),
            pressed: z.boolean().optional(),
            x: z.number().optional(),
            y: z.number().optional(),
            relative_x: z.number().optional(),
            relative_y: z.number().optional(),
            shift: z.boolean().optional(),
            ctrl: z.boolean().optional(),
            alt: z.boolean().optional(),
            strength: z.number().optional(),
            double_click: z.boolean().optional(),
          }),
        ),
        frame_delay: z
          .number()
          .optional()
          .describe("Frames between events (default: 1)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("simulate_sequence", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_input_actions",
      description:
        "Get all input actions defined in the project Input Map, including their bound events. Optionally filter by name pattern.",
      schema: {
        filter: z.string().optional(),
        include_builtin: z.boolean().optional(),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_input_actions", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_input_action",
      description:
        "Create or update an input action in the project Input Map. Define the action name and its bound input events (keys, mouse buttons, joypad).",
      schema: {
        action: z.string().describe("Action name"),
        events: z.array(
          z.object({
            type: z.enum([
              "key",
              "mouse_button",
              "joypad_button",
              "joypad_motion",
            ]),
            keycode: z.string().optional(),
            physical_keycode: z.string().optional(),
            ctrl: z.boolean().optional(),
            shift: z.boolean().optional(),
            alt: z.boolean().optional(),
            meta: z.boolean().optional(),
            button_index: z.number().optional(),
            axis: z.number().optional(),
            axis_value: z.number().optional(),
          }),
        ),
        deadzone: z.number().optional(),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_input_action", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "remove_input_action",
      description:
        "Remove an input action from the project input map.",
      schema: {
        action: z.string().describe("Action name to remove"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_input_action", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
