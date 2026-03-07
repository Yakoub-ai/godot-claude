# Godot MCP Pro — Full Tool Catalog

162 tools for direct Godot engine integration. Organized by domain.
Connection: Claude Code ←stdio/MCP→ Node.js Server ←WebSocket:6505→ Godot Editor Plugin
Auth: none required. Godot editor must be open with plugin enabled.

---

## 1. Scene Management (9 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `create_scene` | Creating a new .tscn scene | `name`, `root_type`, `path` |
| `open_scene` | Opening a scene in the editor | `path` |
| `save_scene` | Saving current scene changes | `path` |
| `delete_scene` | Removing a scene file | `path` |
| `get_scene_tree` | Inspecting scene node hierarchy | `path` |
| `get_scene_file_content` | Reading raw .tscn content | `path` |
| `get_scene_dependencies` | Finding what a scene depends on | `path` |
| `get_scene_exports` | Listing exported vars in scene | `path` |
| `analyze_scene_complexity` | Checking node count, depth | `path` |

## 2. Node Operations (8 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `add_node` | Adding a node to the scene tree | `parent_path`, `name`, `type` |
| `delete_node` | Removing a node | `node_path` |
| `rename_node` | Changing a node's name | `node_path`, `new_name` |
| `move_node` | Reparenting a node | `node_path`, `new_parent` |
| `duplicate_node` | Cloning a node | `node_path` |
| `get_node_properties` | Reading all properties | `node_path` |
| `update_property` | Setting a single property | `node_path`, `property`, `value` |
| `batch_set_property` | Setting multiple properties at once | `properties` (array) |

## 3. Scripting & Code (12 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `create_script` | Creating a new .gd file | `path`, `content`, `class_name` |
| `read_script` | Reading script source | `path` |
| `edit_script` | Modifying script content | `path`, `content` |
| `attach_script` | Attaching script to a node | `node_path`, `script_path` |
| `validate_script` | Checking for parse errors | `path` |
| `list_scripts` | Listing all project scripts | — |
| `get_open_scripts` | Scripts open in editor | — |
| `find_script_references` | Finding where a script is used | `path` |
| `find_nodes_by_script` | Nodes using a specific script | `script_path` |
| `search_in_files` | Searching across project files | `query`, `file_pattern` |
| `search_files` | Finding files by name | `query` |
| `execute_editor_script` | Running GDScript in the editor | `code` |

## 4. Signals & Groups (8 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `get_signals` | Listing a node's signals | `node_path` |
| `connect_signal` | Wiring a signal to a method | `node_path`, `signal_name`, `target_path`, `method` |
| `disconnect_signal` | Removing a signal connection | `node_path`, `signal_name`, `target_path`, `method` |
| `find_signal_connections` | Finding all connections for a signal | `signal_name` |
| `analyze_signal_flow` | Mapping signal graph | `node_path` |
| `get_node_groups` | Listing groups a node belongs to | `node_path` |
| `set_node_groups` | Setting group membership | `node_path`, `groups` |
| `find_nodes_in_group` | Finding all nodes in a group | `group_name` |

## 5. Animation & State Machines (14 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `create_animation` | Creating a new animation | `node_path`, `name`, `length` |
| `remove_animation` | Deleting an animation | `node_path`, `name` |
| `list_animations` | Listing available animations | `node_path` |
| `get_animation_info` | Getting animation details | `node_path`, `name` |
| `add_animation_track` | Adding tracks (property, method, etc.) | `node_path`, `animation`, `track_type`, `track_path` |
| `set_animation_keyframe` | Setting keyframe values | `node_path`, `animation`, `track`, `time`, `value` |
| `create_animation_tree` | Setting up AnimationTree | `node_path` |
| `get_animation_tree_structure` | Reading tree layout | `node_path` |
| `set_blend_tree_node` | Configuring blend tree nodes | `node_path`, `blend_node` |
| `set_tree_parameter` | Setting tree parameters | `node_path`, `parameter`, `value` |
| `add_state_machine_state` | Adding state to StateMachine | `node_path`, `state_name` |
| `remove_state_machine_state` | Removing a state | `node_path`, `state_name` |
| `add_state_machine_transition` | Adding transition between states | `node_path`, `from`, `to` |
| `remove_state_machine_transition` | Removing a transition | `node_path`, `from`, `to` |

