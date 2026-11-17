# FS-07 — Open the sample review on its manifest

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

The first-review guide's sample action opens the existing sample review with the committed manifest id and one sponsor paragraph, both labeled Sample.

## Why

ArchLucid Time-to-Value is **76** (weight 7). The guide points at a sample. The first screen of that sample does not show the committed manifest and a sponsor paragraph together.

## Read first

- `archlucid-ui/src/lib/buyer-copy/onboarding.ts`
- `docs/go-to-market/DEMO_WORKSPACES.md`
- `archlucid-ui/src/components/reviews/RunDetailFirstReviewSpineBand.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageStampViewport.tsx`

## What to build

1. Branch `fresh-score/07-sample-manifest` from current `master`.
2. Find the existing sample review the first-review guide already highlights. Do not create a workspace, a tenant, or a manifest.
3. On that review's spine band, when the review is the sample, show:
   - `Sample manifest` and the committed manifest id already on the review.
   - `Sample sponsor paragraph` and one paragraph already produced for that sample. If the paragraph is not already stored, use the existing sponsor-summary renderer for that review and prefix it with `Sample. Not a customer result.`
4. Do not show this block on a non-sample review.
5. Add a test that the sample review renders both lines and a non-sample review does not.

## Tests

From `archlucid-ui`, run the spine-band test you extended.

## Done when

The sample review shows its committed manifest id and one sample sponsor paragraph. Other reviews do not show that block.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/fresh-score-hold.md` before editing.
- Do not implement another FS prompt in this session.
- Do not commit.
- Beta remains **NO_GO**. Do not publish a fee, a public list price, a CPA SOC 2 report, or a third-party pen-test claim.
- Do not write a customer result, a timed SLA, or a minutes-to-value claim.
- Do not hide review workspace tabs behind a More menu.
- Do not call `PathRankingEngine` or change rank weights.
