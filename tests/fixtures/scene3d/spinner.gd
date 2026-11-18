extends MeshInstance3D

@export var degrees_per_second: float = 90.0


func _process(delta: float) -> void:
	rotate_y(deg_to_rad(degrees_per_second) * delta)
