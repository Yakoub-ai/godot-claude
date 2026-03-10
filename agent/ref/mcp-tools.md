# godot-engine-mcp — Tool Catalog

209 tools across 23 categories for direct Godot engine manipulation via Claude Code.
Connection: Claude Code ←MCP→ Node.js Server ←WebSocket:6505→ Godot Editor Plugin

Core categories (always loaded): scene, node, script, editor
Extended categories (on-demand): call `enable_category` to load

Meta-tools: `list_categories`, `enable_category`, `disable_category`, `server_status`

---

## Scene (10 tools)
| Tool | Purpose |
|------|---------|
| `get_scene_tree` | Get the live scene tree of the currently edited scene |
| `get_scene_file_content` | Read the raw .tscn file content of a scene |
| `create_scene` | Create a new scene file with a specified root node type |
| `open_scene` | Open a scene in the Godot editor |
| `delete_scene` | Delete a scene file from the project |
| `add_scene_instance` | Instance an existing scene as a child node in the currently edited scene |
| `play_scene` | Run a scene in the Godot editor for testing |
| `stop_scene` | Stop the currently playing scene |
| `save_scene` | Save the currently edited scene |
| `get_scene_exports` | Get all @export variables from scripted nodes in a scene |

## Node (14 tools)
| Tool | Purpose |
|------|---------|
| `add_node` | Add new node to current scene |
| `delete_node` | Delete node from current scene (supports undo) |
| `duplicate_node` | Duplicate node and children |
| `move_node` | Move/reparent node |
| `update_property` | Set property on any node (supports Vector2, Color, etc.) |
| `get_node_properties` | Get all editor-visible properties |
| `add_resource` | Add resource to node property |
| `set_anchor_preset` | Set Control node anchor preset |
| `rename_node` | Rename node |
| `connect_signal` | Connect signal between nodes |
| `disconnect_signal` | Disconnect signal |
| `get_node_groups` | Get groups a node belongs to |
| `set_node_groups` | Set node groups (replaces current) |
| `find_nodes_in_group` | Find all nodes in a group |

## Script (8 tools)
| Tool | Purpose |
|------|---------|
| `list_scripts` | List all GDScript/C#/shader files in the project |
| `read_script` | Read the full content of a GDScript file |
| `create_script` | Create a new GDScript file with content or a template |
| `edit_script` | Edit a script via search-replace, full replace, or line insert |
| `attach_script` | Attach a GDScript file to a node in the scene |
| `detach_script` | Remove a script from a node |
| `validate_script` | Validate a GDScript file by compiling it |
| `get_open_scripts` | List all scripts currently open in the Godot script editor |

## Editor (10 tools)
| Tool | Purpose |
|------|---------|
| `get_editor_errors` | Get recent errors from the editor log |
| `get_output_log` | Read the editor Output panel contents |
| `clear_output` | Clear the editor Output panel |
| `get_editor_screenshot` | Capture a screenshot of the editor 2D/3D viewport |
| `get_game_screenshot` | Capture a screenshot of the running game |
| `compare_screenshots` | Pixel-diff two screenshots for visual regression testing |
| `execute_editor_script` | Execute GDScript code in the editor context |
| `get_signals` | Get all signals defined on a node, including their connections |
| `reload_plugin` | Reload the godot-engine-mcp plugin (disable/re-enable) |
| `reload_project` | Rescan the project filesystem and reload all scripts |

## Animation (14 tools)
| Tool | Purpose |
|------|---------|
| `list_animations` | List all animations in an AnimationPlayer node |
| `create_animation` | Create a new animation in an AnimationPlayer |
| `add_animation_track` | Add a track to an existing animation |
| `set_animation_keyframe` | Insert or update a keyframe on an animation track |
| `get_animation_info` | Get detailed information about an animation including all tracks and keyframes |
| `remove_animation` | Remove an animation from an AnimationPlayer by name |
| `create_animation_tree` | Create an AnimationTree node with an AnimationNodeStateMachine as root |
| `get_animation_tree_structure` | Read the full structure of an AnimationTree |
| `add_state_machine_state` | Add a state to an AnimationNodeStateMachine |
| `remove_state_machine_state` | Remove a state from an AnimationNodeStateMachine |
| `add_state_machine_transition` | Add a transition between two states in an AnimationNodeStateMachine |
| `remove_state_machine_transition` | Remove a transition between two states in an AnimationNodeStateMachine |
| `set_blend_tree_node` | Add or replace a node in a BlendTree state |
| `set_tree_parameter` | Set a parameter on the AnimationTree |

