# Fix: CI run 27473597389 (#2168) — 3 Api.Tests integration shards blame-hang despite #2165 bounds

> Branch: `ci/fix-idempotency-concurrency-hang-guard`. HEAD `febc885bfcc10b28c4c187d4f02a1be525e1d9c4`.
> **Recurrence** of `.cursor/prompts/fix-ci-run-2164-api-tests-shard3-ask-host-start-hang.md` and
> `.cursor/prompts/fix-ci-run-2155-api-tests-shard2-retrieval-smoke-hang.md` — **but the #2165 fix is
> already on this commit and it did not stop the hang.** Read "Evidence" before touching anything. This
> is **not** a re-migration job: do **not** re-route tests through `EnsureStartedAsync` (they already are)
> and do **not** raise the 75-min blame timeout.

## Symptom

Three `.NET: full regression — Api.Tests integration shard N/6 (SQL)` jobs each ran ~83 minutes
(`17:54Z → 19:17Z`) and were killed at the **75-minute** Blame inactivity ceiling. Each shard wedged
on a single test that started but never completed (`Completed="False"` in the blame `Sequence_*.xml`):

| Job (databaseId) | Artifact suffix | Hung test (`Completed="False"`) | Mini-dump |
|------------------|-----------------|----------------------------------|-----------|
| shard 2/6 (`81211204076`) | `shard-1` | `RetrievalQuerySmokeIntegrationTests.Index_documents_then_query_returns_matching_hits` — **first and only** test in the shard's sequence (wedged at shard start) | `dotnet_5119_20260613T191706_hangdump.dmp` |
| shard 3/6 (`81211204086`) | `shard-2` | `AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread` — after 16 passed | `dotnet_5104_20260613T191731_hangdump.dmp` |
| shard 4/6 (`81211204080`) | `shard-3` | `ArchitectureFindingAskControllerIntegrationTests.AskAboutFinding_returns_bad_request_when_question_missing` — after 69 passed | `dotnet_5087_20260613T191726_hangdump.dmp` |

All three use the **InMemory** `AlertLifecycleWebAppFactory`. Two of the three hangs are on the
**last-scheduled** test in the shard (load-dependent); one is the **only** test in its chunk.

## Evidence (do not re-diagnose from scratch — and do not repeat the #2164/#2155 fix)

1. **The #2165 host-start bound is already on `febc885` and is in use by all three classes.**
   `git show febc885:ArchLucid.Api.Tests/AskThreadIntegrationTests.cs` shows 5 calls to
   `AlertLifecycleIntegrationHost.EnsureStartedAsync(factory)`; `RetrievalQuerySmokeIntegrationTests`
   and `ArchitectureFindingAskControllerIntegrationTests` likewise. Commit
   `be609928c "fix(ci): resolve CI #2164 Ask-host start hang…"` is an ancestor. So the fix shipped.

2. **Both existing bounds should have converted a hang into a fast failure — but didn't.**
   - `IntegrationTestHostStartup.EnsureStartedAsync` = `Task.Run(() => factory.Services).WaitAsync(120s)`.
     A wedged host **start** must throw `TimeoutException` at **120s**, not hang 75 min.
   - `AlertLifecycleWebAppFactory.DisposeAsync` = `Task.WhenAny(base.DisposeAsync().AsTask(), Task.Delay(2min))`.
     A wedged **dispose** must be abandoned at **2 min**, not hang 75 min.
   Because the shard still burned the full 75-minute ceiling, **the wedge is in a code path that
   neither bound covers** (or one of the bounds is itself defeated). That gap is the bug to fix.

3. **Unbounded / possibly-token-ignoring paths that remain after the two bounds:**
   - `factory.CreateClient()` is called **after** `EnsureStartedAsync` returns. It re-enters
     `WebApplicationFactory.EnsureServer()`; normally cheap once the host is built, but it is **not**
     wrapped by either bound. Confirm from the dump whether the wedged frame is here.
   - The seed/index calls receive the 90s `requestTimeout` token, but **passing a token does not mean
     the callee observes it.** `AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(...)`,
     `IRetrievalIndexingService.IndexDocumentsAsync(...)`, and the InMemory authority/conversation/
     vector stores may take a lock/`SemaphoreSlim`/`lock` that deadlocks under parallel-shard load and
     ignores the token. A genuine InMemory-store deadlock (shared static, lock ordering) would park the
     test thread indefinitely with the request token never checked.
   - The bounded-start `Task.Run(() => factory.Services)` is abandoned on `TimeoutException` but keeps
     running on a pool thread. If the host **does** eventually finish building, two threads may touch
     `WebApplicationFactory` internals — `WebApplicationFactory` is **not** thread-safe for concurrent
     first-access. Confirm from the dump whether two threads are inside `EnsureServer`/`StartAsync`.

