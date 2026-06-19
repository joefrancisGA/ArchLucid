# Fix: CI run 27305192875 — all failing jobs (branch `ci/fix-idempotency-concurrency-hang-guard`)

## Overview

CI run **27305192875** (run #2133) on branch `ci/fix-idempotency-concurrency-hang-guard` has three
failing jobs. Fix them in the order listed — Failure 1 is a one-line change; Failures 2 and 3 share
the same root cause and are fixed together.

---

## Failure 1 — `Operator UI: unit (Vitest)` · 1 test in `buyer-cto-demo-orchestration.test.ts`

### Symptom

```
FAIL src/lib/buyer-cto-demo-orchestration.test.ts > buyer-cto-demo-orchestration > returns audience captions for each step
AssertionError: expected 'Executive outcomes, residual risk pos.' to contain 'executive outcomes'
```

1 of 2262 tests fails. 593 test files pass.

### Root cause

`BUYER_CTO_DEMO_AUDIENCE_CAPTION_LINES[0]` in
`archlucid-ui/src/lib/buyer-cto-demo-orchestration.ts` (line 21) is:

```
"Executive outcomes, residual risk posture, and sponsor-ready actions."
```

The assertion in the test (line 20) uses a **lowercase** substring:

```typescript
expect(buyerCtoDemoAudienceCaption(0)).toContain("executive outcomes");
```

`String.prototype.toContain` (via Vitest's `expect`) is **case-sensitive**. `"Executive outcomes…"`
does not contain `"executive outcomes"`.

The step-4 assertion on line 21 (`"audit trail"`) matches correctly — `"Append-only audit trail…"`
is already lowercase.

### Fix

**File:** `archlucid-ui/src/lib/buyer-cto-demo-orchestration.test.ts` — line 20 only.

```typescript
// BEFORE
expect(buyerCtoDemoAudienceCaption(0)).toContain("executive outcomes");

// AFTER — match actual casing in BUYER_CTO_DEMO_AUDIENCE_CAPTION_LINES[0]
expect(buyerCtoDemoAudienceCaption(0)).toContain("Executive outcomes");
```

Do **not** change the source file — the capitalized string is intentional product copy.

### Acceptance criteria

1. Only `buyer-cto-demo-orchestration.test.ts` line 20 changes.
2. The test `returns audience captions for each step` passes.
3. No other tests break.
4. `npm run typecheck` (or equivalent) clean in `archlucid-ui/`.

---

## Failures 2 & 3 — `.NET integration shards 3/6 and 4/6 (SQL)` · 75-minute blame hang

### Symptom

Both shards (ShardIndex 2 and ShardIndex 3) are killed by the blame hang collector after exactly
75 minutes of inactivity:

```
Data collector 'Blame' message: The specified inactivity time of 75 minutes has elapsed.
Collecting hang dumps from testhost and its child processes.
The active Test Run was aborted. Reason: Test host process crashed
```

| Shard | Tests completed before hang | Duration before hang |
|-------|----------------------------|----------------------|
| 3/6 (ShardIndex 2) | Passed: 25, Failed: 0, Total: 25 | ~11 s |
| 4/6 (ShardIndex 3) | Passed: 56, Failed: 0, Total: 56 | ~24 s |

Both shards report **"The test running when the crash occurred:"** as **blank** — no test was
actively running when the blame dump fired. The test host ran all its quick-completing tests in
under 30 seconds and then became permanently idle for 75 minutes before being killed.

### Root cause (two possible modes — investigate in order)

**Mode A — hang in fixture setup before a long-running test starts**

After the fast tests finish, the test host loads the next xUnit collection fixture (e.g.
`GreenfieldSqlIntegrationFixture` or a WebApplicationFactory derivative). That fixture attempts
a warmup HTTP call (e.g. `WarmArchitectureRequestHostOrSkipOnShardOverloadAsync`) that blocks
indefinitely — making the host appear idle from the blame collector's perspective because no
test *method* is executing.

The Ask / Retrieval integration test classes identified in the prior
`fix-ci-run-2132-all-failures.md` (Failure 3) are the primary suspects for this mode:
- `RetrievalQuerySmokeIntegrationTests`
- `AskThreadIntegrationTests`
- `ArchitectureFindingAskControllerIntegrationTests`

These classes make outbound HTTP calls to AI / retrieval back-ends. If CI lacks the
`AZURE_OPENAI_*` or `AI_SEARCH_*` credentials, the `HttpClient` hangs on a TCP connect
or 401 response without a bounded per-test timeout.

**Mode B — test host shutdown deadlock after all tests complete**

After the last assigned test completes, the test host's `IAsyncDisposable` teardown for the
collection fixture (or the `WebApplicationFactory`) blocks indefinitely on a background hosted
service, `CancellationToken`, or connection-pool draining operation that was never given a
timeout. The blame collector sees no test activity and kills the process after 75 minutes.

### Investigation steps (read-only first)

1. **Identify the test classes** in ShardIndex 2 and ShardIndex 3. Run:
   ```powershell
   # read the shard script to understand how classes are assigned per index
   cat ./scripts/ci/Invoke-ApiIntegrationTestShard.ps1
   ```
   Then grep the test project for the Category=Integration test classes assigned to those shards.

2. **Check for unbounded HTTP calls** in `RetrievalQuerySmokeIntegrationTests`,
   `AskThreadIntegrationTests`, and `ArchitectureFindingAskControllerIntegrationTests`:
   - Does each test method (or its helper) pass a `CancellationToken` to the HTTP call?
   - Is there a per-test `CancellationTokenSource` with a bounded timeout?
   - Compare against tests that already follow the `using CancellationTokenSource cts = new(…)`
     pattern in `CreateRunIdempotencyConcurrencyIntegrationTests.cs`.

3. **Check for warmup calls without skip guards**:
   - Does each class call `GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync`
     in `InitializeAsync`?
   - If not, would a cold-start warmup block indefinitely in the fixture constructor?
   - Check the `SkipShardOverload()` skip pattern used in `AuditTrailCommitIntegrityIntegrationTests`
     (see `.cursor/prompts/fix-audit-trail-warmup-timeout-ci.md`).

4. **Check fixture teardown** (Mode B):
   - Read the `IAsyncLifetime.DisposeAsync` (or `IDisposable.Dispose`) implementation on the
     collection fixture shared by the hanging shards.
   - Look for any `await`-able operation without a timeout that could block shutdown: connection
     pool draining, background service `StopAsync`, `Channel<T>.Writer.Complete()` without drain.

### Fix

Apply whichever fixes the investigation confirms. Prefer both if both modes are plausible.

#### Fix A — per-test cancellation timeout (Mode A)

For each of the three Ask / Retrieval test classes listed above, add a short per-test
`CancellationTokenSource`. Match the timeout to the test's expected execution budget; 90 seconds
is a conservative ceiling for a single Ask request in CI:

```csharp
// In each test method that issues an outbound HTTP call
using CancellationTokenSource cts = new(TimeSpan.FromSeconds(90));
// pass cts.Token to the HttpClient call or helper method
```

If the test classes share a common base class or helper that threads `CancellationToken` through,
set the timeout at that shared call site instead of duplicating it per-method.

#### Fix B — SkipShardOverload in fixture InitializeAsync (Mode A alternative)

If the hang is in fixture startup (not inside a test method), apply the `SkipShardOverload()`
guard used in `AuditTrailCommitIntegrityIntegrationTests.InitializeAsync`:

```csharp
// At the top of the class fixture's InitializeAsync
await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
    _primer,
    includePostCreateRunWarmup: true);
```

This converts a cold-host timeout into a graceful `Skip`, preventing the 75-minute hang.

#### Fix C — bounded teardown (Mode B)

If fixture teardown is deadlocking, add a `CancellationTokenSource` with a hard deadline to
the `DisposeAsync` method of the offending collection fixture:

```csharp
public async ValueTask DisposeAsync()
{
    using CancellationTokenSource cts = new(TimeSpan.FromSeconds(30));
    await _factory.StopAsync(cts.Token).ConfigureAwait(false);
    // ... other cleanup
}
```

Do **not** raise `--blame-hang-timeout` in CI — 75 minutes is already generous; raising it only
defers the underlying hang.

### Acceptance criteria

1. Each of the three Ask / Retrieval test classes completes (pass or explicitly skip) in under
   5 minutes per test method.
2. No test silently swallows an `OperationCanceledException` — either let it surface as a failure
   or convert to `Assert.True(false, reason)` / `Skip` with a descriptive reason.
3. The blame dump artifact for both shards is no longer produced (or, if still produced, contains
   a named test rather than a blank last-running-test entry — indicating at most one hung test
   rather than a wholesale host hang).
4. `ArchLucid.Backend.slnf` compile check passes.
5. No product/API code changes — test harness and fixture timing only.

---

## Execution order

1. **Failure 1** (Vitest caption casing) — one-line change; fix immediately before touching .NET.
2. **Failures 2 & 3** (.NET shard hang) — investigate Mode A first (read test classes and their
   HTTP call patterns), then apply Fix A and/or Fix B. If investigation reveals Mode B
   (teardown deadlock), apply Fix C instead.

## Verification

After all fixes:

```powershell
# UI typecheck (fast — no SQL)
.\scripts\ci\agent-compile-check.ps1 -Ui

# .NET scope compile
.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"
```

Do **not** run the full integration test suite locally unless the user explicitly requests it.

## Related

- Prior run: `.cursor/prompts/fix-ci-run-2132-all-failures.md` (BuyerCtoDemoTourOverlay mock,
  nav guard regex, Ask/Retrieval hang investigation, DemoSeedServiceTests)
- Resolution timeout fix: `.cursor/prompts/fix-idempotency-concurrency-resolution-timeout-ci.md`
- Warmup skip pattern: `.cursor/prompts/fix-audit-trail-warmup-timeout-ci.md`
- CI workflow: `.github/workflows/ci.yml` (`--blame-hang-timeout 75min` for integration shards)
