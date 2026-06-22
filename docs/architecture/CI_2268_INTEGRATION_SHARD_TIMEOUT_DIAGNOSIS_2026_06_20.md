# CI #2268 — Integration shard 2/6 timeout diagnosis (2026-06-20)

## Symptoms

`RetrievalQuerySmokeIntegrationTests` (A/B/C/D) time out on every CI run of shard 2/6.
Previously at 480 s (`DefaultTestTimeout`); now at 150 s after the `SharedHostTestTimeout` fix.
All four tests hang — including `B_Query_without_q_returns_bad_request`, which should return
HTTP 400 in milliseconds — indicating the block is **before the action body**, somewhere in the
middleware pipeline or request dispatch.

## Fixes applied so far

| Commit | Change |
|--------|--------|
| `bc8350444` | Add `SharedHostTestTimeout = 150 s`; apply to all four retrieval smoke tests |
| This PR | Lower `blame_timeout` on shard 1 (2/6) to `130 s` so vstest captures a mini-dump before `RunAsync` returns at 150 s; add `dotnet-hang-dump-api-integration-shard-*` artifact upload |

## Root cause — status: **not yet confirmed**

Analytical code tracing exhausted the full middleware/service chain for the InMemory host
(`AlertLifecycleWebAppFactory`).  Every component examined is either:

- fast / synchronous in-memory, or
- guarded by a `try/catch` that logs and continues.

Key negative findings:

- `InMemoryTenantRepository.GetByIdAsync` — `Task.FromResult` under `lock`, instant.
- `FakeEmbeddingService.EmbedAsync` — `Task.FromResult`, instant.
- `InMemoryVectorIndex.SearchAsync` — `lock + Task.FromResult`, instant.
- `RateLimiter` (`[EnableRateLimiting("fixed")]`) — 100 permits/min, 4 test requests, no queue.
- `TrialSeatReservationMiddleware` — bypassed (no `sub` / `objectidentifier` claim from `DevelopmentBypass`).
- `WarmTenantCatalogReplenishHostedService` — skips body (`WarmTenantCatalogOptions.Enabled = false`), delays 30 min.
- `NoOpHostLeaderLeaseRepository` — returns `Task.FromResult(true)`, instant.
- `DevelopmentBypassAuthenticationHandler` — synchronous, instant.
- `TenantOrProjectCapabilityAuthorizationHandler` — short-circuits on `Admin` role, instant.
- SQL migrations / DbUp — skipped entirely (`StorageProvider = InMemory`).

The hang is server-side: `TestServer.ClientHandler.SendAsync` does not return when a server-side
thread holds a non-cancellable operation.  The inner 90 s `requestTimeout.Token` fires but
`GetAsync` does not complete; the outer 150 s `RunAsync` deadline fires and the test returns
with `TimeoutException`.

## Hypothesis

**Thread pool starvation or a hidden blocking continuation** somewhere in the early request
pipeline (routing initialisation, middleware chain, or a first-request lazy initialiser) that
blocks all .NET thread pool threads, preventing `SendAsync` from returning even after the
cancellation token fires.

A secondary candidate is a synchronisation primitive (`SemaphoreSlim`, `Channel`, `AsyncLocal`
captured incorrectly) inside a component not yet examined.

## CI #2277 — capture failure (2026-06-21)

Shard 2/6 (matrix index 1) ran **3001 s (~50 min)** and failed with **no job log** (`BlobNotFound`)
and **no artifacts** — not even `integration-shard-manifest-1`, which is written before tests run.
Siblings 1/6 and 3/6 failed on real assertion regressions but uploaded trx/diag normally; shards
4/6–6/6 succeeded in ~510–713 s.

**Capture-path root cause:** in-process `--blame-hang` mini-dumps and the 150 s
`IntegrationTestDeadline.RunAsync` wrapper both live inside the wedged test host. When the host
blocks non-cancellably, the collectors die with it and the runner can be lost before `if: always()`
upload steps execute.

## Out-of-process dump + step timeout (2026-06-21)

Track A (CI harness only — product hang still unfixed):

| Component | Change |
|-----------|--------|
| `scripts/ci/ApiIntegrationTestChunkWatchdog.ps1` | Parent-process watchdog per chunk; on timeout runs `dotnet-dump collect --type Full` on testhost/dotnet PIDs **before** killing the tree |
| `scripts/ci/Invoke-ApiIntegrationTestShard.ps1` | Launches each `dotnet test` chunk as an owned child process; `-ChunkTimeout` (default 20 min) |
| `.github/workflows/ci.yml` | Matrix `step_timeout_minutes` (25 for shard 2/6, 30 others) as Actions backstop; `-ChunkTimeout` passed from matrix; hang-dump artifact `if-no-files-found: warn` |

Expected artifact on the next hang: **`dotnet-hang-dump-api-integration-shard-1`** containing
`hangdump-shard-1-chunk*-*.dmp` (Full dump from parent, not in-process mini).

## Next step — read the out-of-process dump

Once **`dotnet-hang-dump-api-integration-shard-1`** lands on CI:

1. Download `hangdump-shard-1-chunk*-*.dmp` from the failed run.
2. Open with `dotnet-dump analyze <file>.dmp` or Visual Studio (Windows) / `lldb` (Linux).
3. Run `threads` / `clrthreads` to list all managed threads.
4. Run `clrstack` on each thread to find the server-side request processing task.
5. Look for: any blocked `await`, `Monitor.Wait`, `SemaphoreSlim.WaitAsync`, `Channel.ReadAsync`,
   or a `lock` entry inside the ASP.NET Core pipeline or one of the middleware listed above.

Key threads to look for:
- The thread running `RetrievalController.SearchAsync` (or its preceding middleware).
- Any thread holding a lock that a server request thread is waiting for.
- The thread pool worker threads — if all are blocked (`Task.WhenAll`, sync-over-async), that
  explains why cancellation is not honored.

Also evaluate whether `IntegrationTestDeadline.RunAsync` abandoning wedged `runTask` instances
(four tests in `RetrievalQuerySmokeIntegrationTests`) amplifies thread-pool starvation.

## Middleware pipeline order (for reference)

```
CorrelationIdMiddleware
HttpRequestLoggingMiddleware
ContextIngestionMaxPayloadMiddleware
TraceResponseHeaderMiddleware
SecurityHeadersMiddleware
ApiDeprecationHeadersMiddleware
UseExceptionHandler
UseResponseCompression
UseRouting
UseCors
UseSerilogRequestLogging
UseAuthentication
ScopeIdentityBindingMiddleware
ScopeResolutionGuardMiddleware
RunAliasDeprecationMiddleware
UseRateLimiter
ArchLucidRateLimitTelemetryHeadersMiddleware
TrialSeatReservationMiddleware
TenantErasureQuarantineMiddleware
UseAuthorization
LlmTokenUsageResponseMiddleware
ApiRequestMeteringMiddleware
MapControllers  →  RetrievalController.SearchAsync
```

## Revert checklist (after root cause fixed)

- [ ] Change `blame_timeout: "130s"` back to `"75min"` for shard 1 in `.github/workflows/ci.yml`.
- [ ] (Optional) Remove or relax shard-2/6-specific `step_timeout_minutes: 25` once hangs stop.
- [ ] (Optional) Remove `dotnet-hang-dump-api-integration-shard-*` artifact upload, or keep as
  permanent diagnostic (out-of-process Full dumps via `ApiIntegrationTestChunkWatchdog.ps1`).
