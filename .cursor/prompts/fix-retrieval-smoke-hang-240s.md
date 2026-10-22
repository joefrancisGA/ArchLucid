# Fix: `RetrievalQuerySmokeIntegrationTests` — all 4 tests timeout at 240 s

## Symptom

All four tests in `ArchLucid.Api.Tests.RetrievalQuerySmokeIntegrationTests` fail with
`System.TimeoutException : Integration test '...' exceeded 240s`:

```
Failed RetrievalQuerySmokeIntegrationTests.Index_documents_then_query_returns_matching_hits [4 m]
Failed RetrievalQuerySmokeIntegrationTests.TopK_clamps_result_count [4 m]
Failed RetrievalQuerySmokeIntegrationTests.Query_without_q_returns_bad_request [4 m]
Failed RetrievalQuerySmokeIntegrationTests.Query_with_no_indexed_documents_returns_empty_list [4 m]
```

xUnit timestamps show sequential runs at exactly 4-minute gaps (00:04:10, 00:08:10,
00:12:10, 00:16:10), meaning each test independently consumes its full 240 s deadline.

## Root-cause analysis

### Timeout provenance

`"Integration test '...' exceeded 240s"` is thrown by `IntegrationTestDeadline.RunAsync`
(file `ArchLucid.Api.Tests/IntegrationTestDeadline.cs`).  That string includes
`{effectiveTimeout.TotalSeconds:N0}`, so 240 s means `DefaultTestTimeout =
TimeSpan.FromMinutes(4)`.

The **current committed** value is `TimeSpan.FromMinutes(6)`.  If the failing CI run
saw 240 s it was running code with the old 4-minute constant — confirm whether this
branch carries the up-to-date `DefaultTestTimeout`.

### Why the test body can consume the full 240 s

Each test creates a **fresh** `AlertLifecycleWebAppFactory` (no sharing between tests).
The end-to-end path through a single test body stacks three bounded operations:

| Operation | Bound | File |
|---|---|---|
| Host startup (`factory.Services`) | 120 s | `IntegrationTestHostStartup.DefaultStartupTimeout` |
| `CreateClient` wrap | 30 s | `IntegrationTestHostStartup.DefaultClientCreationTimeout` |
| HTTP request (via `requestTimeout.Token` linked to `testDeadline`) | up to 90 s | `IntegrationTestHttpCancellation.DefaultRequestTimeout` |

120 + 30 + 90 = **240 s exactly**.

When a slow CI machine pushes each individual bound close to its ceiling, the three
operations together hit exactly the `DefaultTestTimeout`.  The outer `Task.WhenAny` in
`IntegrationTestDeadline.RunAsync` sees `delayTask` fire at the same moment as the
linked-token cancellation propagates; if `delayTask` wins the race it emits "exceeded
240s" instead of propagating the inner `OperationCanceledException`.

### Why four tests are affected, not just one

Each test allocates its own factory.  If startup is slow (e.g. under CI load) the
`IntegrationTestHostStartup.EnsureCompletedAsync` 120 s bound is consumed on every test
independently, stacking the cost four times and ensuring every test hits the deadline.

## Required fixes

### Fix 1 — Verify / restore the 6-minute `DefaultTestTimeout`

Open `ArchLucid.Api.Tests/IntegrationTestDeadline.cs`.  Confirm:

```csharp
internal static readonly TimeSpan DefaultTestTimeout = TimeSpan.FromMinutes(6);
```

If the failing branch still has `TimeSpan.FromMinutes(4)`, update it to 6 minutes.
Rationale: 120 s startup + 30 s client + 90 s HTTP = 240 s worst-case inner stack.
A 4-minute outer budget leaves zero margin; 6 minutes adds a 120 s cushion.

### Fix 2 — Increase `DefaultStartupTimeout` to match slow-CI startup reality

`IntegrationTestHostStartup.DefaultStartupTimeout = TimeSpan.FromSeconds(120)` is also
the dominating slow path.  For an InMemory host with all corpus indexers and purge loops
disabled, startup should finish in seconds.  If it routinely approaches 120 s on CI, a
hosted service that was added after the CI #2155 fix is blocking.

**Investigation steps (run before changing any code):**

1. Look for all `AddHostedService<…>` calls that are NOT gated by a config flag equivalent
   to `IndexOnStartup = false`.  As of the last audit the only always-on retrieval
   service is `RetrievalEmbeddingDriftStartupValidator` (synchronous, completes in
   milliseconds).  Any new unconditional `AddHostedService` is a suspect.

