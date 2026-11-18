extends SceneTree
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## Applies a batch of edit operations to a scene and saves it with the engine's own serializer.
## All-or-nothing: if any op fails, nothing is written.
## Nodes are edited outside the SceneTree, so _ready()/_process() never run.

const C := preload("../lib/common.gd")

var _root: Node


func _initialize() -> void:
	C.write_result(_run(C.read_request()))
	if _root:
		_root.free()
	quit(0)


func _run(req: Dictionary) -> Dictionary:
	var path: String = req.get("scene", "")
	if not path.begins_with("res://") or path.get_extension() != "tscn":
		return {"ok": false, "error": "scene must be a res:// path ending in .tscn"}

	var create: Variant = req.get("create", null)
	var packed: PackedScene
	if create is Dictionary:
		if ResourceLoader.exists(path) and not req.get("overwrite", false):
			return {"ok": false, "error": "%s already exists (pass overwrite: true to replace it)" % path}
		var made := _create_root(create)
		if not made[0]:
			return {"ok": false, "error": made[1]}
		_root = made[1]
		packed = PackedScene.new()
	else:
		if not ResourceLoader.exists(path):
			return {"ok": false, "error": "scene not found: %s (use create to make a new one)" % path}
		packed = load(path) as PackedScene
		if packed == null:
			return {"ok": false, "error": "not a PackedScene: %s" % path}
		_root = packed.instantiate(PackedScene.GEN_EDIT_STATE_INSTANCE)
		if _root == null:
			return {"ok": false, "error": "failed to instantiate %s (run godot_check for details)" % path}

	var ops: Array = req.get("ops", [])
	for i: int in ops.size():
		var op: Variant = ops[i]
		if not op is Dictionary:
			return {"ok": false, "error": "op %d is not an object" % i}
		var err := _apply(op)
		if not err.is_empty():
			return {"ok": false, "error": "op %d (%s) failed: %s" % [i, op.get("op", "?"), err], "failed_op": i}

	var pack_err := packed.pack(_root)
	if pack_err != OK:
		return {"ok": false, "error": "pack failed: %s" % error_string(pack_err)}
	# Preserve the scene's UID (ResourceSaver drops it when run from a --script tool).
	var uid := ResourceLoader.get_resource_uid(path) if ResourceLoader.exists(path) else ResourceUID.INVALID_ID
	if uid == ResourceUID.INVALID_ID:
		uid = ResourceUID.create_id()
	DirAccess.make_dir_recursive_absolute(path.get_base_dir())
	var save_err := ResourceSaver.save(packed, path)
	if save_err != OK:
		return {"ok": false, "error": "save failed: %s" % error_string(save_err)}
	_restore_uid(path, uid)

	var summary: Array = []
	_summarize(_root, summary)
	return {"ok": true, "scene": path, "ops_applied": ops.size(), "nodes": summary}


func _restore_uid(path: String, uid: int) -> void:
	if ResourceSaver.has_method("set_uid"):  # Godot 4.5+
		ResourceSaver.call("set_uid", path, uid)
		return
	# Godot 4.4: patch the header line of the text scene.
	var text := FileAccess.get_file_as_string(path)
	var nl := text.find("\n")
	var header := text.substr(0, nl)
	if header.contains(" uid=") or not header.ends_with("]"):
		return
	header = header.trim_suffix("]") + " uid=\"%s\"]" % ResourceUID.id_to_text(uid)
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f:
		f.store_string(header + text.substr(nl))
		f.close()


func _create_root(create: Dictionary) -> Array:
	var inherits: String = create.get("inherits", "")
	var root: Node
	if not inherits.is_empty():
		var base := load(inherits) as PackedScene if C.is_safe_res_path(inherits) and ResourceLoader.exists(inherits) else null
		if base == null:
			return [false, "inherits: scene not found: %s" % inherits]
		root = base.instantiate(PackedScene.GEN_EDIT_STATE_MAIN_INHERITED)
	else:
		var made := C.instantiate_class(create.get("type", "Node"), "Node")
		if not made[0]:
			return made
		root = made[1]
	root.name = create.get("name", root.name if not root.name.is_empty() else "Root")
	if create.has("script"):
		var e := _attach_script(root, create["script"])
		if not e.is_empty():
			root.free()
			return [false, e]
	if create.has("props"):
		var e2 := _set_props(root, create["props"])
		if not e2.is_empty():
			root.free()
			return [false, e2]
	return [true, root]


