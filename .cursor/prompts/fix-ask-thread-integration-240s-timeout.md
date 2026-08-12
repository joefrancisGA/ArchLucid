# Fix: AskThreadIntegrationTests — all 5 tests timeout at 240 s (4-minute deadline exhaustion)

> **Context:** This is the next step in the #2164 → #2165 → #2168 series of CI hangs on
> `AlertLifecycleWebAppFactory`-backed integration tests. Do **not** re-diagnose from scratch —
> read the evidence and prior-fix summary below.

## Symptom

All 5 `AskThreadIntegrationTests` fail with `TimeoutException` at exactly 240 s (the old
4-minute per-test deadline), each stacked 4 minutes apart in the shard output:

```
Failed AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread [4 m]
  System.TimeoutException: Integration test '…' exceeded 240s.

Failed AskThreadIntegrationTests.Ask_without_runId_or_threadId_returns_bad_request [4 m]
  System.TimeoutException: Integration test '…' exceeded 240s.

Failed AskThreadIntegrationTests.Ask_stream_with_seeded_run_emits_token_and_done_events [4 m]
  System.TimeoutException: Integration test '…' exceeded 240s.

Failed AskThreadIntegrationTests.Ask_without_question_returns_bad_request [4 m]
  System.TimeoutException: Integration test '…' exceeded 240s.

Failed AskThreadIntegrationTests.Ask_follow_up_continues_same_thread [4 m]
  System.TimeoutException: Integration test '…' exceeded 240s.
```

Every test consumes **exactly** the available budget — zero tests complete normally.

## Root cause (do not re-diagnose)

### Immediate cause — test deadline too tight for aggregate CI time

`IntegrationTestDeadline.DefaultTestTimeout` was 4 minutes (240 s). The per-test operation
budget under slow CI:

| Operation | Bound | Max time |
|-----------|-------|----------|
| `EnsureServicesStartedAsync` (host start) | `IntegrationTestHostStartup.DefaultStartupTimeout` (180 s) | 180 s |
| `EnsureCompletedAsync(CreateClient, …)` (client wrap) | `DefaultClientCreationTimeout` (30 s) | 30 s |
| HTTP request (bounded by `requestTimeout`) | `DefaultRequestTimeout` (90 s) | 90 s |
| `DisposeAsync` (bounded dispose) | `BoundedDisposeTimeout` (2 min) | 120 s |

Worst-case aggregate under load: **180 + 30 + 90 + 120 = 420 s**, far exceeding 240 s. Even
a healthy-but-slow startup (150 s) + normal dispose (30 s) + 90 s HTTP stall = 270 s > 240 s.
The deadline fires and the body task is still in `DisposeAsync`.

### Underlying cause — still present per #2168

The 4-minute deadline exhaustion converts what used to be a 75-minute blame-hang into a fast
test failure, which is correct defense-in-depth. **But the underlying hang that makes
operations approach their bounds is not yet fixed.** Per
`.cursor/prompts/fix-ci-run-2168-integration-shards-blame-hang.md`, the hang candidate paths are:

- **(a)** `factory.CreateClient()` / re-entrant `WebApplicationFactory.EnsureServer()` is not
  bounded by either the start bound or the dispose bound (post-start, unbounded window).
- **(d)** The abandoned `Task.Run(() => Services)` from `EnsureCompletedAsync` races
  `CreateClient()` — `WebApplicationFactory` is not thread-safe for concurrent first-access.
- **(b)** An InMemory-store lock/`SemaphoreSlim` that ignores its `CancellationToken` and
  deadlocks under parallel-shard load.

## Current state of the code

Before touching anything, verify:

```powershell
# These should already be present
Select-String -Path 'ArchLucid.Api.Tests/IntegrationTestDeadline.cs' -Pattern 'FromMinutes'
Select-String -Path 'ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs' -Pattern 'EnsureServicesStartedAsync'
```

