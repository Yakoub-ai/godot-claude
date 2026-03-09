import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const nodeCategory: CategoryDef = {
  name: "node",
  description: "Add, delete, move, duplicate nodes; properties, signals, groups",
  tools: [
    {
      name: "add_node",
      description: "Add new node to current scene",
      schema: {
        type: z.string().describe("Node type, e.g. 'Sprite2D', 'CollisionShape2D', 'Label'"),
        parent_path: z.string().optional().describe("Parent node path (default: root '.')"),
        name: z.string().optional().describe("Node name"),
        properties: z.record(z.string(), z.any()).optional().describe("Properties to set, e.g. {\"position\": \"Vector2(100, 200)\"}"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_node", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "delete_node",
      description: "Delete node from current scene (supports undo)",
      schema: {
        node_path: z.string().describe("Path to node to delete"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("delete_node", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "duplicate_node",
      description: "Duplicate node and children",
      schema: {
        node_path: z.string().describe("Path to node to duplicate"),
        name: z.string().optional().describe("Name for duplicate"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("duplicate_node", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "move_node",
      description: "Move/reparent node",
      schema: {
        node_path: z.string().describe("Path to node to move"),
        new_parent_path: z.string().describe("Path to new parent"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("move_node", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "update_property",
      description: "Set property on any node (supports Vector2, Color, etc.)",
      schema: {
        node_path: z.string().describe("Target node path"),
        property: z.string().describe("Property name, e.g. 'position', 'modulate', 'visible'"),
        value: z.any().describe("New value. Strings are auto-parsed: 'Vector2(10,20)', 'Color(1,0,0)', '#ff0000'"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("update_property", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_node_properties",
      description: "Get all editor-visible properties",
      schema: {
        node_path: z.string().describe("Node path"),
        category: z.string().optional().describe("Filter by property category prefix"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_node_properties", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "add_resource",
      description: "Add resource to node property",
      schema: {
        node_path: z.string().describe("Target node path"),
        property: z.string().describe("Property name, e.g. 'shape', 'material', 'texture'"),
        resource_type: z.string().describe("Resource class, e.g. 'RectangleShape2D', 'CircleShape2D'"),
        resource_properties: z.record(z.string(), z.any()).optional().describe("Properties for the resource"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_resource", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_anchor_preset",
      description: "Set Control node anchor preset",
      schema: {
        node_path: z.string().describe("Control node path"),
        preset: z.string().describe("Preset: top_left, top_right, bottom_left, bottom_right, center_left, center_top, center_right, center_bottom, center, left_wide, top_wide, right_wide, bottom_wide, vcenter_wide, hcenter_wide, full_rect"),
        keep_offsets: z.boolean().optional().describe("Keep current offsets (default: false)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_anchor_preset", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "rename_node",
      description: "Rename node",
      schema: {
        node_path: z.string().describe("Node path"),
        new_name: z.string().describe("New name"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("rename_node", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "connect_signal",
      description: "Connect signal between nodes",
      schema: {
        source_path: z.string().describe("Source node path (emitter)"),
        signal_name: z.string().describe("Signal name"),
        target_path: z.string().describe("Target node path (receiver)"),
        method_name: z.string().describe("Method on target to call"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("connect_signal", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "disconnect_signal",
      description: "Disconnect signal",
      schema: {
        source_path: z.string().describe("Source node path"),
        signal_name: z.string().describe("Signal name"),
        target_path: z.string().describe("Target node path"),
        method_name: z.string().describe("Method on target"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("disconnect_signal", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_node_groups",
      description: "Get groups a node belongs to",
      schema: {
        node_path: z.string().describe("Node path"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_node_groups", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_node_groups",
      description: "Set node groups (replaces current)",
      schema: {
        node_path: z.string().describe("Node path"),
        groups: z.array(z.string()).describe("Desired group names (replaces current)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_node_groups", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "find_nodes_in_group",
      description: "Find all nodes in a group",
      schema: {
        group: z.string().describe("Group name to search"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("find_nodes_in_group", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
