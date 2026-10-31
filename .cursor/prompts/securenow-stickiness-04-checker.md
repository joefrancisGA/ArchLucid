# SN-STICK-04 — Checker for SecureNow return reasons

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-STICK prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_STICKINESS_COMPOSER_PROMPTS.md`

## Goal

CI fails when a return reason disappears, Home points somewhere else, the operator page starts claiming reminders or usage, or a dollar amount lands in the note.

## Why

The return section is easy to collapse back into the work summary or to turn into a notification claim. The checker keeps the four reasons and the refusal.

## Read first

- `docs/securenow/RETURN_REASONS.md`
- `archlucid-ui/src/lib/product-line/securenow-return-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-return-reasons-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView.tsx`
- `scripts/ci/check_securenow_decision_velocity.py` (shape only; do not change it)
- `.github/workflows/ci.yml` (step `SecureNow decision velocity unit tests`)

## What to build

1. Branch `sn-stick/04-checker` from current `master` after SN-STICK-01 through SN-STICK-03 are present.
2. Add `scripts/ci/check_securenow_stickiness.py`.
3. The script exits 1 when any of these fail:
   - `docs/securenow/RETURN_REASONS.md` is missing, lacks `NO_GO`, lacks `does not send email`, lacks `Awaiting verification`, `Recent changes`, `Open questions`, or `Sponsor follow-up`, or contains `$`.
   - `securenow-return-home-copy.ts` lacks `Come back for`, `NO_GO`, `/security/remediation-instances`, `/infrastructure/snapshots-drift`, `/infrastructure/diagrams`, or `/administration/securenow-pilot-decision`.
   - `securenow-return-reasons-copy.ts` lacks `does not send a reminder` or lacks `NO_GO`.
   - `SecureNowReturnReasonsPageView.tsx` lacks `securenow-return-reasons-page`.
   - Any of those four files contains `engagement score` or `guaranteed return`, case-insensitive.
4. Add `scripts/ci/test_check_securenow_stickiness.py` using `unittest`. Cover: the real repository passes; a temp copy that inserts `$` into `RETURN_REASONS.md` fails; a temp copy that removes `/infrastructure/diagrams` from the Home copy fails.
5. In `.github/workflows/ci.yml`, add two steps immediately after `SecureNow decision velocity unit tests`:
   - name: `SecureNow stickiness`
   - `continue-on-error: true`
   - `run: python scripts/ci/check_securenow_stickiness.py`
   - And a unittest step for `scripts.ci.test_check_securenow_stickiness`, also `continue-on-error: true`.
6. Do not change `check_securenow_decision_velocity.py`.

## Tests

```bash
python3 scripts/ci/check_securenow_stickiness.py
python3 -m unittest scripts.ci.test_check_securenow_stickiness
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Leave `continue-on-error: true`. Do not edit branch-protection docs.
- Do not commit.

## Done when

The checker exits 0 on the repository, both negative tests fail for the right reason, and the return note still says it does not send email.
