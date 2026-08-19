# Fix: CI run 27339170645 (#2138) — Api.Tests integration shards 3/6 and 4/6 blame-hang crash

> Branch: `ci/fix-idempotency-concurrency-hang-guard`. This supersedes the "blank last-running test"
> framing in `.cursor/prompts/fix-ci-run-2134-all-failures.md` (Failure 4). The 2138 blame dumps
> name the exact hung tests — it is **not** a blank/no-test hang, and it is **not** a SQL warmup or
> SQL teardown hang. Read "Evidence" before changing anything.

## Symptom

Two jobs in CI #2138 failed; both ran ~1h23m then aborted at the **75-minute** blame-hang ceiling:

- `.NET: full regression — Api.Tests integration shard 3/6 (SQL)` (matrix `shard=2`)
- `.NET: full regression — Api.Tests integration shard 4/6 (SQL)` (matrix `shard=3`)

```
The active test run was aborted. Reason: Test host process crashed
```

(Separately, shard 2/6 and core-libs shard 1/4 were still in progress at 2h+. Those are out of scope
for this prompt — the user asked specifically about shards 3 and 4. The long-running idempotency
concurrency burst is tracked in `.cursor/prompts/fix-idempotency-concurrency-resolution-timeout-ci.md`.)

## Evidence (this is the important part — do not re-diagnose from scratch)

The blame collector **did** name the test that was running when each dump fired
(`Sequence_*.xml`, `Completed="False"` on the last entry):

| Shard | Hung test (`Completed="False"`) | Factory used |
|-------|----------------------------------|--------------|
| 3/6 (`shard=2`) | `ArchLucid.Api.Tests.AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread` | `AlertLifecycleWebAppFactory` |
| 4/6 (`shard=3`) | `ArchLucid.Api.Tests.ArchitectureFindingAskControllerIntegrationTests.AskAboutFinding_returns_bad_request_when_question_missing` | `AlertLifecycleWebAppFactory` |

Both hung tests:

1. Use **`AlertLifecycleWebAppFactory`** — an **InMemory** host (`ArchLucid:StorageProvider=InMemory`,
   no SQL catalog). So this is **not** a DbUp / cold-SQL / greenfield-warmup hang. The
   `GreenfieldSqlHostBootstrapBudget` (50 min) skip guard does not apply here and never fired.
2. Already bound **every** HTTP call and seed call with a 90-second token
   (`IntegrationTestHttpCancellation.CreateRequestTimeoutSource()`, default 90s, passed as
   `requestTimeout.Token`). A call that exceeded 90s would **fail fast** with
   `TaskCanceledException`, not hang for 75 minutes.

`AskAboutFinding_returns_bad_request_when_question_missing` is a pure validation test (missing
question → expect 400). It never reaches the LLM/retrieval pipeline. For it to hang 75 minutes, the
hang must be **outside** the bounded HTTP call.

### Conclusion: the hang is the unbounded `WebApplicationFactory` host lifecycle

In both tests the only operations **not** covered by the 90s token are the `WebApplicationFactory`
host start and dispose:

- **Host start** — `ArchitectureFindingAskControllerIntegrationTests` calls `factory.CreateClient()`
  (line 24); `AskThreadIntegrationTests.Ask_with_seeded_run...` passes `factory.Services` to the seed
  (line 40–41). Both trigger `WebApplicationFactory.EnsureServer()` → host build + `IHost.StartAsync`,
  which runs every registered `IHostedService.StartAsync`. **There is no timeout on host start.**
- **Host dispose** — `await using AlertLifecycleWebAppFactory factory = new();` disposes the host at
  method exit with **no cancellation token**. `BaseIntegrationTestFixture` sets
  `HostOptions.ShutdownTimeout = 15s`, but that only bounds the host's own `StopAsync` orchestration;
  a hosted service that ignores its stopping token (or blocks in `StartAsync`) can still wedge the
  process.

