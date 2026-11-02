# FS-12 — Publish the SKU card without fees

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

`/why-securenow` links a public SKU and meter card. The card has no fee, no currency, and no list price.

## Why

Commercial Packaging Readiness is **60** (weight 2). `SKU_METER_CARD.md` is an internal template. A buyer on the Why page cannot see the identifiers.

## Read first

- `docs/securenow/SKU_METER_CARD.md`
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx`
- `scripts/ci/check_securenow_marketability.py`

## What to build

1. Branch `fresh-score/12-public-sku-card` from current `master`.
2. Add route `/securenow-sku`. Render the four SKU rows from `SKU_METER_CARD.md`: **SN-EVAL**, **SN-ANNUAL**, **SN-SUB-ADD**, **SN-SNAP-4**, with the meter summary and no fee column.
3. Status line: the existing `WHY_SECURENOW_STATUS_LINE` (beta **NO_GO**).
4. One sentence: `These identifiers are not active entitlements.`
5. Link it from the Why page body as `SKU and meter card`. Do not add it to the welcome page or the footer.
6. Extend the marketability checker so a price, a currency symbol, or a fee amount on this page fails the warn-only check. Do not make the checker a required CI job if it is warn-only today.
7. Test the page renders the four SKU ids and does not render `$` or a digit fee.

## Tests

From `archlucid-ui`, run the new page test and `python3 scripts/ci/test_check_securenow_marketability.py`.

## Done when

The public SKU page lists the four identifiers and the meters, links from the Why page, and contains no fee.

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
