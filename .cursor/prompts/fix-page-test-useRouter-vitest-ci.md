# Fix: Vitest page.test.tsx — Next.js E238 (useRouter not mounted)

## Symptom

```
FAIL src/app/(operator)/page.test.tsx > HomePage — buyer-polished shell
  > omits co-architect strip, maturity explore cards, and pilot metrics rail
Error: invariant expected app router to be mounted  { __NEXT_ERROR_CODE: 'E238' }
```

1 of 4 tests fails. The 3 non-buyer-polished tests pass.

## Root cause

`vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true")` makes `isBuyerPolishedOperatorShellEnv()`
return true. The buyer-polished render path includes:

```
HomePage → BuyerPolishedHomePageBody → BuyerPolishedHomeHeroSection
  → BuyerCtoDemoReadinessPanel → CtoDemoResetButton  ← useRouter() fires here
```

`CtoDemoResetButton` calls `useRouter()` at render time. Vitest/jsdom has no App Router
provider, so Next.js throws E238.

## Fix

**File:** `archlucid-ui/src/app/(operator)/page.test.tsx` only.

Add before `import HomePage from "./page"`, grouped with other `vi.mock("@/components/...")`:

```typescript
vi.mock("@/components/cto-demo/CtoDemoResetButton", () => ({
  CtoDemoResetButton: () => (
    <button type="button" data-testid="cto-demo-reset-button-mock">Reset demo</button>
  ),
}));
```

## Acceptance criteria

1. Only `page.test.tsx` changes.
2. All 4 tests pass — no E238.
3. Mock export name `CtoDemoResetButton` matches the source export exactly.

## Verification (read-only)

- `CtoDemoResetButton.tsx` line ~3: `useRouter` is the first hook.
- `BuyerCtoDemoReadinessPanel.tsx` line ~7: imports `CtoDemoResetButton`.
- `page.test.tsx`: no existing mock for `CtoDemoResetButton` (confirm before adding).
