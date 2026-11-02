# SN-CPKG-01 — Operator page for the quote packet

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-CPKG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMMERCIAL_PACKAGING_COMPOSER_PROMPTS.md`

## Goal

`/administration/securenow-quote-packet` shows the four SecureNow SKU identifiers, their meters, and the seven-step quote sequence. It is an administration page, not a marketing route.

## Why

Commercial Packaging Readiness is **67** (weight 2). The documents already exist. A reviewer on `/why-securenow#reviewer-pack` is told to ask the owner. This page lets an operator open the buyer-safe packet without a fee.

## Read first

- `docs/securenow/SKU_METER_CARD.md`
- `docs/securenow/QUOTE_TO_PILOT_CHECKLIST.md`
- `archlucid-ui/src/app/(operator)/administration/securenow-compliance-notes/SecureNowComplianceNotesPageView.tsx`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts`
- `archlucid-ui/src/lib/product-line/product-line-catalog.test.ts`
- `.cursor/prompts/securenow-commercial-packaging-hold.md`

## What to build

1. Branch `sn-cpkg/01-operator-page` from current `master`.
2. Add `archlucid-ui/src/lib/product-line/securenow-quote-packet-copy.ts`:
    - Heading `Quote packet`.
    - Lead `SKU identifiers and the quote sequence. Not an approved offer. SecureNow beta remains NO_GO.`
    - Guardrail `Fees stay in the private price sheet. This page does not publish a price.`
    - Commerce limit `This page cannot authorize commerce.`
    - Four SKU rows, in this order, with these meter sentences and no other capacity numbers:
      - `SN-EVAL` — `45-day evaluation; up to 2 Azure subscriptions and 4 successful snapshots`
      - `SN-ANNUAL` — `One-year term; 3 Azure subscriptions, 24 successful snapshots, and 5 named operators`
      - `SN-SUB-ADD` — `One additional subscription on an annual term; the private quote sheet cap applies`
      - `SN-SNAP-4` — `4 successful snapshots; unused balance expires at the end of the applicable annual term`
    - Seven sequence labels, in this order: `Quote cover`, `Controlled pilot proposal`, `Security one-pager and procurement index`, `Data-processing schedule`, `Support commitment`, `Order form`, `Blank measurement log and cost input`.
    - Four links. Do not link `PRIVATE_PRICE_SHEET.md`. Labels and hrefs:
      - `SKU and meter card` → `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/SKU_METER_CARD.md`
      - `Quote-to-pilot checklist` → `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/QUOTE_TO_PILOT_CHECKLIST.md`
      - `Quote cover` → `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/QUOTE_COVER.md`
      - `Order form` → `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/ORDER_FORM_TEMPLATE.md`
3. Add `page.tsx` and `SecureNowQuotePacketPageView.tsx` under `archlucid-ui/src/app/(operator)/administration/securenow-quote-packet/`. `data-testid="securenow-quote-packet-page"`. Use `OperatorPageContainer` and `OperatorPageHeader`.
4. In `PRODUCT_LINE_EXTRA_ASSIGNMENTS`, set `"/administration/securenow-quote-packet": "security"`.
5. Extend `product-line-catalog.test.ts`: allowed for `security`, refused for `architecture`.
6. Add a page test that finds `Not an approved offer`, `NO_GO`, `cannot authorize commerce`, all four SKU ids, and all four link labels. Assert the rendered text has no `$`.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/administration/securenow-quote-packet/SecureNowQuotePacketPageView.test.tsx src/lib/product-line/product-line-catalog.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `/why-securenow`, `PRIVATE_PRICE_SHEET.md`, or the order-form blanks.
- Do not add a marketing route, a fee, or a checkout control.
- Do not commit.

## Done when

A SecureNow operator can open the four SKU identifiers and the quote sequence, and the page says it is not an approved offer and cannot authorize commerce.
