# Welcome and footer — sample review and fixture-path-01

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another prompt in this session.

**Repo:** `c:\ArchLucid`

**Owner decision (2026-11-02):** yes. The existing ArchLucid sample review and SecureNow `fixture-path-01` may appear on the welcome page and the marketing footer.

## Goal

Put those two existing public surfaces on the welcome page and the marketing footer. Keep `/why-securenow` off both. Do not publish a price.

## Why

Marketability is weight 8. The sample review and `/securenow-sample` already exist. The marketability checker still rejects `/securenow-sample` on the welcome page and the footer, so buyers reach the sample by URL more than from the default marketing chrome. This prompt lifts only that hold.

## Read first

- `scripts/ci/check_securenow_marketability.py`
- `scripts/ci/test_check_securenow_marketability.py`
- `archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx`
- `archlucid-ui/src/components/marketing/MarketingPublicFooter.tsx`
- `archlucid-ui/src/components/marketing/welcome-marketing-copy.ts`
- `archlucid-ui/src/app/(marketing)/marketing-layout-securenow-draft.test.ts`
- `archlucid-ui/src/lib/marketing/securenow-sample-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts`
- `.cursor/prompts/securenow-score-lift-hold.md`
- `.cursor/prompts/securenow-marketability-hold.md`
- `.cursor/prompts/fresh-score-hold.md`

## What to build

1. Branch `sn-mkt/welcome-footer-samples` from current `master`.
2. If welcome and the footer already link both surfaces, stop and report that. Do not add a second copy.
3. Keep the existing sample-review link. Its label is `Healthcare Claims sample review`. Its href is the current primary showcase href (`CANONICAL_ANONYMOUS_PROOF_HREF` / `CUSTOMER_INTAKE_CANONICAL_PROOF_HREF`, `/showcase/customer-intake-modernization`). Do not relabel it and do not point it at the claims-intake showcase.
4. That sample-review link is already on the welcome page. Add the same label and href to `MarketingPublicFooter`.
5. Add one SecureNow link on both `WelcomeMarketingPage` and `MarketingPublicFooter`:
   - Label: `SecureNow sample (fixture-path-01)`
   - Href: `/securenow-sample` (`SECURENOW_SAMPLE_MARKETING_PATH`)
6. On the welcome page, immediately after that SecureNow link, show the existing sentence `Synthetic fixture. Not a customer result.`
7. Share the label and href constants from a small module. `MarketingPublicFooter` is a client component. Do not import `@/lib/showcase-static-demo` into it.
8. Retarget `check_securenow_marketability.py`:
   - Welcome and footer must expose the sample-review href and `/securenow-sample`.
   - Welcome and footer must still fail if they contain `/why-securenow`.
   - Welcome, footer, and the new constants module must not name `PROCUREMENT_PACK_INDEX.md`, `QUOTE_COVER.md`, or `CONTROLLED_PILOT_OFFER.md`.
9. Update `test_check_securenow_marketability.py`:
   - Keep the test that inserts `/why-securenow` into a temp welcome copy and expects failure.
   - Add a test that removes the fixture link from a temp welcome copy and expects failure.
10. Update `marketing-layout-securenow-draft.test.ts`. The resources menu still has both `/why-securenow` and `/securenow-sample`. Welcome and footer must expose the two approved links and must not contain `/why-securenow`. `WelcomeMarketingEngagementPathsSection` and `WelcomeMarketingProofAtGlanceSection` stay without `href="/why-securenow"` and `href="/securenow-sample"`.
11. Extend `WelcomeMarketingPage.test.tsx` and `MarketingPublicFooter.test.tsx` so the rendered links match the label and href above. The footer test must not find a `Why SecureNow` link.
12. Update the stop lines that still forbid every welcome and footer SecureNow link, so a later session does not delete these two:
    - `.cursor/prompts/securenow-score-lift-hold.md`
    - `.cursor/prompts/securenow-marketability-hold.md`
    - `.cursor/prompts/fresh-score-hold.md`
    - `.cursor/prompts/securenow-score-lift-19-marketability-hold-lock.md`
    - `.cursor/prompts/securenow-score-lift-00-index.md`
    - `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`
    - `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`
    Record the 2026-11-02 yes. `/why-securenow` stays off welcome and the footer. **M-316** stays `KEEP_OWNER_HELD`.
13. Do not add `/why-securenow` to welcome or the footer. Do not link the procurement index, the quote cover, or the controlled pilot proposal from welcome, the footer, or `/why-securenow`. Do not add a fee, a `$` amount, `Start trial`, or a beta GO. Do not render the marketing footer on the SecureNow security shell. Do not change route-policy blocked prefixes.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_marketability.py`

`python3 -m unittest scripts.ci.test_check_securenow_marketability`

From `archlucid-ui`:

`npx vitest run src/components/marketing/WelcomeMarketingPage.test.tsx src/components/marketing/MarketingPublicFooter.test.tsx src/app/(marketing)/marketing-layout-securenow-draft.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop. Do not add a second copy.
- Do not commit.

## Done when

The welcome page and the marketing footer both link `Healthcare Claims sample review` and `SecureNow sample (fixture-path-01)`. The welcome SecureNow link is followed by `Synthetic fixture. Not a customer result.` The checker fails if a temp welcome copy drops the fixture link or gains `/why-securenow`. No price is published.
