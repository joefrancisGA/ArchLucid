# SN-MKT-12 — Resources-menu test matches the shipped links

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

`marketing-layout-securenow-draft.test.ts` expects the resources menu to link `/why-securenow` and `/securenow-sample`. The same test still expects the welcome page and the marketing footer to omit those two hrefs. This prompt does not add a link. Marketability stays **67**.

## Why

SN-MKT-10 added both hrefs to `MarketingResourcesMenu.tsx`. The SN-MKT-04 layout test still asserts that the menu source does not contain `href="/why-securenow"`. A run of that file fails on trunk. The public pages are already linked from the resources menu. This prompt makes the test agree with that shipped menu.

## Read first

- `archlucid-ui/src/app/(marketing)/marketing-layout-securenow-draft.test.ts`
- `archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx`
- `archlucid-ui/src/components/marketing/MarketingResourcesMenu.test.tsx`
- `archlucid-ui/src/components/marketing/WelcomeMarketingEngagementPathsSection.tsx`
- `archlucid-ui/src/components/marketing/WelcomeMarketingProofAtGlanceSection.tsx`
- `archlucid-ui/src/components/marketing/MarketingPublicFooter.tsx`
- `archlucid-ui/src/app/(marketing)/layout.tsx`

## What to build

1. Branch `sn-mkt/12-menu-test` from current `master` after SN-MKT-01 through SN-MKT-11 are present.
2. In `marketing-layout-securenow-draft.test.ts`, replace the assertion that the resources menu source does not contain `href="/why-securenow"`. The menu source must contain both `href="/why-securenow"` and `href="/securenow-sample"`.
3. In that same test file, read the three welcome and footer sources and assert that none of them contain `href="/why-securenow"` or `href="/securenow-sample"`.
4. Keep the existing assertions for `shouldRedirectMarketingLayout`, `why-securenow-security-shell`, and `ARCHLUCID_PATHNAME_REQUEST_HEADER`.
5. Do not edit `MarketingResourcesMenu.tsx`, the welcome components, the footer, `layout.tsx`, or `scripts/ci/check_securenow_marketability.py`.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(marketing)/marketing-layout-securenow-draft.test.ts src/components/marketing/MarketingResourcesMenu.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a link on the welcome page, in `MarketingPublicFooter`, or in the operator sidebar.
- Do not add a price, a signup, a "Start trial" control, or a beta GO.
- Do not check a box in `docs/securenow/CONTROLLED_PILOT_OFFER.md`.
- Do not commit.

## Done when

The layout test passes because the resources menu contains both public hrefs, and the welcome sections and the marketing footer still do not.
