# SN-MKT-14 — Publish the last three fixture beats on the sample

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

`/securenow-sample` shows six fixture beats. Beats 4 through 6 are the engineer action, an honest not-verified result, and the audit link. The page stays labeled a synthetic fixture. `docs/securenow/FIXTURE_STORYBOARD.md` is not edited. This aims Marketability at about **70**. It does not publish a price or mark beta GO.

## Why

The public sample stops after scope, one ranked path, and the advisory cut point. The accepted Why page already lists the next three steps, and `FIXTURE_STORYBOARD.md` already has the facilitator lines for them. A stranger never sees those three beats. Adding them to the sample is the remaining product change that does not require a commercial decision.

## Read first

- `docs/securenow/FIXTURE_STORYBOARD.md` (beats 4–6; do not edit the file)
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts` (`WHY_SECURENOW_DRAFT_STEPS`; do not change the strings)
- `archlucid-ui/src/lib/marketing/securenow-sample-copy.ts`
- `archlucid-ui/src/lib/marketing/securenow-sample-copy.test.ts`
- `archlucid-ui/src/app/(marketing)/securenow-sample/SecureNowSampleView.tsx`
- `archlucid-ui/src/app/(marketing)/securenow-sample/SecureNowSampleView.test.tsx`
- `scripts/ci/check_securenow_marketability.py`
- `scripts/ci/test_check_securenow_marketability.py`

## What to build

1. Branch `sn-mkt/14-sample-beats` from current `master` after SN-MKT-13 is present. If the in-page Why link from SN-MKT-13 is already in `SecureNowSampleView.tsx`, leave it where it is.
2. Append these three beats to `SECURENOW_SAMPLE_BEATS`, after `"Advisory cut point"`, in this order:
   1. Title `"Engineer action"`. Body `"The fixture shows a remediation instance with an advisory runbook. The engineer changes Azure outside SecureNow under the organization's approvals. SecureNow records the plan and the later collection. It does not change Azure."`
   2. Title `"Not verified"`. Body `"When the later capture, the human attestation, the completed analysis, or the substantive postcondition is missing, the fixture result is not verified. A missing piece is not a silent pass."`
   3. Title `"Audit link"`. Body `"A person records the audit link to the relevant control. The link shows traceability. It is not compliance certification."`
3. Leave the first three beats, the fixture line, the pitch, the status line, and the mailto unchanged.
4. `SecureNowSampleView.tsx` already maps `SECURENOW_SAMPLE_BEATS`. Do not add a second list. Do not embed a screenshot and do not link to an authenticated Path inspect route.
5. Extend `check_securenow_marketability.py` so `validate` fails when `securenow-sample-copy.ts` lacks any of the titles `"Engineer action"`, `"Not verified"`, or `"Audit link"`. Keep `continue-on-error: true`.
6. Do not edit `FIXTURE_STORYBOARD.md`, `BUYER_OVERVIEW.md`, or `CONTROLLED_PILOT_OFFER.md`.

## Tests

In `securenow-sample-copy.test.ts`, expect six beats and these titles in order: `"Scope and freshness"`, `"One ranked path"`, `"Advisory cut point"`, `"Engineer action"`, `"Not verified"`, `"Audit link"`. Keep the assertions that reject `$`, `Start trial`, `guaranteed`, and `autonomous`. Add a rejection for `SOC 2`.

In `SecureNowSampleView.test.tsx`, expect the rendered page to contain `not verified` and `does not change Azure`.

From `archlucid-ui`:

`npx vitest run src/lib/marketing/securenow-sample-copy.test.ts src/app/(marketing)/securenow-sample/SecureNowSampleView.test.tsx`

From the repo root:

`python3 scripts/ci/check_securenow_marketability.py`

`python3 -m unittest scripts.ci.test_check_securenow_marketability`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not say the fixture was exploited, that SecureNow applied a change, or that the audit link is a certification.
- No price, no signup, no "Start trial", no beta GO, and no checked owner checklist box.
- Do not add a welcome, footer, or sidebar link.
- Do not commit.

## Done when

The sample page renders six fixture beats, including an explicit not-verified result, and the warn-only checker fails if any of the three new titles is missing.
