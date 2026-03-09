export class GodotConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GodotConnectionError";
  }
}

export class GodotCommandError extends Error {
  code: number;
  data?: Record<string, unknown>;

  constructor(code: number, message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = "GodotCommandError";
    this.code = code;
    this.data = data;
  }
}

export class TimeoutError extends Error {
  constructor(method: string, timeoutMs: number) {
    super(`Command '${method}' timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

export function formatErrorForMcp(error: unknown): string {
  if (error instanceof GodotConnectionError) {
    return [
      `Connection error: ${error.message}`,
      "",
      "Make sure:",
      "  1. Godot editor is running",
      "  2. The 'Godot Engine MCP' plugin is enabled",
      "  3. Check Project → Project Settings → Plugins",
    ].join("\n");
  }

  if (error instanceof GodotCommandError) {
    const lines = [`Godot error (${error.code}): ${error.message}`];
    if (error.data?.suggestion) {
      lines.push("", `Suggestion: ${error.data.suggestion}`);
    }
    if (error.data?.available) {
      lines.push("", `Available: ${JSON.stringify(error.data.available)}`);
    }
    return lines.join("\n");
  }

  if (error instanceof TimeoutError) {
    return [
      error.message,
      "",
      "The Godot editor may be busy or the plugin stopped responding.",
      "Try: reload_plugin or check if a modal dialog is blocking the editor.",
    ].join("\n");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
