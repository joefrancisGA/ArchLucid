# SN-MKT-09 — Public synthetic SecureNow sample

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

`/securenow-sample` is a public, indexed page that shows one synthetic ranked path: scope and freshness, cited hops, and an advisory cut point. It is labeled a fixture. It reuses the Why SecureNow pitch and the existing ArchLucid conversation mailto. A SecureNow host can open it without the public marketing header. The resources menu does not link it in this session.

## Why

ArchLucid’s `/see-it` page lets a stranger see the proof shape without a tenant. SecureNow’s storyboard is a facilitator script in the repo. A buyer cannot open a sample. This page is that sample. It does not load live tenant data, clone the `/see-it` preview pipeline, or present fixture output as a customer result.

## Read first

- `docs/securenow/FIXTURE_STORYBOARD.md` (beats 1–3 only; do not edit the file)
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts` (reuse the pitch, status line, and mailto; do not change their strings)
- `archlucid-ui/src/app/(marketing)/why-securenow/page.tsx` (metadata pattern only)
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.test.ts`
- `archlucid-ui/src/app/(marketing)/layout.tsx`
- `archlucid-ui/src/app/(marketing)/see-it/page.tsx` (do not edit it; do not import its loader)

## What to build

1. Branch `sn-mkt/09-public-sample` from current `master` after SN-MKT-08 is present.
2. Add `archlucid-ui/src/lib/marketing/securenow-sample-copy.ts` with these constants:
   - Heading: `"SecureNow sample"`.
   - Fixture line: `"Synthetic fixture. Not a customer result."`.
   - Import and re-export `WHY_SECURENOW_STATUS_LINE`, `WHY_SECURENOW_DRAFT_PITCH`, `WHY_SECURENOW_CONVERSATION_MAILTO`, and `WHY_SECURENOW_CONVERSATION_LABEL`. Do not duplicate the mailto string.
   - Three beats, in order, each with a `title` and a `body`:
     1. Title `"Scope and freshness"`. Body `"Fixture tenant, one workspace, one subscription. The latest collection time is visible. A missing capture is a gap, not a clean bill of health."`
     2. Title `"One ranked path"`. Body `"Fixture path fixture-path-01. Cited hops: Reader on the subscription, then Contributor on a storage account. This is a possible access path. It is not an observed exploit."`
     3. Title `"Advisory cut point"`. Body `"Remove the standing Contributor assignment on that storage account. This is an analysis recommendation. SecureNow does not change Azure."`
3. Add `archlucid-ui/src/app/(marketing)/securenow-sample/page.tsx` and `SecureNowSampleView.tsx`.
   - Title `"SecureNow · Sample"`. `description` is `WHY_SECURENOW_DRAFT_PITCH`. `robots: { index: true, follow: true }`.
   - Render the status line, the fixture line, the pitch, the three beats, and one link using the shared mailto and label `"Request a conversation."`
   - `data-testid="securenow-sample-page"`.
4. In `securenow-marketing-route-policy.ts`:
   - Add `SECURENOW_SAMPLE_MARKETING_PATH = "/securenow-sample"`.
   - `isSecureNowSampleMarketingPath` is true only for that exact path. `/securenow-sample/` is true. `/securenow-sample/extra` is false.
   - `shouldRedirectMarketingLayout` stays false for the architecture product line. On the security product line it stays false for `/why-securenow` and `/securenow-sample`, and true for `/pricing`, `/see-it`, and `/why`.
   - Do not add `/securenow-sample` to `SECURENOW_BLOCKED_MARKETING_ROUTE_PREFIXES`. Do not change the `/why` prefix so that it matches `/why-securenow`.
5. In `(marketing)/layout.tsx`, the security-shell branch that returns `children` without `MarketingPublicHeader` applies to both exact paths. Keep `data-testid="why-securenow-security-shell"` for `/why-securenow`. Use `data-testid="securenow-sample-security-shell"` for `/securenow-sample`.
6. Do not add either route to `MarketingResourcesMenu`. That is SN-MKT-10.
7. Do not edit `scripts/ci/check_securenow_marketability.py`.

## Tests

Add `securenow-sample-copy.test.ts`. It expects the fixture line, `fixture-path-01`, the three titles, the shared mailto, no `$`, and none of `Start trial`, `guaranteed`, or `autonomous`.

Add a view test that renders the fixture line, the pitch, and `Request a conversation`.

Extend `securenow-marketing-route-policy.test.ts`:
- `/securenow-sample` is allowed on the security product line.
- `/pricing` and `/see-it` still redirect on that product line.
- `/securenow-sample/extra` is not an allowed sample path.

A layout source assertion expects `securenow-sample-security-shell`. `MarketingResourcesMenu` source still has no `href="/securenow-sample"`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- No live API call, no demo-seed loader, and no screenshot presented as a customer result.
- No new mailbox. Reuse `support@archlucid.net`.
- No price, no signup, no "Start trial", no beta GO, no checked owner checklist box.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

`/securenow-sample` renders three fixture beats and the ArchLucid conversation link, search engines may index it, and a SecureNow host does not redirect it to `/`. `/pricing` on that host still redirects.