## 6. Audio (6 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `add_audio_player` | Adding AudioStreamPlayer node | `parent_path`, `name`, `stream_path` |
| `get_audio_info` | Getting audio node details | `node_path` |
| `get_audio_bus_layout` | Reading bus layout | — |
| `add_audio_bus` | Creating a new audio bus | `name` |
| `set_audio_bus` | Configuring bus properties | `bus_name`, `volume`, `mute`, `solo` |
| `add_audio_bus_effect` | Adding effect to a bus | `bus_name`, `effect_type` |

## 7. Physics & Collision (6 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `setup_collision` | Configuring collision shape | `node_path`, `shape_type`, `params` |
| `setup_physics_body` | Configuring physics body properties | `node_path`, `properties` |
| `get_collision_info` | Reading collision setup | `node_path` |
| `get_physics_layers` | Reading layer/mask names | — |
| `set_physics_layers` | Configuring layer names | `layers` |
| `add_raycast` | Adding RayCast2D/3D | `parent_path`, `name`, `target_position` |

## 8. Navigation (5 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `setup_navigation_region` | Creating nav region | `node_path` |
| `setup_navigation_agent` | Configuring nav agent | `node_path`, `properties` |
| `bake_navigation_mesh` | Baking navmesh | `node_path` |
| `get_navigation_info` | Reading nav setup | `node_path` |
| `set_navigation_layers` | Configuring nav layers | `node_path`, `layers` |

## 9. Particles (5 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `create_particles` | Creating particle node | `parent_path`, `name`, `type` |
| `get_particle_info` | Reading particle config | `node_path` |
| `apply_particle_preset` | Applying preset (fire, smoke, etc.) | `node_path`, `preset` |
| `set_particle_material` | Setting particle material | `node_path`, `properties` |
| `set_particle_color_gradient` | Configuring color ramp | `node_path`, `gradient` |

## 10. Shaders (6 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `create_shader` | Creating a new .gdshader | `path`, `code` |
| `read_shader` | Reading shader source | `path` |
| `edit_shader` | Modifying shader code | `path`, `code` |
| `assign_shader_material` | Applying shader to node | `node_path`, `shader_path` |
| `get_shader_params` | Reading shader uniforms | `node_path` |
| `set_shader_param` | Setting shader uniform value | `node_path`, `param`, `value` |

## 11. Resources & Themes (10 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `create_resource` | Creating a .tres resource | `path`, `type`, `properties` |
| `read_resource` | Reading resource properties | `path` |
| `edit_resource` | Modifying resource | `path`, `properties` |
| `add_resource` | Adding resource to node | `node_path`, `property`, `resource_path` |
| `create_theme` | Creating a Theme resource | `path` |
| `get_theme_info` | Reading theme data | `path` |
| `set_theme_color` | Setting theme color | `theme_path`, `type`, `name`, `color` |
| `set_theme_constant` | Setting theme constant | `theme_path`, `type`, `name`, `value` |
| `set_theme_font_size` | Setting font size | `theme_path`, `type`, `name`, `size` |
| `set_theme_stylebox` | Configuring StyleBox | `theme_path`, `type`, `name`, `properties` |

## 12. Tilemaps & Gridmaps (7 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `tilemap_get_info` | Reading tilemap setup | `node_path` |
| `tilemap_set_cell` | Placing a single tile | `node_path`, `coords`, `source_id`, `atlas_coords` |
| `tilemap_get_cell` | Reading a cell | `node_path`, `coords` |
| `tilemap_get_used_cells` | Getting all placed cells | `node_path` |
| `tilemap_fill_rect` | Filling a rectangle | `node_path`, `rect`, `source_id`, `atlas_coords` |
| `tilemap_clear` | Clearing all tiles | `node_path` |
| `add_gridmap` | Adding GridMap (3D) | `parent_path`, `name` |

## 13. UI & Input (5 tools)

| Tool | Use When | Key Params |
|------|----------|------------|
| `find_ui_elements` | Finding UI nodes in scene | `node_path` |
| `set_anchor_preset` | Setting Control anchors | `node_path`, `preset` |
| `get_input_actions` | Reading input map | — |
| `set_input_action` | Configuring input action | `action_name`, `events` |
| `click_button_by_text` | Simulating button click | `text` |

## 14. Runtime & Testing (25 tools)

### Scene Execution
| Tool | Use When | Key Params |
|------|----------|------------|
| `play_scene` | Running a scene | `path` |
| `stop_scene` | Stopping running scene | — |

