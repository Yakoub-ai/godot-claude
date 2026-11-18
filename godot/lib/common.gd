extends RefCounted
@warning_ignore_start("untyped_declaration","inferred_declaration","unsafe_property_access","unsafe_method_access","unsafe_cast","unsafe_call_argument","return_value_discarded","unused_variable","unused_local_constant","unused_private_class_variable","unused_parameter","unused_signal","shadowed_variable","shadowed_variable_base_class","shadowed_global_identifier","unreachable_code","standalone_expression","narrowing_conversion","integer_division","inference_on_variant","native_method_override","get_node_default_without_onready","onready_with_export","static_called_on_instance","redundant_static_unload","redundant_await","assert_always_true","assert_always_false","confusable_identifier","confusable_local_declaration","confusable_local_usage","int_as_enum_without_cast","int_as_enum_without_match","enum_variable_without_default","missing_tool","unsafe_void_return","deprecated_keyword","incompatible_ternary","unassigned_variable","unassigned_variable_op_assign","empty_file")
## Shared helpers for godot-claude tool scripts.
## Request/result exchange uses JSON files passed via user args:
##   godot --headless --path <project> --script <tool.gd> -- --request=<file> --result=<file>
## Compatible with Godot 4.4+.

const _LITERAL_TYPES: PackedStringArray = [
	"Vector2", "Vector2i", "Vector3", "Vector3i", "Vector4", "Vector4i",
	"Rect2", "Rect2i", "Transform2D", "Transform3D", "Basis", "Quaternion",
	"AABB", "Plane", "Projection", "Color", "NodePath", "StringName",
	"PackedByteArray", "PackedInt32Array", "PackedInt64Array",
	"PackedFloat32Array", "PackedFloat64Array", "PackedStringArray",
	"PackedVector2Array", "PackedVector3Array", "PackedColorArray", "PackedVector4Array",
]

static var _literal_re: RegEx


static func is_safe_res_path(path: String) -> bool:
	if not path.begins_with("res://"):
		return false
	var rest := path.substr(6)
	return not (rest.split("/").has("..") or rest.contains("\\") or rest.contains(":"))


static func user_arg(name: String) -> String:
	var prefix := "--%s=" % name
	for a: String in OS.get_cmdline_user_args():
		if a.begins_with(prefix):
			return a.substr(prefix.length())
	return ""


static func read_request() -> Dictionary:
	var path := user_arg("request")
	if path.is_empty():
		return {}
	var text := FileAccess.get_file_as_string(path)
	var data: Variant = JSON.parse_string(text)
	return data if data is Dictionary else {}


static func write_result(data: Dictionary) -> void:
	var path := user_arg("result")
	var text := JSON.stringify(data)
	if path.is_empty():
		print(text)
		return
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f:
		f.store_string(text)
		f.close()


## Lists project files with the given extensions, skipping hidden dirs and (optionally) addons/.
static func list_files(exts: PackedStringArray, include_addons: bool = false, dir: String = "res://") -> PackedStringArray:
	var out: PackedStringArray = []
	var da := DirAccess.open(dir)
	if da == null:
		return out
	da.include_hidden = false
	da.list_dir_begin()
	var name := da.get_next()
	while not name.is_empty():
		var full := dir.path_join(name)
		if da.current_is_dir():
			var skip := name.begins_with(".") or (name == "addons" and dir == "res://" and not include_addons)
			if not skip and not FileAccess.file_exists(full.path_join(".gdignore")):
				out.append_array(list_files(exts, include_addons, full))
		elif name.get_extension() in exts:
			out.append(full)
		name = da.get_next()
	da.list_dir_end()
	out.sort()
	return out


# ── Value codec (JSON <-> Variant). Never evaluates code. ─────────────────────

static func _get_literal_re() -> RegEx:
	if _literal_re == null:
		_literal_re = RegEx.new()
		_literal_re.compile("^(%s)\\(" % "|".join(_LITERAL_TYPES))
	return _literal_re


## Decodes a JSON value into a Variant, using target_type (Variant.Type) as a hint.
## Returns [ok: bool, value_or_error: Variant].
static func decode(v: Variant, target_type: int = TYPE_NIL) -> Array:
	if v == null:
		return [true, null]
	if v is bool:
		return [true, v]
	if v is float or v is int:
		if target_type == TYPE_INT:
			return [true, int(v)]
		if target_type == TYPE_FLOAT:
			return [true, float(v)]
		return [true, v]
	if v is String:
		return _decode_string(v, target_type)
	if v is Array:
		return _decode_array(v, target_type)
	if v is Dictionary:
		return _decode_dict(v, target_type)
	return [false, "unsupported value: %s" % str(v)]


