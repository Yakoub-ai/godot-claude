# Visual Quality Assurance

Analyze game screenshots against the visual reference using **Claude's native vision** (multimodal). No external VQA service required.

## How It Works

Claude reads captured PNGs directly as images. The analysis uses the prompt templates in `scripts/static_prompt.md` and `scripts/dynamic_prompt.md` as frameworks for what to look for.

## Static Mode

For scenes without meaningful motion (decoration, terrain, UI). Two images: reference + one game screenshot.

1. Read `reference.png` and the representative game screenshot (not frame 0 — often has init artifacts)
2. Apply the analysis framework from `scripts/static_prompt.md`
3. Write findings to `visual-qa/{N}.md`

```
mkdir -p visual-qa
# Read reference.png and screenshots/{task}/frame0003.png
# Analyze using static prompt framework
# Write report to visual-qa/{N}.md
```

## Dynamic Mode

For scenes with motion, animation, or physics. Reference + frames at ~2 FPS cadence.

1. Read `reference.png` and select frames at 2 FPS cadence (every Nth frame where N = capture_fps / 2)
2. Apply the analysis framework from `scripts/dynamic_prompt.md`
3. Write findings to `visual-qa/{N}.md`

```
# Example: captured at --fixed-fps 10 → step=5, select every 5th frame
# Read reference.png + frame0005.png, frame0010.png, frame0015.png, ...
# Analyze using dynamic prompt framework
# Write report to visual-qa/{N}.md
```

## Task Context

Pass the task's **Goal**, **Requirements**, and **Verify** from PLAN.md into the analysis. Two objectives:
1. **Quality verification (primary):** visual defects, bugs, implementation shortcuts — problems regardless of what the task asked for.
2. **Goal verification (secondary):** does the output match what was requested?

## Report Format

Write to `visual-qa/{N}.md` (sequential numbering):

```markdown
### Verdict: {pass | fail | warning}

### Reference Match
{1-3 sentences: does the game capture the reference's intent?}

### Goal Assessment
{1-3 sentences: does the screenshot demonstrate the goal was achieved?}

### Issues

If no issues: "No issues detected."

Otherwise:

#### Issue {N}: {short title}
- **Type:** style mismatch | visual bug | logical inconsistency | motion anomaly | placeholder
- **Severity:** major | minor | note (major/minor = must fix; note = cosmetic, acceptable to ship)
- **Location:** {where in frame}
- **Description:** {one or two sentences}

### Summary
{One-sentence overall assessment.}
```

## Handling Failures

When verdict is **fail**, treat the issues as findings — VQA is usually accurate. Read each issue and act:

- **Fixable** (placement, scale, materials, spatial bugs, clipping, z-fighting, animation logic) — fix it, re-capture, re-run VQA.
- **Unfixable from here** (wrong assets, wrong approach, architectural mismatch) — stop. Report failure to the orchestrator with the VQA issues so it can replan or change assets.

Max 3 fix-and-rerun cycles. If still failing after 3, the root cause is upstream — report all remaining issues to the orchestrator.

## Advantages Over External VQA

Using Claude's native vision instead of an external service:
- **No extra API key** — works out of the box
- **No Python dependencies** — no `google-genai` package needed
- **Consistent reasoning** — same model that writes the code also evaluates it
- **Richer context** — Claude has full task context, not just image + text prompt
