import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const localizationCategory: CategoryDef = {
  name: "localization",
  description:
    "Translation files, locale management, string keys, CSV/PO import",
  tools: [
    {
      name: "get_translations",
      description:
        "Get all translation files configured in the project and their locale codes.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_translations", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "add_translation",
      description:
        "Add a translation file to the project's translation list.",
      schema: {
        path: z
          .string()
          .describe(
            "Path to translation file (e.g. 'res://translations/messages.en.translation')",
          ),
        locale: z
          .string()
          .describe("Locale code (e.g. 'en', 'es', 'ja')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_translation", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "remove_translation",
      description: "Remove a translation file from the project.",
      schema: {
        path: z
          .string()
          .describe("Path to the translation file to remove"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_translation", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_translation_key",
      description:
        "Set a translation key-value pair for a specific locale.",
      schema: {
        key: z
          .string()
          .describe("Translation key (e.g. 'MENU_START')"),
        value: z.string().describe("Translated text"),
        locale: z.string().describe("Locale code (e.g. 'en')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_translation_key", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_translation_keys",
      description:
        "Get all translation keys and values for a specific locale.",
      schema: {
        locale: z.string().describe("Locale code"),
        filter: z
          .string()
          .optional()
          .describe("Filter keys containing substring"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_translation_keys",
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
      name: "get_locale",
      description:
        "Get the current locale setting and list of available locales.",
      schema: {},
      handler: async (
        _params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_locale", {});
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_locale",
      description: "Set the current locale for the running game.",
      schema: {
        locale: z
          .string()
          .describe("Locale code to set (e.g. 'en', 'es')"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_locale", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "create_translation_csv",
      description:
        "Create a translation CSV file with headers for specified locales.",
      schema: {
        path: z
          .string()
          .describe(
            "Path for CSV file (e.g. 'res://translations/strings.csv')",
          ),
        locales: z
          .array(z.string())
          .describe(
            "Array of locale codes to include (e.g. ['en', 'es', 'ja'])",
          ),
        keys: z
          .array(
            z.object({
              key: z.string(),
              values: z.record(z.string(), z.string()),
            }),
          )
          .optional()
          .describe("Initial key-value pairs"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "create_translation_csv",
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
