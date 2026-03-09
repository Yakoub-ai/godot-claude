# Godot MCP Pro — Tool Catalog

162 tools for direct Godot engine manipulation via Claude Code.
Connection: Claude Code ←MCP→ Node.js Server ←WebSocket:6505→ Godot Editor Plugin

---

## Scene Management (9)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `create_scene` | New .tscn scene | `name`, `root_type`, `path` |
| `open_scene` | Open in editor | `path` |
| `save_scene` | Save changes | `path` |
| `delete_scene` | Remove scene file | `path` |
| `get_scene_tree` | Inspect hierarchy | `path` |
| `get_scene_file_content` | Raw .tscn content | `path` |
| `get_scene_dependencies` | Scene dependencies | `path` |
| `get_scene_exports` | Exported vars | `path` |
| `analyze_scene_complexity` | Node count/depth audit | `path` |

## Node Operations (8)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `add_node` | Add to scene tree | `parent_path`, `name`, `type` |
| `delete_node` | Remove node | `node_path` |
| `rename_node` | Change name | `node_path`, `new_name` |
| `move_node` | Reparent | `node_path`, `new_parent` |
| `duplicate_node` | Clone | `node_path` |
| `get_node_properties` | Read all props | `node_path` |
| `update_property` | Set single prop | `node_path`, `property`, `value` |
| `batch_set_property` | Set multiple props | `properties` (array) |

## Scripting (12)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `create_script` | New .gd file | `path`, `content`, `class_name` |
| `read_script` | Read source | `path` |
| `edit_script` | Modify content | `path`, `content` |
| `attach_script` | Attach to node | `node_path`, `script_path` |
| `validate_script` | Check parse errors | `path` |
| `list_scripts` | All project scripts | — |
| `get_open_scripts` | Open in editor | — |
| `find_script_references` | Where script is used | `path` |
| `find_nodes_by_script` | Nodes using script | `script_path` |
| `search_in_files` | Search project files | `query`, `file_pattern` |
| `search_files` | Find files by name | `query` |
| `execute_editor_script` | Run GDScript in editor | `code` |

## Signals & Groups (8)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `get_signals` | List node signals | `node_path` |
| `connect_signal` | Wire signal→method | `node_path`, `signal_name`, `target_path`, `method` |
| `disconnect_signal` | Remove connection | `node_path`, `signal_name`, `target_path`, `method` |
| `find_signal_connections` | All connections | `signal_name` |
| `analyze_signal_flow` | Map signal graph | `node_path` |
| `get_node_groups` | List groups | `node_path` |
| `set_node_groups` | Set membership | `node_path`, `groups` |
| `find_nodes_in_group` | All nodes in group | `group_name` |

## Animation (14)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `create_animation` | New animation | `node_path`, `name`, `length` |
| `remove_animation` | Delete | `node_path`, `name` |
| `list_animations` | Available anims | `node_path` |
| `get_animation_info` | Animation details | `node_path`, `name` |
| `add_animation_track` | Add track | `node_path`, `animation`, `track_type`, `track_path` |
| `set_animation_keyframe` | Set keyframe | `node_path`, `animation`, `track`, `time`, `value` |
| `create_animation_tree` | Setup AnimationTree | `node_path` |
| `get_animation_tree_structure` | Read tree layout | `node_path` |
| `set_blend_tree_node` | Config blend node | `node_path`, `blend_node` |
| `set_tree_parameter` | Set tree param | `node_path`, `parameter`, `value` |
| `add_state_machine_state` | Add state | `node_path`, `state_name` |
| `remove_state_machine_state` | Remove state | `node_path`, `state_name` |
| `add_state_machine_transition` | Add transition | `node_path`, `from`, `to` |
| `remove_state_machine_transition` | Remove transition | `node_path`, `from`, `to` |

## Audio (6)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `add_audio_player` | Add AudioStreamPlayer | `parent_path`, `name`, `stream_path` |
| `get_audio_info` | Audio node details | `node_path` |
| `get_audio_bus_layout` | Bus layout | — |
| `add_audio_bus` | New bus | `name` |
| `set_audio_bus` | Config bus | `bus_name`, `volume`, `mute`, `solo` |
| `add_audio_bus_effect` | Add effect | `bus_name`, `effect_type` |

