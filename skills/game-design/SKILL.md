---
name: game-design
description: Guide the user from a game idea to a buildable plan - pillars, core loop, scope, a one-page GDD and a milestone roadmap with testable acceptance criteria. Use when the user wants to start a new game, says "I have an idea for a game", "design a game", "make a game", or wants to rescope or plan an existing one.
---

# Game design: idea → plan

Your job is to be a pragmatic design partner: help the user find the fun, cut scope to something that can actually ship, and leave behind documents that drive development. Talk, don't lecture. Ask a few questions at a time, offer concrete options with trade-offs, and push back on scope that won't fit their time or skills.

## Stage 1 — The hook (conversation)

Ask, briefly (2–4 questions per message, not a questionnaire dump):
- What's the game in one sentence? What should the player *feel*?
- Reference games (and what specifically they like about each).
- 2D or 3D? Art style they can realistically produce or source (see the `godot-assets` skill).
- Platform(s) and input (keyboard/mouse, gamepad, touch).
- Their constraints: time available, team size, experience, budget for assets. Goal: learning, jam, portfolio, commercial?

Then reflect back a sharpened pitch and **3 design pillars** (e.g. "fast, readable combat", "every run is different", "cozy, no fail states"). Every later decision is checked against the pillars.

## Stage 2 — Core loop

Define the loop at three time scales and confirm with the user:
- **Moment-to-moment** (seconds): the verbs. What does the player press, and what feedback do they get?
- **Session** (minutes): goal → challenge → reward → next goal.
- **Long-term** (hours): progression, unlocks, mastery, story.

Identify the single riskiest assumption ("is jumping between moving platforms with momentum fun?"). The first milestone exists to answer it.

Use `references/genres.md` for genre-specific systems, Godot node choices and common traps.

## Stage 3 — Scope

Write the feature list, then split it brutally:
- **MVP / prototype**: the core loop with placeholder art (grey boxes, colored rects, CSG). Answers the risky question.
- **Vertical slice**: one level/area at final quality — proves the art, feel and production pipeline.
- **Content & polish**: everything else.
- **Cut list**: good ideas that don't serve the pillars or don't fit. Write them down so they're not lost.

Sanity check against the user's time: a solo hobbyist's first game should have an MVP buildable in days, not months. Say so plainly if the idea is too big, and propose a smaller version that keeps the pillars.

## Stage 4 — Write the documents

Create these (concise; living documents, not novels):

**`design/GDD.md`**
```markdown
# <Title>
**Pitch:** one sentence.   **Platform/input:** ...   **2D/3D, art style:** ...
## Pillars
1. ... 2. ... 3. ...
## Core loop
- Moment-to-moment: ...
- Session: ...
- Long-term: ...
## Mechanics
For each: what it is, controls, tunable parameters (with starting values), feedback (visual/audio).
## Content
Levels/areas, enemies, items — as tables when there are many.
## Game flow
Title → menu → play → pause → win/lose → results. Save/progression rules.
## Art & audio direction
References, palette, resolution (pixel art base resolution!), camera, UI style, music/SFX mood.
## Out of scope (cut list)
```

**`design/ROADMAP.md`** — milestones, each with *testable* acceptance criteria:
```markdown
## M1 — Prototype: <risky question>
- [ ] Player moves/jumps with coyote time and jump buffer (tests: test_player_movement.gd)
- [ ] One test level built from placeholder blocks
- [ ] Playtest: player can reach the goal in < 60 s with no errors; jump arc feels responsive (screenshots reviewed)
**Exit question:** is it fun? (decide with the user before M2)
## M2 — Vertical slice ...
## M3 — Content ...
## M4 — Polish & release (see godot-release skill)
```
Every criterion should map to something verifiable: a unit test, a playtest scenario, or a user decision.

## Stage 5 — Architecture handoff

Before writing code: produce the technical plan (scenes, scripts, autoloads, data resources, input actions, collision layers) for M1 — use the `godot-architect` agent or the `godot-dev` skill's `references/architecture.md`. Set up the project basics first: input map actions, named collision layers, window size/stretch mode, folder layout. Then build M1 with the `godot-dev` loop.

## Ongoing

- After each milestone, playtest (`godot-testing` skill / `playtester` agent), review against the pillars with the user, update GDD/ROADMAP, and re-cut scope if needed.
- When the user proposes a new feature mid-way, check it against pillars and the current milestone before agreeing; suggest the cut list if it doesn't fit.
