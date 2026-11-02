# SN-MKT-11 — Checker for the public Why page and sample

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

The warn-only marketability checker matches the public explanation. It requires an indexed `/why-securenow`, an indexed `/securenow-sample`, both resources-menu links, the shared ArchLucid mailto, and the fixture label. It still rejects a price, a signup, and a beta GO. `BUYER_OVERVIEW.md` stays an internal draft.

## Why

`scripts/ci/check_securenow_marketability.py` was written when `/why-securenow` was a hidden draft. After SN-MKT-08 through SN-MKT-10 it reports failures for the behavior those prompts require. This prompt retargets the checker. It does not flip `continue-on-error` to false.

## Read first

- `scripts/ci/check_securenow_marketability.py`
- `scripts/ci/test_check_securenow_marketability.py`
- `.github/workflows/ci.yml` (steps `SecureNow marketability` and `SecureNow marketability unit tests`; leave `continue-on-error: true`)
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/lib/marketing/securenow-sample-copy.ts`
- `archlucid-ui/src/app/(marketing)/why-securenow/page.tsx`
- `archlucid-ui/src/app/(marketing)/securenow-sample/page.tsx`
- `archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts`
- `archlucid-ui/src/app/(marketing)/layout.tsx`
- `docs/securenow/BUYER_OVERVIEW.md`

## What to build

1. Branch `sn-mkt/11-public-checker` from current `master` after SN-MKT-08 through SN-MKT-10 are present.
2. Update `check_securenow_marketability.py` so `validate` fails when any of these are true:
   - `docs/securenow/BUYER_OVERVIEW.md` lacks `**Scope:**`, `NO_GO`, or `INTERNAL DRAFT`, lacks a relative link to `PROCUREMENT_PACK_INDEX.md`, `QUOTE_COVER.md`, or `CONTROLLED_PILOT_OFFER.md`, or contains `$`.
   - `why-securenow-draft-copy.ts` lacks `SecureNow beta remains NO_GO. This page explains the product. It does not publish a price or open a signup.`
   - That file lacks `WHY_SECURENOW_DRAFT_PITCH`’s current sentence, or lacks `mailto:support@archlucid.net?subject=SecureNow%20conversation`.
   - That file still contains `Internal draft. Not approved buyer communication.`
   - `why-securenow/page.tsx` lacks `index: true`.
   - `securenow-sample/page.tsx` is missing, lacks `index: true`, or `securenow-sample-copy.ts` lacks `Synthetic fixture. Not a customer result.` and `fixture-path-01`.
   - `securenow-marketing-route-policy.ts` lacks `/why-securenow`, `/securenow-sample`, or `"/pricing"` in the blocked prefix list.
   - `(marketing)/layout.tsx` lacks `why-securenow-security-shell` or `securenow-sample-security-shell`.
   - `MarketingResourcesMenu.tsx` lacks `href="/why-securenow"` or `href="/securenow-sample"`.
   - `docs/securenow/FIXTURE_STORYBOARD.md` lacks `Every beat below is a fixture`.
   - Any of the checked files contains `guaranteed savings`, `READY_TO_PUBLISH`, or `Start trial`.
3. Keep the checker warn-only. Do not set `continue-on-error` to false.
4. Extend `test_check_securenow_marketability.py` so the real tree passes, a `$` in `BUYER_OVERVIEW.md` still fails, and a copy of the tree with the status line removed fails. Add the new sample files to `TRACKED_PATHS` when the temp-tree copy needs them.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_marketability.py`

`python3 -m unittest scripts.ci.test_check_securenow_marketability`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit the pitch, the six steps, the refusals, or the mailto string.
- Do not add a CI step that blocks the pull request. The two existing marketability steps stay `continue-on-error: true`.
- Do not commit.

## Done when

The checker passes on the tree that contains the indexed Why page, the synthetic sample, and the two resources-menu links, and it still fails when the buyer overview contains `$` or loses `INTERNAL DRAFT`.