## Physics & Collision (6)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `setup_collision` | Config collision shape | `node_path`, `shape_type`, `params` |
| `setup_physics_body` | Config physics body | `node_path`, `body_type`, `params` |
| `add_raycast` | Add RayCast node | `parent_path`, `target_position` |
| `set_physics_layers` | Set collision layers | `node_path`, `layer`, `mask` |
| `get_physics_layers` | Read layers/mask | `node_path` |
| `create_physics_material` | New PhysicsMaterial | `friction`, `bounce` |

## Navigation (4)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `setup_navigation_region` | Config nav region | `node_path`, `nav_mesh` |
| `setup_navigation_agent` | Config nav agent | `node_path`, `params` |
| `bake_navigation` | Bake nav mesh | `node_path` |
| `get_navigation_info` | Nav details | `node_path` |

## Particles (6)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `create_particles` | New particle system | `parent_path`, `name`, `type` |
| `set_particle_property` | Config particle prop | `node_path`, `property`, `value` |
| `apply_particle_preset` | Apply preset | `node_path`, `preset_name` |
| `get_particle_presets` | List presets | — |
| `create_particle_material` | New material | `params` |
| `set_particle_emission_shape` | Config emission | `node_path`, `shape`, `params` |

## Shaders (6)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `create_shader` | New .gdshader | `path`, `content` |
| `assign_shader_material` | Assign to node | `node_path`, `shader_path` |
| `set_shader_param` | Set uniform | `node_path`, `param`, `value` |
| `get_shader_params` | Read uniforms | `node_path` |
| `validate_shader` | Check for errors | `path` |
| `create_visual_shader` | New visual shader | `path` |

## Resources (6)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `create_resource` | New .tres resource | `path`, `type`, `properties` |
| `list_resources` | List project resources | `type_filter` |
| `create_theme` | New UI theme | `path`, `base_theme` |
| `set_theme_property` | Config theme prop | `path`, `item_type`, `item_name`, `property`, `value` |
| `get_project_info` | Project structure | — |
| `get_project_settings` | Project settings | — |

## Tilemaps (6)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `tilemap_set_cell` | Set single cell | `node_path`, `coords`, `source_id`, `atlas_coords` |
| `tilemap_fill_rect` | Fill rectangular area | `node_path`, `rect`, `source_id`, `atlas_coords` |
| `tilemap_get_cell` | Read cell data | `node_path`, `coords` |
| `tilemap_clear` | Clear all cells | `node_path` |
| `tilemap_get_used_cells` | All used cells | `node_path` |
| `tilemap_set_layer_properties` | Config layer | `node_path`, `layer`, `properties` |

## UI (6)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `find_ui_elements` | Find UI nodes | `root_path`, `type_filter` |
| `set_anchor_preset` | Set anchor/margins | `node_path`, `preset` |
| `set_size_flags` | Config size flags | `node_path`, `h_flags`, `v_flags` |
| `set_theme_override` | Override theme prop | `node_path`, `type`, `name`, `value` |
| `create_style_box` | New StyleBox | `type`, `params` |
| `set_control_layout` | Layout presets | `node_path`, `layout` |

## Runtime & Testing (15)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `play_scene` | Run scene | `path` |
| `play_project` | Run main scene | — |
| `stop_scene` | Stop running game | — |
| `get_game_screenshot` | Capture screenshot | — |
| `simulate_action` | Simulate input | `action`, `duration` |
| `get_game_node_properties` | Runtime node props | `node_path` |
| `set_game_node_property` | Runtime set prop | `node_path`, `property`, `value` |
| `call_game_method` | Call runtime method | `node_path`, `method`, `args` |
| `assert_node_state` | Assert prop values | `node_path`, `assertions` |
| `compare_screenshots` | Diff screenshots | `path_a`, `path_b` |
| `get_performance_monitors` | FPS/memory/draws | — |
| `run_stress_test` | Load test | `config` |
| `get_game_logs` | Runtime log output | — |
| `reload_scene` | Hot-reload scene | — |
| `toggle_debug_draw` | Visual debug | `mode` |

## Project Operations (10)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `get_project_info` | Full project overview | — |
| `get_project_settings` | Read settings | — |
| `set_project_setting` | Write setting | `key`, `value` |
| `get_autoloads` | List autoloads | — |
| `add_autoload` | Register autoload | `name`, `path` |
| `remove_autoload` | Unregister autoload | `name` |
| `get_input_map` | Input action map | — |
| `add_input_action` | Add input action | `name`, `events` |
| `get_editor_plugins` | List plugins | — |
| `export_project` | Export build | `preset`, `path` |
