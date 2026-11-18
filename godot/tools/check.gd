extends SceneTree
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## Compiles every script and loads every scene, reporting failures.
## Engine error text goes to stderr; markers ("@@GC_FILE <path>") let the server attribute it.

const C := preload("../lib/common.gd")


func _initialize() -> void:
	var req := C.read_request()
	var include_addons: bool = req.get("include_addons", false)
	var paths: Array = req.get("paths", [])
	var check_scenes: bool = req.get("scenes", true)

	var scripts: PackedStringArray = []
	var scenes: PackedStringArray = []
	if paths.is_empty():
		scripts = C.list_files(["gd"], include_addons)
		if check_scenes:
			scenes = C.list_files(["tscn", "scn"], include_addons)
	else:
		for p: String in paths:
			if p.get_extension() == "gd":
				scripts.append(p)
			elif p.get_extension() in ["tscn", "scn"]:
				scenes.append(p)

	var failed_scripts: Array = []
	for path: String in scripts:
		printerr("@@GC_FILE ", path)
		if not FileAccess.file_exists(path):
			failed_scripts.append({"path": path, "reason": "file not found"})
			continue
		var s: Resource = ResourceLoader.load(path, "", ResourceLoader.CACHE_MODE_IGNORE)
		if s == null or not (s is Script) or not (s as Script).can_instantiate() and not _is_abstract(s):
			failed_scripts.append({"path": path, "reason": "failed to compile"})

	var failed_scenes: Array = []
	var missing: Array = []
	for path: String in scenes:
		printerr("@@GC_FILE ", path)
		for dep: String in ResourceLoader.get_dependencies(path):
			var dep_path := dep.get_slice("::", dep.get_slice_count("::") - 1) if dep.contains("::") else dep
			if dep_path.begins_with("uid://"):
				var id := ResourceUID.text_to_id(dep_path)
				dep_path = ResourceUID.get_id_path(id) if ResourceUID.has_id(id) else dep_path
			if not dep_path.is_empty() and not ResourceLoader.exists(dep_path):
				missing.append({"scene": path, "dependency": dep_path})
		var packed: Resource = ResourceLoader.load(path)
		if packed == null or not packed is PackedScene:
			failed_scenes.append({"path": path, "reason": "failed to load"})
			continue
		var inst: Node = (packed as PackedScene).instantiate()
		if inst == null:
			failed_scenes.append({"path": path, "reason": "failed to instantiate"})
		else:
			inst.free()
	printerr("@@GC_END")

	C.write_result({
		"ok": true,
		"scripts_checked": scripts.size(),
		"scenes_checked": scenes.size(),
		"failed_scripts": failed_scripts,
		"failed_scenes": failed_scenes,
		"missing_dependencies": missing,
	})
	quit(0)


func _is_abstract(s: Resource) -> bool:
	# Godot 4.5+: @abstract scripts compile fine but cannot be instantiated.
	return s is Script and s.has_method("is_abstract") and s.call("is_abstract")
