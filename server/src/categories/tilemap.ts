import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const tilemapCategory: CategoryDef = {
  name: "tilemap",
  description: "TileMapLayer cells, regions, patterns, tile sets",
  tools: [
    {
      name: "tilemap_set_cell",
      description: "Set a single cell in a TileMapLayer. Specify atlas coordinates and source to paint a specific tile.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
        x: z.number().describe("Cell X coordinate"),
        y: z.number().describe("Cell Y coordinate"),
        source_id: z.number().optional().describe("TileSet source ID (default: 0)"),
        atlas_x: z.number().optional().describe("Atlas X coordinate of the tile"),
        atlas_y: z.number().optional().describe("Atlas Y coordinate of the tile"),
        alternative: z.number().optional().describe("Alternative tile index (default: 0)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_set_cell", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "tilemap_fill_rect",
      description: "Fill a rectangular region of a TileMapLayer with a specific tile. Coordinates are inclusive.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
        x1: z.number().describe("Start X coordinate"),
        y1: z.number().describe("Start Y coordinate"),
        x2: z.number().describe("End X coordinate"),
        y2: z.number().describe("End Y coordinate"),
        source_id: z.number().optional().describe("TileSet source ID (default: 0)"),
        atlas_x: z.number().optional().describe("Atlas X coordinate of the tile"),
        atlas_y: z.number().optional().describe("Atlas Y coordinate of the tile"),
        alternative: z.number().optional().describe("Alternative tile index (default: 0)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_fill_rect", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "tilemap_get_cell",
      description: "Get tile data for a specific cell in a TileMapLayer. Returns source ID, atlas coordinates, and alternative tile.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
        x: z.number().describe("Cell X coordinate"),
        y: z.number().describe("Cell Y coordinate"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_get_cell", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "tilemap_clear",
      description: "Clear all cells in a TileMapLayer, removing every painted tile.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_clear", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "tilemap_get_info",
      description: "Get information about a TileMapLayer including its TileSet, cell size, and configuration.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_get_info", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "tilemap_get_used_cells",
      description: "Get a list of all used (non-empty) cells in a TileMapLayer. Optionally limit the number returned.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
        max_count: z.number().optional().describe("Maximum number of cells to return (default: all)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_get_used_cells", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "tilemap_set_pattern",
      description: "Set a pattern of tiles relative to a starting position. Each cell in the array specifies a relative offset and tile data.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
        x: z.number().describe("Start X coordinate"),
        y: z.number().describe("Start Y coordinate"),
        cells: z.array(z.object({
          x: z.number().describe("Relative X offset"),
          y: z.number().describe("Relative Y offset"),
          source_id: z.number().optional().describe("TileSet source ID"),
          atlas_x: z.number().optional().describe("Atlas X coordinate of the tile"),
          atlas_y: z.number().optional().describe("Atlas Y coordinate of the tile"),
          alternative: z.number().optional().describe("Alternative tile index"),
        })).describe("Array of cells with relative offsets"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_set_pattern", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "tilemap_erase_rect",
      description: "Erase all tiles in a rectangular region of a TileMapLayer. Coordinates are inclusive.",
      schema: {
        node_path: z.string().describe("Path to TileMapLayer"),
        x1: z.number().describe("Start X"),
        y1: z.number().describe("Start Y"),
        x2: z.number().describe("End X"),
        y2: z.number().describe("End Y"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("tilemap_erase_rect", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
