# Fix: CI run 27464501457 (#2164) — Api.Tests integration shard 3/6 blame-hang (Ask host **start**)

> Branch: `ci/fix-idempotency-concurrency-hang-guard`. **Recurrence** of
> `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md`. CI #2164 ran on HEAD `5acee2204`
> ("fix(ci): repair CI #2162 Vitest drift and bound Ask-host integration dispose"), which already added
> the 2-minute bounded `DisposeAsync` to `AlertLifecycleWebAppFactory` and `--blame-hang-dump-type mini`.
> **The hang came back anyway.** Read "Evidence" — the prior fix bounded *dispose*; this hang is in
> *host start*, which is still unbounded. Do **not** re-bound dispose or raise the blame timeout.

## Symptom

`.NET: full regression — Api.Tests integration shard 3/6 (SQL)` (matrix `shard=2`), job
`81186547853`, ran `11:21:35Z → 14:24:54Z` and aborted at the **75-minute** Blame inactivity ceiling:

```
The active test run was aborted. Reason: Test host process crashed
Data collector 'Blame' message: The specified inactivity time of 75 minutes has elapsed. Collecting hang dumps...
Passed!  - Failed: 0, Passed: 44, Skipped: 2, Total: 46, Duration: 1 h 41 m - ArchLucid.Api.Tests.dll (net10.0)
The test running when the crash occurred:
ArchLucid.Api.Tests.AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread
```

44 of 46 tests passed; the run wedged on the **last-scheduled** Ask test and produced **no further
test output** for ~76 minutes before the dump fired — i.e. a true inactivity hang, not a slow test.

## Evidence (do not re-diagnose from scratch)

1. **It is not dispose.** HEAD `5acee2204` already bounds `AlertLifecycleWebAppFactory.DisposeAsync`
   at **2 minutes** (`BoundedDisposeTimeout`). A wedged dispose would have been abandoned at 2 min and
   the test would have completed — it could not produce a 75-min inactivity hang. So the wedge is
   **before** dispose.

2. **It is not the bounded HTTP / seed calls.** Every HTTP and seed call in
   `AskThreadIntegrationTests` is bound by a 90-second token
   (`IntegrationTestHttpCancellation.CreateRequestTimeoutSource()`, `DefaultRequestTimeout = 90s`).
   A stuck `v1/ask` handler would cancel the client at 90s and **fail fast** with
   `TaskCanceledException`, not hang for 75 minutes.

3. **It is not SQL warmup/teardown.** `AlertLifecycleWebAppFactory` is an **InMemory** host
   (`ArchLucid:StorageProvider=InMemory`). The greenfield-SQL bootstrap/skip guards are irrelevant.

4. **The only unbounded operation left is host start.** `Ask_with_seeded_run...` touches the host
   first at `AskThreadIntegrationTests.cs:41`
   (`SeedDefaultScopeAuthorityRunAsync(factory.Services, …)`) and again via
   `CreateScopedClient(factory)` → `factory.CreateClient()` (lines 27, 43). Both trigger
   `WebApplicationFactory.EnsureServer()` → host build + `IHost.StartAsync` (every
   `IHostedService.StartAsync`). **Host start has no native cancellation seam and is not bounded here.**
   Under heavy parallel CI load ~80 min into the shard, one startup service blocks, `.Services` never
   returns, the test thread is parked in the property getter, and the 75-min blame collector kills the
   host. Load-dependent → only the last-scheduled Ask test in the shard tipped over.

5. **The fix already exists and is in use — just not on these tests.**
   `IntegrationTestHostStartup.EnsureStartedAsync(() => factory.Services)` runs the first `.Services`
   access on a worker thread under a **120s** `WaitAsync` bound and throws `TimeoutException` if start
   stalls. `RetrievalQuerySmokeIntegrationTests` (same `AlertLifecycleWebAppFactory`) already routes
   start through it (`RetrievalQuerySmokeIntegrationTests.cs:116-119`). The Ask classes were never
   migrated to it.

## This run captured a managed mini dump (use it)

Unlike #2138, the shard now runs `--blame-hang-dump-type mini`
(`scripts/ci/Invoke-ApiIntegrationTestShard.ps1:113`), so a **managed hang dump** was collected:

```
coverage-full-core-api-integration-shard-2/17defb53-ef73-41c7-906a-5ad5d8b4f049/dotnet_5073_20260613T142426_hangdump.dmp
Sequence_72d1b71fec2e4411ba7fa558e11a1ba0.xml
```

Artifact: `dotnet-trx-full-core-api-integration-shard-2` (and the blame artifact) on run
`27464501457`. Download once the run finishes and inspect the parked thread to **confirm** the wedge
is in `IHost.StartAsync` (a specific `IHostedService`) rather than elsewhere:

```powershell
gh run download 27464501457 -n dotnet-trx-full-core-api-integration-shard-2 -D ./_ci-2164-dump
# open the .dmp with dotnet-dump and dump the managed stacks:
dotnet-dump analyze ./_ci-2164-dump/**/dotnet_5073_*_hangdump.dmp
#   > clrstack -all      (find the thread parked in HostedServiceExecutor / StartAsync)
#   > syncblk            (look for a lock held across StartAsync)
```

If the dump confirms a specific blocking `IHostedService`, fix that service too (Step 3). If the dump
shows the parked frame is the `factory.Services` getter / `EnsureServer`, the Step 2 bound is the
complete fix.

## Files

