import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import type { JsonRpcRequest, JsonRpcResponse, PendingRequest } from "./utils/types.js";
import { GodotConnectionError, GodotCommandError, TimeoutError } from "./utils/errors.js";

const DEFAULT_PORT = 6505;
const PORT_RANGE = 5;
const COMMAND_TIMEOUT_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 10_000;

export class GodotConnection {
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private port: number;
  private connected = false;

  constructor(port?: number) {
    this.port = port ?? DEFAULT_PORT;
  }

  async connect(): Promise<void> {
    const port = await this.findAvailablePort();
    this.port = port;

    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ host: "127.0.0.1", port });

      this.wss.on("listening", () => {
        console.error(`[godot-engine-mcp] WebSocket server listening on ws://127.0.0.1:${port}`);
        resolve();
      });

      this.wss.on("error", (err) => {
        console.error(`[godot-engine-mcp] WebSocket error: ${err.message}`);
        reject(err);
      });

      this.wss.on("connection", (ws) => {
        if (this.client) {
          console.error("[godot-engine-mcp] Replacing existing Godot connection");
          this.client.close();
          this.rejectAllPending("Godot reconnected");
        }

        this.client = ws;
        this.connected = true;
        console.error("[godot-engine-mcp] Godot editor connected");
        this.startHeartbeat();

        ws.on("message", (data) => this.handleMessage(data.toString()));

        ws.on("close", () => {
          console.error("[godot-engine-mcp] Godot editor disconnected");
          this.client = null;
          this.connected = false;
          this.stopHeartbeat();
          this.rejectAllPending("Godot disconnected");
        });

        ws.on("error", (err) => {
          console.error(`[godot-engine-mcp] Client error: ${err.message}`);
        });
      });
    });
  }

  isConnected(): boolean {
    return this.connected && this.client?.readyState === WebSocket.OPEN;
  }

  getPort(): number {
    return this.port;
  }

  async sendCommand(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.isConnected()) {
      throw new GodotConnectionError(
        "Not connected to Godot editor. Is the editor running with the plugin enabled?"
      );
    }

    const id = randomUUID();
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new TimeoutError(method, COMMAND_TIMEOUT_MS));
      }, COMMAND_TIMEOUT_MS);

      this.pendingRequests.set(id, {
        resolve: (response: JsonRpcResponse) => {
          if (response.error) {
            reject(
              new GodotCommandError(
                response.error.code,
                response.error.message,
                response.error.data
              )
            );
          } else {
            resolve(response.result);
          }
        },
        reject,
        timer,
      });

      this.client!.send(JSON.stringify(request));
    });
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.rejectAllPending("Server shutting down");

    if (this.client) {
      this.client.close();
      this.client = null;
    }

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }

    this.connected = false;
  }

  private handleMessage(raw: string): void {
    let response: JsonRpcResponse;
    try {
      response = JSON.parse(raw);
    } catch {
      console.error("[godot-engine-mcp] Failed to parse message:", raw.slice(0, 200));
      return;
    }

    if (!response.id) return; // Notification or heartbeat pong — ignore

    const pending = this.pendingRequests.get(response.id);
    if (!pending) return; // Orphaned response — ignore

    clearTimeout(pending.timer);
    this.pendingRequests.delete(response.id);
    pending.resolve(response);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.client!.ping();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private rejectAllPending(reason: string): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new GodotConnectionError(reason));
    }
    this.pendingRequests.clear();
  }

  private async findAvailablePort(): Promise<number> {
    for (let offset = 0; offset < PORT_RANGE; offset++) {
      const port = this.port + offset;
      const available = await this.testPort(port);
      if (available) return port;
    }
    throw new Error(
      `No available port in range ${this.port}-${this.port + PORT_RANGE - 1}`
    );
  }

  private testPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = new WebSocketServer({ host: "127.0.0.1", port });
      server.on("listening", () => {
        server.close(() => resolve(true));
      });
      server.on("error", () => {
        resolve(false);
      });
    });
  }
}
