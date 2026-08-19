# Fix: CI #2155 — Api.Tests integration shard 2/6 hangs on `RetrievalQuerySmokeIntegrationTests`

**Run:** 27416378916 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard` · **Commit:** `9960e9d31`
**Job:** `.NET: full regression — Api.Tests integration shard 2/6 (SQL)` (databaseId `81037013855`)

## Symptom

The shard runs, then the test host is killed by the 75-minute blame inactivity guard:

```
The active test run was aborted. Reason: Test host process crashed
Data collector 'Blame' message: The specified inactivity time of 75 minutes has elapsed.
  Collecting hang dumps from testhost and its child processes.
Test Run Aborted.
Process completed with exit code 1.
hangdump: dotnet_5156_20260612T144927_hangdump.dmp
```

Shard 2/6 was assigned 30 integration classes (chunk 1/1), started executing at `13:30:19Z`, and
went idle until the blame timer fired at `14:49`.

## Root cause (precise — from the blame Sequence XML)

The blame `Sequence_*.xml` (artifact `dotnet-blame-api-integration-shard-1`) lists 24 tests in
execution order. The first 23 are `Completed="True"`; the **last** one is `Completed="False"` — it
started but never finished, which is the hung test:

```
ArchLucid.Api.Tests.RetrievalQuerySmokeIntegrationTests.Index_documents_then_query_returns_matching_hits  (Completed="False")
```

This matches the log's `Passed: 23` line — 23 finished, the 24th hung.

### Why it can hang for 75 minutes

File: `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs`, test at line 30.

```csharp
await using AlertLifecycleWebAppFactory factory = new();
using CancellationTokenSource requestTimeout =
    IntegrationTestHttpCancellation.CreateRequestTimeoutSource();   // 90s

await SeedRetrievalDocumentsAsync(factory.Services, requestTimeout.Token);   // <-- first access to factory.Services

HttpClient client = factory.CreateClient();
HttpResponseMessage response = await client.GetAsync(uri, requestTimeout.Token);   // 90s bounded
```

Every **HTTP** path here is bounded to 90s (`IntegrationTestHttpCancellation` + `HttpClient.Timeout`
in `BaseIntegrationTestFixture.ConfigureClient`). But the **first access to `factory.Services`**
(inside `SeedRetrievalDocumentsAsync`) is what forces `WebApplicationFactory<Program>` to **build and
start the host**. That host-startup path is **not covered by any timeout or cancellation token** —
the 90s `requestTimeout` token is only passed to `IndexDocumentsAsync`, not to host startup. If any
`IHostedService.StartAsync` (or other startup warmup) blocks under CI load, `factory.Services` never
returns and the test hangs until the 75-minute blame guard kills the whole shard.

This is the same class of failure the branch is chasing (cf.
`fix-audit-trail-warmup-timeout-ci.md`, `fix-ci-run-2138-ask-host-lifecycle-hang.md`): an **unbounded
host startup/warmup** consuming the entire blame budget. The smoke test normally passes, so this is an
intermittent startup hang, not a logic defect in the assertions.

`AlertLifecycleWebAppFactory` uses InMemory storage (no SQL), and `BaseIntegrationTestFixture` already
disables startup corpus indexing (`Retrieval:*:IndexOnStartup=false`), demo seeding, purge loops, and
OTLP — so the blocked startup task is something still running after those are off.

## Step 1 — Confirm the blocked thread (do this first)

Open the hang dump to get the managed stack of the stuck startup thread:

```powershell
# Download the dump artifact from run 27416378916
gh run download 27416378916 -n dotnet-trx-full-core-api-integration-shard-1 -D ./_ci2155
# Open dotnet_5156_20260612T144927_hangdump.dmp with dotnet-dump
dotnet tool install -g dotnet-dump   # if not present
dotnet-dump analyze ./_ci2155/**/dotnet_5156_*.dmp
# In the analyze prompt:
#   clrstack -all        (find the thread parked in Program startup / IHostedService.StartAsync)
#   syncblk              (look for a lock/monitor deadlock)
```

The stack will name the exact hosted service / warmup call that blocks (e.g. a retrieval index
freshness warmup, embedding service warmup, or an `IHostedService` awaiting a resource). Fix that
root cause if the dump points to a specific deadlock.

## Step 2 — Bound host startup so a hang fails fast instead of burning 75 minutes

Regardless of the specific culprit, the test must not be able to consume the whole blame budget.
Add a small, reusable helper that forces host startup under a timeout, mirroring the existing
`IntegrationTestHttpCancellation` pattern, then use it in the retrieval smoke tests.

**New file:** `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs`

```csharp
using ArchLucid.TestSupport;   // SkippableFact's Skip, if used

