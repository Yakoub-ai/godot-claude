extends SceneTree
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## Playtest harness. Launched by the godot-claude MCP server with:
##   godot --path <project> --script <this file> -- --scene=res://... --mode=stepped|realtime [--seed=N]
## and env GC_PORT / GC_TOKEN. It is never added to the project: nothing ships with the game.
##
## stepped mode: the engine is frozen between commands (the main loop blocks here), so a
##   `step` advances exactly N frames. Deterministic and fast (server passes --fixed-fps).
## realtime mode: the game runs freely; `step` just waits N frames.

const C := preload("../lib/common.gd")

enum Phase { CONNECTING, LOADING, IDLE, STEPPING, FINISHING }

var _tcp := StreamPeerTCP.new()
var _buf := PackedByteArray()
var _phase := Phase.CONNECTING
var _stepped := true
var _headless := false
var _token := ""
var _scene_path := ""
var _load_frames := 0
var _connect_deadline := 0
var _quitting := false

# Current step
var _step_id: Variant = null
var _step_frames := 0
var _step_index := 0
var _step_actions: Array = []
var _step_observe: Dictionary = {}
var _step_capture_every := 0
var _step_shots: Array = []
var _step_results: Array = []
var _pending_releases: Array = []  # [{frame, event}]
var _max_shots := 8


func _initialize() -> void:
	if not OS.is_debug_build():
		printerr("[godot-claude] harness refuses to run in release builds")
		quit(1)
		return
	_token = OS.get_environment("GC_TOKEN")
	var port := OS.get_environment("GC_PORT").to_int()
	OS.set_environment("GC_TOKEN", "")
	if _token.length() < 32 or port <= 0:
		printerr("[godot-claude] missing GC_PORT/GC_TOKEN")
		quit(1)
		return
	_stepped = C.user_arg("mode") != "realtime"
	_headless = DisplayServer.get_name() == "headless"
	var seed_arg := C.user_arg("seed")
	if not seed_arg.is_empty():
		seed(seed_arg.to_int())
	_scene_path = C.user_arg("scene")
	if _scene_path.is_empty():
		_scene_path = ProjectSettings.get_setting("application/run/main_scene", "")
	if _tcp.connect_to_host("127.0.0.1", port) != OK:
		printerr("[godot-claude] cannot connect to server")
		quit(1)
		return
	_connect_deadline = Time.get_ticks_msec() + 10000
	RenderingServer.frame_post_draw.connect(_on_frame_post_draw)


func _process(_delta: float) -> bool:
	if _quitting:
		return true
	_tcp.poll()
	var status := _tcp.get_status()
	if _phase != Phase.CONNECTING and status != StreamPeerTCP.STATUS_CONNECTED:
		quit(0)
		return true

	match _phase:
		Phase.CONNECTING:
			if status == StreamPeerTCP.STATUS_CONNECTED:
				_send({"type": "hello", "token": _token, "engine": Engine.get_version_info().string, "headless": _headless, "mode": "stepped" if _stepped else "realtime"})
				if _scene_path.is_empty() or not ResourceLoader.exists(_scene_path):
					_send({"type": "fatal", "error": "scene not found: '%s' (set a main scene or pass scene)" % _scene_path})
					quit(1)
					return true
				change_scene_to_file(_scene_path)
				_phase = Phase.LOADING
			elif status == StreamPeerTCP.STATUS_ERROR or Time.get_ticks_msec() > _connect_deadline:
				quit(1)
				return true
		Phase.LOADING:
			_load_frames += 1
			if current_scene != null and _load_frames >= 2:
				_phase = Phase.IDLE
				_send({"type": "ready", "scene": _scene_path, "frame": Engine.get_process_frames()})
		Phase.IDLE:
			if _stepped:
				_block_until_command()
			else:
				_read_commands()
		Phase.STEPPING:
			_advance_step()
			if not _stepped:
				_read_commands()
	return false


# ── Networking ────────────────────────────────────────────────────────────────

func _send(msg: Dictionary) -> void:
	_tcp.put_data((JSON.stringify(msg) + "\n").to_utf8_buffer())


