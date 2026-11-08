# SN-CPKG-02 — Home row for the quote packet

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-CPKG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMMERCIAL_PACKAGING_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home **For reviewers** links the operator quote packet. The public Why page still tells a reviewer to ask the owner.

## Why

SN-CPKG-01 adds the page. Home still points **Reviewer packet** at `/why-securenow#reviewer-pack`. **M-316** has not approved public links.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.test.ts`
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/components/product-line/SecureNowReviewerHomeSection.tsx`

## What to build

1. Branch `sn-cpkg/02-home-row` from current `master` after SN-CPKG-01 is present.
2. Insert one row in `SECURENOW_REVIEWER_HOME_ROWS` immediately after **Reviewer packet**:
    - `href`: `/administration/securenow-quote-packet`
    - `label`: `Quote packet`
    - `summary`: `Four SKU identifiers and the quote sequence. Fees stay off this page.`
    - Do not set `recommendedFirst`.
3. Update `securenow-reviewer-home-copy.test.ts` so the label list is `Why SecureNow`, `SecureNow sample`, `Reviewer packet`, `Quote packet`, `Request a conversation`, `Accessibility`. Keep the assertion that no row has `recommendedFirst: true`, and keep the assertion that the joined copy has no `$`.
4. Do not edit `why-securenow-draft-copy.ts`. It must keep `Those documents stay with the owner until buyer communication is approved.`

## Tests

From `archlucid-ui`:

`npx vitest run src/lib/product-line/securenow-reviewer-home-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add the quote packet to the welcome page, the marketing footer, or `/why-securenow`.
- Do not commit.

## Done when

Home **For reviewers** includes **Quote packet**, and the public Why page still says the documents stay with the owner.