namespace ArchLucid.Api.Tests;

/// <summary>
///     Forces <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> host
///     startup (first access to <c>Services</c>) under a bounded timeout so a stuck hosted-service
///     <c>StartAsync</c> fails the test quickly instead of consuming the full CI blame-hang budget.
/// </summary>
internal static class IntegrationTestHostStartup
{
    internal static readonly TimeSpan DefaultStartupTimeout = TimeSpan.FromSeconds(120);

    /// <summary>
    ///     Returns the started host's <see cref="IServiceProvider" />, or throws
    ///     <see cref="TimeoutException" /> if startup does not complete within <paramref name="timeout" />.
    /// </summary>
    internal static async Task<IServiceProvider> EnsureStartedAsync(
        Func<IServiceProvider> accessServices,
        TimeSpan? timeout = null)
    {
        ArgumentNullException.ThrowIfNull(accessServices);

        // First access to factory.Services builds and starts the host synchronously; run it off the
        // test thread so we can bound it with WaitAsync (host start has no native CancellationToken seam).
        Task<IServiceProvider> startTask = Task.Run(accessServices);

        return await startTask.WaitAsync(timeout ?? DefaultStartupTimeout);
    }
}
```

**Edit:** `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs` — in each test that touches
the host, resolve services through the bounded helper before seeding / creating the client. Example
for `Index_documents_then_query_returns_matching_hits`:

```csharp
await using AlertLifecycleWebAppFactory factory = new();
using CancellationTokenSource requestTimeout =
    IntegrationTestHttpCancellation.CreateRequestTimeoutSource();

// Bound host startup so a stuck IHostedService.StartAsync fails fast, not after the 75-min blame guard.
IServiceProvider services = await IntegrationTestHostStartup.EnsureStartedAsync(() => factory.Services);

await SeedRetrievalDocumentsAsync(services, requestTimeout.Token);

HttpClient client = factory.CreateClient();
// ... unchanged
```

Apply the same `EnsureStartedAsync` guard to the other three tests in the file
(`Query_without_q_returns_bad_request`, `Query_with_no_indexed_documents_returns_empty_list`,
`TopK_clamps_result_count`) — each currently triggers host startup via `factory.Services` or
`factory.CreateClient()` without a bound. For the two that call `CreateClient()` first, call
`EnsureStartedAsync(() => factory.Services)` before `CreateClient()`.

> If the dump in Step 1 shows the hang is in a specific hosted service that should simply be disabled
> for these InMemory tests (like the existing `Retrieval:*:IndexOnStartup=false` switches in
> `BaseIntegrationTestFixture`), prefer adding that off-switch as the real fix and keep the startup
> guard as defense-in-depth.

## Acceptance criteria

1. The hung test (and its three siblings) cannot exceed `DefaultStartupTimeout` waiting for host
   startup — a stuck host raises `TimeoutException` quickly rather than hanging the shard.
2. If Step 1 identifies a concrete startup deadlock / off-switch, that root cause is fixed too.
3. No change to the test assertions or product retrieval behavior.
4. `ArchLucid.Backend.slnf` still builds; `RetrievalQuerySmokeIntegrationTests` passes locally:
   `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'`
   then `dotnet test --filter "FullyQualifiedName~RetrievalQuerySmokeIntegrationTests"`.

## Notes

- This run also shows the Operator UI jobs and core-libs shard 1/4 failing. Those are tracked
  separately (UI build/docs/vitest fixes from #2152 and the recurring SQL shard hang). This prompt is
  scoped only to **Api.Tests integration shard 2/6** as requested.
