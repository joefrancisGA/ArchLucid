# Fix: Playwright mock CI — CtoDemoExecutiveLandingRedirect breaks home-page tests

## Symptom

Three Playwright mock-CI tests fail with "element(s) not found" or wrong URL:

```
# trial-funnel.spec.ts
Error: expect(page).not.toHaveURL(/\/reviews\//) failed
Test: "signup form forwards the optional baseline + dashboard renders the before-vs-measured delta"

# tests/core-pilot-path.spec.ts
Error: expect(locator).toBeVisible() failed — element(s) not found
Test: "home hint, new request, reviews list, finalized architecture package, manifest roundtrip" (update assertion if the spec title still says legacy "review package")
Selector: getByTestId("core-pilot-buyer-step-hint")

# e2e/demo-readiness.spec.ts
Error: expect(locator).toBeVisible() failed — element(s) not found
Test: "core demo smoke — home, new request, runs, run detail, manifest, finding, showcase"
Selector: getByTestId("runs-dashboard-buyer-proof-summary")
```

The axe-core WCAG test also fails: "page.evaluate: Execution context was destroyed, most
likely because of a navigation" — the page navigates away mid-evaluation.

## Root cause

`CtoDemoExecutiveLandingRedirect` (rendered on the operator home `page.tsx`) calls
`window.location.replace(getStartCtoDemoTourHref())` in a `useEffect` whenever
`isCtoDemoExecutiveLandingEnv()` returns true.

`isCtoDemoExecutiveLandingEnv()` returns `isCtoDemoPresenterSafeModeEnv()` which is
`isBuyerPolishedOperatorShellEnv() && isCtoDemoPackEnv()`.

The Playwright mock config sets `NEXT_PUBLIC_DEMO_MODE=true` to enable buyer-polished
shell testing. Both conditions are satisfied, so the redirect fires on every `/` visit —
navigating the page to the executive summary `/executive/reviews/claims-intake-modernization`
before the test assertions run. No test in the mock suite sets the "tour active"
localStorage flag that would make the redirect intentional.

## Fix

Gate the redirect on the tour being explicitly active. The CTO demo tour active state is
stored in localStorage by `writeBuyerCtoDemoTourActive(true)` when the presenter clicks
"Start CTO demo". Env flags alone (`NEXT_PUBLIC_DEMO_MODE`) should not redirect — they
enable the buyer-polished shell for testing, not an active presenter session.

**File:** `archlucid-ui/src/components/cto-demo/CtoDemoExecutiveLandingRedirect.tsx`

```typescript
// BEFORE
useEffect(() => {
  if (!isCtoDemoExecutiveLandingEnv()) {
    return;
  }
  window.location.replace(getStartCtoDemoTourHref());
}, []);

// AFTER — require the tour to be actively running (localStorage flag)
useEffect(() => {
  if (!isCtoDemoExecutiveLandingEnv()) {
    return;
  }

  if (!readBuyerCtoDemoTourActive()) {
    return;
  }

  window.location.replace(getStartCtoDemoTourHref());
}, []);
```

Add the missing import for `readBuyerCtoDemoTourActive` from `@/lib/buyer-cto-demo-tour`
(already imported by `BuyerPolishedHomeHeroSection` which is on the same page).

## Why this is correct

- `isCtoDemoExecutiveLandingEnv()` gates on packaging env flags (safe for static builds).
- `readBuyerCtoDemoTourActive()` gates on an explicit presenter action (clicking Start).
- During Playwright mock tests, localStorage is empty → no redirect → tests pass.
- During a live CTO demo, the presenter clicked "Start CTO demo" → redirect fires as before.

## Acceptance criteria

1. Only `CtoDemoExecutiveLandingRedirect.tsx` changes (plus the import line).
2. All three Playwright mock tests listed above pass.
3. axe-core WCAG test passes (no mid-navigation context destruction).
4. Existing `CtoDemoExecutiveLandingRedirect` unit/component tests still pass or are updated
   to set the tour-active flag before asserting the redirect.
5. `ArchLucid.UI.slnf` TypeScript build clean.

## Verification (read-only)

1. `isCtoDemoExecutiveLandingEnv()` in `cto-demo-presenter-pack.ts` — confirm it delegates
   to `isCtoDemoPresenterSafeModeEnv()` without any localStorage check.
2. `readBuyerCtoDemoTourActive()` in `buyer-cto-demo-tour.ts` — confirm it reads
   `localStorage` and returns false when not set.
3. `playwright.mock.config.ts` env flags — confirm `NEXT_PUBLIC_DEMO_MODE=true` is set
   (no `ARCHLUCID_BUYER_CTO_DEMO_TOUR_ACTIVE` or equivalent localStorage seeding).
4. Grep for `CtoDemoExecutiveLandingRedirect` tests — update any that assert redirect
   without setting the tour-active flag.