Under heavy parallel CI load ~80 minutes into the shard (SQL container saturated, CPU pegged), one
startup/shutdown `IHostedService` blocks, the test method never returns, and the 75-min blame-hang
kills the host. This is load-dependent, which is why most `AlertLifecycleWebAppFactory` tests passed
and only the last-scheduled ones in each shard tipped over ("crashed for no apparent reason").

### Why the previous (Sonnet) attempt did not fix it

Prior runs (#2132–#2134) framed the integration hang as a **blank** last-running test on **SQL**
fixtures, and the fixes targeted greenfield-SQL warmup skip guards
(`WarmArchitectureRequestHostOrSkipOnShardOverloadAsync`) and SQL factory teardown. Those paths are
irrelevant to these two tests, which run on the **InMemory** `AlertLifecycleWebAppFactory` whose host
**start and dispose are completely unbounded**. The earlier work never touched that lifecycle.

## Files

- `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs` (InMemory host; currently no bounded start/dispose)
- `ArchLucid.Api.Tests/AskThreadIntegrationTests.cs` (5 tests, all use the factory)
- `ArchLucid.Api.Tests/ArchitectureFindingAskControllerIntegrationTests.cs`
- `ArchLucid.Api.Tests/BaseIntegrationTestFixture.cs` (`HostOptions.ShutdownTimeout = 15s`, line ~92)
- `scripts/ci/Invoke-ApiIntegrationTestShard.ps1` (`--blame-hang --blame-hang-timeout 75min`, **no dump type**)
- InMemory hosted-service registration: `ArchLucid.Host.Composition/Configuration/InMemoryStorageProviderRegistrar.cs`
  and `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions*.cs`

## Step 1 — get a managed stack (the Sequence file has none)

The shard runs `--blame-hang` **without** `--blame-hang-dump-type`, so only the test-naming
`Sequence_*.xml` is produced (no `.dmp`, no managed stack). Do **one** of:

- **(Preferred, fast, no SQL):** reproduce locally — these two classes are InMemory, so they need no
  SQL Server:

  ```powershell
  dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
      --filter 'FullyQualifiedName~AskThreadIntegrationTests|FullyQualifiedName~ArchitectureFindingAskControllerIntegrationTests' `
      --blame-hang --blame-hang-timeout 3min --blame-hang-dump-type mini
  ```

  If it does not hang locally (likely — the trigger is CI load), attach a debugger / dump on the
  `await using` dispose and the first `factory.Services`/`CreateClient()` and inspect which
  `IHostedService.StartAsync` or `StopAsync` is still running.

- **(CI capture):** add `--blame-hang-dump-type mini` to the `dotnet test` invocation in
  `scripts/ci/Invoke-ApiIntegrationTestShard.ps1` (line ~111) and upload the `.dmp` alongside the
  existing blame artifact, so the next hang yields a managed stack. Do **not** raise the 75-min
  timeout.

## Step 2 — identify and fix the blocking hosted service

Audit the `IHostedService` set that is active under **InMemory** for a service that can block
`StartAsync`/`StopAsync` and is **not** already disabled by `BaseIntegrationTestFixture`
(which disables Demo, ServiceBus, OTLP/console exporter, leader election, and the
`*PurgeWorker`/reaper loops, and sets `Retrieval:PlatformDocs:IndexOnStartup=false` +
`Retrieval:PolicyPackCorpus:IndexOnStartup=false`).

Highest-probability culprits — startup services tied to the **retrieval/embedding** path the Ask
feature depends on, registered in `ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`:

- `RetrievalEmbeddingDriftStartupValidator`
- `ExemplarCorpusStartupIndexerHostedService` (note: the base fixture disables **PlatformDocs** and
  **PolicyPackCorpus** startup indexing, but **not** the exemplar corpus or the drift validator)
- `PlatformDocCorpusStartupIndexerHostedService` / `PolicyPackCorpusStartupIndexerHostedService`
  (confirm the `IndexOnStartup=false` flags actually short-circuit their `StartAsync` and that they
  honor the stopping token while waiting)

For the identified service, make `StartAsync` return promptly (do real work in the background loop,
not inline in `StartAsync`) and make `ExecuteAsync`/`StopAsync` honor `stoppingToken`/the host
shutdown token so `HostOptions.ShutdownTimeout = 15s` can actually release it. Follow the pattern in
the already-token-correct `BackgroundService` implementations under `ArchLucid.Host.Core/Hosted/`.

If the offender is genuinely needed at startup, disable it for integration hosts the same way the
base fixture disables the others (add a config key to `BaseIntegrationTestFixture.ConfigureWebHost`
settings, or to `AlertLifecycleWebAppFactory.AddCustomSettings`).

## Step 3 — defensive guard so no single host start/dispose can burn the blame budget

Independent of the specific service, add a bounded lifecycle guard to `AlertLifecycleWebAppFactory`
(and ideally a shared base helper reused by the other InMemory factories) so a wedged hosted service
fails the test fast instead of hanging 75 minutes:

- Override `DisposeAsync` to run `base.DisposeAsync()` under a hard deadline (e.g.,
  `Task.WhenAny(base.DisposeAsync().AsTask(), Task.Delay(timeout))`); if the deadline wins, log a
  clear diagnostic naming the factory so the next CI hang is attributable in seconds, not 75 minutes.
- Be aware a truly wedged `Dispose` cannot be force-aborted on a background thread — Step 2 (a hosted
  service that honors its token) is the real fix; Step 3 only converts a future regression into a
  fast, named failure.

Reuse `IntegrationTestHttpCancellation` for the timeout constant rather than introducing a new magic
number. Keep the bound comfortably under 75 min (e.g., 2–3 min) — host start/dispose of an InMemory
host should take seconds.

## Acceptance criteria

1. All 5 `AskThreadIntegrationTests` and `ArchitectureFindingAskControllerIntegrationTests` complete
   (pass or fail with an assertion — never hang). Host start and `await using` dispose of
   `AlertLifecycleWebAppFactory` return within seconds.
2. The offending `IHostedService` honors its stopping/shutdown token (or is disabled for integration
   hosts); host shutdown completes within `HostOptions.ShutdownTimeout` (15s).
3. Integration shards 3/6 and 4/6 finish within the 75-min blame-hang budget; no `Sequence_*.xml`
   with `Completed="False"`.
4. (Recommended) `scripts/ci/Invoke-ApiIntegrationTestShard.ps1` captures a mini dump on future hangs
   (`--blame-hang-dump-type mini`). Do **not** raise the 75-min `--blame-hang-timeout`.
5. No product/API behavior change beyond making a hosted service honor cancellation; test-harness and
   (optionally) CI-config changes otherwise.
6. `ArchLucid.Backend.slnf` compile check passes (`.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"`).

## Verification (read-only — do not run the full shard suite)

- Run only the two classes locally (InMemory — no SQL needed) per Step 1; confirm clean, fast
  start/dispose and that the host shuts down within 15s.
- `git grep`/`Grep` the chosen hosted service for `stoppingToken` / `StopAsync` usage to confirm token
  propagation.

## Reference artifacts (CI #2138, run id 27339170645)

- Blame (names hung test, no stack): `dotnet-blame-api-integration-shard-2`, `dotnet-blame-api-integration-shard-3`
- Shard class manifests: `integration-shard-manifest-2`, `integration-shard-manifest-3`
- vstest diag logs (deeper trace): `vstest-diag-api-integration-shard-2`, `vstest-diag-api-integration-shard-3`

## Related

- `.cursor/prompts/fix-ci-run-2134-all-failures.md` (Failure 4 — the older "blank test" SQL framing this corrects)
- `.cursor/prompts/fix-retrieval-query-smoke-integration-hang-ci.md` (Ask/retrieval bounded-token pattern)
- `.cursor/prompts/fix-idempotency-concurrency-resolution-timeout-ci.md` (separate slow-shard burst)
- CI workflow: `.github/workflows/ci.yml` (`dotnet-full-regression-core-api-integration`, `timeout-minutes: 240`, `-BlameHangTimeout 75min`)
