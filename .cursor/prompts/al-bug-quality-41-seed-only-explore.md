# ABQ-41 — Seed-only must not farm explore or speed

**After ABQ-06/16 (shipped).** Do not rewrite historical `bugs-found`. Do not hunt. Do not count seed-only as dry or as a hit.

## Goal

Picker `explore = 1 / sqrt(hunts + 1)` uses **all** hunts, including `seed-only`. Agents can shrink explore (and churn the catalog) by reseeding without a failing repro. Rolling 24h already counts `seedOnly24h` separately. Picker scoring and cooldown must treat **seed-only** as activity that does **not** earn speed and does **not** by itself drive a zone to `cooling` via hit-rate — and **consecutive seed-only** should not look like a healthy hunt streak.

## Why

Wave 5 made seed hunts mandatory when hypotheses are closed. That is correct. Combined with explore decaying on every hunt, a zone that is only ever seed-only becomes “sampled” without a thorough hunt. Goodhart: more `/al-bug` invocations, fewer repros.

## Context

- `scripts/agent/al-bug-pick-zone.ps1` — `Get-ZoneScoreBreakdown`; hit-rate cooldown already **excludes** seed-only from the **rate** (keep that)
- `scripts/agent/al-bug-rolling-stats.ps1` — `seedOnly24h`
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` — `outcome: seed-only`
- `docs/library/AL_BUG_HUNT_LEDGER.md` § Scoring — `hunts` on the stanza still increment on seed-only (How-to step 3). **Do not stop incrementing stanza `hunts`** (that is the audit trail). Change **picker formulas** that use run-log hunts, or document a `thoroughHunts` denominator.
- `scripts/tests/AlBugPickZone.Tests.ps1`

Pick **one** scoring change, document it, test it:

- **A (preferred):** `explore` uses `thoroughHunts = hunts in run log whose outcome is hit|dry` (not seed-only). Stanza `hunts` unchanged.
- **B:** after ≥ 3 seed-only in 7d with 0 thorough hunts, zone is not eligible while any zone with a pending thorough hunt remains (preview `seedOnlyFarming: true`). Do not mark `exhausted`.

Do **not** forfeit speed for seed-only (speed already uses hits). Do **not** let seed-only increment `consecutive-dry-hunts` (already forbidden in How-to).

## What to build

1. Implement A or B (not both unless B is a tiny preview flag on top of A).
2. Preview JSON: `seedOnly24h` or `thoroughHunts` so agents can see the split.
3. Ledger Scoring paragraph: seed-only is not thorough; explore/eligibility uses thorough hunts.
4. Command Phase 0: one sentence — seed-only does not satisfy a thorough hunt if one is queued as thorough.

5. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
```

Cover: (a) two zones equal except one has 10 seed-only run-log lines — explore for that zone is **not** smaller under A (or it is ineligible under B); (b) a hit still shrinks explore; (c) seed-only still excluded from 24h hit-rate cooldown; (d) UTC window tests from ABQ-29 still pass.

## Acceptance criteria

- Seed-only cannot be used to decay explore (A) or to occupy the picker (B).
- How-to still increments stanza `hunts` on seed-only.
- No English-phrase validity signals. Closed enum unchanged.

## Constraints

- Do not recreate `_al-bug-pick-zone.ps1`.
- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Pester 5 (`Should -Be`). Check nulls.
