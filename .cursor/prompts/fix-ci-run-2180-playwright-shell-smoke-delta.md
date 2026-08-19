# Fix: CI run #2180 — Playwright mock 2 failures (shell headings + before-after-delta-panel)

**Run:** 27488816955 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Job:** `Operator UI: Playwright mock functional (mock API)` (databaseId `81250063876`)

## Symptom

Two Playwright tests fail after commit `5d35bf238` ("Simplify V1 operator sidebar by hiding pin and
layout customization"):

### Failure 1 — `smoke.spec.ts` shell headings

```
1) [chromium] > e2e/smoke.spec.ts:12:7 > operator shell smoke > home renders shell headings
   Error: expect(locator).toBeVisible() failed
   Timeout: 5000ms / element(s) not found
```

Test at `archlucid-ui/e2e/smoke.spec.ts:16`:

```typescript
await expect(page.locator("#sample-first-review-heading")).toBeVisible();
await expect(page.locator("#runs-dashboard-heading")).toBeVisible();
```

Both assertions use `id` locators (`#sample-first-review-heading`, `#runs-dashboard-heading`) that no
longer resolve after the sidebar/home simplification.

### Failure 2 — `trial-funnel.spec.ts` before-after delta panel

```
2) [chromium] > e2e/trial-funnel.spec.ts:135:7 > trial funnel - mocked end-to-end >
   signup form forwards the optional baseline + dashboard renders the before-vs-measured delta
   Error: expect(locator).toBeVisible() failed
   Timeout: 15000ms / element(s) not found
   > 182 | await expect(page.getByTestId("before-after-delta-panel")).toBeVisible({ timeout: 15_000 });
```

The `data-testid="before-after-delta-panel"` element is no longer rendered on the operator home page.

## Root cause

Commit `5d35bf238` changed the operator home layout. The simplification either:
- Removed or renamed the `id="sample-first-review-heading"` and `id="runs-dashboard-heading"` elements.
- Removed or restructured the `PilotCommandCenterCard` / before-after delta panel section so
  `data-testid="before-after-delta-panel"` is no longer in the DOM.

## Investigation steps

### Failure 1

1. Read `archlucid-ui/src/app/(operator)/page.tsx` (operator home page) and search for
   `sample-first-review-heading` and `runs-dashboard-heading`.
2. If the elements exist with different ids or are now inside a different component, update the
   locators in `e2e/smoke.spec.ts` to match the current DOM.
3. If these sections were removed entirely as part of the simplification, update the smoke test to
   assert on whichever headings are present on the new home page.

### Failure 2

1. Read `archlucid-ui/src/components/usability/PilotCommandCenterCard.tsx` (locally modified) and
   search for `before-after-delta-panel`.
2. If the panel was moved inside a disclosure/accordion, ensure the test opens it before asserting
   visibility, **or** if the panel was removed, update the assertion to check whatever ROI/delta UI
   now appears in its place.

## Fix strategy

Update the Playwright test locators and/or assertions to match the current committed DOM structure.
Do **not** remove the ROI delta panel assertion from the trial-funnel spec — this is a product
contract that the baseline vs. measured delta renders. If the panel now lives behind a disclosure,
expand it first.

## Acceptance criteria

1. Both failing Playwright tests pass in `npm run test:e2e:mock:operator-shell`.
2. The smoke test still verifies that the operator home page renders recognizable shell headings.
3. The trial-funnel test still verifies the before-vs-measured delta is visible after the signup
   flow with a baseline.
4. No other mock-E2E tests regress.

## Verification

```bash
cd archlucid-ui
MOCK_E2E_SKIP_NEXT_BUILD=1 MOCK_E2E_OPERATOR_PORT=3002 npm run test:e2e:mock:operator-shell \
  -- --grep "home renders shell headings|before-vs-measured delta"
```

## Related

- `archlucid-ui/src/components/usability/PilotCommandCenterCard.tsx` (locally modified)
- `archlucid-ui/e2e/smoke.spec.ts`
- `archlucid-ui/e2e/trial-funnel.spec.ts`
