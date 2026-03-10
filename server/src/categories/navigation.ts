import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const navigationCategory: CategoryDef = {
  name: "navigation",
  description: "Navigation regions, agents, mesh baking, pathfinding",
  tools: [
    {
      name: "setup_navigation_region",
      description:
        "Add a NavigationRegion2D/3D child to a node with auto-created NavigationPolygon or NavigationMesh. Auto-detects 2D/3D from parent context.",
      schema: {
        node_path: z.string().describe("Path to the parent node that will receive the NavigationRegion child"),
        mode: z.string().optional().describe("Force '2d' or '3d' mode (default: auto-detect from parent)"),
        name: z.string().optional().describe("Custom name for the NavigationRegion node"),
        navigation_layers: z.number().optional().describe("Navigation layers bitmask (default: 1)"),
        agent_radius: z.number().optional().describe("Agent radius for mesh generation"),
        agent_height: z.number().optional().describe("Agent height for 3D mesh generation"),
        agent_max_climb: z.number().optional().describe("Maximum step height agents can climb (3D only)"),
        agent_max_slope: z.number().optional().describe("Maximum slope angle in degrees agents can traverse (3D only)"),
        cell_size: z.number().optional().describe("Navigation mesh cell size for voxelization"),
        cell_height: z.number().optional().describe("Navigation mesh cell height for voxelization (3D only)"),
        source_geometry_mode: z.string().optional().describe("Source geometry mode: root_node, groups_with_children, groups_explicit (3D only)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_navigation_region", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "bake_navigation_mesh",
      description:
        "Bake navigation mesh for a NavigationRegion3D, or set outline vertices and generate polygons for a NavigationRegion2D.",
      schema: {
        node_path: z.string().describe("Path to the NavigationRegion2D/3D node"),
        outline: z
          .array(z.union([z.array(z.number()), z.object({ x: z.number(), y: z.number() })]))
          .optional()
          .describe("Outline vertices for 2D navigation polygon as [[x,y],...] or [{x,y},...]"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("bake_navigation_mesh", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "setup_navigation_agent",
      description:
        "Add a NavigationAgent2D/3D child to a node and configure pathfinding and avoidance properties.",
      schema: {
        node_path: z.string().describe("Path to the parent node that will receive the NavigationAgent child"),
        mode: z.string().optional().describe("Force '2d' or '3d' mode (default: auto-detect from parent)"),
        name: z.string().optional().describe("Custom name for the NavigationAgent node"),
        path_desired_distance: z.number().optional().describe("Distance threshold to consider a path point reached"),
        target_desired_distance: z.number().optional().describe("Distance threshold to consider the target reached"),
        radius: z.number().optional().describe("Agent radius for avoidance"),
        neighbor_distance: z.number().optional().describe("Maximum distance to search for other agents for avoidance"),
        max_neighbors: z.number().optional().describe("Maximum number of neighbors to consider for avoidance"),
        max_speed: z.number().optional().describe("Maximum speed the agent can move"),
        avoidance_enabled: z.boolean().optional().describe("Enable avoidance behavior (default: false)"),
        navigation_layers: z.number().optional().describe("Navigation layers bitmask for pathfinding queries"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_navigation_agent", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_navigation_layers",
      description: "Set navigation layers for a NavigationRegion or NavigationAgent.",
      schema: {
        node_path: z.string().describe("Path to the NavigationRegion or NavigationAgent node"),
        layers: z.number().optional().describe("Navigation layers as a single bitmask integer"),
        layer_bits: z.array(z.number()).optional().describe("Individual layer bit indices to enable (0-based)"),
        layer_names: z.array(z.string()).optional().describe("Layer names to enable (requires named layers in project settings)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_navigation_layers", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_navigation_info",
      description: "Get navigation setup info for a node and its subtree.",
      schema: {
        node_path: z.string().describe("Path to the node to inspect for navigation configuration"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_navigation_info", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_navigation_path",
      description:
        "Calculate a navigation path between two points using the navigation server. Returns the path as an array of waypoints.",
      schema: {
        start: z.string().describe("Start position as Vector2/Vector3 string or node path"),
        end: z.string().describe("End position as Vector2/Vector3 string or node path"),
        navigation_layers: z.number().optional().describe("Navigation layers bitmask for query"),
        mode: z.string().optional().describe("Force '2d' or '3d' mode (default: auto)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_navigation_path", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
