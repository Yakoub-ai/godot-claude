extends SceneTree
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## godot-claude test runner. Zero install: nothing is added to the project.
## Discovers res://test(s)/**/test_*.gd. Each test script extends RefCounted (or Node) and
## defines `func test_something(t) -> void`. Optional hooks: before_all(t), before_each(t),
## after_each(t), after_all(t). Test methods may `await` (frames, physics, signals).
## Stderr markers ("@@GC_TEST <id>") let the server attribute runtime errors to tests.

const C := preload("../lib/common.gd")
const TestContext := preload("../lib/test_context.gd")


func _initialize() -> void:
	var req := C.read_request()
	var dirs: Array = req.get("dirs", ["res://test", "res://tests"])
	var select: String = req.get("select", "")
	var name_filter: String = req.get("name", "")

	var files: PackedStringArray = []
	for d: String in dirs:
		if DirAccess.dir_exists_absolute(d):
			for f: String in C.list_files(["gd"], true, d):
				if f.get_file().begins_with("test_") and (select.is_empty() or f.contains(select)):
					files.append(f)

	var results: Array = []
	var skipped: Array = []
	for path: String in files:
		var src := FileAccess.get_file_as_string(path)
		if src.contains("extends GutTest") or src.contains("extends GdUnitTestSuite"):
			skipped.append({"script": path, "reason": "uses another test framework (GUT/gdUnit4); run it with that framework"})
			continue
		printerr("@@GC_TEST %s::<load>" % path)
		var script := load(path) as Script
		if script == null or not script.can_instantiate():
			results.append({"script": path, "name": "<load>", "status": "error", "failures": ["test script failed to compile"]})
			continue
		await _run_script(path, script, name_filter, results)
	printerr("@@GC_TEST <end>")

	var passed := results.filter(func(r: Dictionary) -> bool: return r["status"] == "passed").size()
	C.write_result({
		"ok": true,
		"files": files.size(),
		"total": results.size(),
		"passed": passed,
		"failed": results.size() - passed,
		"tests": results,
		"skipped": skipped,
	})
	quit(0)


func _run_script(path: String, script: Script, name_filter: String, results: Array) -> void:
	var obj: Object = script.new()
	if obj is Node:
		root.add_child(obj)
	var methods: Array[String] = []
	for m: Dictionary in script.get_script_method_list():
		var n: String = m["name"]
		if n.begins_with("test_") and not methods.has(n) and (name_filter.is_empty() or n.contains(name_filter)):
			methods.append(n)

	var suite_ctx := TestContext.new(self)
	if obj.has_method("before_all"):
		await obj.call("before_all", suite_ctx)

	for method: String in methods:
		var t := TestContext.new(self)
		printerr("@@GC_TEST %s::%s" % [path, method])
		var started := Time.get_ticks_msec()
		if obj.has_method("before_each"):
			await obj.call("before_each", t)
		await obj.call(method, t)
		if obj.has_method("after_each"):
			await obj.call("after_each", t)
		t.cleanup()
		await process_frame  # let queued frees run
		var entry: Dictionary = {
			"script": path,
			"name": method,
			"status": "passed" if t.failures.is_empty() else "failed",
			"assertions": t.assertions,
			"ms": Time.get_ticks_msec() - started,
		}
		if not t.failures.is_empty():
			entry["failures"] = t.failures
		elif t.assertions == 0:
			entry["warning"] = "no assertions"
		results.append(entry)

	if obj.has_method("after_all"):
		await obj.call("after_all", suite_ctx)
	suite_ctx.cleanup()
	if obj is Node:
		(obj as Node).queue_free()
	await process_frame
