extends RefCounted

const R := preload("res://scripts/runtime_error.gd")

func test_fails(t) -> void:
	t.eq(1 + 1, 3, "math")

func test_runtime_error(t) -> void:
	var n := R.new()
	n.read_missing()
	n.free()
	t.is_true(true)

func test_ok(t) -> void:
	t.is_true(true)