## Audio (8 tools)
| Tool | Purpose |
|------|---------|
| `get_audio_bus_layout` | Get the full audio bus layout including all buses, volumes, and effects |
| `add_audio_bus` | Add a new audio bus to the AudioServer |
| `set_audio_bus` | Modify an existing audio bus |
| `add_audio_bus_effect` | Add an audio effect to a bus |
| `add_audio_player` | Add an AudioStreamPlayer node to the scene tree |
| `get_audio_info` | Get audio setup information for a node subtree |
| `remove_audio_bus` | Remove an audio bus by name |
| `remove_audio_bus_effect` | Remove an audio effect from a bus by its index |

## Batch (8 tools)
| Tool | Purpose |
|------|---------|
| `find_nodes_by_type` | Find all nodes of a given type in the current scene tree |
| `find_signal_connections` | Find signal connections in the current scene |
| `batch_set_property` | Set a property on all nodes of a given type in the current scene |
| `find_node_references` | Search all project files for a text pattern |
| `get_scene_dependencies` | Get all resource dependencies for a scene or resource file |
| `cross_scene_set_property` | Set a property on all nodes of a given type across all scene files |
| `analyze_scene_complexity` | Analyze a scene's complexity: node count, nesting depth, potential issues |
| `get_project_statistics` | Get overall project statistics: file counts, script lines, autoloads |

## Debugger (10 tools)
| Tool | Purpose |
|------|---------|
| `set_breakpoint` | Set or remove a breakpoint in a GDScript file |
| `get_breakpoints` | Get all currently set breakpoints across all scripts |
| `clear_breakpoints` | Clear all breakpoints, optionally filtered to a specific file |
| `get_stack_trace` | Get the current call stack when paused at a breakpoint |
| `get_stack_variables` | Get local and member variables at a specific stack frame when paused |
| `debug_continue` | Continue game execution after hitting a breakpoint |
| `debug_step` | Step execution when paused at a breakpoint |
| `evaluate_expression` | Evaluate a GDScript expression in the current debug context |
| `get_debug_state` | Get the current debugger state: running, paused, breakpoint info |
| `watch_expression` | Add or remove a watch expression evaluated each time the debugger pauses |

## Docs (6 tools)
| Tool | Purpose |
|------|---------|
| `find_unused_resources` | Scan the project for resource files not referenced by any file |
| `analyze_signal_flow` | Map all signal connections in the currently edited scene |
| `find_script_references` | Find all places where a script, class_name, or resource is referenced |
| `detect_circular_dependencies` | Check for circular scene dependencies |
| `get_class_info` | Get class documentation: methods, properties, signals, enums, inheritance |
| `search_class_api` | Search across all Godot classes for methods, properties, or signals |

## Input (8 tools)
| Tool | Purpose |
|------|---------|
| `simulate_key` | Simulate a keyboard key press/release |
| `simulate_mouse_click` | Simulate a mouse button click at optional screen coordinates |
| `simulate_mouse_move` | Simulate mouse movement |
| `simulate_action` | Simulate an input action press/release |
| `simulate_sequence` | Execute a sequence of input events with optional frame delays |
| `get_input_actions` | Get all input actions defined in the project Input Map |
| `set_input_action` | Create or update an input action in the project Input Map |
| `remove_input_action` | Remove an input action from the project input map |

## Localization (8 tools)
| Tool | Purpose |
|------|---------|
| `get_translations` | Get all translation files configured in the project |
| `add_translation` | Add a translation file to the project's translation list |
| `remove_translation` | Remove a translation file from the project |
| `set_translation_key` | Set a translation key-value pair for a specific locale |
| `get_translation_keys` | Get all translation keys and values for a specific locale |
| `get_locale` | Get the current locale setting and list of available locales |
| `set_locale` | Set the current locale for the running game |
| `create_translation_csv` | Create a translation CSV file with headers for specified locales |

