# Demo flags and unit tests

## Problem

`NEXT_PUBLIC_DEMO_MODE` and `NEXT_PUBLIC_DEMO_STATIC_OPERATOR` are read at module evaluation time in several UI helpers (for example `isStaticDemoPayloadFallbackEnabled()`). If either flag is set in the shell when you run `npm test`, pages that **hide** raw Operate forms in demo mode (such as **Policy packs** lifecycle JSON) will not render those controls — and tests that assert on **Create pack** / similar buttons will fail.

## Fix (default)

`vitest.setup.ts` clears both variables before each test run so the default path is **non-demo** unless a test file uses `vi.stubEnv` for a specific scenario.

## When you need demo behaviour in a test

Prefer explicit stubbing in the test file:

```ts
vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
// or
vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "true");
```

Restore prior values in `afterEach` if the file also covers non-demo cases.

## Related

- `docs/OPERATOR_DEMO_RUNS_FALLBACK.md` — when static payloads apply at runtime.
