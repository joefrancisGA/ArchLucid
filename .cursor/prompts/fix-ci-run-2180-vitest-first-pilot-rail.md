# Fix: CI run #2180 — Vitest `FirstPilotOperatingRail` buyer-mode copy mismatch

**Run:** 27488816955 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Job:** `Operator UI: unit (Vitest)` (databaseId `81250063860`)  
**Test file:** `archlucid-ui/src/components/FirstPilotOperatingRail.test.tsx`

## Symptom

```
FAIL src/components/FirstPilotOperatingRail.test.tsx >
  FirstPilotOperatingRail > shows buyer-safe copy and hides github troubleshoot links in buyer-polished shell

TestingLibraryElementError: Unable to find an element with the text: /Complete the guided assessment/i.

Test Files  1 failed | 620 passed (621)
      Tests  1 failed | 2346 passed (2347)
```

Failing line (`FirstPilotOperatingRail.test.tsx:74`):

```typescript
expect(screen.getByText(/Complete the guided assessment/i)).toBeInTheDocument();
```

## Root cause

The test sets `buyerPolishedMock.value = true` and expects the "execute-review" step title to be
`"Complete the guided assessment"` — defined in `BUYER_STEP_TEXT_OVERRIDES["execute-review"]`
inside `archlucid-ui/src/lib/first-pilot-operating-rail-copy.ts`.

Commit `5d35bf238` ("Simplify V1 operator sidebar by hiding pin and layout customization") changed
either how `FirstPilotOperatingRail` renders the step titles in buyer mode, or the buyer-mode step
overrides themselves, so that "Complete the guided assessment" is no longer present in the rendered
output when `buyerPolishedShell = true`.

## Investigation steps

1. Read `archlucid-ui/src/components/FirstPilotOperatingRail.tsx` and confirm `displaySteps` (from
   `resolveFirstPilotOperatingRailStepsForDisplay(buyerPolishedShell)`) is still being mapped and each
   `step.title` is rendered inside the section.

2. Read `archlucid-ui/src/lib/first-pilot-operating-rail-copy.ts` and confirm
   `BUYER_STEP_TEXT_OVERRIDES["execute-review"].title` equals `"Complete the guided assessment"` in
   the committed version.

3. Check `archlucid-ui/src/lib/buyer-polish-copy.ts` (locally modified) — if copy was moved or
   renamed, trace where the "execute-review" buyer title now lives.

## Fix strategy

**Option A — the component changed:** If commit `5d35bf238` changed the component to hide the
execute-review step title in buyer mode (e.g., a new conditional, layout refactor, or step was
removed), restore the rendering of the title so the text is present in the DOM in buyer mode, **or**
update the test assertion to match the new canonical title string.

**Option B — the copy constant changed:** If `BUYER_STEP_TEXT_OVERRIDES["execute-review"].title`
was changed to a different phrase in the committed version (e.g., "Complete the assessment workflow"),
update the test at `FirstPilotOperatingRail.test.tsx:74` to match the new phrase.

Prefer Option A unless the copy change was intentional. Do **not** delete the assertion — the buyer-
mode copy check is a product contract.

## Acceptance criteria

1. `FirstPilotOperatingRail > shows buyer-safe copy and hides github troubleshoot links in buyer-polished shell`
   passes in Vitest.
2. All 621 test files continue to pass (no new failures).
3. If the fix changes copy: the new text is reflected in the `first-pilot-operating-rail-copy.ts`
   buyer overrides and the test matches exactly.
4. No product behavior changes — test alignment only (unless Option A restores an unintentional omission).

## Verification

```bash
cd archlucid-ui
npx vitest run src/components/FirstPilotOperatingRail.test.tsx
```
