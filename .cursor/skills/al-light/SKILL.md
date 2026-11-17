---
name: al-light
description: >-
  Run /al-light: light 47-quality rescore for SecureNow and ArchLucid, show deltas
  since the latest FRESH or LIGHT desk on origin/master, emit N codable score-lift
  suggestions (default 35). Read-only unless user asks to persist docs or implement.
---

# `/al-light` — light architectural quality desk

When the user types **`/al-light`**, execute **`.cursor/commands/al-light.md`** in full.

1. Parse **`/al-light [<count>] ["<focus>"]`** — default **35** suggestions, clamp count **5–50**.
2. Score with **`.cursor/skills/assessment-scope-v1_1/SKILL.md`** and the **47 / 120** model from recent **`docs/assessments/FRESH_DESK_*`** files.
3. Diff against the latest **`LIGHT_DESK_*`** or **`FRESH_DESK_*`** anchor; absorb **`docs/CHANGELOG.md`** score-lift rounds merged on **`origin/master`** since that anchor.
4. Reply in chat with headline deltas, touched-quality nudges, and **`suggestionCount`** engineering-safe backlog items.

Do **not** implement or commit assessment files unless the user explicitly requests it.