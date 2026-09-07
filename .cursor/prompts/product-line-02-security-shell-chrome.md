# PL-02 — Security shell chrome (wordmark, titles, skip Architecture home RSC)

**Do not** add a second Next.js app. **Do not** load the Architecture runs dashboard just to throw it away on the Security process. **Do not** collapse desktop review workspace tabs. **Do not** imply architecture reviews, sealed manifests, CPA SOC 2, or a published third-party pen test on the Security home.

## Goal

A Security window (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`, typically :3001) must *read* as the Infrastructure / Security product:

1. Wordmark accessible name uses `PRODUCT_LINE_WORDMARK_ARIA_LABEL.security`. If **SN-01** (SecureNow consumer brand) has landed or is the owner’s current intent, that string is **SecureNow**, not `ArchLucid Security`. Do not ship both. See [`.cursor/prompts/securenow-brand-01-display-name-chrome.md`](securenow-brand-01-display-name-chrome.md).
2. Home document title matches Security home (`SECURITY_PRODUCT_HOME_TITLE` / Infrastructure evidence), not the Architecture operator-home label.
3. Server render of `/` on the Security process does **not** construct `OperatorHomeRunsDashboardAsync`. `ProductLineHomeSwitch` receiving architecture home as a prop still creates that tree on the server.

Cookie override in a *single* window can still switch shells client-side; do not over-build a cookie-aware RSC split. The dual-start loop (PL-01) is env-based: one process per product.

## Why

If Security home still fetches Architecture runs and announces “Home” / Architecture wordmark, the split looks like a filter, not a product. Operators will judge the shuffle from chrome first.

## Context

- `archlucid-ui/src/app/(operator)/page.tsx` — `ProductLineHomeSwitch` + `OperatorHomeRunsDashboardAsync`
- `archlucid-ui/src/lib/product-line/product-line-copy.ts` — labels already exist
- `archlucid-ui/src/lib/product-line/resolve-product-line-id.ts` — env default
- `archlucid-ui/src/components/ArchLucidWordmarkLink.tsx` / operator top bar / `TenantMastheadWordmark`
- `archlucid-ui/src/components/product-line/SecurityProductHome.tsx`
- `archlucid-ui/src/lib/i18n.ts` `OPERATOR_NAV_LINK_LABELS.home`

## What to build

1. Home page: if `resolveProductLineIdFromEnv()` (or equivalent) is `security`, render `SecurityProductHome` only — no architecture dashboard child.
2. `metadata.title` for that process: Security home title.
3. Operator masthead / wordmark: product-line-aware aria-label (and visible wordmark text only if the existing logo component already supports a label; do not invent a second logo file).
4. Vitest: home switch / wordmark / metadata helper. Do not “fix” `NODE_ENV=test` system-admin nav emptying.

## Acceptance criteria

- Security `next dev` on :3001 does not await Architecture home runs on `/`.
- Screen reader name for the masthead link says Security in the Security process.
- Architecture :3000 chrome unchanged.
- Claim sentence on Security home stays: this shell does not run architecture reviews.

## Constraints

- Reuse `product-line-copy.ts`. One component per file. Sentence case. Carbon density.
- Commit on the named product-line branch. Stage only chrome files + tests.
