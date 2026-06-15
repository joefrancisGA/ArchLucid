# Fix: CI run #2155 — core-libs shard 1/4 testhost won't exit after `Host.Composition.Tests` pass

> Branch: `ci/fix-idempotency-concurrency-hang-guard` (run id `27416378916`, run #2155).
> This is the **Step 2 follow-up** to `.cursor/prompts/fix-ci-run-2138-core-libs-shard-no-blame-hang.md`.
> That prompt added `--blame-hang --blame-hang-timeout 30min` to `Invoke-CoreLibsTestShard.ps1`.
> The guard **worked**: it fired at 30 min and named the project + last-running test. Read "Evidence"
> before changing anything — do **not** re-diagnose from scratch and do **not** raise the 30-min budget.

## Symptom

`.NET: full regression — core libraries shard 1/4 (SQL, non-Api Category!=Slow)` (matrix `shard=0`,
job `81037013827`) failed with exit code 1.

```
13:36:12  Shard 1/4: ArchLucid.Host.Composition.Tests/ArchLucid.Host.Composition.Tests.csproj
13:36:12  Test run for ...ArchLucid.Host.Composition.Tests.dll
14:09:01  The active test run was aborted. Reason: Test host process crashed
14:09:01  Data collector 'Blame' message: The specified inactivity time of 30 minutes has elapsed.
          Collecting hang dumps from testhost and its child processes.
14:09:03  Passed!  - Failed: 0, Passed: 156, Skipped: 0, Total: 156, Duration: 1 s - ArchLucid.Host.Composition.Tests.dll
14:09:03  Test Run Aborted.
14:09:03  The active Test Run was aborted because the host process exited unexpectedly.
14:09:03  The test running when the crash occurred:
          ArchLucid.Host.Composition.Tests.ServiceCollectionExtensionsCompositionResolveTests.
          AddArchLucidApplicationServices_RealAzure_resolves_scoped_IAgentCompletionClient
14:12:40  ... remaining shard projects ran fine ...
14:12:41  ##[error]Process completed with exit code 1.
```

The project started at `13:36:12`, all tests finished within ~1 second, then the **testhost process
did not exit for ~32 minutes** until blame killed it at the 30-min inactivity ceiling.

## Evidence (this is the important part)

1. **All 156 tests PASSED** (`Passed: 156, Total: 156`). This is **not** a hung assertion and **not** a
   test that never returned — every test was recorded as passed before the host was killed.
2. The hang is therefore **after** the last test completed — at **testhost process exit / data
   collector finalization**. A leaked process-lifetime resource (most likely a non-background thread,
   or a data-collector flush) is keeping the process alive.
3. The named "test running when the crash occurred" —
   `ServiceCollectionExtensionsCompositionResolveTests.AddArchLucidApplicationServices_RealAzure_resolves_scoped_IAgentCompletionClient`
   — is simply the **last-started** test recorded by blame, not a test that hung. It is one of the
   composition-resolve tests that build a **full `AddArchLucidApplicationServices` `ServiceProvider`**
   and resolve the **real Azure OpenAI completion pipeline**.
4. It is **not** a per-test `await using` dispose hang: a hung provider disposal would prevent the test
   method from returning, so the test would not be reported `Passed`. It was. So provider disposal
   inside each test completed.
5. The named test resolves via the **API-key** construction path (`AzureOpenAI:ApiKey` is set,
   `AuthenticationMode` defaults to `ApiKey`), so it constructs
   `new AzureOpenAIClient(endpointUri, new ApiKeyCredential(apiKey))` — **`DefaultAzureCredential` is
   NOT on this resolution path**, so an IMDS/managed-identity token-probe hang is **ruled out for this
   test**. (Keep `DefaultAzureCredential` in mind only if a different resolve test that uses
   `AuthenticationMode=ManagedIdentity` is implicated by the dump — none in this class currently do.)

### Why a managed stack is missing

The runner **did** write a hang dump:

```
.../coverage-full-core-libs-shard-0/5e43b6b9-.../dotnet_7004_20260612T140858_hangdump.dmp
.../coverage-full-core-libs-shard-0/5e43b6b9-.../Sequence_78505981fc1143a49a34f32df65ded4f.xml
```

…but the CI workflow only uploads the **`Sequence_*.xml`** (test-naming) artifact for core-libs
shards. The `*.dmp` (the only thing with a managed thread stack) is **discarded**. So we know *which
project* hangs but not *which thread*. Fixing that upload gap is Step 1.

## Files

- `ArchLucid.Host.Composition.Tests/ServiceCollectionExtensionsCompositionResolveTests.cs`
  — the composition-resolve tests; the three `RealAzure_*` tests (lines ~36, ~72) build a full
  provider and resolve the Azure completion pipeline; the `CircuitBreakingContentSafetyGuard` test
  (line ~138) resolves a real `AzureContentSafetyGuard` (Azure Content Safety SDK client).
- `scripts/ci/Invoke-CoreLibsTestShard.ps1` — `dotnet test` invocation (line ~77); already has
  `--blame-hang --blame-hang-timeout 30min`, **no `--blame-hang-dump-type`**.
- `.github/workflows/ci.yml` — core-libs blame upload step (line ~2173) globs `**/Sequence_*.xml`
  only; **does not upload `*.dmp`**.
- `ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs` — constructs `AzureOpenAIClient`
  (API-key ctor line ~105/123; managed-identity factory line ~59/75).
- `ArchLucid.AgentRuntime/CircuitBreakingAgentCompletionClient.cs` — `IDisposable`; `Dispose`
  chains to `_inner` (line ~215).
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`
  — Azure completion client registration (singleton, line ~505; API-key vs ManagedIdentity at ~528).

## Step 1 — capture the managed dump (CI instrumentation only)

The dump is already produced; we just need to keep it and add a managed-stack dump type.

### 1a. `scripts/ci/Invoke-CoreLibsTestShard.ps1`

Add a dump-type and pass it to `dotnet test`:

```powershell
param(
    # ... existing params ...
    [string]$BlameHangTimeout = '30min',

    [string]$BlameHangDumpType = 'mini'     # ADD: 'mini' is enough for a managed thread stack
)
```

```powershell
& dotnet test $projectPath `
    --no-build `
    -c $Configuration `
    --settings $RunSettingsPath `
    --filter $Filter `
    --collect:'XPlat Code Coverage' `
    --results-directory $ResultsDirectory `
    --logger 'console;verbosity=minimal' `
    --logger "trx;LogFilePrefix=full-core-libs-shard-$ShardIndex-" `
    --blame-hang `
    --blame-hang-timeout $BlameHangTimeout `
    --blame-hang-dump-type $BlameHangDumpType   # ADD
```

### 1b. `.github/workflows/ci.yml`

Widen the existing `dotnet-blame-core-libs-shard-${{ matrix.shard }}` upload (line ~2173) so it also
captures the dump and the full crash dump dir. Either change the glob to include `*.dmp`, or add a
second path entry:

```yaml
- uses: actions/upload-artifact@v6
  if: always()
  with:
    name: dotnet-blame-core-libs-shard-${{ matrix.shard }}
    path: |
      ${{ runner.temp }}/coverage-full-core-libs-shard-${{ matrix.shard }}/**/Sequence_*.xml
      ${{ runner.temp }}/coverage-full-core-libs-shard-${{ matrix.shard }}/**/*.dmp
    if-no-files-found: ignore
```

Do **not** raise `--blame-hang-timeout` above 30min — the goal is a fast, attributable failure, not a
longer wait.

## Step 2 — reproduce locally (no SQL needed) and get the thread stack

The resolve tests use `ArchLucid:StorageProvider=InMemory`, so they need **no** SQL Server even though
the connection string points at localhost (it is never opened during resolution). Run just this class
with a short hang budget and a mini dump:

```powershell
dotnet test ArchLucid.Host.Composition.Tests/ArchLucid.Host.Composition.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~ServiceCollectionExtensionsCompositionResolveTests' `
    --blame-hang --blame-hang-timeout 2min --blame-hang-dump-type mini
```

- If it hangs locally, open the `.dmp` (Visual Studio, or `dotnet-dump analyze <file>` then
  `clrstack -all` / `threads`) and find the **non-background thread** (or the data-collector thread)
  that is still alive after all tests pass. That thread's stack names the offending resource.
- If it does **not** reproduce locally (the leak may be load- or environment-dependent), rely on the
  CI dump from Step 1 on the next run, then return here.

### Leading hypotheses to confirm with the dump (do not guess-fix without it)

- **A leaked foreground thread from constructing a real Azure SDK client.** The `RealAzure_*` resolve
  tests and the `CircuitBreakingContentSafetyGuard` test each construct real Azure SDK clients
  (`AzureOpenAIClient`, `AzureContentSafetyGuard`). Confirm whether any of them, or a decorator in the
  completion chain (`CostGuardrailInterceptor` → … → `CircuitBreakingAgentCompletionClient` →
  `AzureOpenAiCompletionClient`), starts a `Thread` with `IsBackground=false`, a non-disposed timer
  loop, or an `EventListener`/metrics pump that outlives provider disposal.
- **A data-collector (coverlet `XPlat Code Coverage`) flush hang at process exit.** The dump may show
  the coverage collector finalizing. If so, the fix is harness/CI-side (see Step 3, option C).
- **An un-disposed singleton.** `BuildServiceProvider()` does not eagerly construct, but resolved
  singletons (e.g. the singleton `AzureOpenAiCompletionClient`, line ~505) live until provider
  dispose. Confirm each implements and honors `Dispose`/`DisposeAsync` and that nothing it owns spins
  a foreground thread.

## Step 3 — fix the leak at the source (driven by the dump)

Pick the remedy that matches the thread the dump names:

- **(A) Foreground thread / undisposed resource in a completion-pipeline type.** Make the owning type
  `IDisposable`/`IAsyncDisposable`, dispose the inner Azure SDK client / cancel and join the thread in
  `Dispose`, and ensure it is registered so the DI container disposes it. Prefer `IsBackground=true`
  for any worker thread that must not block process exit. Follow the token-honoring `BackgroundService`
  pattern under `ArchLucid.Host.Core/Hosted/`.
- **(B) Real Azure SDK client constructed in a unit/integration-category resolve test that has no
  business making/holding a connection.** These tests only assert the **shape** of the resolved
  decorator chain (`BeOfType`, `DecoratorChainContains`). If the dump shows the Azure SDK client (or
  its credential/transport) is the leak, the cleanest fix is to keep asserting composition shape
  **without** holding a live SDK transport open past the test — e.g. ensure the resolved client is
  disposed deterministically within the test (it already uses `await using` on the provider; confirm
  the singleton client is actually reached by provider disposal), or have the test resolve through a
  scope that the provider owns. Do **not** weaken the assertions.
- **(C) Coverlet flush hang.** If the collector is the offender, exclude this assembly from
  `XPlat Code Coverage` collection on the shard, or bound the collector — but only after the dump
  confirms it; do not pre-emptively drop coverage.

Whatever the fix, it must make the **testhost exit within seconds** of the last test completing.

## Acceptance criteria

1. Core-libs shard 1/4 (`shard=0`) completes within the **30-min** blame budget; the
   `ArchLucid.Host.Composition.Tests` testhost **exits promptly** (seconds, not minutes) after its
   156 tests pass. No `Sequence_*.xml` is produced for that project on a healthy run.
2. `Invoke-CoreLibsTestShard.ps1` passes `--blame-hang-dump-type mini`, and the CI workflow uploads
   the `*.dmp` alongside `Sequence_*.xml` for core-libs shards, so any future hang yields a managed
   stack in one run.
3. The leaked resource identified from the dump is fixed at its source (disposed / made background /
   not held open), with no weakening of the composition-resolve assertions.
4. No product/API behavior change beyond resource lifecycle/disposal; test-harness and CI-config
   changes otherwise.
5. `ArchLucid.Backend.slnf` compile check passes:
   `.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"`.

## Verification (read-only — do not run the full shard matrix)

- Run only `ServiceCollectionExtensionsCompositionResolveTests` locally per Step 2 with
  `--blame-hang-timeout 2min`; confirm the run completes and the testhost exits with no hang dump.
- `Grep` the implicated type for `new Thread`, `IsBackground`, `Timer`, `Task.Run`, and `Dispose` to
  confirm the thread/resource is now bounded and disposed.
- Confirm `Select-String "blame-hang-dump-type" scripts/ci/Invoke-CoreLibsTestShard.ps1` matches and
  the `ci.yml` core-libs blame upload step lists `*.dmp`.

## Reference artifacts (CI #2155, run id 27416378916, job 81037013827)

- `dotnet-blame-core-libs-shard-0` — `Sequence_78505981fc1143a49a34f32df65ded4f.xml`
  (names `...RealAzure_resolves_scoped_IAgentCompletionClient`; **no `.dmp` uploaded** — Step 1 fixes
  this).
- `dotnet_7004_20260612T140858_hangdump.dmp` — produced on the runner, **not** uploaded.

## Related

- `.cursor/prompts/fix-ci-run-2138-core-libs-shard-no-blame-hang.md` — Step 1 that added the blame
  guard this run vindicates (it explicitly predicted `Host.Composition.Tests` as a likely culprit).
- `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` — the unbounded-host-lifecycle hang on
  API integration shards (same blame-then-fix methodology; mini-dump capture pattern).
- `.cursor/prompts/fix-ci-run-2138-trial-preseed-shard-timeout.md` — background-worker-not-disabled
  pattern for test hosts.
- CI workflow: `.github/workflows/ci.yml` — `dotnet-full-regression-core-libs`
  (`Invoke-CoreLibsTestShard.ps1`, `-BlameHangTimeout 30min`).
