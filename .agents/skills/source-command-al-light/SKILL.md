---
name: "source-command-al-light"
description: "Light rescore SecureNow and ArchLucid 47 qualities, delta vs last desk, and codable score-lift suggestions (default 35)"
---

# source-command-al-light

Use this skill when the user invokes **`/al-light`**.

## Command Template

Follow **`.cursor/commands/al-light.md`** end-to-end. That file is the authoritative procedure.

## Quick reference

| Input | Behavior |
|-------|----------|
| `/al-light` | Light desk + **35** suggestions |
| `/al-light 25` | **25** suggestions |
| `/al-light "partial capture"` | **35** suggestions biased to that focus |
| `/al-light 20 "compare"` | **20** suggestions with compare focus |

## Non-negotiables

- Read **`.cursor/skills/assessment-scope-v1_1/SKILL.md`** before scoring.
- Anchor: latest **`docs/assessments/LIGHT_DESK_*.md`**, else **`FRESH_DESK_*_FULL_RESCORE.md`**.
- Model: **47 qualities**, weight **120**, separate SecureNow and ArchLucid **`(A)`**.
- **Read-only** for repo code and assessments unless the user explicitly asks to save or implement.

## Output shape

Mirror historical light desks: headline table, shipped-since-anchor table, row-level nudges, unchanged caps, `(B)` block, most important truth, numbered codable follow-ups, do-not-reopen footer.