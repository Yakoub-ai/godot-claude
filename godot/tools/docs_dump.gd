extends SceneTree
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## Converts the editor's offline class reference cache (editor_doc_cache-X.Y.res) into JSON.
## The cache is produced by running the editor once; the server handles that step.

const C := preload("../lib/common.gd")


func _initialize() -> void:
	var req := C.read_request()
	var cache: String = req.get("cache", "")
	var out: String = req.get("out", "")
	var res: Resource = ResourceLoader.load(cache) if FileAccess.file_exists(cache) else null
	if res == null or not res.has_meta("classes"):
		C.write_result({"ok": false, "error": "doc cache not readable: %s" % cache})
		quit(0)
		return
	var classes: Array = res.get_meta("classes")
	var f := FileAccess.open(out, FileAccess.WRITE)
	if f == null:
		C.write_result({"ok": false, "error": "cannot write %s" % out})
		quit(0)
		return
	f.store_string(JSON.stringify(classes))
	f.close()
	C.write_result({"ok": true, "classes": classes.size()})
	quit(0)