func _read_commands() -> void:
	var avail := _tcp.get_available_bytes()
	if avail > 0:
		var got := _tcp.get_partial_data(avail)
		if got[0] == OK:
			_buf.append_array(got[1])
	while true:
		var nl := _buf.find(10)
		if nl < 0:
			break
		var line := _buf.slice(0, nl).get_string_from_utf8()
		_buf = _buf.slice(nl + 1)
		var msg: Variant = JSON.parse_string(line)
		if msg is Dictionary:
			_handle(msg)
		if _phase == Phase.STEPPING and _stepped:
			break


## Stepped mode: freeze the whole engine until a command starts a step.
func _block_until_command() -> void:
	while _phase == Phase.IDLE and not _quitting:
		_tcp.poll()
		if _tcp.get_status() != StreamPeerTCP.STATUS_CONNECTED:
			quit(0)
			return
		_read_commands()
		if _phase == Phase.IDLE and not _quitting:
			OS.delay_msec(2)


func _handle(msg: Dictionary) -> void:
	var id: Variant = msg.get("id")
	match msg.get("cmd", ""):
		"step":
			if _phase != Phase.IDLE:
				_send({"id": id, "ok": false, "error": "a step is already running"})
				return
			_begin_step(id, msg)
		"observe":
			if _phase != Phase.IDLE:
				_send({"id": id, "ok": false, "error": "busy"})
				return
			_begin_step(id, {"frames": 0, "observe": msg.get("observe", {})})
		"quit":
			_send({"id": id, "ok": true})
			_quitting = true
			quit(0)
		var other:
			_send({"id": id, "ok": false, "error": "unknown cmd '%s'" % other})


# ── Steps ─────────────────────────────────────────────────────────────────────

func _begin_step(id: Variant, msg: Dictionary) -> void:
	_step_id = id
	_step_frames = clampi(int(msg.get("frames", 1)), 0, 36000)
	_step_index = 0
	_step_actions = msg.get("actions", [])
	_step_observe = msg.get("observe", {})
	_step_capture_every = maxi(0, int(msg.get("capture_every", 0)))
	_step_shots = []
	_step_results = []
	_phase = Phase.STEPPING
	_run_actions_for_frame(0)
	if _step_frames == 0:
		_finish_step()


func _advance_step() -> void:
	_step_index += 1
	_flush_releases()
	if _step_index >= _step_frames:
		_finish_step()
		return
	_run_actions_for_frame(_step_index)
	if _step_capture_every > 0 and _step_index % _step_capture_every == 0 and _step_shots.size() < _max_shots and not _headless:
		_want_shot = true


var _want_shot := false
var _want_finish := false


func _finish_step() -> void:
	_phase = Phase.FINISHING
	if _headless or not _step_observe.get("screenshot", false):
		_complete_step(null)
	else:
		_want_finish = true  # wait for this frame to be drawn


func _on_frame_post_draw() -> void:
	if _want_shot:
		_want_shot = false
		_step_shots.append({"frame": _step_index, "png": _capture(0.5)})
	if _want_finish:
		_want_finish = false
		var opt: Variant = _step_observe.get("screenshot")
		var scale: float = float(opt.get("scale", 1.0)) if opt is Dictionary else 1.0
		_complete_step(_capture(scale))


func _complete_step(final_png: Variant) -> void:
	var resp: Dictionary = {"id": _step_id, "ok": true, "frames_advanced": _step_index, "observation": _observe(_step_observe)}
	if not _step_results.is_empty():
		resp["action_results"] = _step_results
	if final_png != null:
		resp["screenshot"] = final_png
	if not _step_shots.is_empty():
		resp["frames"] = _step_shots
	_send(resp)
	_phase = Phase.IDLE


func _capture(scale: float) -> String:
	var img := root.get_texture().get_image()
	if img == null:
		return ""
	scale = clampf(scale, 0.1, 1.0)
	if scale < 1.0:
		img.resize(maxi(1, int(img.get_width() * scale)), maxi(1, int(img.get_height() * scale)), Image.INTERPOLATE_BILINEAR)
	return Marshalls.raw_to_base64(img.save_png_to_buffer())


# ── Actions ───────────────────────────────────────────────────────────────────

func _run_actions_for_frame(frame: int) -> void:
	for a: Variant in _step_actions:
		if a is Dictionary and int(a.get("frame", 0)) == frame:
			var r := _do_action(a)
			if r != null:
				_step_results.append(r)


