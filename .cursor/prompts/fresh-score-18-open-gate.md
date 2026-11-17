# FS-18 — Name the one open review gate

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

The review header names one open gate and links to it. The tab strip stays as it is.

## Why

ArchLucid Cognitive Load is **68** (weight 1). The review header carries several statuses. It does not say which gate is the current one.

## Read first

- `archlucid-ui/src/components/reviews/RunDetailFirstReviewSpineBand.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageStampViewport.tsx`
- `archlucid-ui/src/lib/reviews/first-review-spine-band.ts`

## What to build

1. Branch `fresh-score/18-open-gate` from current `master`.
2. On the spine band, add `data-testid="review-open-gate"`.
3. Pick the first matching gate only, in this order: an uncited finding, an open disposition, an uncommitted review.
4. The line names that gate and links to the existing section for it.
5. When none match, the line is `No open gate on this review.`
6. Do not add a More menu. Do not remove or collapse a review tab.
7. Test each of the three gates and the clear state. An uncited finding wins over an open disposition.

## Tests

From `archlucid-ui`, run the spine-band test you extended.

## Done when

The header shows one open gate in that order, or says there is no open gate. The tab strip is unchanged.

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