## Step 0 (MANDATORY) — analyze the three captured mini-dumps before writing any code

#2168 ran `--blame-hang-dump-type mini` (`scripts/ci/Invoke-ApiIntegrationTestShard.ps1`), so a managed
hang dump was captured for each shard. **This is the only way to break the #2134/#2138/#2164/#2168
cycle — stop guessing, read the parked stack.** Download from run `27473597389`:

```powershell
gh run download 27473597389 -n dotnet-trx-full-core-api-integration-shard-1 -D ./_ci2168/s1   # Retrieval
gh run download 27473597389 -n dotnet-trx-full-core-api-integration-shard-2 -D ./_ci2168/s2   # AskThread
gh run download 27473597389 -n dotnet-trx-full-core-api-integration-shard-3 -D ./_ci2168/s3   # FindingAsk
dotnet tool install -g dotnet-dump   # if not present
# For each dump:
dotnet-dump analyze ./_ci2168/s1/**/dotnet_5119_*_hangdump.dmp
#   > clrstack -all        find the thread parked in the test method; record the deepest managed frame
#   > syncblk              look for a lock/monitor held across the wedge (InMemory store or EnsureServer)
#   > threads / pstacks    confirm whether TWO threads sit in WebApplicationFactory.EnsureServer/StartAsync
```

Record, in the PR description, the exact parked frame for **each** of the three dumps. The three shards
may share one root cause (most likely) or differ — the dumps decide. Classify each as one of:
**(a)** wedged inside `factory.CreateClient()` / `EnsureServer` (post-start, unbounded);
**(b)** wedged inside a seed/index call that ignores its `CancellationToken` (InMemory-store deadlock);
**(c)** wedged inside the in-flight HTTP handler with the client token not aborting the TestServer;
**(d)** a concurrency hazard from the abandoned `Task.Run` start racing `CreateClient`.

## Files

- `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs` — `Index_documents_then_query…` (shard-1 hang); seeds via `IRetrievalIndexingService.IndexDocumentsAsync`.
- `ArchLucid.Api.Tests/AskThreadIntegrationTests.cs` — `Ask_with_seeded_run…` (shard-2 hang); seeds via `AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync`, then `CreateScopedClient` → `factory.CreateClient()`.
- `ArchLucid.Api.Tests/ArchitectureFindingAskControllerIntegrationTests.cs` — `AskAboutFinding_returns_bad_request_when_question_missing` (shard-3 hang); validation-only, no seed: `EnsureStartedAsync` → `factory.CreateClient()` → one bounded POST.
- `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs` — the 120s host-start bound (`Task.Run` + `WaitAsync`).
- `ArchLucid.Api.Tests/AlertLifecycleIntegrationHost.cs` — thin wrapper over the above.
- `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs` — InMemory host; **`DisposeAsync` already bounded at 2 min**; `ConfigureClient` sets `client.Timeout = IntegrationTestHttpCancellation.DefaultRequestTimeout` (90s).
- `ArchLucid.Api.Tests/IntegrationTestHttpCancellation.cs` — `DefaultRequestTimeout = 90s`, `CreateRequestTimeoutSource()`.
- `ArchLucid.Api.Tests/BaseIntegrationTestFixture.cs` — already disables Demo/ServiceBus/OTLP/leader-election/purge-reaper workers and `Retrieval:*:IndexOnStartup=false`; `HostOptions.ShutdownTimeout=15s`.
- Seed/store internals to audit only if the dump points at them: `AdvisoryIntegrationSeed`, `ArchLucid.Retrieval.Indexing.*`, the InMemory store/registrar under `ArchLucid.Host.Composition/Configuration/InMemoryStorageProviderRegistrar.cs` and `…/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`.

## Step 1 — close the leaking gap with a single whole-test deadline (root, reusable)

The per-seam bounds (start, dispose) demonstrably leak because the **middle** of the test (CreateClient,
seed, HTTP) and re-entrant `EnsureServer` are not bounded. Add **one** reusable hard per-test deadline so
**no** test on this factory can exceed a few minutes — converting any future 75-min shard burn into a
fast, attributable `TimeoutException` that names the operation. Prefer **aggressive reuse**: one helper,
used by all affected tests.

