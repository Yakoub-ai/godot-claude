/**
 * Tools currently declared by the TypeScript MCP layer but not implemented by
 * the bundled Godot editor plugin. Keep this list explicit so the server does
 * not advertise commands that would fail with "Method not found" at runtime.
 *
 * Run `./verify.sh` after changing tool categories or plugin commands.
 */
export const UNSUPPORTED_PLUGIN_METHODS = new Set<string>([
  "add_translation",
  "clear_breakpoints",
  "close_multiplayer",
  "configure_rpc",
  "create_control",
  "create_plugin_scaffold",
  "create_translation_csv",
  "debug_continue",
  "debug_step",
  "detach_script",
  "detect_bottlenecks",
  "disable_plugin",
  "disconnect_peer",
  "duplicate_resource",
  "enable_plugin",
  "evaluate_expression",
  "get_addon_files",
  "get_breakpoints",
  "get_class_info",
  "get_connected_peers",
  "get_control_info",
  "get_debug_state",
  "get_locale",
  "get_memory_info",
  "get_multiplayer_info",
  "get_navigation_path",
  "get_network_stats",
  "get_physics_body_info",
  "get_plugin_info",
  "get_render_info",
  "get_resource_dependencies",
  "get_stack_trace",
  "get_stack_variables",
  "get_translation_keys",
  "get_translations",
  "list_plugins",
  "list_resource_properties",
  "profile_frames",
  "remove_audio_bus",
  "remove_audio_bus_effect",
  "remove_input_action",
  "remove_particles",
  "remove_translation",
  "rename_resource",
  "search_class_api",
  "send_rpc",
  "set_breakpoint",
  "set_locale",
  "set_translation_key",
  "setup_area",
  "setup_container",
  "setup_multiplayer",
  "tilemap_erase_rect",
  "tilemap_set_pattern",
  "watch_expression",
]);

export function isPluginSupportedMethod(method: string): boolean {
  return !UNSUPPORTED_PLUGIN_METHODS.has(method);
}
