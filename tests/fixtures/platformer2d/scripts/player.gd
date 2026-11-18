class_name Player
extends CharacterBody2D
## Simple platformer controller.

@export var speed: float = 200.0
@export var jump_velocity: float = -400.0

var jumps: int = 0


func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity += get_gravity() * delta
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity
		jumps += 1
	var direction := Input.get_axis("move_left", "move_right")
	velocity.x = direction * speed
	move_and_slide()
