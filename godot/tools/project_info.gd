extends SceneTree
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## Summarizes a Godot project: engine, settings, autoloads, input map, layers, files.

const C := preload("../lib/common.gd")


func _initialize() -> void:
	var v := Engine.get_version_info()
	var info: Dictionary = {
		"engine": {"version": "%d.%d.%d" % [v.major, v.minor, v.patch], "status": v.status, "string": v.string},
		"name": ProjectSettings.get_setting("application/config/name", ""),
		"main_scene": ProjectSettings.get_setting("application/run/main_scene", ""),
		"features": ProjectSettings.get_setting("application/config/features", PackedStringArray()),
		"rendering_method": ProjectSettings.get_setting("rendering/renderer/rendering_method", ""),
		"physics_3d_engine": ProjectSettings.get_setting("physics/3d/physics_engine", "DEFAULT"),
		"window": {
			"size": [
				ProjectSettings.get_setting("display/window/size/viewport_width", 0),
				ProjectSettings.get_setting("display/window/size/viewport_height", 0),
			],
			"stretch_mode": ProjectSettings.get_setting("display/window/stretch/mode", ""),
			"stretch_aspect": ProjectSettings.get_setting("display/window/stretch/aspect", ""),
		},
		"default_texture_filter": ProjectSettings.get_setting("rendering/textures/canvas_textures/default_texture_filter", 1),
		"autoloads": [],
		"input_actions": {},
		"layer_names": {},
		"addons": [],
		"files": {},
	}

	for p: Dictionary in ProjectSettings.get_property_list():
		var name: String = p["name"]
		if name.begins_with("autoload/"):
			var path: String = ProjectSettings.get_setting(name)
			info["autoloads"].append({"name": name.trim_prefix("autoload/"), "path": path.trim_prefix("*"), "singleton": path.begins_with("*")})
		elif name.begins_with("input/"):
			var action: Dictionary = ProjectSettings.get_setting(name)
			var events: Array[String] = []
			for e: InputEvent in action.get("events", []):
				events.append(e.as_text())
			info["input_actions"][name.trim_prefix("input/")] = events
		elif name.begins_with("layer_names/"):
			var val: String = ProjectSettings.get_setting(name)
			if not val.is_empty():
				info["layer_names"][name.trim_prefix("layer_names/")] = val

	var da := DirAccess.open("res://addons")
	if da:
		for d: String in da.get_directories():
			info["addons"].append(d)

	var files: Dictionary = info["files"]
	files["scenes"] = C.list_files(["tscn", "scn"])
	files["scripts"] = C.list_files(["gd", "cs"])
	files["resources"] = C.list_files(["tres", "res"])
	files["shaders"] = C.list_files(["gdshader", "gdshaderinc"])
	var assets := C.list_files(["png", "jpg", "jpeg", "webp", "svg", "glb", "gltf", "blend", "fbx", "obj", "wav", "ogg", "mp3", "ttf", "otf"])
	files["asset_count"] = assets.size()
	files["assets_sample"] = assets.slice(0, 40)
	files["has_tests"] = DirAccess.dir_exists_absolute("res://test") or DirAccess.dir_exists_absolute("res://tests")
	info["test_framework"] = "gut" if DirAccess.dir_exists_absolute("res://addons/gut") else ("gdunit4" if DirAccess.dir_exists_absolute("res://addons/gdUnit4") else "")

	C.write_result({"ok": true, "info": info})
	quit(0)
