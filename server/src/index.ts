import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GodotConnection } from "./connection.js";
import { CategoryRegistry } from "./registry.js";

// Import category definitions — core
import { sceneCategory } from "./categories/scene.js";
import { nodeCategory } from "./categories/node.js";
import { scriptCategory } from "./categories/script.js";
import { editorCategory } from "./categories/editor.js";

// Import category definitions — extended
import { animationCategory } from "./categories/animation.js";
import { audioCategory } from "./categories/audio.js";
import { physicsCategory } from "./categories/physics.js";
import { navigationCategory } from "./categories/navigation.js";
import { particlesCategory } from "./categories/particles.js";
import { renderingCategory } from "./categories/rendering.js";
import { tilemapCategory } from "./categories/tilemap.js";
import { uiCategory } from "./categories/ui.js";
import { resourcesCategory } from "./categories/resources.js";
import { runtimeCategory } from "./categories/runtime.js";
import { inputCategory } from "./categories/input.js";
import { projectCategory } from "./categories/project.js";
import { profilingCategory } from "./categories/profiling.js";
import { batchCategory } from "./categories/batch.js";
import { debuggerCategory } from "./categories/debugger.js";
import { localizationCategory } from "./categories/localization.js";
import { pluginsCategory } from "./categories/plugins.js";
import { networkingCategory } from "./categories/networking.js";
import { docsCategory } from "./categories/docs.js";

async function main(): Promise<void> {
  const port = parseInt(process.env.GODOT_MCP_PORT ?? "6505", 10);

  const server = new McpServer({
    name: "godot-engine-mcp",
    version: "1.0.0",
  });

  const godot = new GodotConnection(port);
  const registry = new CategoryRegistry(server, godot);

  // Register core categories (always loaded)
  registry.register(sceneCategory, true);
  registry.register(nodeCategory, true);
  registry.register(scriptCategory, true);
  registry.register(editorCategory, true);

  // Register extended categories (on-demand)
  registry.register(animationCategory);
  registry.register(audioCategory);
  registry.register(physicsCategory);
  registry.register(navigationCategory);
  registry.register(particlesCategory);
  registry.register(renderingCategory);
  registry.register(tilemapCategory);
  registry.register(uiCategory);
  registry.register(resourcesCategory);
  registry.register(runtimeCategory);
  registry.register(inputCategory);
  registry.register(projectCategory);
  registry.register(profilingCategory);
  registry.register(batchCategory);
  registry.register(debuggerCategory);
  registry.register(localizationCategory);
  registry.register(pluginsCategory);
  registry.register(networkingCategory);
  registry.register(docsCategory);

  // Register meta-tools (list_categories, enable_category, etc.)
  registry.registerMetaTools();

  // Load core categories
  registry.enableAllCore();

  // Start Godot WebSocket (non-blocking — editor can connect later)
  try {
    await godot.connect();
  } catch (err) {
    console.error(`[godot-engine-mcp] Initial connection failed (will retry on first command): ${err}`);
  }

  // Start MCP transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[godot-engine-mcp] MCP server running on stdio");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await godot.disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[godot-engine-mcp] Fatal error:", err);
  process.exit(1);
});