static func _decode_string(s: String, target_type: int) -> Array:
	if _get_literal_re().search(s) != null:
		if s.contains("Object(") or s.contains("Resource(") or s.contains("ExtResource") or s.contains("SubResource"):
			return [false, "object literals are not allowed: %s" % s]
		var parsed: Variant = str_to_var(s)
		if parsed == null or parsed is Object:
			return [false, "could not parse literal: %s" % s]
		return [true, parsed]
	match target_type:
		TYPE_COLOR:
			if s.begins_with("#") or Color.html_is_valid(s):
				return [true, Color.html(s)]
			return [true, Color.from_string(s, Color.MAGENTA)]
		TYPE_NODE_PATH:
			return [true, NodePath(s)]
		TYPE_STRING_NAME:
			return [true, StringName(s)]
		TYPE_INT:
			if s.is_valid_int():
				return [true, s.to_int()]
		TYPE_FLOAT:
			if s.is_valid_float():
				return [true, s.to_float()]
		TYPE_OBJECT:
			if s.begins_with("res://"):
				return _load_resource(s)
	return [true, s]


static func _decode_array(a: Array, target_type: int) -> Array:
	var all_numbers := a.all(func(x: Variant) -> bool: return x is float or x is int)
	if all_numbers:
		match target_type:
			TYPE_VECTOR2:
				if a.size() == 2: return [true, Vector2(a[0], a[1])]
			TYPE_VECTOR2I:
				if a.size() == 2: return [true, Vector2i(a[0], a[1])]
			TYPE_VECTOR3:
				if a.size() == 3: return [true, Vector3(a[0], a[1], a[2])]
			TYPE_VECTOR3I:
				if a.size() == 3: return [true, Vector3i(a[0], a[1], a[2])]
			TYPE_VECTOR4:
				if a.size() == 4: return [true, Vector4(a[0], a[1], a[2], a[3])]
			TYPE_COLOR:
				if a.size() == 3: return [true, Color(a[0], a[1], a[2])]
				if a.size() == 4: return [true, Color(a[0], a[1], a[2], a[3])]
			TYPE_RECT2:
				if a.size() == 4: return [true, Rect2(a[0], a[1], a[2], a[3])]
			TYPE_PACKED_FLOAT32_ARRAY:
				return [true, PackedFloat32Array(a)]
			TYPE_PACKED_INT32_ARRAY:
				return [true, PackedInt32Array(a)]
	var out: Array = []
	for item: Variant in a:
		var r := decode(item)
		if not r[0]:
			return r
		out.append(r[1])
	if target_type == TYPE_PACKED_STRING_ARRAY:
		return [true, PackedStringArray(out)]
	return [true, out]


static func _decode_dict(d: Dictionary, _target_type: int) -> Array:
	if d.has("$res"):
		return _load_resource(str(d["$res"]))
	if d.has("$new"):
		return new_resource(str(d["$new"]), d)
	var out: Dictionary = {}
	for k: Variant in d:
		var r := decode(d[k])
		if not r[0]:
			return r
		out[k] = r[1]
	return [true, out]


static func _load_resource(path: String) -> Array:
	if not is_safe_res_path(path):
		return [false, "resource paths must be res:// paths inside the project (got %s)" % path]
	if not ResourceLoader.exists(path):
		return [false, "resource not found: %s" % path]
	var res := load(path)
	if res == null:
		return [false, "failed to load resource: %s" % path]
	return [true, res]


## Creates a built-in Resource of class `cls` and applies the remaining keys as properties.
static func new_resource(cls: String, props: Dictionary) -> Array:
	var made := instantiate_class(cls, "Resource")
	if not made[0]:
		return made
	var res: Resource = made[1]
	if props.has("script"):
		var rs := set_property(res, "script", props["script"])
		if not rs[0]:
			return rs
	for key: String in props:
		if key.begins_with("$") or key == "script":
			continue
		var r := set_property(res, key, props[key])
		if not r[0]:
			return r
	return [true, res]


## Instantiates an engine class or a script `class_name` that derives from `base`.
## Returns [ok, object_or_error].
static func instantiate_class(cls: String, base: String) -> Array:
	# Never build executable code from tool input (GDScript/CSharpScript resources, etc.).
	if ClassDB.class_exists(cls) and (cls == "Script" or ClassDB.is_parent_class(cls, "Script")):
		return [false, "creating Script resources from input is not allowed; write a .gd file and reference it by path"]
	if ClassDB.class_exists(cls):
		if not ClassDB.is_parent_class(cls, base):
			return [false, "'%s' is not a %s" % [cls, base]]
		if not ClassDB.can_instantiate(cls):
			return [false, "'%s' cannot be instantiated (abstract or editor-only)" % cls]
		return [true, ClassDB.instantiate(cls)]
	for g: Dictionary in ProjectSettings.get_global_class_list():
		if g["class"] == cls:
			var script := load(g["path"]) as Script
			if script == null or not script.can_instantiate():
				return [false, "script class '%s' failed to load (%s)" % [cls, g["path"]]]
			var native := script.get_instance_base_type()
			if not ClassDB.is_parent_class(native, base):
				return [false, "'%s' is not a %s" % [cls, base]]
			return [true, script.new()]
	return [false, "unknown class '%s'" % cls]


