# ABQ-34 — Revert-verifier ratchet (new unguarded rows only)

**After ABQ-20 (shipped).** Do not mass-retick historical `(proven)` to `(invalid)`. Do not add English-phrase signals to the validity audit. Do not hunt. Run **after** ABQ-20 has a committed unguarded baseline.

## Goal

CI **fails** when a **newly added** `(proven)` row is `unguarded` (cited test still passes after production revert), compared to a **committed baseline** of already-known unguarded rows. Historical unguarded rows stay warn-only. Same idea as Stryker `assert_stryker_score_vs_baseline.py`: ratchet new debt, do not boil the ocean.

## Why

ABQ-20’s CI step is `continue-on-error: true` and **omits** `--fail-on-unguarded`. Turning that flag on globally would fail `master` on every historical treadmill row the sample hits. A baseline file lets the owner keep old debt visible while **new** hunts cannot land unguarded proven ticks.

## Context

- `scripts/agent/al-bug-verify-proven-revert.py` — classifications `guarded` / `unguarded` / `could-not-run` / `no-test-cited` / `no-commit-cited`; `--fail-on-unguarded` already exists
- `scripts/tests/test_al_bug_verify_proven_revert.py`
- `.github/workflows/ci.yml` `azure-extractor-pester` — warn-only `--limit 5 --since 2026-08-01`
- `scripts/ci/stryker-baselines.json` + `assert_stryker_score_vs_baseline.py` — copy the **ratchet policy**, not Stryker itself
- `docs/library/AL_BUG_PROVEN_REVERT_AUDIT.md` — report path
- Default hunt target `bugsmash` unchanged

Do **not** reclassify ledger checkboxes. The baseline is a **data file of row identities**, not a ledger rewrite.

## What to build

1. **Baseline file** `scripts/ci/al-bug-unguarded-proven-baseline.json` (path may vary):

   ```json
   { "unguardedKeys": [ "zoneId|testName|shaPrefix" ], "_measuredDate": "2026-09-07" }
   ```

   Key format must be stable (document it). Generate the first file from a **local** `--limit` run on current `master` / this branch; commit it even if the list is empty (empty list means “no known unguarded in the last sample window”).

2. **`--fail-on-new-unguarded --baseline <path>`** on the verifier (keep `--fail-on-unguarded` as the nuclear option; **CI must not use nuclear**).

   - Load current results (same `--limit` / `--since` as CI).
   - `newUnguarded` = result keys in `unguarded` minus baseline set.
   - Exit 1 only when `newUnguarded` is non-empty.
   - `could-not-run` / `no-test-cited` / `no-commit-cited` do **not** fail the ratchet (still listed in the report).
   - Print the new keys on stderr.

3. **CI:** keep `continue-on-error` **until** the baseline is committed **and** a dry run on this branch shows zero new unguarded. Then switch **that step** to blocking with `--fail-on-new-unguarded --baseline …` (still `--limit 5` so the job stays small). Do not expand `--limit` to the whole ledger in PR CI.

4. **Refresh:** a tiny `--write-baseline` (or a sibling `scripts/ci/refresh_al_bug_unguarded_baseline.py`) that **only** adds keys (never silently drops unless `--allow-shrink` and a comment). Shrinking the baseline (an old row became guarded) is good — allow it when the verifier now classifies that key `guarded`.

5. **Docs:** ABQ-20 command sentence + ledger How-to: new proven rows must be revert-guarded; historical unguarded are baselined. Honest: “sample window, not all proven rows.”

6. Tests:

```text
python3 scripts/tests/test_al_bug_verify_proven_revert.py
```

Cover: (a) unguarded key in baseline → exit 0; (b) extra unguarded key → exit 1 with `--fail-on-new-unguarded`; (c) `--fail-on-unguarded` still fails on any unguarded (existing behavior); (d) `could-not-run` not in `newUnguarded`; (e) worktree cleanup unchanged.

## Acceptance criteria

- Historical `(proven)` checkboxes are not mass-edited.
- CI does not use `--fail-on-unguarded` globally.
- New unguarded in the sample window fails once the baseline is in and the step is blocking — or the PR leaves the step warn-only **and** documents the leftover (prefer blocking if the sample is clean).
- No Stryker threshold changes. No validity-audit regexes.

## Constraints

- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Never `git checkout` the agent branch to a fix SHA (ABQ-20 already uses worktrees).
- Check nulls. Prefer concrete types in any new C# (unlikely here).
