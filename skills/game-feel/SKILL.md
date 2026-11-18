---
name: game-feel
description: Make Godot games feel good - responsive controls, juice (screen shake, hit stop, squash and stretch, particles, flashes, tweens), camera work, audio feedback and mixing. Use when a mechanic works but feels flat, during polish milestones, or when the user says it "feels off", "floaty", "boring" or wants "juice".
---

# Game feel and polish

Feel comes from **responsiveness** (input → immediate reaction) and **feedback** (every action is seen and heard). Polish only after the core mechanic is right; juice can't fix a bad mechanic.

## Responsiveness first
- Act on input the same frame; avoid long wind-up animations on core verbs (or allow canceling).
- Platformers: coyote time (~0.1 s), jump buffer (~0.1 s), variable jump height, fall gravity ×1.5–2, capped fall speed, snappy acceleration (reach top speed in ~0.1 s), less air control than ground control.
- Top-down: little or no acceleration on the stick, instant facing, dash with brief i-frames.
- Tune with exported variables; playtest each change in stepped mode and compare trajectories numerically (positions per frame) as well as visually.

## Feedback toolkit

| Event | Feedback |
|---|---|
| Jump / land | squash on land, stretch on jump (scale tween on the visual), dust particles, sound |
| Hit enemy | hit stop (freeze 40–80 ms), white flash shader, knockback, small screen shake, particles, impact sound with pitch variation |
| Take damage | stronger shake, red flash/vignette, invulnerability blink, health bar ghosting |
| Pickup | pop scale tween, sparkle, rising pitch on combos, UI counter bump |
| Death / big moment | slow motion (`Engine.time_scale` briefly), zoom, bigger particles, silence then sound |

Snippets:
```gdscript
# Hit stop (put in an autoload). ignore_time_scale = true so the timer itself isn't frozen.
func hit_stop(duration: float = 0.06) -> void:
	Engine.time_scale = 0.0
	await get_tree().create_timer(duration, true, false, true).timeout
	Engine.time_scale = 1.0

# Trauma-based screen shake on a Camera2D (offset) — decays smoothly, noise not random jitter.
var trauma: float = 0.0
var _noise := FastNoiseLite.new()
func add_trauma(amount: float) -> void:
	trauma = minf(trauma + amount, 1.0)
func _process(delta: float) -> void:
	trauma = maxf(trauma - delta * 1.5, 0.0)
	var s := trauma * trauma
	var t := Time.get_ticks_msec() * 0.05
	offset = Vector2(_noise.get_noise_2d(t, 0.0), _noise.get_noise_2d(0.0, t)) * 12.0 * s

# Squash & stretch
func squash() -> void:
	var tw := create_tween()
	tw.tween_property(visual, "scale", Vector2(1.25, 0.8), 0.05)
	tw.tween_property(visual, "scale", Vector2.ONE, 0.15).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
```
Flash on hit: a CanvasItem shader with `uniform float flash : hint_range(0, 1);` mixing toward white, tweened from 1 to 0.

Provide an accessibility option to reduce shake/flash.

## Camera
Smooth follow (lerp or `position_smoothing`), look-ahead in the movement direction, framing that shows what's coming, limits at level edges, zoom for emphasis. Shake via offset, never by moving the camera's real position.

## Audio
- Every player action has a sound; vary pitch (`pitch_scale = randf_range(0.9, 1.1)`) to avoid repetition.
- Buses: Master → Music, SFX, UI (and Ambience); volume settings per bus (`AudioServer.set_bus_volume_db`), saved in settings.
- Music: `.ogg`, looping, crossfade between tracks with tweens; `AudioStreamPlayer` with `process_mode = ALWAYS` if it should play while paused.
- Positional: `AudioStreamPlayer2D/3D` with sensible attenuation; limit simultaneous instances (`max_polyphony`).
- Playtests run with muted audio: verify sounds are *triggered* (e.g. observe `playing` on the player node), and ask the user to listen at milestones.

## Verifying feel
Use `capture_every` strips to see squash/flash/particles actually appear, compare per-frame positions before/after tuning, and always end polish passes with the user playing a build: feel is ultimately a human judgment.
