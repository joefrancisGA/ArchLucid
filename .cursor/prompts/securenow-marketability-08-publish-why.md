# SN-MKT-08 — Publish the Why SecureNow page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

`/why-securenow` becomes an indexed explanation. The pitch, audience, six steps, refusals, reviewer-pack sentences, and conversation mailto stay character for character. The internal-draft banner is replaced by a beta **NO_GO** status line. The marketing menu does not link the page in this session.

## Why

Marketability is **61**. ArchLucid’s comparable score is **68** because `/why` is indexed and linked. The SecureNow sentences are already accepted. Search engines and the resources menu still treat the page as an unapproved draft. This prompt removes that draft gate. It does not rewrite the story, publish a price, or mark beta GO.

## Read first

- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/app/(marketing)/why-securenow/page.tsx`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.test.tsx`
- `archlucid-ui/src/app/(marketing)/why/page.tsx` (indexed metadata pattern only; do not edit it)
- `scripts/ci/check_securenow_marketability.py` (do not edit it; SN-MKT-11 does)

## What to build

1. Branch `sn-mkt/08-publish-why` from current `master`.
2. Leave these constants unchanged, including their string values:
   - `WHY_SECURENOW_DRAFT_HEADING`
   - `WHY_SECURENOW_DRAFT_PITCH`
   - `WHY_SECURENOW_DRAFT_AUDIENCE`
   - `WHY_SECURENOW_DRAFT_STEPS`
   - `WHY_SECURENOW_DRAFT_REFUSALS`
   - `WHY_SECURENOW_CONVERSATION_MAILTO` (`mailto:support@archlucid.net?subject=SecureNow%20conversation`)
   - `WHY_SECURENOW_CONVERSATION_LABEL`
   - `WHY_SECURENOW_REVIEWER_PACK_HEADING`
   - `WHY_SECURENOW_REVIEWER_PACK_BODY`
   - `WHY_SECURENOW_PILOT_DECISION_HEADING`
   - `WHY_SECURENOW_PILOT_DECISION_BODY`
3. Replace `WHY_SECURENOW_DRAFT_BANNER` with `WHY_SECURENOW_STATUS_LINE`:
   - `"SecureNow beta remains NO_GO. This page explains the product. It does not publish a price or open a signup."`
   - Update every import. The rendered page shows this status line first.
4. In `page.tsx`, set `robots: { index: true, follow: true }`. Set `description` to `WHY_SECURENOW_DRAFT_PITCH`. Do not add a price, a signup URL, or Open Graph copy that is not the pitch.
5. Do not add `/why-securenow` to `MarketingResourcesMenu`, the welcome page, or the marketing footer. That is SN-MKT-10.
6. Do not edit `docs/securenow/BUYER_OVERVIEW.md`. It stays an internal draft.
7. Do not edit `scripts/ci/check_securenow_marketability.py` in this session. Until SN-MKT-11, that warn-only checker still expects the old banner and `index: false`.

## Tests

Update `WhySecureNowDraftView.test.tsx` and the page metadata test:
- The status line is present.
- The old sentence `Internal draft. Not approved buyer communication. SecureNow beta remains NO_GO.` is absent.
- The pitch, one refusal, and `Request a conversation` remain.
- The mailto is still `mailto:support@archlucid.net?subject=SecureNow%20conversation`.
- `robots` index is true.
- Rendered text has no `$`.

The existing assertion that `MarketingResourcesMenu` has no `href="/why-securenow"` still passes.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- No new mailbox. Intake stays `support@archlucid.net`.
- No price, no SKU id, no Stripe link, no Partner Center id, no signup form, no "Start trial".
- Do not check any owner checklist box. Beta remains **NO_GO**.
- Do not edit `CONTROLLED_PILOT_OFFER.md`, `PRIVATE_PRICE_SHEET.md`, or `SUPPORT_COMMITMENT.md`.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

`/why-securenow` is indexable, the accepted copy is unchanged, the status line states beta **NO_GO**, and the conversation link is still the ArchLucid support mailbox. The resources menu does not link the page yet.