### Game State Inspection
| Tool | Use When | Key Params |
|------|----------|------------|
| `get_game_scene_tree` | Runtime scene tree | — |
| `get_game_node_properties` | Runtime node properties | `node_path` |
| `set_game_node_property` | Modifying runtime property | `node_path`, `property`, `value` |
| `batch_get_properties` | Reading multiple properties | `queries` |
| `monitor_properties` | Watching property changes | `node_path`, `properties` |

### Input Simulation
| Tool | Use When | Key Params |
|------|----------|------------|
| `simulate_action` | Simulating input action | `action`, `pressed` |
| `simulate_key` | Simulating key press | `key`, `pressed` |
| `simulate_mouse_click` | Clicking at position | `position`, `button` |
| `simulate_mouse_move` | Moving mouse | `position` |
| `simulate_sequence` | Running input sequence | `steps` |

### Assertions & Testing
| Tool | Use When | Key Params |
|------|----------|------------|
| `assert_node_state` | Verifying node properties | `node_path`, `assertions` |
| `assert_screen_text` | Checking visible text | `text`, `exists` |
| `wait_for_node` | Waiting for node to exist | `node_path`, `timeout` |
| `run_test_scenario` | Running test script | `scenario` |
| `run_stress_test` | Performance testing | `config` |
| `get_test_report` | Getting test results | — |

### Screenshots & Recording
| Tool | Use When | Key Params |
|------|----------|------------|
| `get_game_screenshot` | Capturing runtime screenshot | — |
| `get_editor_screenshot` | Capturing editor view | — |
| `compare_screenshots` | Visual regression testing | `image_a`, `image_b` |
| `capture_frames` | Recording frame sequence | `count`, `interval` |
| `start_recording` | Starting input recording | — |
| `stop_recording` | Stopping input recording | — |
| `replay_recording` | Replaying recorded input | `recording_id` |

### Navigation
| Tool | Use When | Key Params |
|------|----------|------------|
| `navigate_to` | Moving to location | `position` |
| `move_to` | Moving node to position | `node_path`, `position` |

## 15. Project-Wide Tools

| Tool | Use When | Key Params |
|------|----------|------------|
| `get_project_info` | Project overview | — |
| `get_project_settings` | Reading project settings | `category` |
| `set_project_setting` | Changing project setting | `setting`, `value` |
| `get_project_statistics` | File counts, sizes | — |
| `get_filesystem_tree` | Project file structure | `path` |
| `get_editor_errors` | Current editor errors | — |
| `get_editor_performance` | Editor performance stats | — |
| `get_performance_monitors` | Runtime performance | — |
| `get_output_log` | Editor output log | — |
| `clear_output` | Clearing output log | — |
| `get_export_info` | Export configuration | — |
| `list_export_presets` | Available export presets | — |
| `export_project` | Building the project | `preset`, `path` |
| `get_autoload` | Listing autoloads | — |
| `add_autoload` | Registering autoload | `name`, `path` |
| `remove_autoload` | Removing autoload | `name` |
| `reload_plugin` | Reloading editor plugin | `plugin_name` |
| `reload_project` | Reloading entire project | — |

## 16. 3D Setup

| Tool | Use When | Key Params |
|------|----------|------------|
| `add_mesh_instance` | Adding 3D mesh | `parent_path`, `mesh_type` |
| `set_material_3d` | Setting 3D material | `node_path`, `properties` |
| `setup_camera_3d` | Configuring 3D camera | `node_path`, `properties` |
| `setup_lighting` | Adding lights | `parent_path`, `type` |
| `setup_environment` | Configuring WorldEnvironment | `node_path`, `properties` |

## 17. Analysis & Discovery

| Tool | Use When | Key Params |
|------|----------|------------|
| `find_nearby_nodes` | Spatial proximity search | `position`, `radius` |
| `find_node_references` | Finding node references | `node_path` |
| `find_unused_resources` | Finding orphaned resources | — |
| `detect_circular_dependencies` | Finding circular refs | — |
| `get_resource_preview` | Getting resource thumbnail | `path` |

## 18. Scene Instances & UIDs

| Tool | Use When | Key Params |
|------|----------|------------|
| `add_scene_instance` | Instantiating a scene | `parent_path`, `scene_path` |
| `cross_scene_set_property` | Setting property across scenes | `scene_path`, `node_path`, `property`, `value` |
| `project_path_to_uid` | Converting path to UID | `path` |
| `uid_to_project_path` | Converting UID to path | `uid` |
