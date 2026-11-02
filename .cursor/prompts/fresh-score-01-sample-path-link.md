# FS-01 — Open the sample path in Path inspect

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

`/securenow-sample` links a signed-in operator to `fixture-path-01` in Path inspect. The public page stays a synthetic fixture.

## Why

Marketability is **58** (weight 8). The sample page already names `fixture-path-01` and the cited hops. It does not open that path in the product.

## Read first

- `archlucid-ui/src/lib/marketing/securenow-sample-copy.ts`
- `archlucid-ui/src/app/(marketing)/securenow-sample/SecureNowSampleView.tsx`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts` (the ranked-path href)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`

## What to build

1. Branch `fresh-score/01-sample-path-link` from current `master`.
2. Add copy constants in `securenow-sample-copy.ts`:
   - Label: `Open fixture-path-01 in Path inspect`
   - Lead: `Signed-in operators only. Synthetic fixture. Not a customer result.`
   - Href: the ranked-path href from `SECURENOW_FIRST_HOUR_HOME_ROWS` plus `?pathId=fixture-path-01`.
3. Render that link on `SecureNowSampleView` under the "One ranked path" beat. Keep `SECURENOW_SAMPLE_FIXTURE_LINE`.
4. In `RemediationFactoryClient`, when `pathId` is `fixture-path-01` and that row is in the loaded list, select it and show Path inspect. When the row is absent, keep the existing select prompt. Do not invent a path.
5. Extend `securenow-sample-copy.test.ts` and the remediation-factory client test for the query.

## Tests

From `archlucid-ui`, run the sample copy test and the remediation-factory client test that covers `pathId`.

## Done when

The sample page links to Path inspect for `fixture-path-01`, and the factory selects that row only when it is loaded. The fixture line stays on the page. Welcome and footer do not gain this link.

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