func _apply(op: Dictionary) -> String:
	match op.get("op", ""):
		"add":
			return _op_add(op)
		"set":
			var n := _find(op.get("node", ""))
			return "node not found: %s" % op.get("node") if n == null else _set_props(n, op.get("props", {}))
		"remove":
			var n := _find(op.get("node", ""))
			if n == null:
				return "node not found: %s" % op.get("node")
			if n == _root:
				return "cannot remove the root node"
			if n.owner != _root:
				return "node belongs to an instanced scene; remove the instance instead"
			n.get_parent().remove_child(n)
			n.free()
		"rename":
			var n := _find(op.get("node", ""))
			if n == null:
				return "node not found: %s" % op.get("node")
			var new_name: String = op.get("name", "")
			if new_name.is_empty() or new_name.validate_node_name() != new_name:
				return "invalid node name: '%s'" % new_name
			n.name = new_name
		"move":
			var n := _find(op.get("node", ""))
			var p := _find(op.get("parent", "."))
			if n == null or p == null:
				return "node or parent not found"
			if n == _root or n == p or n.is_ancestor_of(p):
				return "invalid move"
			n.reparent(p, false)
			_reown(n)
			if op.has("index"):
				p.move_child(n, int(op["index"]))
		"script":
			var n := _find(op.get("node", ""))
			return "node not found: %s" % op.get("node") if n == null else _attach_script(n, op.get("path", null))
		"connect":
			return _op_connect(op, true)
		"disconnect":
			return _op_connect(op, false)
		"groups":
			var n := _find(op.get("node", ""))
			if n == null:
				return "node not found: %s" % op.get("node")
			for g: String in op.get("add", []):
				n.add_to_group(g, true)
			for g: String in op.get("remove", []):
				n.remove_from_group(g)
		var other:
			return "unknown op '%s' (expected add|set|remove|rename|move|script|connect|disconnect|groups)" % other
	return ""


func _op_add(op: Dictionary) -> String:
	var parent := _find(op.get("parent", "."))
	if parent == null:
		return "parent not found: %s" % op.get("parent")
	if parent != _root and parent.owner != _root:
		return "cannot add children inside an instanced scene"
	var node: Node
	if op.has("scene"):
		var sp: String = op["scene"]
		var ps := load(sp) as PackedScene if C.is_safe_res_path(sp) and ResourceLoader.exists(sp) else null
		if ps == null:
			return "scene not found: %s" % sp
		node = ps.instantiate(PackedScene.GEN_EDIT_STATE_INSTANCE)
	else:
		var made := C.instantiate_class(op.get("type", ""), "Node")
		if not made[0]:
			return made[1]
		node = made[1]
	if op.has("name"):
		node.name = str(op["name"])
	parent.add_child(node, true)
	node.owner = _root
	if op.has("script"):
		var e := _attach_script(node, op["script"])
		if not e.is_empty():
			return e
	if op.has("props"):
		var e2 := _set_props(node, op["props"])
		if not e2.is_empty():
			return e2
	if op.has("groups"):
		for g: String in op["groups"]:
			node.add_to_group(g, true)
	return ""


func _op_connect(op: Dictionary, do_connect: bool) -> String:
	var from := _find(op.get("from", ""))
	var to := _find(op.get("to", ""))
	var sig: String = op.get("signal", "")
	var method: String = op.get("method", "")
	if from == null or to == null:
		return "from/to node not found"
	if not from.has_signal(sig):
		return "%s has no signal '%s'" % [from.name, sig]
	var callable := Callable(to, method)
	if do_connect:
		if from.is_connected(sig, callable):
			return ""
		var err := from.connect(sig, callable, int(op.get("flags", 0)) | CONNECT_PERSIST)
		return "" if err == OK else error_string(err)
	if from.is_connected(sig, callable):
		from.disconnect(sig, callable)
	return ""


func _attach_script(node: Node, path: Variant) -> String:
	if path == null:
		node.set_script(null)
		return ""
	var sp := str(path)
	if not C.is_safe_res_path(sp) or not ResourceLoader.exists(sp):
		return "script not found: %s" % sp
	var script := load(sp) as Script
	if script == null or not script.can_instantiate():
		return "script failed to compile: %s (run godot_check)" % sp
	if not node.is_class(script.get_instance_base_type()):
		return "%s extends %s but node is %s" % [sp, script.get_instance_base_type(), node.get_class()]
	node.set_script(script)
	return ""


func _set_props(obj: Object, props: Variant) -> String:
	if not props is Dictionary:
		return "props must be an object"
	for key: String in props:
		var r := C.set_property(obj, key, props[key])
		if not r[0]:
			return r[1]
	return ""


func _find(path: String) -> Node:
	if path.is_empty() or path == "." or path == _root.name:
		return _root
	return _root.get_node_or_null(NodePath(path))


func _reown(n: Node) -> void:
	if n.owner == null or n.owner == _root or not n.scene_file_path.is_empty():
		n.owner = _root
	for c: Node in n.get_children():
		if c.owner == null:
			_reown(c)


func _summarize(n: Node, out: Array, prefix: String = "") -> void:
	var p := "." if n == _root else (prefix + n.name if prefix != "." else String(n.name))
	var entry := {"path": p, "type": n.get_class()}
	if n.get_script():
		entry["script"] = (n.get_script() as Script).resource_path
	if n != _root and not n.scene_file_path.is_empty():
		entry["instance"] = n.scene_file_path
	out.append(entry)
	if n != _root and not n.scene_file_path.is_empty():
		return  # don't list instance internals
	for c: Node in n.get_children():
		_summarize(c, out, "" if n == _root else p + "/")