Add a helper (e.g. `ArchLucid.Api.Tests/IntegrationTestDeadline.cs`) that runs a full test body under a
linked `CancellationTokenSource` and a `WaitAsync` ceiling (suggest **4 minutes** — comfortably above a
healthy InMemory test of seconds, far below the 75-min budget), surfacing a `TimeoutException` whose
message includes the test name. Thread its token into the existing `requestTimeout` usage so seed/HTTP
calls observe one linked token instead of an independent 90s source. Wrap the three hung tests (and, for
consistency, their siblings on `AlertLifecycleWebAppFactory`) in it.

> This is defense-in-depth, not the root cause. It must land **regardless** of what the dump shows, so
> the shard can never burn 75 minutes again. Keep the existing 120s start bound and 2-min dispose bound.

## Step 2 — fix the actual root cause identified in Step 0

Apply the fix that matches the dump classification:

- **(a) wedged in `factory.CreateClient()` / `EnsureServer`:** route `CreateClient()` through the same
  bounded pattern as `EnsureStartedAsync` (a small `EnsureClientAsync(factory)` helper that bounds the
  call), or ensure `EnsureStartedAsync` fully completes host build before any `CreateClient()` so the
  re-entrant `EnsureServer` is a no-op. Eliminate the concurrency window from the abandoned `Task.Run`.
- **(b) seed/index ignores its token (InMemory-store deadlock):** make the offending store/index method
  honor the `CancellationToken` (observe it across the lock/`SemaphoreSlim`), and fix the lock-ordering
  or shared-static hazard that deadlocks under parallel shards. **No product behavior change** beyond
  honoring cancellation. Add a focused regression test if the deadlock is reproducible.
- **(c) in-flight HTTP handler not aborted by the client token:** confirm `client.Timeout` (90s) and the
  request token reach the handler; if a server-side `IHostedService`/handler awaits an unbounded
  resource, give it the request/stopping token (follow the token-correct `BackgroundService`
  implementations under `ArchLucid.Host.Core/Hosted/`).
- **(d) `Task.Run` start racing `CreateClient`:** force host startup to fully settle inside
  `EnsureStartedAsync` (await the build to completion on one thread) before the test thread proceeds, so
  `WebApplicationFactory` is never touched concurrently.

## Acceptance criteria

1. The exact parked frame for **each** of the three #2168 dumps is recorded in the PR description, and
   each shard's hang is classified (a/b/c/d) with the matching fix applied.
2. The three named tests — and every sibling on `AlertLifecycleWebAppFactory` — **cannot** exceed the
   whole-test deadline from Step 1; a stall fails fast with a `TimeoutException` naming the test, never a
   75-minute shard burn. No `Sequence_*.xml` `Completed="False"` on these classes.
3. The real root cause from Step 0 is fixed (token honored / concurrency window closed / hosted service
   bounded), not just papered over by the deadline.
4. The 75-min `--blame-hang-timeout`, the 120s host-start bound, and the 2-min `DisposeAsync` bound are
   **unchanged**. No product behavior change beyond honoring cancellation tokens.
5. `ArchLucid.Backend.slnf` compile check passes:
   `.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"`.

## Verification (scoped — InMemory, no SQL Server needed)

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'

dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~RetrievalQuerySmokeIntegrationTests|FullyQualifiedName~AskThreadIntegrationTests|FullyQualifiedName~ArchitectureFindingAskControllerIntegrationTests' `
    --blame-hang --blame-hang-timeout 5min --blame-hang-dump-type mini
```

Confirm clean, fast completion; `Grep` the three classes to verify the Step 1 deadline wraps every test
and that no unbounded `factory.CreateClient()` / seed call precedes a bound.

## Reference

- Failed run: `27473597389` (#2168); jobs `81211204076` (2/6), `81211204086` (3/6), `81211204080` (4/6).
- Prior (now-insufficient) fixes: `.cursor/prompts/fix-ci-run-2164-api-tests-shard3-ask-host-start-hang.md`,
  `.cursor/prompts/fix-ci-run-2155-api-tests-shard2-retrieval-smoke-hang.md`,
  `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md`, `.cursor/prompts/fix-ci-run-2165-verify-2164-fixes.md`.
- CI workflow: `.github/workflows/ci.yml` (`dotnet-full-regression-core-api-integration`, `timeout-minutes: 240`,
  `-BlameHangTimeout 75min`); shard runner: `scripts/ci/Invoke-ApiIntegrationTestShard.ps1`.
```
