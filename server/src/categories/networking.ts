import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const networkingCategory: CategoryDef = {
  name: "networking",
  description:
    "Multiplayer peer setup, RPC configuration, network state inspection",
  tools: [
    {
      name: "setup_multiplayer",
      description:
        "Setup a multiplayer peer (ENet or WebSocket server/client).",
      schema: {
        type: z
          .string()
          .describe(
            "Peer type: 'enet_server', 'enet_client', 'websocket_server', 'websocket_client'",
          ),
        port: z
          .number()
          .optional()
          .describe("Port number (default: 9999)"),
        address: z
          .string()
          .optional()
          .describe("Server address for clients (default: '127.0.0.1')"),
        max_clients: z
          .number()
          .optional()
          .describe("Max clients for server (default: 32)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_multiplayer", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_multiplayer_info",
      description:
        "Get current multiplayer state: peer type, unique ID, connected peers, is server/client.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_multiplayer_info", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_connected_peers",
      description:
        "Get list of all connected peer IDs with their connection info.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_connected_peers", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "disconnect_peer",
      description:
        "Disconnect a specific peer from the multiplayer session.",
      schema: {
        peer_id: z.number().describe("Peer ID to disconnect"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("disconnect_peer", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "configure_rpc",
      description: "Configure RPC settings for a node method.",
      schema: {
        node_path: z.string().describe("Path to the node"),
        method: z.string().describe("Method name"),
        rpc_mode: z
          .string()
          .describe("RPC mode: 'any_peer', 'authority'"),
        transfer_mode: z
          .string()
          .optional()
          .describe(
            "Transfer mode: 'reliable', 'unreliable', 'unreliable_ordered' (default: 'reliable')",
          ),
        channel: z
          .number()
          .optional()
          .describe("Transfer channel (default: 0)"),
        call_local: z
          .boolean()
          .optional()
          .describe("Also call locally (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("configure_rpc", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "send_rpc",
      description: "Send an RPC call to a method on a node.",
      schema: {
        node_path: z.string().describe("Path to the node"),
        method: z.string().describe("Method name to call"),
        args: z
          .array(z.union([z.string(), z.number(), z.boolean()]))
          .optional()
          .describe("Method arguments"),
        target_peer: z
          .number()
          .optional()
          .describe("Target peer ID (0=all, 1=server, default: 0)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("send_rpc", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_network_stats",
      description:
        "Get network statistics: bandwidth usage, packet counts, latency per peer.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_network_stats", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "close_multiplayer",
      description:
        "Close the current multiplayer connection and clean up peers.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("close_multiplayer", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
