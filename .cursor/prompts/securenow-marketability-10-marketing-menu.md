# SN-MKT-10 — Marketing menu links for Why SecureNow and the sample

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

The public resources menu links `/why-securenow` and `/securenow-sample`. SecureNow Home’s reviewer section points at those same pages and at the existing ArchLucid conversation mailto. The welcome page and the marketing footer stay unchanged.

## Why

SN-MKT-08 and SN-MKT-09 make the pages reachable by URL. ArchLucid’s menu already lists Why ArchLucid and See it. SecureNow still has no public entry. The Home "For reviewers" lead still calls the page an internal draft, which will be false after SN-MKT-08.

## Read first

- `archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx`
- `archlucid-ui/src/components/marketing/MarketingFaqPageClient.test.tsx` (the Why ArchLucid href assertion; follow that style)
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.test.ts`
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts` (mailto only; do not change the pitch)

## What to build

1. Branch `sn-mkt/10-marketing-menu` from current `master` after SN-MKT-08 and SN-MKT-09 are present.
2. In `MarketingResourcesMenu.tsx`, immediately after the existing Why ArchLucid item (`href="/why"`), add two menu items:
   - Label `Why SecureNow`, `href="/why-securenow"`.
   - Label `SecureNow sample`, `href="/securenow-sample"`.
3. Do not add these hrefs to the welcome page, the marketing footer, the operator sidebar, or the operator header.
4. In `securenow-reviewer-home-copy.ts`:
   - Lead becomes `Public explanation and a synthetic sample. Not an offer. SecureNow beta remains NO_GO.`
   - First row label becomes `Why SecureNow`. Summary becomes `Who it is for, the six-step workflow, and the refusals.` Href stays `/why-securenow`.
   - Add a row after it: href `/securenow-sample`, label `SecureNow sample`, summary `One synthetic ranked path. Not a customer result.`
   - Keep the reviewer-packet row and the conversation row. The conversation href stays `mailto:support@archlucid.net?subject=SecureNow%20conversation`.
   - No row sets `recommendedFirst`.
5. Do not add a price, a signup item, or a "Start trial" item.

## Tests

Add or extend a resources-menu test so the menu exposes `Why SecureNow` → `/why-securenow` and `SecureNow sample` → `/securenow-sample`. Remove or invert any assertion that `MarketingResourcesMenu` must not contain `href="/why-securenow"`.

Update `securenow-reviewer-home-copy.test.ts` for the new lead, the Why SecureNow label, the sample row, and the unchanged mailto. The joined copy contains no `$`, `Start trial`, or `Buy`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- No new mailbox. Reuse `support@archlucid.net`.
- Do not edit `WHY_SECURENOW_DRAFT_PITCH`, the six steps, or the refusals.
- Do not edit `scripts/ci/check_securenow_marketability.py`. SN-MKT-11 updates it. Until then the warn-only checker still rejects a menu href.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

The resources menu lists Why SecureNow and SecureNow sample, Home links the same two pages plus the ArchLucid mailto, and the welcome page still has no SecureNow marketing links.
