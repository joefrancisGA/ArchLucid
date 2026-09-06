# ABQ-06 — Reform `/al-bug` picker scoring (cap speed, honor impact, cooldown)

**Do not fork ABQ-05/07/08.** Implement scoring in `scripts/agent/al-bug-pick-zone.ps1` + Pester. Update the scoring section in `docs/library/AL_BUG_HUNT_LEDGER.md` so the formula matches the script (today the ledger documents `impact_multiplier` but `Get-ZoneScoreBreakdown` never reads `impact`).

## Goal

The picker can no longer lock on a mega-zone because `bugs-found >> hunts`. Speed is computed from **at most 1 hit per hunt**, capped. Zones with a high recent hit rate **cool** instead of accelerating. Documented `high|medium|low` impact actually multiplies the score. Rolling 24h preview warns when hit rate is implausibly high.

## Why

Ledger `archlucid-core`: hunts 350, bugs-found 2,478 → mean hunts/bug ≈ 0.14 → speed ≈ 7, times high impact (if it were applied) dominates every other zone. Run log: 397 hunts / 390 hits on that id. Explore bonus `1/sqrt(n+1)` is too weak to unlock the rest of the catalog. Sequential-100 then farms the winner.

The run log (`docs/library/AL_BUG_HUNT_RUN_LOG.jsonl`) already stores one outcome per hunt (`hit|dry|seed-only`) and is the honest time unit. Ledger `bugs-found` must not exceed hunts for scoring; if it does, treat bugs as `min(bugs-found, hunts)` or prefer run-log hit count when `-Refresh` can read the log.

## Context

- `scripts/agent/al-bug-pick-zone.ps1` — `Get-MeanHuntsPerBug`, `Get-ZoneScoreBreakdown`, `Read-AlBugHuntLedger` (does not parse `impact` today)
- `scripts/tests/AlBugPickZone.Tests.ps1` — Pester 3.4 (Windows PowerShell 5.1). Do not switch to Pester 5 `-Be` / `BeforeAll`
- `scripts/agent/al-bug-rolling-stats.ps1` + `scripts/tests/AlBugRollingStats.Tests.ps1` — add hit-rate warning fields
- `docs/library/AL_BUG_HUNT_LEDGER.md` § Scoring
- `.cursor/commands/al-bug.md` scoring blurb (keep in sync, short)
- Do **not** edit `.cursor/_al-bug-pick-zone.ps1` (stale copy). If something still points at it, leave a comment in the PR; do not grow a second picker.

## What to build

1. Parse `- **impact:**` (`high` ×1.40, `medium` ×1.00, `low` ×0.65, missing → medium). Apply `score = base_score × impact_multiplier` as the ledger already states.
2. `mean_hunts_per_bug = hunts / max(1, min(bugsFound, hunts))` when hunts > 0. Never allow mean < 1. Untried prior stays `hunts + 2`.
3. Cap `speed = min(1, 1/mean)` so a perfect 1:1 zone scores 1, not 8.
4. **Cooldown:** if a zone has ≥ 8 hits in the last 7 calendar days (from run log when present, else `bugs-found` deltas are not available — use run log path next to the ledger) **or** 24h hit rate for that zone ≥ 0.7 with ≥ 5 hunts, treat status as cooling for eligibility (same rules as ledger `cooling`: ineligible while any `open`/`unseeded` remains). Expose `cooledByHitRate: true` in JSON.
5. Rolling 24h table adds `Hit rate` and a `Warning` line when 24h hits / (hits+drys) ≥ 0.6 with ≥ 8 hunts in window (seed-only excluded from the denominator). Do not celebrate that as yield.
6. Pester: fixture with bugs-found 100 / hunts 10 must **not** outrank a 1:1 sampled zone plus a never-hunted zone on explore; impact high vs low changes order; cooldown fixture with fake jsonl.
7. Preview table shows `Impact` and `Cooled` fields.

```powershell
Invoke-Pester -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
Invoke-Pester -Path 'scripts/tests/AlBugRollingStats.Tests.ps1'
```

## Acceptance criteria

- A zone cannot get `speed > 1`.
- `bugs-found > hunts` cannot dominate the catalog.
- Ledger scoring markdown matches the script (including impact, which is implemented).
- 24h preview warns on implausible hit rate.
- Existing hint-override, unseeded seedHunt, exhausted+churn reopen tests still pass.

## Constraints

- Do not split zone paths (ABQ-08).
- Do not implement file-hit escalation (ABQ-07) beyond the zone-level cooldown above.
- Pester 3.4 syntax only.
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
