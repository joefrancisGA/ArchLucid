# ABQ-25 — Map existing Stryker scores onto hunt zones (periodic, not a PR gate)

**After ABQ-09/16 (shipped).** The repo **already** runs Stryker.NET. Do not add a new mutation framework. Do not raise `thresholds.break` in this prompt. Do not hunt.

## Goal

Hunt-zone preview can show a **mutation kill-rate** (or `n/a`) derived from existing Stryker reports / `scripts/ci/stryker-baselines.json` plus config mutate globs, so agents prefer zones whose tests would **not** catch a seeded defect. Scheduled Stryker stays the source of truth; `/al-bug` does not run Stryker.

## Why

Picker scores hunt **yield**. Mutation score scores **test quality**. A zone with high effective-bugs and 80% kill rate is a treadmill; a zone with low kill rate and real churn is where hunting is productive. Stryker is already scheduled (`.github/workflows/stryker-scheduled.yml`, configs `stryker-config*.json`, assert `scripts/ci/assert_stryker_score_vs_baseline.py`, docs `docs/library/MUTATION_TESTING_STRYKER.md`). Hunt tooling ignores it.

## Context

- `stryker-config.json` and `stryker-config.*.json` — mutate globs + test projects
- `scripts/ci/stryker-baselines.json` — last asserted scores per **label** (Persistence, Application, …)
- `docs/library/MUTATION_TESTING_STRYKER.md` — do not contradict ratchet policy
- `scripts/agent/al-bug-pick-zone.ps1` — preview JSON
- `docs/library/AL_BUG_HUNT_LEDGER.md` — zone `paths`

Many zones will not map 1:1 to a Stryker label (UI, scripts, Pester). Those must show `mutationScore: null` / `n/a`, not `0` (zero would falsely scream “hunt here”).

## What to build

1. **Mapping table** (data file, e.g. `scripts/agent/al-bug-stryker-zone-map.json` or generated from configs): Stryker `label` → glob(s) already in that config’s mutate list. Join to zones whose `paths` overlap those globs. One zone may map to **zero or one** primary label (if overlap is ambiguous, pick the **narrowest** config — e.g. `ApplicationCommitCriticalPaths` over `Application`). Document ties in the file comment / README sentence.

2. **Picker:** optional `-StrykerBaselines Path` (default `scripts/ci/stryker-baselines.json`). JSON fields: `strykerLabel`, `mutationScore` (nullable number), `mutationScoreMissing: true` when unmapped. Preview table row only when mapped. **Scoring:** small explore-style bonus for **low** score when mapped, e.g. `+ 1 × (1 - score/100)` capped, **or** no score change in v1 and display-only. Prefer **display-only** unless tests are easy — do not let a stale 22.5 ApplicationCommitCriticalPaths baseline dominate the catalog.

3. **Docs:** ledger Scoring notes mutation score is **test-quality, not product-quality**, sourced from scheduled Stryker, not live. Link `MUTATION_TESTING_STRYKER.md`. `/al-bug` Phase 0: do not run `dotnet stryker`.

4. **Do not** add a Stryker step to `/al-bug` or to `azure-extractor-pester`. Do not change `thresholds.break` or ratchet baselines.

5. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
```

Fixture baselines JSON + map: zone path under Persistence glob → score from fixture; UI zone → null / missing flag, score terms identical to today.

Optional Python unit test for the overlap function if you implement join in Python.

## Acceptance criteria

- Unmapped zones do not get `mutationScore: 0`.
- Mapped zones show the baseline number from the committed JSON (no network).
- No Stryker CLI in this PR’s CI.
- Ratchet docs unchanged except the hunt-tooling pointer.

## Constraints

- Do not treat low mutation score as a hunt-ready bug.
- Do not run `/al-bug`.
- Working-tree safety. Pester 5. Check nulls.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