## Navigation (6 tools)
| Tool | Purpose |
|------|---------|
| `setup_navigation_region` | Add a NavigationRegion2D/3D child to a node with auto-created mesh |
| `bake_navigation_mesh` | Bake navigation mesh for a NavigationRegion3D or set outline for 2D |
| `setup_navigation_agent` | Add a NavigationAgent2D/3D child and configure pathfinding/avoidance |
| `set_navigation_layers` | Set navigation layers for a NavigationRegion or NavigationAgent |
| `get_navigation_info` | Get navigation setup info for a node and its subtree |
| `get_navigation_path` | Calculate a navigation path between two points |

## Networking (8 tools)
| Tool | Purpose |
|------|---------|
| `setup_multiplayer` | Setup a multiplayer peer (ENet or WebSocket server/client) |
| `get_multiplayer_info` | Get current multiplayer state: peer type, unique ID, connected peers |
| `get_connected_peers` | Get list of all connected peer IDs with their connection info |
| `disconnect_peer` | Disconnect a specific peer from the multiplayer session |
| `configure_rpc` | Configure RPC settings for a node method |
| `send_rpc` | Send an RPC call to a method on a node |
| `get_network_stats` | Get network statistics: bandwidth, packet counts, latency per peer |
| `close_multiplayer` | Close the current multiplayer connection and clean up peers |

## Particles (6 tools)
| Tool | Purpose |
|------|---------|
| `create_particles` | Add a GPUParticles2D or GPUParticles3D node with a ParticleProcessMaterial |
| `set_particle_material` | Configure ParticleProcessMaterial properties |
| `set_particle_color_gradient` | Set a color ramp (gradient) on a particle system's material |
| `apply_particle_preset` | Apply a named particle preset: explosion, fire, smoke, sparks, rain, snow, magic, dust |
| `get_particle_info` | Get the full configuration of a particle system |
| `remove_particles` | Remove a GPUParticles2D/3D node from the scene |

## Physics (8 tools)
| Tool | Purpose |
|------|---------|
| `setup_collision` | Add a CollisionShape2D or CollisionShape3D to a physics body node |
| `set_physics_layers` | Set collision layer and mask on a physics body or area node |
| `get_physics_layers` | Get the current collision layer and mask values for a physics node |
| `add_raycast` | Add a RayCast2D or RayCast3D node as a child |
| `setup_physics_body` | Configure physics properties on a CharacterBody or RigidBody |
| `get_collision_info` | Get detailed collision information for a node |
| `setup_area` | Configure properties on an Area2D or Area3D node |
| `get_physics_body_info` | Get complete physics body information including type, shapes, layers |

## Plugins (6 tools)
| Tool | Purpose |
|------|---------|
| `list_plugins` | List all editor plugins with their enabled/disabled status |
| `enable_plugin` | Enable an editor plugin by its folder name |
| `disable_plugin` | Disable an editor plugin by its folder name |
| `get_plugin_info` | Get detailed information about an editor plugin |
| `create_plugin_scaffold` | Create a new editor plugin scaffold with plugin.cfg and main script |
| `get_addon_files` | List all files in an addon/plugin directory |

## Profiling (6 tools)
| Tool | Purpose |
|------|---------|
| `get_performance_monitors` | Get all Godot performance monitors (FPS, memory, draw calls, etc.) |
| `get_editor_performance` | Get a quick performance summary (FPS, frame time, memory) |
| `profile_frames` | Profile frame times over a duration |
| `get_memory_info` | Get detailed memory usage breakdown |
| `detect_bottlenecks` | Analyze game performance and detect bottlenecks |
| `get_render_info` | Get rendering pipeline information: draw calls, vertices, objects |

## Project (10 tools)
| Tool | Purpose |
|------|---------|
| `get_project_info` | Get project metadata including name, version, Godot version, main scene |
| `get_filesystem_tree` | Get the project file and directory tree |
| `search_files` | Search for files by name in the project |
| `search_in_files` | Search for text content inside project files (grep-like) |
| `get_project_settings` | Read project settings, optionally filtered by section |
| `set_project_setting` | Set a project setting value |
| `uid_to_project_path` | Convert a Godot UID string to its corresponding resource path |
| `project_path_to_uid` | Convert a resource path to its Godot UID |
| `add_autoload` | Add an autoload singleton to the project |
| `remove_autoload` | Remove an autoload singleton from the project |