func _do_action(a: Dictionary) -> Variant:
	if a.has("press") or a.has("release") or a.has("tap"):
		var action: String = a.get("press", a.get("release", a.get("tap", "")))
		if not InputMap.has_action(action):
			return {"action": a, "error": "unknown input action '%s' (known: %s)" % [action, ", ".join(_user_actions())]}
		var ev := InputEventAction.new()
		ev.action = action
		ev.pressed = not a.has("release")
		ev.strength = float(a.get("strength", 1.0)) if ev.pressed else 0.0
		Input.parse_input_event(ev)
		if a.has("tap"):
			var up := InputEventAction.new()
			up.action = action
			up.pressed = false
			_pending_releases.append({"frame": _step_index + maxi(1, int(a.get("hold", 1))), "event": up})
		return null
	if a.has("key"):
		var code := OS.find_keycode_from_string(str(a["key"]))
		if code == KEY_NONE:
			return {"action": a, "error": "unknown key '%s'" % a["key"]}
		var down := not a.has("pressed") or bool(a["pressed"])
		Input.parse_input_event(_key_event(code, down))
		if not a.has("pressed"):
			_pending_releases.append({"frame": _step_index + maxi(1, int(a.get("hold", 1))), "event": _key_event(code, false)})
		return null
	if a.has("mouse_move"):
		var mm := InputEventMouseMotion.new()
		mm.position = _vec2(a["mouse_move"])
		mm.global_position = mm.position
		Input.parse_input_event(mm)
		return null
	if a.has("click"):
		var pos := _vec2(a["click"])
		var button := MOUSE_BUTTON_RIGHT if a.get("button", "left") == "right" else MOUSE_BUTTON_LEFT
		Input.parse_input_event(_mouse_event(pos, button, true))
		_pending_releases.append({"frame": _step_index + 1, "event": _mouse_event(pos, button, false)})
		return null
	if a.has("call"):
		var n := _node(str(a["call"]))
		var method: String = a.get("method", "")
		if n == null:
			return {"action": a, "error": "node not found: %s" % a["call"]}
		if not n.has_method(method):
			return {"action": a, "error": "%s has no method '%s'" % [n.name, method]}
		var args: Array = []
		for raw: Variant in a.get("args", []):
			var d := C.decode(raw)
			if not d[0]:
				return {"action": a, "error": d[1]}
			args.append(d[1])
		return {"call": "%s.%s" % [a["call"], method], "returned": C.encode(n.callv(method, args))}
	if a.has("set"):
		var n := _node(str(a["set"]))
		if n == null:
			return {"action": a, "error": "node not found: %s" % a["set"]}
		var props: Dictionary = a.get("props", {})
		for k: String in props:
			var r := C.set_property(n, k, props[k])
			if not r[0]:
				return {"action": a, "error": r[1]}
		return null
	if a.has("change_scene"):
		var p: String = str(a["change_scene"])
		if not C.is_safe_res_path(p) or not ResourceLoader.exists(p):
			return {"action": a, "error": "scene not found: %s" % p}
		change_scene_to_file(p)
		return null
	return {"action": a, "error": "unknown action (expected press|release|tap|key|mouse_move|click|call|set|change_scene)"}


func _flush_releases() -> void:
	var keep: Array = []
	for r: Dictionary in _pending_releases:
		if int(r["frame"]) <= _step_index:
			Input.parse_input_event(r["event"])
		else:
			keep.append(r)
	_pending_releases = keep


func _key_event(code: Key, down: bool) -> InputEventKey:
	var ev := InputEventKey.new()
	ev.keycode = code
	ev.physical_keycode = code
	ev.pressed = down
	return ev


