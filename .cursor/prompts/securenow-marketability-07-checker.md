# SN-MKT-07 — Checker for SecureNow marketability notes

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

CI fails when the buyer overview gains a price, the draft becomes indexable, the security shell loses its exception, marketing nav links the draft, or the Home reviewer section disappears.

## Why

SN-MKT-04 through SN-MKT-06 are easy to regress. A later edit can put the draft behind the blanket marketing redirect, add it to the public menu, or paste a fee into the overview.

## Read first

- `docs/securenow/BUYER_OVERVIEW.md`
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/app/(marketing)/why-securenow/page.tsx`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts`
- `archlucid-ui/src/app/(marketing)/layout.tsx`
- `archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx`
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`
- `docs/securenow/FIXTURE_STORYBOARD.md`
- `scripts/ci/check_securenow_commercial_packaging.py` (shape only; do not change it)
- `.github/workflows/ci.yml` (step `SecureNow commercial packaging unit tests`)

## What to build

1. Branch `sn-mkt/07-checker` from current `master` after SN-MKT-04 through SN-MKT-06 are present.
2. Add `scripts/ci/check_securenow_marketability.py`.
3. The script exits 1 when any of these fail:
   - `docs/securenow/BUYER_OVERVIEW.md` is missing, has no `**Scope:**`, has no `NO_GO`, has no `INTERNAL DRAFT`, lacks a relative link to `PROCUREMENT_PACK_INDEX.md`, `QUOTE_COVER.md`, or `CONTROLLED_PILOT_OFFER.md`, or contains `$`.
   - `why-securenow-draft-copy.ts` lacks `Internal draft. Not approved buyer communication. SecureNow beta remains NO_GO.` or lacks `This page does not publish a price.`
   - `archlucid-ui/src/app/(marketing)/why-securenow/page.tsx` lacks `index: false`.
   - `securenow-marketing-route-policy.ts` lacks `isSecureNowDraftMarketingPath` or lacks `/why-securenow`, or lacks `"/pricing"` in the blocked prefix list.
   - `(marketing)/layout.tsx` lacks `shouldRedirectMarketingLayout` or lacks `why-securenow-security-shell`.
   - `MarketingResourcesMenu.tsx` contains `href="/why-securenow"`.
   - `securenow-reviewer-home-copy.ts` lacks `For reviewers`, `Draft overview`, `Reviewer packet`, or `Request a conversation`.
   - `docs/securenow/FIXTURE_STORYBOARD.md` lacks `Every beat below is a fixture`.
   - `BUYER_OVERVIEW.md` or `securenow-reviewer-home-copy.ts` contains `guaranteed savings`, `READY_TO_PUBLISH`, or `Start trial`.
4. Add `scripts/ci/test_check_securenow_marketability.py` using `unittest`. Cover: the real repository passes; a temp copy that inserts `$` into `BUYER_OVERVIEW.md` fails; a temp copy that inserts `href="/why-securenow"` into `MarketingResourcesMenu.tsx` fails.
5. In `.github/workflows/ci.yml`, add a step immediately after `SecureNow commercial packaging unit tests`:
   - name: `SecureNow marketability`
   - `continue-on-error: true`
   - `run: python scripts/ci/check_securenow_marketability.py`
   - And a unittest step for `scripts.ci.test_check_securenow_marketability`, also `continue-on-error: true`.
6. Do not change `check_securenow_commercial_packaging.py`, `check_securenow_procurement_pack.py`, or `check_securenow_roi_notes.py`.

## Tests

```bash
python3 scripts/ci/check_securenow_marketability.py
python3 -m unittest scripts.ci.test_check_securenow_marketability
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Leave `continue-on-error: true`. Do not edit branch-protection docs.
- Do not commit.

## Done when

The checker exits 0 on the repository, the two negative tests fail for the right reason, and `/why-securenow` stays `noindex`.