| File | Expected current value |
|------|------------------------|
| `IntegrationTestDeadline.cs` — `DefaultTestTimeout` | `TimeSpan.FromMinutes(6)` ← if still `4`, this is the immediate fix |
| `AlertLifecycleWebAppFactory.cs` — `EnsureServicesStartedAsync` | present (bounded 180 s host start) |
| `AlertLifecycleWebAppFactory.cs` — `DisposeAsync` | bounded at 2 min (`BoundedDisposeTimeout`) |
| `AlertLifecycleWebAppFactory.cs` — `CreateBoundedClientAsync` | calls `EnsureServicesStartedAsync` then `EnsureCompletedAsync(CreateClient, 30 s)` |

## Step 1 — immediate fix: raise the per-test deadline

If `DefaultTestTimeout` is still `TimeSpan.FromMinutes(4)`, change it to `TimeSpan.FromMinutes(6)`.
Worst-case aggregate (420 s) stays below the 6-minute (360 s) ceiling only if disposal is fast.
If the aggregate can hit 420 s, raise to **`TimeSpan.FromMinutes(8)`** (480 s); the shards each have
a 240-minute shard timeout and the 75-minute blame-hang guard stays unchanged.

**Rationale:** 6 minutes gives 30 s headroom above the 330 s realistic worst-case
(150 s slow-CI startup + 30 s client + 30 s HTTP + 120 s dispose). 8 minutes is the fully-
conservative ceiling.

**This is a one-line change — do it first regardless of the deeper fixes below.**

## Step 2 — close the `CreateClient` concurrency window (root cause a/d)

`CreateBoundedClientAsync` calls `EnsureCompletedAsync(CreateClient, 30 s)` **after** the
`EnsureServicesStartedAsync` Task completes. If `EnsureServicesStartedAsync` timed out (threw
at 180 s), the `Task.Run(() => Services)` is still running on a pool thread. When the test body
unwinds from the exception and a sibling test then calls `CreateClient()` on its own factory,
two pool threads may be inside `WebApplicationFactory.EnsureServer()` concurrently.

Fix options (pick one; prefer aggressive reuse):

**Option A — gate `CreateClient` inside `EnsureServicesStartedAsync` (recommended):**
Move the `CreateClient` call into `StartServicesCoreAsync` so both `Services` access and the
first `CreateClient` happen on the same `Task.Run` thread, eliminating the second entry into
`EnsureServer`:

```csharp
private async Task<IServiceProvider> StartServicesCoreAsync()
{
    // Both calls happen on the same worker thread — no concurrent EnsureServer.
    IServiceProvider services =
        await IntegrationTestHostStartup.EnsureStartedAsync(() => Services).ConfigureAwait(false);

    // Prime the TestServer client cache on the same thread while still inside the 180 s bound.
    _ = CreateClient();

    return services;
}
```

`CreateBoundedClientAsync` then becomes:

```csharp
internal async Task<HttpClient> CreateBoundedClientAsync()
{
    await EnsureServicesStartedAsync().ConfigureAwait(false);

    // CreateClient is now a no-op re-entrant EnsureServer call (server already built).
    return CreateClient();
}
```

**Option B — bound `CreateClient` independently but cancel the orphaned Task.Run:**
Replace the `Task.WhenAny` abandonment pattern in `IntegrationTestHostStartup.EnsureCompletedAsync`
with `operationTask.WaitAsync(effectiveTimeout, CancellationToken.None)`. This does NOT kill
the orphaned thread (threads cannot be aborted), but makes the exception surface immediately and
removes the race between the timed-out thread and a subsequent `CreateClient()` call on the
same factory instance (the timed-out task eventually faults `_ensureServicesTask` but the timing
window is narrower).

## Step 3 — confirm InMemory stores are instance-scoped, not static

If the dump from #2168 (artifact `dotnet_5104_*_hangdump.dmp`, shard-2) was downloaded, inspect
whether the parked frame is in an InMemory store lock.  If dumps are unavailable, audit the
registered InMemory services for static `Dictionary`/`ConcurrentDictionary`/`SemaphoreSlim`
fields that are shared across factory instances:

