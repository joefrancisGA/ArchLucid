# SN-MKT-04 — Why SecureNow draft on the security shell

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

On a SecureNow deployment, `/why-securenow` renders the existing noindex draft. Every other marketing route still redirects to `/`. The draft does not show the ArchLucid marketing header, footer, pricing, or signup chrome.

## Why

Marketability is **50**. Differentiability is **74**. SN-MKT-02 shipped `/why-securenow`, and `robots` is already `index: false`. The marketing layout still redirects the whole `(marketing)` tree when the product line is `security`, so a SecureNow host never shows the draft. The prefix list does not match `/why-securenow` (it matches `/why` and `/why/...` only). The blanket layout redirect is the block.

## Read first

- `archlucid-ui/src/app/(marketing)/layout.tsx`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.test.ts`
- `archlucid-ui/src/proxy.ts`
- `archlucid-ui/src/proxy.test.ts`
- `archlucid-ui/src/app/(marketing)/why-securenow/page.tsx` (do not change `robots`)
- `archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx` (do not add a link)

## What to build

1. Branch `sn-mkt/04-draft-on-security-shell` from current `master`.
2. In `securenow-marketing-route-policy.ts`, add:
   - `SECURENOW_DRAFT_MARKETING_PATH = "/why-securenow"`.
   - `isSecureNowDraftMarketingPath(pathnameOrHref)` is true only when `normalizeMarketingRoutePath` equals that constant. `/why-securenow/` is true. `/why-securenow/extra`, `/why`, and `/pricing` are false.
   - `shouldRedirectMarketingLayout({ productLineId, pathname })` returns true only when `isMarketingRouteBlockedForProductLine(productLineId)` is true and the path is not the draft path. Architecture product line returns false for every path.
3. Do not add `/why-securenow` to `SECURENOW_BLOCKED_MARKETING_ROUTE_PREFIXES`. Do not change the prefix matcher so that `/why` matches `/why-securenow`.
4. In `proxy.ts`, on every `NextResponse.next()` (including the `/403` branch), pass the incoming request headers through and set `x-archlucid-pathname` to `request.nextUrl.pathname`. Do not set that header on redirects.
5. In `(marketing)/layout.tsx`, read `x-archlucid-pathname` from `headers()`. Missing header means `""` (fail closed on the security product line).
   - If `shouldRedirectMarketingLayout` is true, `redirect("/")` as today.
   - If the product line is security and the path is the draft path, return `children` inside `ShellReadySurface` with `data-testid="why-securenow-security-shell"`. Do not render `MarketingPublicHeader`, `MarketingPublicFooterDeferred`, `MarketingJsonLd`, Clarity, first-touch capture, or the consent banner.
   - Otherwise keep the current public marketing chrome.
6. Leave the draft copy, the banner, and `robots: { index: false, follow: false }` as they are. Do not add a Home link in this session. That is SN-MKT-06.

## Tests

Extend `securenow-marketing-route-policy.test.ts`:
- `/why-securenow` and `/why-securenow/` are draft paths.
- `/why`, `/pricing`, and `/why-securenow/extra` are not.
- Security product line redirects `/pricing` and does not redirect `/why-securenow`.
- Architecture product line does not redirect either path.

Extend `proxy.test.ts`: a pass-through request to `http://localhost:3000/why-securenow` forwards the pathname on `NextResponse.next({ request: { headers } })`. Assert response header `x-middleware-request-x-archlucid-pathname` equals `/why-securenow`. That value is not on the response as `x-archlucid-pathname`. The layout reads it from the incoming request headers.

Read `(marketing)/layout.tsx` in a Vitest and expect both `shouldRedirectMarketingLayout` and `why-securenow-security-shell`. Expect `MarketingResourcesMenu.tsx` source to contain no `href="/why-securenow"`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add the route to the marketing header, footer, welcome page, or resources menu.
- Do not edit `CONTROLLED_PILOT_OFFER.md`, `PRIVATE_PRICE_SHEET.md`, or the owner checklist.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

A SecureNow host can open `/why-securenow` without the public marketing header, and `/pricing` on that host still redirects to `/`.