- `ArchLucid.Api.Tests/AskThreadIntegrationTests.cs` — 5 tests, all `new AlertLifecycleWebAppFactory()`;
  touch `factory.Services` / `factory.CreateClient()` directly (unbounded start).
- `ArchLucid.Api.Tests/ArchitectureFindingAskControllerIntegrationTests.cs` — sibling Ask class on the
  same factory (#2138 named it on shard 4/6); migrate it too.
- `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs` — **reuse this**; `EnsureStartedAsync`, 120s bound.
- `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs:116-119` — the established pattern to copy.
- `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs` — InMemory host; dispose already bounded.
- `ArchLucid.Api.Tests/BaseIntegrationTestFixture.cs` — already disables Demo, ServiceBus, OTLP/console
  export, leader election, all purge/reaper workers, and `Retrieval:{PlatformDocs,PolicyPackCorpus,ExemplarCorpus}:IndexOnStartup=false`;
  `AgentExecution:Mode=Simulator`, AzureOpenAI endpoints blank, `HostOptions.ShutdownTimeout=15s`.
- InMemory hosted-service registrars (audit only if Step 1 names a service):
  `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`,
  `ArchLucid.Host.Composition/Configuration/InMemoryStorageProviderRegistrar.cs`.

## Step 1 — confirm the blocking frame from the captured dump

Analyze the `dotnet_5073_*_hangdump.dmp` above. Confirm whether the wedge is host start
(`Microsoft.Extensions.Hosting` → `HostedServiceExecutor.StartAsync` → some `IHostedService`) or
something else. Record the exact service/frame in the PR description. This is fast and removes the
guesswork that made #2134/#2138 cycle.

## Step 2 — bound host start on every Ask test (reuse the existing helper)

For **all 5** `AskThreadIntegrationTests` and every test in
`ArchitectureFindingAskControllerIntegrationTests`, route the **first** host touch through
`IntegrationTestHostStartup.EnsureStartedAsync(() => factory.Services)` **before** any
`factory.Services` access or `factory.CreateClient()` call — exactly as
`RetrievalQuerySmokeIntegrationTests` does. Concretely:

- Add a private `Task<IServiceProvider> EnsureHostStartedAsync(AlertLifecycleWebAppFactory factory)`
  helper (or reuse one shared helper) that returns
  `IntegrationTestHostStartup.EnsureStartedAsync(() => factory.Services)`.
- In each test, `await` it immediately after constructing the factory; pass the returned
  `IServiceProvider` to the seed instead of `factory.Services`.
- For the validation-only tests that don't seed (`Ask_without_question_returns_bad_request`,
  `Ask_without_runId_or_threadId_returns_bad_request`, and the missing-question finding test),
  `await EnsureHostStartedAsync(factory)` before `CreateScopedClient(factory)` so the bounded start
  runs first and `CreateClient()` then reuses the already-started host.

Prefer a small shared helper over per-class duplication (aggressive reuse). A blocked start now throws
`TimeoutException` at 120s — a fast, attributable failure instead of a 75-minute shard burn.

## Step 3 — if Step 1 named a blocking hosted service, make it honor cancellation

If the dump shows a specific `IHostedService` parked in `StartAsync` under InMemory (one not already
disabled by `BaseIntegrationTestFixture`), fix it: make `StartAsync` return promptly (do real work in
the background `ExecuteAsync` loop), honor `stoppingToken`/the host shutdown token, and follow the
token-correct `BackgroundService` implementations under `ArchLucid.Host.Core/Hosted/`. If the service
is not needed at startup for integration hosts, disable it via a config key in
`BaseIntegrationTestFixture.ConfigureWebHost` the same way the others are disabled. **No product
behavior change** beyond making a hosted service honor cancellation.

## Acceptance criteria

1. All 5 `AskThreadIntegrationTests` and all `ArchitectureFindingAskControllerIntegrationTests`
   complete (pass, or fail with an assertion / `TimeoutException`) — never hang. First host touch is
   bounded by `IntegrationTestHostStartup.EnsureStartedAsync` (≤120s).
2. No `Sequence_*.xml` with `Completed="False"` on these classes; shard 3/6 (and 4/6) finish well
   inside the 75-min blame budget.
3. If Step 1 identified a blocking hosted service, it now honors its stopping/shutdown token (or is
   disabled for integration hosts); host shutdown completes within `HostOptions.ShutdownTimeout` (15s).
4. The 75-min `--blame-hang-timeout` and the 2-min `DisposeAsync` bound are **unchanged**.
5. `ArchLucid.Backend.slnf` compile check passes:
   `.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"`.

## Verification (read-only — do not run the full shard suite)

These classes are **InMemory** — no SQL Server needed:

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~AskThreadIntegrationTests|FullyQualifiedName~ArchitectureFindingAskControllerIntegrationTests' `
    --blame-hang --blame-hang-timeout 3min --blame-hang-dump-type mini
```

Confirm clean, fast start/dispose. `Grep` the migrated tests to verify no remaining direct
`factory.Services` / `factory.CreateClient()` access precedes a bounded start.

## Reference

- Run `27464501457` (#2164), job `81186547853`, branch `ci/fix-idempotency-concurrency-hang-guard`,
  HEAD `5acee2204`.
- `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` (prior framing; dispute bounded only).
- `.cursor/prompts/fix-retrieval-query-smoke-integration-hang-ci.md` (origin of `EnsureStartedAsync`).
- CI workflow: `.github/workflows/ci.yml` (`dotnet-full-regression-core-api-integration`,
  `timeout-minutes: 240`, `-BlameHangTimeout 75min`).