2. Check `AuditRetryDrainHostedService` — confirm its `StartAsync` returns immediately
   (it should only drain the `InMemoryAuditRetryQueue`, which is empty at startup).

3. Check `.ValidateOnStart()` calls:
   ```
   services.AddOptions<AzureOpenAiOptions>().ValidateOnStart();
   ```
   The `AzureOpenAiOptionsValidator` runs synchronously at host startup.  If
   `ArchLucidAuth:Mode = DevelopmentBypass` but the validator still requires a non-empty
   `Endpoint`, the host throws rather than hangs.  Verify that the InMemory test
   settings in `BaseIntegrationTestFixture` satisfy all `ValidateOnStart` validators
   (or that failing validators throw immediately rather than block).

4. If a specific `IHostedService.StartAsync` is hanging, wrap it with an internal
   `CancellationToken`-aware exit guard and/or disable it in InMemory mode with a
   feature-flag setting, then add that setting to `AlertLifecycleWebAppFactory.AddCustomSettings`.

### Fix 3 — Increase the startup ceiling to 180 s as a defense-in-depth measure

Even if the root-cause hosted-service hang is fixed, raise the startup bound so
transient CI slowness does not mask real test failures:

```csharp
// IntegrationTestHostStartup.cs
internal static readonly TimeSpan DefaultStartupTimeout = TimeSpan.FromSeconds(180);
```

180 s + 30 s + 90 s = 300 s < 360 s (6-minute outer deadline), preserving headroom.

### Fix 4 — Reduce per-test factory churn for the two non-seeding tests

`Query_without_q_returns_bad_request` and `Query_with_no_indexed_documents_returns_empty_list`
do not seed any retrieval documents.  They only need a running HTTP client, not fresh
state.  If host startup is the dominant cost, sharing a single factory across these two
tests (and possibly all four) via `IClassFixture<AlertLifecycleWebAppFactory>` eliminates
three of four startup cycles per shard run.

**Prerequisite before sharing:** confirm the `InMemoryVectorIndex` singleton holds no
inter-test state after the seeding tests finish.  If `DisposeAsync` is called only at
class teardown, the seeding tests must run before the empty-index assertion tests.  Use
`[TestCaseOrderer]` or separate the seeding tests into a different class if clean
isolation is mandatory.

If sharing is not acceptable, at minimum extract a static helper that creates a
`AlertLifecycleWebAppFactory` and caches it across the test class lifetime (one startup,
four tests).

## Acceptance criteria

1. All four `RetrievalQuerySmokeIntegrationTests` complete without throwing
   `TimeoutException` under normal CI load.
2. `IntegrationTestDeadline.DefaultTestTimeout` is `TimeSpan.FromMinutes(6)`.
3. The `DefaultStartupTimeout` ceiling is at least 150 s (prefer 180 s).
4. Any new or existing `IHostedService` that blocked startup under CI is either fixed or
   gated behind a config flag disabled in `AlertLifecycleWebAppFactory.AddCustomSettings`.
5. Compile check passes:
   ```
   .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
   ```

## Prior art

- `fix-ci-run-2155-api-tests-shard2-retrieval-smoke-hang.md` — original 75-minute hang
  in these same tests; added `IntegrationTestHostStartup`, `AlertLifecycleIntegrationHost`,
  and bounded `DisposeAsync`.  The current failure is a recurrence of the same class of
  hang, now caught by the shorter 240 s outer deadline instead of the 75-minute blame guard.
- `fix-ci-run-2168-integration-shards-blame-hang.md` — related shard blame-hang from
  `IHostedService` blocking after CI #2155 fixes; includes investigation pattern for
  finding the specific blocking service.

## Files to read first

Before making any changes, read:

- `ArchLucid.Api.Tests/IntegrationTestDeadline.cs`
- `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs`
- `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs`
- `ArchLucid.Api.Tests/AlertLifecycleIntegrationHost.cs`
- `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs`
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`
  (the `RegisterRetrieval` and `RegisterAgentExecution` methods — look for unconditional
  `AddHostedService` calls that could block under InMemory test settings)
- `ArchLucid.Api.Tests/BaseIntegrationTestFixture.cs`
  (confirm all potentially-blocking hosted services are disabled via config)