## Rendering (12 tools)
| Tool | Purpose |
|------|---------|
| `add_mesh_instance` | Add a MeshInstance3D node with a primitive mesh or load a 3D model file |
| `setup_lighting` | Add a light node (DirectionalLight3D, OmniLight3D, SpotLight3D) |
| `set_material_3d` | Create and apply a StandardMaterial3D to a MeshInstance3D |
| `setup_environment` | Add or configure a WorldEnvironment node with sky, fog, glow, SSAO, SSR |
| `setup_camera_3d` | Add or configure a Camera3D node |
| `add_gridmap` | Add or configure a GridMap node with a MeshLibrary |
| `create_shader` | Create a new shader file with a template or custom content |
| `read_shader` | Read the content of a shader file |
| `edit_shader` | Edit a shader file using full replacement or search-and-replace |
| `assign_shader_material` | Create a ShaderMaterial from a shader file and assign it to a node |
| `set_shader_param` | Set a shader parameter on a node's ShaderMaterial |
| `get_shader_params` | Get all shader parameters and their current values |

## Resources (8 tools)
| Tool | Purpose |
|------|---------|
| `read_resource` | Read a .tres resource file and return its properties |
| `edit_resource` | Edit properties of an existing .tres resource file |
| `create_resource` | Create a new .tres resource file of a given type |
| `get_resource_preview` | Get a visual preview of an image or texture resource as PNG |
| `duplicate_resource` | Duplicate a resource file to a new path |
| `list_resource_properties` | List all configurable properties of a Godot resource type |
| `get_resource_dependencies` | Get all resources that a given resource depends on |
| `rename_resource` | Rename or move a resource file, optionally updating all references |

## Runtime (18 tools)
| Tool | Purpose |
|------|---------|
| `get_game_scene_tree` | Get the scene tree of the currently running game |
| `get_game_node_properties` | Get properties of a node in the running game |
| `set_game_node_property` | Set a property on a node in the running game |
| `execute_game_script` | Execute GDScript code in the context of the running game |
| `capture_frames` | Capture multiple screenshots at frame intervals from the running game |
| `monitor_properties` | Record property values of a node over multiple frames |
| `start_recording` | Start recording input events in the running game |
| `stop_recording` | Stop recording input events and return the captured event list |
| `replay_recording` | Replay a previously recorded sequence of input events |
| `find_nodes_by_script` | Find all nodes in the running game with a specific script attached |
| `get_autoload` | Get properties of an autoload singleton in the running game |
| `find_ui_elements` | Find all visible UI Control elements in the running game |
| `click_button_by_text` | Click a button in the running game by its text label |
| `wait_for_node` | Wait until a node exists at the specified path in the running game |
| `find_nearby_nodes` | Find nodes within a radius of a position in the running game |
| `navigate_to` | Get navigation information from the player to a target position |
| `move_to` | Autopilot the player to a target position or node |
| `batch_get_properties` | Get properties of multiple nodes in the running game in a single call |

## Tilemap (8 tools)
| Tool | Purpose |
|------|---------|
| `tilemap_set_cell` | Set a single cell in a TileMapLayer |
| `tilemap_fill_rect` | Fill a rectangular region of a TileMapLayer with a specific tile |
| `tilemap_get_cell` | Get tile data for a specific cell in a TileMapLayer |
| `tilemap_clear` | Clear all cells in a TileMapLayer |
| `tilemap_get_info` | Get information about a TileMapLayer including its TileSet and config |
| `tilemap_get_used_cells` | Get a list of all used (non-empty) cells in a TileMapLayer |
| `tilemap_set_pattern` | Set a pattern of tiles relative to a starting position |
| `tilemap_erase_rect` | Erase all tiles in a rectangular region of a TileMapLayer |

## UI (9 tools)
| Tool | Purpose |
|------|---------|
| `create_theme` | Create a Theme resource and save it to disk |
| `set_theme_color` | Set a theme color override on a Control node |
| `set_theme_constant` | Set a theme constant override on a Control node |
| `set_theme_font_size` | Set a theme font size override on a Control node |
| `set_theme_stylebox` | Set a StyleBoxFlat override on a Control node |
| `get_theme_info` | Get theme information for a Control node including overrides |
| `create_control` | Create a Control node (Button, Label, LineEdit, etc.) |
| `setup_container` | Create or configure a container node (VBox, HBox, Grid, Margin, etc.) |
| `get_control_info` | Get detailed info about a Control node: size, anchors, margins, theme |
