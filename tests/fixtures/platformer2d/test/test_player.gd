extends RefCounted
## Example tests for godot-claude's built-in runner.


func test_default_speed(t) -> void:
	var player := Player.new()
	t.eq(player.speed, 200.0, "default speed")
	player.free()


func test_score_adds_points(t) -> void:
	var watch = t.watch(GameState, "score_changed")
	var before: int = GameState.score
	GameState.add_points(3)
	t.eq(GameState.score, before + 3)
	t.eq(watch.count, 1, "score_changed emitted once")


func test_player_lands_and_jumps(t) -> void:
	var level: Node = t.instantiate("res://scenes/main.tscn")
	var player: Player = level.get_node("Player")
	await t.physics_frames(30)
	t.is_true(player.is_on_floor(), "player lands on the floor")
	t.tap("jump")
	await t.physics_frames(3)
	t.lt(player.velocity.y, 0.0, "player moves up after jumping")
	t.eq(player.jumps, 1)
