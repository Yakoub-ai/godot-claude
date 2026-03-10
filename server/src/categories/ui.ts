import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const uiCategory: CategoryDef = {
  name: "ui",
  description: "Theme overrides, Control nodes, containers, UI inspection",
  tools: [
    // ── Theme tools (6) ───────────────────────────────────────────────

    {
      name: "create_theme",
      description: "Create a Theme resource and save it to disk. Use this to establish a shared theme for consistent UI styling.",
      schema: {
        path: z.string().describe("Path to save theme (e.g. 'res://themes/main.tres')"),
        default_font_size: z.number().optional().describe("Default font size"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_theme", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_theme_color",
      description: "Set a theme color override on a Control node (e.g. font_color, font_outline_color).",
      schema: {
        node_path: z.string().describe("Path to Control node"),
        name: z.string().describe("Color name (e.g. 'font_color')"),
        color: z.string().describe("Color as hex or name"),
        theme_type: z.string().optional().describe("Theme type (defaults to node's class)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_theme_color", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_theme_constant",
      description: "Set a theme constant override on a Control node (e.g. margin_left, separation, outline_size).",
      schema: {
        node_path: z.string().describe("Path to Control node"),
        name: z.string().describe("Constant name (e.g. 'margin_left')"),
        value: z.number().describe("Integer value"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_theme_constant", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_theme_font_size",
      description: "Set a theme font size override on a Control node.",
      schema: {
        node_path: z.string().describe("Path to Control node"),
        name: z.string().describe("Font size name (e.g. 'font_size')"),
        size: z.number().describe("Font size in pixels"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_theme_font_size", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_theme_stylebox",
      description: "Set a StyleBoxFlat override on a Control node. Configure background, border, corners, and padding.",
      schema: {
        node_path: z.string().describe("Path to Control node"),
        name: z.string().describe("Style name (e.g. 'panel', 'normal', 'hover')"),
        bg_color: z.string().optional().describe("Background color (hex)"),
        border_color: z.string().optional().describe("Border color (hex)"),
        border_width: z.number().optional().describe("Border width in pixels"),
        corner_radius: z.number().optional().describe("Corner radius in pixels"),
        padding: z.number().optional().describe("Content padding in pixels"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_theme_stylebox", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_theme_info",
      description: "Get theme information for a Control node including active overrides, inherited theme, and available theme properties.",
      schema: {
        node_path: z.string().describe("Path to Control node"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_theme_info", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },

    // ── Control & Container tools (3) ─────────────────────────────────

    {
      name: "create_control",
      description: "Create a Control node (Button, Label, LineEdit, etc.) with optional text, size, and anchor preset.",
      schema: {
        parent_path: z.string().describe("Path to parent node"),
        type: z.string().describe("Control type: Button, Label, LineEdit, TextEdit, RichTextLabel, CheckBox, SpinBox, OptionButton, TextureRect, Panel, etc."),
        name: z.string().optional().describe("Node name"),
        text: z.string().optional().describe("Text content (for Label, Button, etc.)"),
        size: z.object({ x: z.number(), y: z.number() }).optional().describe("Minimum size"),
        position: z.object({ x: z.number(), y: z.number() }).optional().describe("Position"),
        anchors_preset: z.string().optional().describe("Anchor preset: full_rect, center, top_left, top_right, bottom_left, bottom_right, center_left, center_right, center_top, center_bottom"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_control", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "setup_container",
      description: "Create or configure a container node (VBox, HBox, Grid, Margin, etc.).",
      schema: {
        node_path: z.string().describe("Path to existing container, or parent to create one under"),
        type: z.string().optional().describe("Container type to create: VBoxContainer, HBoxContainer, GridContainer, MarginContainer, PanelContainer, ScrollContainer, TabContainer, HSplitContainer, VSplitContainer"),
        name: z.string().optional().describe("Node name when creating"),
        separation: z.number().optional().describe("Child separation (VBox/HBox)"),
        columns: z.number().optional().describe("Column count (GridContainer)"),
        margin_left: z.number().optional().describe("Left margin (MarginContainer)"),
        margin_right: z.number().optional().describe("Right margin"),
        margin_top: z.number().optional().describe("Top margin"),
        margin_bottom: z.number().optional().describe("Bottom margin"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_container", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_control_info",
      description: "Get detailed info about a Control node: size, anchors, margins, theme overrides, font settings.",
      schema: {
        node_path: z.string().describe("Path to the Control node"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_control_info", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
