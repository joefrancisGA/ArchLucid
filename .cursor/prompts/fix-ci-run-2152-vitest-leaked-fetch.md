# Fix: CI #2152 — Vitest job fails on a leaked `fetch failed` (all test files pass)

**Run:** 27395468550 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard` · **Commit:** `e5910318a`
**Job:** `Operator UI: unit (Vitest)`

## Symptom

Every test file passes, but the job exits non-zero on an **unhandled** rejection raised after the
run:

```
 Test Files  608 passed (608)
##[error]TypeError: fetch failed
 ❯ apiGetJsonWithTrace src/lib/api/http.ts:222:20
 ❯ apiGet src/lib/api/http.ts:235:20
```

## Root cause (hypothesis — confirm before fixing)

`608 passed (608)` with a process-level `fetch failed` means a test started a **real** network
`fetch` through `apiGet` / `apiGetJsonWithTrace` that was **not awaited and not mocked**, so the
rejection surfaced during teardown (after the test that started it had already completed). Vitest
treats unhandled rejections as a run failure.

The most likely source is a component that **polls** on an interval/timer and fires a follow-up
`apiGet` after the test unmounts it. Strong candidates (they exercise polling / run tracking):

- `src/app/(operator)/reviews/new/NewRunWizardClient.test.tsx`
  ("walks preset review, creates a run, lands on pipeline tracking with **polling**")
- `src/components/operator-home/RunsDashboardPanel.test.tsx`
- any test that renders a component using `useRunPolling` / `setInterval` + `apiGet`

This failure did **not** occur in CI #2151 and commit `378e76ee8` added no fetch-calling tests, so
it is most likely a **pre-existing flaky** leaked timer rather than a new regression.

## Investigation steps

1. Reproduce locally with the same conditions. Run the full Vitest suite (not a single file) and
   look for the unhandled rejection:
   `cd archlucid-ui; npm run test:unit` (use the repo's Vitest script).
2. Re-run a few times — if it only fails intermittently, it is a leaked async timer.
3. Identify the leaking component by searching for polling that calls `apiGet`:
   - Look for `setInterval` / `setTimeout` / `useEffect` polling loops that call `apiGet`,
     `apiGetJsonWithTrace`, or a run-status poller.
   - In the suspected test, check that the component is **unmounted** (`cleanup()` / RTL auto
     cleanup) and that any in-flight poll is canceled.

## Fix options (apply the smallest that resolves it)

- **Preferred:** ensure the polling component cancels its timer and aborts the in-flight request on
  unmount (e.g. `clearInterval` in the `useEffect` cleanup and pass an `AbortSignal` to `apiGet`).
  This fixes the product code, not just the test.
- If the component is already correct and the test simply doesn't wait for the poll to settle, make
  the test deterministic: use fake timers (`vi.useFakeTimers()`), advance/flush them, and
  `vi.useRealTimers()` in cleanup; ensure `global.fetch` is mocked for the whole test so no real
  network call is possible.
- As a safety net, confirm the Vitest setup file mocks `fetch` globally (so a leaked call rejects
  against a mock, not the network). If it does not, add a default `fetch` mock in
  `vitest.setup.ts` (or the configured setup file) and assert no unexpected calls.

Do **not** silence the failure by disabling unhandled-rejection reporting in Vitest config.

## Verify

- Run the full suite 3× locally; the `fetch failed` post-run error must not appear and the job must
  exit 0.
- If the root cause was product code (uncancelled poll), add/extend a unit test asserting the
  interval is cleared on unmount.
