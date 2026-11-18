extends SceneTree
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## Reads a scene file via SceneState (no user code runs) and returns its node tree,
## stored (non-default) properties, groups, instanced sub-scenes and signal connections.

const C := preload("../lib/common.gd")


func _initialize() -> void:
	var req := C.read_request()
	var path: String = req.get("scene", "")
	var with_props: bool = req.get("properties", true)
	if path.is_empty() or not ResourceLoader.exists(path):
		C.write_result({"ok": false, "error": "scene not found: %s" % path})
		quit(0)
		return
	var packed := load(path) as PackedScene
	if packed == null:
		C.write_result({"ok": false, "error": "not a PackedScene: %s" % path})
		quit(0)
		return

	var state := packed.get_state()
	var nodes: Array = []
	for i: int in state.get_node_count():
		var node: Dictionary = {
			"path": str(state.get_node_path(i)).trim_prefix("./"),
			"type": str(state.get_node_type(i)),
		}
		var inst := state.get_node_instance(i)
		if inst:
			node["instance"] = inst.resource_path
		var groups := state.get_node_groups(i)
		if not groups.is_empty():
			node["groups"] = groups
		var props: Dictionary = {}
		for p: int in state.get_node_property_count(i):
			var pname := str(state.get_node_property_name(i, p))
			var val: Variant = state.get_node_property_value(i, p)
			if pname == "script":
				node["script"] = (val as Resource).resource_path if val is Resource else null
			elif with_props:
				props[pname] = C.encode(val)
		if with_props and not props.is_empty():
			node["properties"] = props
		if node["type"].is_empty() and not inst:
			node["type"] = "(inherited)"
		nodes.append(node)

	var connections: Array = []
	for c: int in state.get_connection_count():
		connections.append({
			"from": str(state.get_connection_source(c)).trim_prefix("./"),
			"signal": str(state.get_connection_signal(c)),
			"to": str(state.get_connection_target(c)).trim_prefix("./"),
			"method": str(state.get_connection_method(c)),
			"flags": state.get_connection_flags(c),
		})

	var base: SceneState = state.call("get_base_scene_state") if state.has_method("get_base_scene_state") else null  # 4.5+
	C.write_result({
		"ok": true,
		"scene": path,
		"inherits": base.get_path() if base else null,
		"node_count": nodes.size(),
		"nodes": nodes,
		"connections": connections,
	})
	quit(0)
