# FS-03 — Gate the investigation-effort figure

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

An operator can enter B, A, N, R, and C. The page shows a figure only when those inputs are the operator's own numbers. The fixture worksheet cannot be submitted.

## Why

Proof-of-ROI Readiness is **58** (weight 5). `ROI_SEND_RULE.md` states the gate. The product does not enforce it.

## Read first

- `docs/securenow/ROI_SEND_RULE.md`
- `docs/securenow/ROI_FIXTURE_WORKSHEET.md`
- `docs/securenow/ROI_COST_INPUT.md`
- `archlucid-ui/src/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx`
- `archlucid-ui/src/lib/product-line/securenow-investigation-effort-copy.ts`

## What to build

1. Branch `fresh-score/03-effort-form` from current `master`.
2. On the investigation-effort page, add five fields: baseline hours **B**, after-product hours **A**, annual count **N**, hourly rate **R**, annual cost **C**. No default values. Do not copy a fee from `PRIVATE_PRICE_SHEET.md`.
3. Until every field is a number greater than zero, and **A** is less than or equal to **B**, the result line is `ROI not calculated`.
4. Reject the fixture tuple exactly: B=3, A=2, N=20, R=100, C=10000. The result line is `ROI not calculated. Those values are the fixture worksheet.`
5. For any other valid tuple, show three lines using the worksheet formula, each labeled `Entered inputs. Not a customer result.`:
   - Gross annual analyst capacity value = `max(0, B - A) × N × R`
   - Net annual value estimate = gross − C
   - ROI ratio = net / C when C > 0
6. A negative net value stays visible. Do not hide it behind a savings headline.
7. Do not write the figure into `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
8. Add a view test for empty fields, the fixture tuple, and one non-fixture tuple that produces a negative net.

## Tests

From `archlucid-ui`, run the investigation-effort page test.

## Done when

Empty inputs and the fixture tuple stay on `ROI not calculated`. A different valid tuple shows the three labeled lines, including a negative net.

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