func _mouse_event(pos: Vector2, button: MouseButton, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.position = pos
	ev.global_position = pos
	ev.button_index = button
	ev.pressed = down
	return ev


func _vec2(v: Variant) -> Vector2:
	if v is Array and v.size() >= 2:
		return Vector2(float(v[0]), float(v[1]))
	return Vector2.ZERO


func _user_actions() -> PackedStringArray:
	var out: PackedStringArray = []
	for a: StringName in InputMap.get_actions():
		if not str(a).begins_with("ui_"):
			out.append(str(a))
	return out


# ── Observation ───────────────────────────────────────────────────────────────

func _node(path: String) -> Node:
	if path.begins_with("/root"):
		return root.get_node_or_null(NodePath(path))
	if current_scene == null:
		return null
	if path.is_empty() or path == ".":
		return current_scene
	return current_scene.get_node_or_null(NodePath(path))


func _observe(spec: Dictionary) -> Dictionary:
	var out: Dictionary = {
		"scene": current_scene.scene_file_path if current_scene else null,
		"frame": Engine.get_process_frames(),
		"physics_frame": Engine.get_physics_frames(),
		"fps": Engine.get_frames_per_second(),
		"paused": paused,
	}
	if spec.has("tree"):
		var t: Variant = spec["tree"]
		var opts: Dictionary = t if t is Dictionary else {}
		var start := _node(str(opts.get("root", ".")))
		var lines: PackedStringArray = []
		if start:
			_tree_lines(start, 0, clampi(int(opts.get("depth", 4)), 1, 12), lines)
		out["tree"] = lines
	if spec.has("nodes"):
		var nodes: Dictionary = {}
		for q: Variant in spec["nodes"]:
			var path: String = q if q is String else str(q.get("path", ""))
			var props: Array = [] if q is String else q.get("props", [])
			var n := _node(path)
			nodes[path] = _node_state(n, props) if n else {"error": "not found"}
		out["nodes"] = nodes
	if spec.has("groups"):
		var groups: Dictionary = {}
		for g: String in spec["groups"]:
			var members: Array = []
			for n: Node in get_nodes_in_group(g):
				members.append(_brief(n))
			groups[g] = members
		out["groups"] = groups
	if spec.has("autoloads"):
		var autos: Dictionary = {}
		for n: Node in root.get_children():
			if n != current_scene:
				autos[n.name] = _node_state(n, [])
		out["autoloads"] = autos
	return out


func _node_state(n: Node, props: Array) -> Dictionary:
	var st: Dictionary = {"type": n.get_class()}
	if props.is_empty():
		for p: String in ["position", "rotation_degrees", "velocity", "linear_velocity", "visible", "text", "size", "value", "frame", "animation", "current_animation"]:
			if p in n:
				st[p] = C.encode(n.get(p))
		var s := n.get_script() as Script
		if s:
			st["script"] = s.resource_path
			for sp: Dictionary in s.get_script_property_list():
				if int(sp["usage"]) & PROPERTY_USAGE_SCRIPT_VARIABLE:
					st[sp["name"]] = C.encode(n.get(sp["name"]))
	else:
		for p: Variant in props:
			st[str(p)] = C.encode(n.get_indexed(NodePath(str(p))))
	if n is Node2D and props.is_empty():
		st["global_position"] = C.encode((n as Node2D).global_position)
	elif n is Node3D and props.is_empty() and n.is_inside_tree():
		st["global_position"] = C.encode((n as Node3D).global_position)
	return st


func _brief(n: Node) -> Dictionary:
	var b: Dictionary = {"path": str(current_scene.get_path_to(n)) if current_scene and current_scene.is_ancestor_of(n) else str(n.get_path()), "type": n.get_class()}
	if n is Node2D:
		b["position"] = C.encode((n as Node2D).global_position)
	elif n is Node3D:
		b["position"] = C.encode((n as Node3D).global_position)
	elif n is Control:
		b["position"] = C.encode((n as Control).global_position)
	return b


func _tree_lines(n: Node, depth: int, max_depth: int, lines: PackedStringArray) -> void:
	var line := "  ".repeat(depth) + "%s (%s)" % [n.name, n.get_class()]
	if n is Node2D:
		line += " pos=%s" % (n as Node2D).position.round()
	elif n is Node3D:
		line += " pos=%s" % (n as Node3D).position.snappedf(0.01)
	elif n is Control:
		line += " pos=%s size=%s" % [(n as Control).position.round(), (n as Control).size.round()]
	if (n is CanvasItem and not (n as CanvasItem).visible) or (n is Node3D and not (n as Node3D).visible):
		line += " hidden"
	if n.get_script():
		line += " script=%s" % (n.get_script() as Script).resource_path.get_file()
	lines.append(line)
	if lines.size() > 400:
		return
	if depth + 1 >= max_depth:
		if n.get_child_count() > 0:
			lines.append("  ".repeat(depth + 1) + "... %d children" % n.get_child_count())
		return
	for c: Node in n.get_children():
		_tree_lines(c, depth + 1, max_depth, lines)
