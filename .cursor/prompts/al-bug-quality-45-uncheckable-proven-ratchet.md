# ABQ-45 — Ratchet new `no-test-cited` / `could-not-run` proven rows

**After ABQ-34 (shipped unguarded ratchet).** Do not mass-retick historical `(proven)`. Do not use `--fail-on-unguarded` nuclear. Do not hunt. Prefer **after** ABQ-36 if both run in the same week (36 flips sample blocking; this adds two more classifications).

## Goal

ABQ-34 fails CI only on **new** `unguarded` keys. Rows classified `no-test-cited` or `could-not-run` still merge. Add `--fail-on-new-uncheckable` (name may vary) vs a committed baseline of known uncheckable keys. Same sample window as CI (`--limit 5 --since 2026-08-01`). `unguarded` stays on the existing ratchet. Historical uncheckable keys may be baselined; new ones fail once the step is blocking.

## Why

Agents can tick `(proven)` with a test name that does not compile in the revert worktree, or with no backtick citation. That is as dishonest as an unguarded row: the revert verifier cannot prove the test would fail. Wave 5 explicitly left those classifications out of `newUnguarded`. This prompt closes that hole without boiling the ledger.

## Context

- `scripts/agent/al-bug-verify-proven-revert.py` — classifications `guarded` / `unguarded` / `could-not-run` / `no-test-cited` / `no-commit-cited`
- `scripts/ci/al-bug-unguarded-proven-baseline.json` — keep; add a sibling `al-bug-uncheckable-proven-baseline.json` **or** a second array in the same file (`uncheckableKeys`). Prefer a sibling file so 34’s tests stay stable.
- `.github/workflows/ci.yml` same step (or a second invocation with the new flag). Do **not** expand `--limit`.
- `scripts/tests/test_al_bug_verify_proven_revert.py`

`no-commit-cited` may be included in uncheckable **or** left warn-only — pick one, document it. Default: include `no-test-cited` and `could-not-run` only.

## What to build

1. Baseline file with stable keys (`zoneId|testName|shaPrefix` or `zoneId|classification|lineHash` — must not collide with unguarded keys). Generate from a local sample; empty list is OK.

2. **`--fail-on-new-uncheckable --uncheckable-baseline <path>`:** `newUncheckable` = result keys in those classes minus baseline. Exit 1 when non-empty. Print keys on stderr.

3. **CI:** add the flag to the existing revert step. If ABQ-36 made that step blocking, this fails the same job. If 36 left warn-only, this prompt stays warn-only too (do not make uncheckable stricter than unguarded). `--write-baseline` sibling must not silently drop keys without `--allow-shrink`.

4. **Command Phase 2:** proven rows must cite a test that the revert verifier can run; `could-not-run` is not a pass.

5. Tests: extend `test_al_bug_verify_proven_revert.py`:

   - (a) uncheckable key in baseline → exit 0
   - (b) extra `no-test-cited` → exit 1
   - (c) `unguarded` still uses the unguarded baseline only
   - (d) `could-not-run` in `newUncheckable`
   - (e) worktree cleanup unchanged

```text
python3 scripts/tests/test_al_bug_verify_proven_revert.py
```

## Acceptance criteria

- Historical checkboxes unchanged.
- CI does not use `--fail-on-unguarded`.
- New uncheckable in the sample fails when the step is blocking (or leftover documented if 36 is still warn-only).
- No validity-audit phrase lists. No Stryker threshold changes.

## Constraints

- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Never `git checkout` the agent branch to a fix SHA.
- Check nulls.
