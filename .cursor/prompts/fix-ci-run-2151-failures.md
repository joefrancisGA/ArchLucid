# Fix: CI run 27386119357 — failing jobs (branch `ci/fix-idempotency-concurrency-hang-guard`)

## Overview

CI run **27386119357** (run #2151) has three failing jobs. One is a deterministic text-mismatch in a
Playwright spec that requires a one-line fix. The other two are test-host hang/crash failures that
appear to be infrastructure-level flakiness; investigate first before touching test code.

Fix them in the order below.

---

## Failure 1 — `Operator UI: Playwright mock functional (mock API)` · text-mismatch in `first-run-wizard.spec.ts`

### Symptom

```
1) [chromium] > e2e/first-run-wizard.spec.ts:4:7 > first-run wizard > new run page renders wizard shell

Error: expect(locator).toBeVisible() failed
Locator: getByText('Start fast with a pasted brief (Quick review), use Guided intake for admission
         and MUST questions, or open the full wizard with templates and imports.')
  - waiting for getByText('Start fast with a pasted brief...')
    at archlucid-ui/e2e/first-run-wizard.spec.ts:12:7

1 failed  (102 passed)
```

### Root cause

The description paragraph on the `/reviews/new` page was reworded as part of the usability batch.
The test still asserts the old copy; the page now renders different text.

**File producing the visible text:**
`archlucid-ui/src/app/(operator)/reviews/new/page.tsx`, line 23:

```tsx
Start fast with Quick review (guided defaults), or open Full guided review for intake questions, templates, and imports.
```

**Test asserting stale copy:**
`archlucid-ui/e2e/first-run-wizard.spec.ts`, line 10:

```ts
"Start fast with a pasted brief (Quick review), use Guided intake for admission and MUST questions, or open the full wizard with templates and imports.",
```

### Fix

Update `archlucid-ui/e2e/first-run-wizard.spec.ts` to assert the text that `page.tsx` actually renders.

Replace lines 8–12:

```typescript
await expect(
  page.getByText(
    "Start fast with a pasted brief (Quick review), use Guided intake for admission and MUST questions, or open the full wizard with templates and imports.",
  ),
).toBeVisible();
```

With:

```typescript
await expect(
  page.getByText(
    "Start fast with Quick review (guided defaults), or open Full guided review for intake questions, templates, and imports.",
  ),
).toBeVisible();
```

The heading assertion on line 7 (`/new architecture review/i`) is unaffected and should stay.

---

## Failure 2 — `.NET: full regression — core libraries shard 1/4 (SQL, non-Api Category!=Slow)` · test-host hang

### Symptom

```
The active test run was aborted. Reason: Test host process crashed
Data collector 'Blame' message: The specified inactivity time of 30 minutes has elapsed.
  Collecting hang dumps from testhost and its child processes.

The active Test Run was aborted because the host process exited unexpectedly.
Process completed with exit code 1.
```

Timeline in the log:
- `01:11:52Z` — `ArchLucid.ContextIngestion.Tests.dll` passed (82 tests, 253 ms)
- `01:44:33Z` — test host crash logged (30-minute inactivity timer fired)
- `01:44:35Z` — `ArchLucid.Host.Composition.Tests.dll` passed (156 tests, 976 ms) — resumed after the crash

This means a test DLL that runs **between** `ContextIngestion.Tests` and `Host.Composition.Tests`
deadlocked and held the test host for ~33 minutes. The most likely candidates given the shard
filter `Category!=Slow, SQL` are:

- `ArchLucid.Persistence.Tests` (SQL — most likely; uses real SQL server against `dbo.DraftRequests`
  and related tables that were recently touched in `DapperDraftRequestRepository.cs`)
- `ArchLucid.Application.Tests`

### Investigation steps (do these before changing test code)

1. Identify the exact hanging test by checking the blame hang-dump artifact uploaded in this job:
   `dotnet_7067_20260612T014430_hangdump.dmp` (artifact uploaded from
   `/home/runner/work/_temp/coverage-full-core-libs-shard-0/…`).

2. If a hang dump is not reachable, look at which test DLL was last printed to stdout before the
   30-minute silence: the absence of a "Passed!" line for `ArchLucid.Persistence.Tests` between
   01:11 and 01:44 strongly implies Persistence tests were the culprit.

3. Check whether the `HardDeleteTerminalDraftsBatchAsync` bulk-delete path in
   `ArchLucid.Persistence/Data/Repositories/DapperDraftRequestRepository.cs` — which was recently
   annotated with `[TenantScopeExempt]` — could be involved in a test that opens a long-running
   transaction or holds a SQL lock without a timeout.

4. If the test is confirmed as `ArchLucid.Persistence.Tests`, look for any async tests that use
   `SqlTransaction` or `BeginTransaction` without a `CancellationToken` or command timeout; add a
   30-second `CommandTimeout` guard to the Dapper command or add `[Timeout]` to the test.

5. If no code issue is found and the hang did not recur in shards 2–4 (which passed), treat this as
   infrastructure flakiness and simply re-trigger CI. **Do not widen timeouts across the board.**

---

## Failure 3 — `.NET: full regression — Api.Tests integration shard 3/6 (SQL)` · status unknown

### Symptom

Job `80937757660` was still in-progress when its log blob expired (BlobNotFound when fetching logs).
The step `Test — ArchLucid.Api.Tests (Integration shard, exclude Category=Slow)` shows no
conclusion in the job JSON — the shard was either still running when the run was queried, or it
was terminated mid-run.

### Action

1. After fixing Failure 1 (Playwright text mismatch) and committing, trigger a new CI run.
2. Watch whether Api.Tests shard 3 still fails in the new run.
3. If it fails again, fetch the new run's logs for that job and add a Failure 4 section here with
   the specific test names and error messages.

---

## Commit and push plan

1. Fix `archlucid-ui/e2e/first-run-wizard.spec.ts` (Failure 1 — the only certain code change).
2. Investigate Failure 2 (hang). If a code fix is found, include it in the same commit; otherwise
   proceed without it.
3. Commit message: `fix(ci): update first-run-wizard e2e to match current /reviews/new copy`
4. Push to `ci/fix-idempotency-concurrency-hang-guard` and trigger a new CI run.
5. Monitor the new run for Failure 3 (Api.Tests shard 3) and any recurrence of Failure 2.
