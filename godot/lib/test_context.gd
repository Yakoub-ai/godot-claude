extends RefCounted
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## The `t` object passed to every test method by godot-claude's test runner.
##
##   func test_jump(t) -> void:
##       var level: Node = t.instantiate("res://scenes/main.tscn")
##       await t.physics_frames(30)
##       t.tap("jump")
##       await t.physics_frames(5)
##       t.lt(level.get_node("Player").velocity.y, 0.0, "moves up after jumping")

var failures: Array[String] = []
var assertions: int = 0
var _tree: SceneTree
var _spawned: Array[Node] = []
var _pending_release: Array[StringName] = []


func _init(tree: SceneTree) -> void:
	_tree = tree


# ── Assertions ────────────────────────────────────────────────────────────────

func eq(actual: Variant, expected: Variant, msg: String = "") -> bool:
	return _check(_same(actual, expected), "expected %s, got %s" % [_s(expected), _s(actual)], msg)


func ne(actual: Variant, unexpected: Variant, msg: String = "") -> bool:
	return _check(not _same(actual, unexpected), "expected anything but %s" % _s(unexpected), msg)


func is_true(cond: bool, msg: String = "") -> bool:
	return _check(cond, "expected true", msg)


func is_false(cond: bool, msg: String = "") -> bool:
	return _check(not cond, "expected false", msg)


func is_null(v: Variant, msg: String = "") -> bool:
	return _check(v == null, "expected null, got %s" % _s(v), msg)


func not_null(v: Variant, msg: String = "") -> bool:
	return _check(v != null, "expected non-null", msg)


func almost(actual: Variant, expected: Variant, tolerance: float = 0.001, msg: String = "") -> bool:
	var ok := false
	if (actual is float or actual is int) and (expected is float or expected is int):
		ok = absf(float(actual) - float(expected)) <= tolerance
	elif actual is Vector2 and expected is Vector2 or actual is Vector3 and expected is Vector3:
		ok = actual.distance_to(expected) <= tolerance
	return _check(ok, "expected %s ± %s, got %s" % [_s(expected), tolerance, _s(actual)], msg)


func gt(a: Variant, b: Variant, msg: String = "") -> bool:
	return _check(a > b, "expected %s > %s" % [_s(a), _s(b)], msg)


func lt(a: Variant, b: Variant, msg: String = "") -> bool:
	return _check(a < b, "expected %s < %s" % [_s(a), _s(b)], msg)


func has(container: Variant, item: Variant, msg: String = "") -> bool:
	return _check(item in container, "expected %s to contain %s" % [_s(container), _s(item)], msg)


func fail(msg: String) -> void:
	_check(false, "failed", msg)


# ── Scenes, time and input ────────────────────────────────────────────────────

## Instantiates a scene into the running tree; it is freed automatically after the test.
func instantiate(scene_path: String) -> Node:
	var ps := load(scene_path) as PackedScene
	if ps == null:
		fail("cannot load scene %s" % scene_path)
		return null
	var n := ps.instantiate()
	_tree.root.add_child(n)
	_spawned.append(n)
	return n


## Adds an existing node to the tree (freed after the test).
func add(node: Node) -> Node:
	_tree.root.add_child(node)
	_spawned.append(node)
	return node


func frames(n: int = 1) -> void:
	for i: int in n:
		await _tree.process_frame
		_flush_release()


func physics_frames(n: int = 1) -> void:
	for i: int in n:
		await _tree.physics_frame
		_flush_release()


func seconds(s: float) -> void:
	await _tree.create_timer(s, true, true).timeout


func press(action: StringName, strength: float = 1.0) -> void:
	if not _known_action(action):
		return
	var ev := InputEventAction.new()
	ev.action = action
	ev.pressed = true
	ev.strength = strength
	Input.parse_input_event(ev)


func release(action: StringName) -> void:
	if not _known_action(action):
		return
	var ev := InputEventAction.new()
	ev.action = action
	ev.pressed = false
	Input.parse_input_event(ev)


## Press now, release after the next awaited frame.
func tap(action: StringName) -> void:
	press(action)
	_pending_release.append(action)


## Counts emissions of `sig` from now on. Read the result with `.count` / `.args`.
func watch(obj: Object, sig: StringName) -> SignalWatch:
	var w := SignalWatch.new()
	obj.connect(sig, w.on_emit)
	return w


class SignalWatch:
	extends RefCounted
	var count: int = 0
	var args: Array = []

	func on_emit(a: Variant = null, b: Variant = null, c: Variant = null, d: Variant = null) -> void:
		count += 1
		args = [a, b, c, d].filter(func(x: Variant) -> bool: return x != null)


# ── Internals ─────────────────────────────────────────────────────────────────

func cleanup() -> void:
	for n: Node in _spawned:
		if is_instance_valid(n):
			n.queue_free()
	_spawned.clear()
	for a: StringName in InputMap.get_actions():
		if Input.is_action_pressed(a):
			Input.action_release(a)


func _flush_release() -> void:
	for a: StringName in _pending_release:
		release(a)
	_pending_release.clear()


func _known_action(action: StringName) -> bool:
	if InputMap.has_action(action):
		return true
	fail("unknown input action '%s'" % action)
	return false


func _check(ok: bool, detail: String, msg: String) -> bool:
	assertions += 1
	if not ok:
		var where := _caller_line()
		failures.append(("%s: %s" % [msg, detail] if not msg.is_empty() else detail) + where)
	return ok


func _caller_line() -> String:
	# Godot 4.5+: script backtraces work without a debugger attached.
	if Engine.has_method("capture_script_backtraces"):
		var traces: Array = Engine.call("capture_script_backtraces")
		for bt: Object in traces:
			for i: int in bt.call("get_frame_count"):
				var file: String = bt.call("get_frame_file", i)
				if not file.begins_with("res://"):
					continue
				return " (%s:%d)" % [file, bt.call("get_frame_line", i)]
	return ""


func _same(a: Variant, b: Variant) -> bool:
	if (a is float or a is int) and (b is float or b is int):
		return is_equal_approx(float(a), float(b))
	if typeof(a) != typeof(b):
		return false
	return a == b


func _s(v: Variant) -> String:
	var s := var_to_str(v) if not v is Object else str(v)
	return s if s.length() < 200 else s.left(200) + "…"
