# ABQ-36 — Make the revert-verifier sample blocking

**After ABQ-34 (shipped).** Do not mass-retick historical `(proven)`. Do not use `--fail-on-unguarded` (nuclear). Do not expand `--limit` to the whole ledger. Do not hunt.

## Goal

The `azure-extractor-pester` revert-verifier step already passes `--fail-on-new-unguarded --baseline scripts/ci/al-bug-unguarded-proven-baseline.json`. It still has `continue-on-error: true`. If a dry run on this branch with the same `--limit` / `--since` as CI exits **0**, **drop `continue-on-error`** so **new** unguarded proven rows in the sample window fail the job. If the dry run is not clean, leave warn-only and document why (do not paper over it by emptying the baseline).

## Why

ABQ-34 shipped the ratchet **and** left the step warn-only so a dirty first sample would not fail `master`. The committed baseline is `unguardedKeys: []`. An empty baseline plus `continue-on-error` means a brand-new unguarded `(proven)` still merges. The leftover is policy, not a missing flag.

## Context

- `scripts/agent/al-bug-verify-proven-revert.py` — `--fail-on-new-unguarded`, `--baseline`, `--write-baseline`, `--allow-shrink`
- `scripts/ci/al-bug-unguarded-proven-baseline.json`
- `.github/workflows/ci.yml` `azure-extractor-pester` — `al-bug verify proven revert (warn-only sample + new-unguarded ratchet)`
- `scripts/tests/test_al_bug_verify_proven_revert.py`
- ABQ-20 remains the sampler; this prompt only changes **whether that step is required**

Do **not** change `--limit 5` or `--since 2026-08-01` unless you are unblocking a hung sample (then say so). Do **not** classify `could-not-run` / `no-test-cited` as new unguarded (ABQ-45 owns that leftover).

## What to build

1. **Dry-run locally** (same args as CI):

```text
python3 scripts/agent/al-bug-verify-proven-revert.py --limit 5 --since 2026-08-01 --fail-on-new-unguarded --baseline scripts/ci/al-bug-unguarded-proven-baseline.json
```

2. **If exit 0:** remove `continue-on-error: true` from **that step only**. Rename the step so it is no longer “warn-only.” Keep the job otherwise unchanged.

3. **If exit ≠ 0:** do **not** drop `continue-on-error`. Print the `newUnguarded` keys in the PR. Either (a) leave warn-only with a one-line ledger How-to leftover, or (b) add those keys to the baseline **only if they are historical sample hits**, never to hide a row added in this PR.

4. **Docs:** ledger Scoring / How-to: sample window is now blocking for **new** unguarded when the step is required. Honest: still not all proven rows.

5. Tests: existing `python3 scripts/tests/test_al_bug_verify_proven_revert.py` must still pass. No new Stryker / validity-audit regexes.

## Acceptance criteria

- Either the CI step is blocking **and** the dry run on this branch is exit 0, **or** the PR documents the leftover keys and keeps warn-only.
- `--fail-on-unguarded` is still unused in CI.
- Historical ledger checkboxes unchanged.
- Default hunt target remains `bugsmash`.

## Constraints

- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92.
- Working-tree safety. Check nulls.
- Do not recreate `_al-bug-pick-zone.ps1`.
