# Narrative Workflow — Story, Dialog, Quests, Cutscenes

Load this file when user says "design story", "add narrative", "add dialog", or is building an RPG, visual novel, or story-driven game.

**Recommend model: Opus** (narrative design requires deep reasoning about character arcs and world consistency)

---

## When to Use This Workflow

- User wants dialog trees / branching conversations with NPCs
- User wants quest/objective systems
- User wants cutscenes or scripted story sequences
- User is building RPG, visual novel, adventure game, or any narrative-driven genre
- User says "add story", "add lore", "add NPCs", "dialog system"

Can be run standalone or as an extension of the GDD workflow (as Stage 3b after Entities & Characters).

---

## Stage 1: Story Foundation (Lore Bible)

Ask:
1. **Genre** — RPG / visual novel / adventure / narrative platformer / other
2. **Setting** — world name, era, tone (dark/hopeful/comedic), key factions
3. **Main conflict** — one-sentence summary of the central tension
4. **Protagonist** — name, motivation, arc (what do they want? what do they learn?)
5. **Key NPCs** — 3-5 major characters (name, role, relationship to protagonist, secret/motivation)
6. **World lore** — 3-5 facts the player discovers that change how they understand the world

Output: `.planning/LORE.md`

```markdown
# Lore Bible: {World Name}

## Setting
{Era, tone, world description}

## Central Conflict
{One paragraph}

## Factions
| Faction | Goal | Relationship to Player |
|---------|------|----------------------|

## Key Characters
| Name | Role | Arc | Secret |
|------|------|-----|--------|

## Lore Reveals
1. {Reveal 1 — discovered early}
2. {Reveal 2}
3. {Reveal 3 — discovered late}
```

---

## Stage 2: Story Structure

Ask:
1. **Act structure** — 3-act / 5-act / non-linear / episodic
2. **Player agency** — linear story (railroad) / branching choices (affect dialog) / consequential choices (affect world/ending)
3. **Endings** — single ending / multiple endings (how many?) / morality-based
4. **Tone** — cutscenes heavy / dialog-only / environmental storytelling

Output: `.planning/STORY.md`

```markdown
# Story: {Game Name}

## Act 1 — Setup
- Inciting incident: {event}
- Player goal established: {goal}
- Key scene: {scene name}

## Act 2 — Confrontation
- Complication: {complication}
- Midpoint twist: {twist}
- Key scene: {scene name}

## Act 3 — Resolution
- Climax: {climax}
- Endings: {list endings and trigger conditions}

## Choice Points
| Choice | Option A | Option B | Consequence |
|--------|----------|----------|-------------|
```

---

## Stage 3: Dialog System Design

Ask:
1. **Dialog style** — linear (NPC talks, no choices) / branching (player chooses responses) / full conversation graph (revisitable, state-aware)
2. **Third-party library** — [Dialogic](https://github.com/dialogic-godot/dialogic) (visual timeline editor, recommended) / [DialogueManager](https://github.com/nathanhoad/godot_dialogue_manager) (script-based, lightweight) / custom (built-in GDScript)
3. **Portraits** — character portrait per speaker (2D sprite) / none / animated
4. **Voice** — none / sound effects only (typewriter SFX) / full voice acting

**Recommended:** Dialogic 2 for RPGs and visual novels (visual editor, portrait support, variable tracking). DialogueManager for simpler games (Markdown-like scripts, minimal overhead).

---

## Stage 4: Quest System Design

Ask:
1. **Quest types** — main quests only / side quests / daily/repeatable
2. **Tracking** — no tracker (player remembers) / simple objective list / full quest journal with map markers
3. **Branching quests** — yes (player choices affect quest outcomes) / no (linear objectives)
4. **Quest rewards** — none / XP+gold / items / story unlocks / all

Output: `.planning/QUESTS.md`

```markdown
# Quest Plan

## Main Quests
| ID | Name | Trigger | Objectives | Reward | Notes |
|----|------|---------|------------|--------|-------|

## Side Quests
| ID | Name | Giver NPC | Objectives | Reward |
|----|------|-----------|------------|--------|

## Quest Variables (tracked in GameManager)
- completed_quests: Array[String]
- active_quests: Array[String]
- quest_flags: Dictionary  # {quest_id: {flag_name: value}}
```

---

## Stage 5: Cutscene Plan

Ask:
1. **Cutscene count** — how many scripted sequences?
2. **Method** — AnimationPlayer timeline (precise, complex) / scripted camera + dialog (simpler) / pre-rendered video (never recommended for Godot)
3. **Key moments** — list the 3-5 cutscenes that must exist (opening, midpoint, ending)
4. **Skip support** — yes (required for most games) / no

Output: `.planning/CUTSCENES.md`

```markdown
# Cutscene Plan

| ID | Scene | Method | Duration | Trigger | Skip |
|----|-------|--------|----------|---------|------|
| cs_intro | Opening: protagonist wakes up | AnimationPlayer | ~45s | Game start | Yes |
| cs_midpoint | Betrayal reveal | Camera script + dialog | ~30s | Quest Q03 complete | Yes |
```

---

## Output Documents

After all stages, generate:

1. `.planning/LORE.md` — world lore bible
2. `.planning/STORY.md` — act structure + choice map
3. `.planning/QUESTS.md` — quest manifest
4. `.planning/CUTSCENES.md` — cutscene plan

Then update `PLAN.md` if it exists — add narrative tasks:
- "Dialog system setup" (install Dialogic/DialogueManager, configure)
- "NPC dialog scripts" (write `.dialogue` files for each major NPC)
- "Quest system" (QuestManager autoload + journal UI)
- Each planned cutscene as its own task if complex, bundled if simple

---

## Implementation Notes

### Choosing Between Dialogic vs DialogueManager vs Custom

**Dialogic 2** (recommended for RPGs and visual novels):
- Visual timeline editor in Godot editor
- Portrait system, typewriter effect, audio lip-sync hooks
- Variables, conditions, signals
- Install: AssetLib or Git submodule

**DialogueManager** (recommended for simpler games):
- Markdown-like `.dialogue` files, edited in any text editor
- Lightweight — minimal editor footprint
- Good for Twine-style branching
- Install: AssetLib or Git submodule

**Custom (built-in)** — use only when:
- Game needs <10 lines of total dialog
- Very specific UI requirements that both tools can't meet
- See dialog system patterns in `scene-architecture.md`

### Cutscene Strategy

For short cutscenes (< 30s): scripted camera + dialog overlay via CanvasLayer.
For complex cutscenes (animation, multiple cameras): AnimationPlayer timeline controlling camera position, dialog trigger, character movement.
Always implement Skip (connect to Escape / Back button).

### State Management

All narrative state (completed quests, dialog choices, flags) belongs in a `NarrativeManager` autoload. Never store story state in scene variables — it won't persist across scene transitions.

---

## After Narrative Design

If narrative was added to an existing GDD:
1. Re-read `PLAN.md` and insert narrative tasks in correct dependency order
2. Run `neural_update` to index the new planning documents
3. Confirm with user: *"Narrative plan complete. Added X tasks to PLAN.md. Say 'generate game' to build."*
