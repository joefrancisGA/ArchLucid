# SN-ROI-08 — Extend the ROI notes checker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

The existing warn-only ROI checker also guards the hour join, the send rule, the sponsor row, and the operator page. It stays warn-only.

## Why

SN-ROI-05 through SN-ROI-07 are easy to regress into a filled customer result, a dollar amount, or a send rule that no longer names the gates.

## Read first

- `scripts/ci/check_securenow_roi_notes.py`
- `scripts/ci/test_check_securenow_roi_notes.py`
- `docs/securenow/PILOT_MEASUREMENT_LOG.md`
- `docs/securenow/ROI_SEND_RULE.md`
- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx`
- `.github/workflows/ci.yml` (steps `SecureNow ROI notes` and `SecureNow ROI notes unit tests`)

## What to build

1. Branch `sn-roi/08-checker` from current `master` after SN-ROI-05 through SN-ROI-07 are present.
2. Extend `scripts/ci/check_securenow_roi_notes.py`. Keep every current check. Add failures when:
   - `docs/securenow/PILOT_MEASUREMENT_LOG.md` lacks `Hours for the formula`, `Sample size`, `Limitation`, `Selection note`, or `NOT MEASURED`, or has fewer than 3 data rows whose cells include `BLANK`.
   - That measurement log contains `$`.
   - `docs/securenow/ROI_SEND_RULE.md` lacks `NO_GO`, `NOT COLLECTED`, `FIXTURE`, `ROI not calculated`, or `sponsor approved`.
   - That send rule contains `$`, `975%`, or `guaranteed ROI`.
   - `securenow-sponsor-home-copy.ts` lacks `Investigation effort` and `/administration/securenow-investigation-effort`.
   - `SecureNowInvestigationEffortPageView.tsx` lacks `securenow-investigation-effort-page`.
   - `archlucid-ui/src/lib/product-line/securenow-investigation-effort-copy.ts` lacks any of `docs/securenow/PILOT_MEASUREMENT_LOG.md`, `docs/securenow/ROI_COST_INPUT.md`, `docs/securenow/ROI_FIXTURE_WORKSHEET.md`, or `docs/securenow/ROI_SEND_RULE.md`.
3. Extend `scripts/ci/test_check_securenow_roi_notes.py`. The real tree passes. A temp copy that inserts `$` into `ROI_SEND_RULE.md` fails. A temp copy that deletes `Sample size` from the measurement log fails.
4. Leave the existing CI steps in place. Do not add a second workflow job. Both steps stay `continue-on-error: true`.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_roi_notes.py`

`python3 -m unittest scripts.ci.test_check_securenow_roi_notes`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not edit branch-protection docs.
- Do not commit.

## Done when

The existing checker passes on the tree that contains the hour join, the send rule, and the operator page, and it fails when the send rule contains `$` or the log loses `Sample size`.