- `ArchLucid.Host.Composition/Configuration/InMemoryStorageProviderRegistrar.cs` — check all
  `AddSingleton` registrations for static backing fields.
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` —
  retrieval index store and vector store registrations.

Any store with a static lock must be rewritten so the lock (or the entire backing field) is
instance-scoped (i.e., captured per DI container lifetime, not shared across test processes).

## Step 4 — verify the `OperationCanceledException` swallow in `AskService` does not mask stalls

In `AskService.PrepareAskContextAsync`, the retrieval search catch is:

```csharp
catch (Exception ex)
{
    logger.LogWarning(ex, "Retrieval search failed…");
    retrievalDegraded = true;
    retrievalContext = AskRetrievalSqlFallback.BuildFromRunDetail(detail, question);
}
```

`OperationCanceledException` is a subtype of `Exception` and is caught here. When `ct` is
canceled (request timeout fires), the code falls back instead of propagating cancellation —
subsequent awaits with `ct` will then immediately throw `OperationCanceledException`, but any
synchronous work inside the catch (e.g., `BuildFromRunDetail`) runs to completion. This is
generally safe but can mask a stall: if `retrievalQuery.SearchAsync` is hanging AND ignoring `ct`,
cancellation never fires on the `ct` side, and the catch never runs until the retrieval eventually
returns.

Change the catch to rethrow on `OperationCanceledException`:

```csharp
catch (OperationCanceledException)
{
    throw;
}
catch (Exception ex)
{
    logger.LogWarning(ex, "Retrieval search failed…");
    retrievalDegraded = true;
    retrievalContext = AskRetrievalSqlFallback.BuildFromRunDetail(detail, question);
}
```

## Files

| File | Change |
|------|--------|
| `ArchLucid.Api.Tests/IntegrationTestDeadline.cs` | Raise `DefaultTestTimeout` to `TimeSpan.FromMinutes(6)` or `8` |
| `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs` | Option A: move `CreateClient()` into `StartServicesCoreAsync` |
| `ArchLucid.Host.Core.Services.Ask/AskService.cs` | Add `catch (OperationCanceledException) { throw; }` before the broad retrieval catch |
| InMemory store registrar(s) | Make all backing fields instance-scoped if any are static |

## Acceptance criteria

1. All 5 `AskThreadIntegrationTests` complete (pass or fail with an assertion / operation
   `TimeoutException` from a bounded seam) — never fail with the whole-test deadline
   `TimeoutException` under normal CI load.
2. The per-test deadline message never appears in the CI TRX output for this class on a
   non-overloaded shard.
3. `factory.CreateClient()` is called only after `EnsureServicesStartedAsync` has fully
   settled the host on one thread (no concurrent `EnsureServer` entry from an abandoned
   `Task.Run`).
4. `AskService.PrepareAskContextAsync` re-throws `OperationCanceledException` from the
   retrieval catch block.
5. `ArchLucid.Backend.slnf` compile check passes:
   `.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"`.
6. The 75-minute `--blame-hang-timeout`, the 180 s host-start bound, and the 2-minute
   `DisposeAsync` bound are **unchanged**.

## Verification (InMemory — no SQL Server needed)

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'

dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~AskThreadIntegrationTests' `
    --blame-hang --blame-hang-timeout 8min --blame-hang-dump-type mini
```

Confirm every test completes (pass or assertion failure) in < 2 minutes per test. Grep the class
to verify no direct `factory.Services` or `factory.CreateClient()` call precedes a bounded start.

## Reference

- `.cursor/prompts/fix-ci-run-2168-integration-shards-blame-hang.md` — root-cause taxonomy (a/b/c/d)
  and dump-analysis instructions for shard-2 `dotnet_5104_*_hangdump.dmp`.
- `.cursor/prompts/fix-ci-run-2164-api-tests-shard3-ask-host-start-hang.md` — original bounded-start
  migration (host-start seam).
- `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs` — `EnsureStartedAsync` / `EnsureCompletedAsync`.
- `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs` — `EnsureServicesStartedAsync`, `CreateBoundedClientAsync`, `DisposeAsync`.
- `ArchLucid.Host.Core.Services.Ask/AskService.cs` — `PrepareAskContextAsync` retrieval catch.
