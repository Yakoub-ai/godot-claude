# Stress Killer — Project Reference

**Engine:** Godot 4.6 (GL Compatibility, GDScript)
**Genre:** 2.5D isometric roguelite auto-battler (Vampire Survivors style)
**Current milestone:** v1.0 Isometric Pivot — converting from platformer to isometric

---

## What It Is

Players survive escalating enemy waves on procedural biome maps with 3 playable characters (Archie/Barbar/Elara). Weapons auto-fire; positioning is the skill expression. Kill chain momentum (5/10/15/20 tiers → Speed/Damage/Crit/Frenzy) is the core identity loop.

**NOT a platformer.** No gravity, no jumping, no platforms. Pure 2D-plane isometric movement.

---

## Phase Status (as of 2026-03-07)

| Phase | Status |
|-------|--------|
| 1: Isometric Foundation | In Progress (4/5 plans done) |
| 2: Combat on Isometric Plane | Complete |
| 3: VS-Style Maps and Spawning | In Progress (2/4 plans done) |
| 4: Characters and Abilities | Complete |
| 5–9 | Not started |

---

## Project Structure

```
scripts/
├── characters/
│   ├── base_character.gd    (BaseCharacter — CharacterBody2D, 8-dir movement)
│   ├── archie.gd            (8-dir dodge roll with i-frames)
│   ├── barbar.gd            (8-dir charge bash with knockback)
│   └── elara.gd             (blink teleport)
├── enemies/
│   ├── base_enemy.gd        (BaseEnemy — CharacterBody2D, no gravity)
│   └── ground_chaser.gd     (2D Vector2 chase AI)
├── systems/
│   ├── game_manager.gd      (Autoload singleton)
│   ├── combat_system.gd     (360-degree targeting helpers)
│   ├── wave_manager.gd      (WaveManager — time-gated 5-wave model)
│   ├── vs_wave_spawner.gd   (VSWaveSpawner — edge-based enemy spawning)
│   ├── enemy_pool.gd        (EnemyPool — object pooling for enemies)
│   ├── xp_system.gd         (XPSystem — physical XP gem pickups)
│   ├── xp_gem.gd            (XPGem — drops at enemy position, magnet collect)
│   ├── kill_chain.gd        (KillChain — combo momentum with char synergies)
│   ├── health_system.gd     (HealthSystem)
│   ├── character_data.gd    (CharacterData — 8-dir animation mappings)
│   ├── sprite_frame_loader.gd (SpriteFrameLoader — loads frame PNGs)
│   ├── game_camera.gd       (GameCamera — OPEN_FIELD mode for iso)
│   ├── base_weapon.gd       (BaseWeapon — 360-degree auto-fire base)
│   └── weapons/
│       ├── melee_weapon.gd   (360-degree arc)
│       ├── ranged_weapon.gd  (fires toward nearest enemy in any direction)
│       └── orbital_weapon.gd (rotating)
├── levels/
│   ├── iso_stage_level_setup.gd  (IsoStageLevel setup — current main scene)
│   └── iso_test_level_setup.gd
└── ui/
    └── health_bar.gd

scenes/
└── levels/
    ├── iso_stage_level.tscn   (MAIN DEV SCENE — isometric stage)
    └── arenas/infernal_arena_02.tscn

assets/
├── characters/{name}/{direction}/{animation}/frame_NNN.png  (48x48, 8-dir)
├── enemies/{name}/{direction}/{animation}/frame_NNN.png     (32x32, 8-dir)
├── bosses/     (8 bosses, 8-dir sprites)
├── minibosses/ (8 minibosses, 8-dir sprites)
└── shaders/hit_flash.gdshader
```

---

## Architecture

### Movement
- **8-directional** on the 2D plane. No gravity. No jump.
- Input: move_left(A/Left), move_right(D/Right), move_up(W/Up), move_down(S/Down), ability(R)
- `move_and_slide()` in `_physics_process()` — velocity set from input direction vector
- Sprites flip/change based on velocity direction (8 dirs: N/NE/E/SE/S/SW/W/NW)

### Isometric Rendering
- TileMapLayer in isometric mode, 64x32 tiles
- Y-sort enabled on all entity containers
- Camera2D in OPEN_FIELD mode — follows player with 2D velocity lead

### Spawning (VS-style)
- `VSWaveSpawner`: spawns enemies at camera-view edges, never on-screen
- `EnemyPool`: object pool to avoid instantiate/free overhead
- `WaveManager`: time-gated 5-wave model with escalating difficulty
- Boss spawns at final wave with dramatic entrance sequence

### Combat
- Weapons auto-fire on cooldown toward nearest enemy (360-degree, any direction)
- `take_damage(amount, hit_color, is_crit, hit_dir)` — 4 params on BaseEnemy
- Kill chain: register_kill(context dict) with character-specific synergies
- Max 4 weapons; WeaponReplacePanel shown when cap hit

### XP / Leveling
- XP gems drop as physical nodes at enemy death position
- Auto-collected within magnet range, pulled toward player
- Filling bar pauses game and shows level-up card selection

### Characters
- **Archie**: 8-dir dodge roll (i-frames, speed boost)
- **Barbar**: 8-dir charge bash (damages + knocks back enemies in path)
- **Elara**: blink teleport (short range, brief i-frames)

---

## Key Systems (carry-over from platformer, adapted)

- `RunCoordinator`: central run system, creates XPSystem/KillChain/ScreenEffects
- `WeaponFactory.create_weapon(name)`: returns configured weapon from registry
- `EvolutionData.check_evolution()`: called after each item pickup
- `ScreenEffects`: hit_freeze_tiered(type), slowmo(), screen_flash()
- `KillChain`: 5→Speed, 10→Damage, 15→Crit, 20→Frenzy. 3s timeout per kill.
- Status effects: burn/freeze/bleed/stun (stun zeroes full velocity, skips AI)

---

## PixelLab Asset Pipeline

8-directional sprites already generated. Convention:
```
assets/{category}/{name}/{direction}/{animation}/frame_NNN.png
```
Directions: N, NE, E, SE, S, SW, W, NW (or subset — east + flip for simple cases)

For new assets:
1. `create_character` — 48x48 for characters, 32x32 for enemies
2. Generate animations: idle, walk, attack, death minimum; all 8 directions
3. Load via `SpriteFrameLoader.load_character_frames()`
4. For isometric tiles: use `create_isometric_tile` or `create_topdown_tileset`

---

## Display Config

- Viewport: 640x360 (pixel art native)
- Window: 1280x720 (2x scale)
- Stretch mode: viewport
- Texture filter: Nearest (no smoothing)
- Renderer: GL Compatibility

---

## Conventions

- `class_name` on all script files
- `@export` for tunable values
- `@onready` for node references with `$NodeName`
- Virtual methods prefixed with `_` (e.g., `_character_ready()`, `_update_ai()`, `_attack()`)
- Signals for system communication (`wave_started`, `xp_gained`, `chain_updated`, `enemy_died`)
- Groups: `"enemies"` for all enemies, `"player"` for character
- Never use hardcoded cross-scene node paths — use groups or signals