## Sets a property after validating it exists, decoding the value with the property's type.
static func set_property(obj: Object, prop: String, raw: Variant) -> Array:
	var info := find_property(obj, prop)
	if info.is_empty() and not prop.begins_with("metadata/"):
		return [false, "%s has no property '%s'%s" % [obj.get_class(), prop, suggest(obj, prop)]]
	var t := int(info.get("type", TYPE_NIL))
	var r := decode(raw, t)
	if not r[0]:
		return [false, "%s: %s" % [prop, r[1]]]
	var val: Variant = r[1]
	if not prop.contains(":") and not _type_compatible(val, t, str(info.get("class_name", ""))):
		return [false, "%s expects %s%s, got %s (%s)" % [prop, type_string(t), " " + str(info["class_name"]) if str(info.get("class_name", "")) != "" else "", type_string(typeof(val)), str(raw).left(80)]]
	obj.set(prop, val)
	return [true, null]


static func _type_compatible(val: Variant, t: int, cls: String) -> bool:
	if t == TYPE_NIL:
		return true
	var vt := typeof(val)
	if vt == t:
		if t == TYPE_OBJECT and val != null and not cls.is_empty() and ClassDB.class_exists(cls):
			return (val as Object).is_class(cls)
		return true
	if t == TYPE_OBJECT:
		return val == null
	if t == TYPE_FLOAT and vt == TYPE_INT or t == TYPE_INT and vt == TYPE_FLOAT:
		return true
	if (t == TYPE_STRING or t == TYPE_STRING_NAME or t == TYPE_NODE_PATH) and (vt == TYPE_STRING or vt == TYPE_STRING_NAME or vt == TYPE_NODE_PATH):
		return true
	if t >= TYPE_PACKED_BYTE_ARRAY and vt == TYPE_ARRAY or t == TYPE_ARRAY and vt >= TYPE_PACKED_BYTE_ARRAY:
		return true
	return false


static func find_property(obj: Object, prop: String) -> Dictionary:
	var base := prop.get_slice(":", 0)
	for p: Dictionary in obj.get_property_list():
		if p["name"] == base:
			return p
	return {}


static func suggest(obj: Object, prop: String) -> String:
	var best: Array[String] = []
	for p: Dictionary in obj.get_property_list():
		var n: String = p["name"]
		if int(p["usage"]) & PROPERTY_USAGE_EDITOR and (n.similarity(prop) > 0.55 or n.contains(prop)):
			best.append(n)
	if best.is_empty():
		return ""
	return " (did you mean: %s?)" % ", ".join(best.slice(0, 5))


## Encodes a Variant into JSON-safe data.
static func encode(v: Variant, depth: int = 0) -> Variant:
	match typeof(v):
		TYPE_NIL, TYPE_BOOL, TYPE_INT, TYPE_STRING:
			return v
		TYPE_FLOAT:
			return v if is_finite(v) else str(v)
		TYPE_STRING_NAME, TYPE_NODE_PATH:
			return str(v)
		TYPE_ARRAY:
			if depth > 4:
				return "[...]"
			var out: Array = []
			for i: int in mini(v.size(), 64):
				out.append(encode(v[i], depth + 1))
			return out
		TYPE_DICTIONARY:
			if depth > 4:
				return "{...}"
			var out: Dictionary = {}
			for k: Variant in v:
				out[str(k)] = encode(v[k], depth + 1)
			return out
		TYPE_OBJECT:
			if v == null or not is_instance_valid(v):
				return null
			if v is Node:
				return {"$node": str(v.get_path()) if v.is_inside_tree() else v.name, "type": v.get_class()}
			if v is Resource:
				var res: Resource = v
				if not res.resource_path.is_empty() and not res.resource_path.contains("::"):
					return {"$res": res.resource_path, "type": res.get_class()}
				return encode_resource_props(res, depth)
			return {"$object": v.get_class()}
		_:
			if typeof(v) >= TYPE_PACKED_BYTE_ARRAY and v.size() > 64:
				return "%s(size=%d)" % [type_string(typeof(v)), v.size()]
			return var_to_str(v)


## Encodes a built-in (embedded) resource as {"$new": Class, prop: value...} with non-default stored props.
static func encode_resource_props(res: Resource, depth: int) -> Dictionary:
	var out: Dictionary = {"$new": res.get_class()}
	if depth > 3:
		return out
	var cls := res.get_class()
	for p: Dictionary in res.get_property_list():
		var n: String = p["name"]
		if not (int(p["usage"]) & PROPERTY_USAGE_STORAGE) or n.begins_with("resource_") or n == "script":
			continue
		var val: Variant = res.get(n)
		if ClassDB.class_get_property_default_value(cls, n) == val:
			continue
		out[n] = encode(val, depth + 1)
	if res.get_script():
		out["script"] = (res.get_script() as Script).resource_path
	return out
