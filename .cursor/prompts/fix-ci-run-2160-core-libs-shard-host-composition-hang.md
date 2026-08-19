# Fix: CI run #2160 — core-libs shard 1/4 testhost won't exit after `Host.Composition.Tests` pass (dump now available)

> Run #2160. **Recurrence** of `.cursor/prompts/fix-ci-run-2155-core-libs-shard-host-composition-hang.md`.
> That prompt's **Step 1 (CI instrumentation) is already merged** — `Invoke-CoreLibsTestShard.ps1` passes
> `--blame-hang-dump-type mini` and `.github/workflows/ci.yml` uploads `*.dmp`. **Verified in the tree.**
> #2160 is the **first run that produced a downloadable managed hang dump.** Your job is **Step 2–3**:
> pull the dump, read the leaked-thread stack, and **fix the leak at its source**. Do **not** re-add
> instrumentation, do **not** raise the 30-min budget, and do **not** re-diagnose from scratch.

## Symptom

`.NET: full regression — core libraries shard 1/4 (SQL, non-Api Category!=Slow)` (matrix `shard=0`)
failed with exit code 1. Same shape as #2155:

```
Shard 1/4: ArchLucid.Host.Composition.Tests/ArchLucid.Host.Composition.Tests.csproj
Test run for ...ArchLucid.Host.Composition.Tests.dll (.NETCoreApp,Version=v10.0)
The active test run was aborted. Reason: Test host process crashed
Data collector 'Blame' message: The specified inactivity time of 30 minutes has elapsed.
  Collecting hang dumps from testhost and its child processes.
Passed!  - Failed: 0, Passed: 137, Skipped: 0, Total: 137, Duration: 1 s - ArchLucid.Host.Composition.Tests.dll
Test Run Aborted.
The active Test Run was aborted because the host process exited unexpectedly.
The test running when the crash occurred:
  ArchLucid.Host.Composition.Tests.ServiceCollectionExtensionsCompositionResolveTests.
  AddArchLucidApplicationServices_RealAzure_resolves_scoped_IAgentCompletionClient
```

The project's **137 tests all PASSED in ~1 s**, then the testhost **did not exit for ~30 minutes** until
blame killed it at the inactivity ceiling. This is a **process-exit / shutdown leak**, not a hung test.

## Evidence (carry-over from #2155 — still holds)

1. **All 137 tests PASSED.** Not a hung assertion and not a test that never returned — every test was
   recorded `Passed` before the host was killed. The hang is **after** the last test, at testhost
   process exit / data-collector finalization. A leaked process-lifetime resource (a non-background
   thread, an un-canceled timer/loop, or a coverlet flush) is keeping the process alive.
2. The named "test running when the crash occurred" is just the **last-started** test recorded by blame,
   not a hung test.
3. The named test resolves via the **API-key** path (`AzureOpenAI:ApiKey="primary-test-key"`,
   `AuthenticationMode` defaults to `ApiKey`) → `new AzureOpenAIClient(endpointUri, new ApiKeyCredential(apiKey))`.
   **`DefaultAzureCredential` is NOT on this resolution path**, so an IMDS/managed-identity token-probe
   hang is **ruled out for this test**. (Keep `DefaultAzureCredential` in mind only if the dump implicates a
   `ManagedIdentity` resolve path — none of the current resolve tests use it.)
4. It is **not** a per-test `await using` provider-dispose hang: a hung provider disposal would prevent the
   test method from returning, so the test would not be `Passed`. It was.

## What changed since #2155 (do not redo)

- `scripts/ci/Invoke-CoreLibsTestShard.ps1` already declares `[string]$BlameHangDumpType = 'mini'`
  (line ~19) and passes `--blame-hang --blame-hang-timeout $BlameHangTimeout --blame-hang-dump-type
  $BlameHangDumpType` (lines ~88–90).
- `.github/workflows/ci.yml` `dotnet-blame-core-libs-shard-${{ matrix.shard }}` upload (line ~2217)
  already globs both `**/Sequence_*.xml` **and** `**/*.dmp`.
- So #2160 uploaded a real managed dump: `dotnet_6956_20260612T202806_hangdump.dmp` (plus
  `Sequence_5c18b34680fa45e09fc32a9fd5c665af.xml`) under artifact `dotnet-blame-core-libs-shard-0`.

## Step 1 — get the managed thread stack from the #2160 dump

Pull the artifact, then open the dump and find the thread(s) still alive after all tests passed.

```powershell
# Download the blame artifact for shard 0 from run #2160 (resolve <run-id> via gh run list)
gh run download <run-id> --name dotnet-blame-core-libs-shard-0 --dir ./_ci2160

# Analyze the hang dump (install once: dotnet tool install -g dotnet-dump)
dotnet-dump analyze ./_ci2160/**/dotnet_6956_20260612T202806_hangdump.dmp
```

In the analyzer:

- `threads` then `clrstack -all` — identify every **non-background managed thread** still running, or a
  data-collector/finalizer thread blocked on a flush.
- `dumpasync` — look for a stuck `await` (e.g. a retry `Task.Delay`, an IMDS/credential probe, an HTTP
  send) parked on a thread that blocks process exit.
- The thread that is **not** a normal threadpool/GC worker is the offender; its stack names the leaking
  resource. **Fix that resource — do not guess.**

If you cannot get the dump (artifact expired), reproduce locally per Step 2 first.

## Step 2 — reproduce locally (no SQL needed) and confirm

The resolve tests use `ArchLucid:StorageProvider=InMemory`; the localhost connection string is never
opened during resolution. Run just this class with a short hang budget and a mini dump:

```powershell
dotnet test ArchLucid.Host.Composition.Tests/ArchLucid.Host.Composition.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~ServiceCollectionExtensionsCompositionResolveTests' `
    --blame-hang --blame-hang-timeout 2min --blame-hang-dump-type mini
```

- If it reproduces, analyze the local `.dmp` the same way and confirm the same offending thread as the
  CI dump.
- If it does **not** reproduce (leak may be load-/environment-dependent), rely on the CI dump from
  Step 1.

## Suspect surface (confirm against the dump — these only narrow the search)

The two `RealAzure_*` resolve tests build a full `AddArchLucidApplicationServices` provider and resolve
the real Azure completion pipeline; the `CircuitBreakingContentSafetyGuard` test resolves a real Azure
Content Safety client. Candidate process-lifetime owners:

- `ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs` — wraps `AzureOpenAIClient`; `Dispose()`
  (line ~703) chains to the SDK client's `DisposeAsync`/`Dispose`. Registered as a **singleton**
  (`services.AddSingleton<AzureOpenAiCompletionClient>`,
  `ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` line ~505), so it lives until provider
  dispose. Confirm provider disposal actually reaches and disposes this singleton (and the SDK
  transport behind it) — a still-open SDK HTTP transport or credential pump is a prime suspect.
- `ArchLucid.AgentRuntime/CircuitBreakingAgentCompletionClient.cs` — `IDisposable`; `Dispose()` (line
  ~215) chains to `_inner`. Holds a `CircuitBreakerGate` + `ResiliencePipeline` (Polly). Check whether
  the gate/pipeline (or `CircuitBreakerGateMetricsRegistry.Register`, line ~1078 of the registration)
  starts a timer/`EventListener`/metrics pump that is never disposed/unregistered.
- `ArchLucid.AgentRuntime/Safety/CircuitBreakingContentSafetyGuard.cs` + the real
  `AzureContentSafetyGuard` resolved by the `..._when_enabled_with_endpoint_and_key` test — another
  real Azure SDK client (Content Safety) whose transport may outlive the provider.
- **Coverlet `XPlat Code Coverage` flush at process exit.** If the dump shows the coverage collector
  finalizing rather than product code, the leak is harness/CI-side (Step 3 option C).

## Step 3 — fix the leak at the source (driven by the dump)

Pick the remedy matching the thread the dump names:

- **(A) Foreground thread / un-canceled timer / undisposed resource in a completion-pipeline type.**
  Make the owning type `IDisposable`/`IAsyncDisposable`, dispose the inner Azure SDK client, cancel and
  join the thread / dispose the timer in `Dispose`, and register it so the DI container disposes it.
  Prefer `IsBackground=true` for any worker thread that must not block process exit. Follow the
  token-honoring `BackgroundService` pattern under `ArchLucid.Host.Core/Hosted/`.
- **(B) A real Azure SDK client (OpenAI / Content Safety) or its credential/transport held open past
  the test.** Ensure the resolved singleton is reached by provider disposal (the tests already use
  `await using`/`using` on the provider; confirm the singleton is actually disposed). Do **not** weaken
  the composition-shape assertions (`BeOfType`, `DecoratorChainContains`).
- **(C) Coverlet flush hang.** If the collector is the offender (dump shows coverage finalization),
  bound or exclude this assembly from `XPlat Code Coverage` on the shard — but **only after the dump
  confirms it**; do not pre-emptively drop coverage.

Whatever the fix, the **testhost must exit within seconds** of the last test completing.

## Acceptance criteria

1. Core-libs shard 1/4 (`shard=0`) completes well inside the **30-min** blame budget; the
   `ArchLucid.Host.Composition.Tests` testhost **exits promptly** (seconds, not minutes) after its 137
   tests pass. No `Sequence_*.xml`/`*.dmp` is produced for that project on a healthy run.
2. The leaked resource identified from the #2160 dump is fixed at its source (disposed / made
   background / un-registered / not held open), with the offending thread named in the PR description.
3. No weakening of the composition-resolve assertions; no product/API behavior change beyond resource
   lifecycle/disposal (plus any CI-only coverage scoping if Step 3-C applies).
4. `ArchLucid.Backend.slnf` compile check passes:
   `.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"`.

## Verification (read-only — do not run the full shard matrix)

- Run only `ServiceCollectionExtensionsCompositionResolveTests` locally per Step 2 with
  `--blame-hang-timeout 2min`; confirm the run completes and **no** hang dump is written.
- `Grep` the implicated type for `new Thread`, `IsBackground`, `Timer`, `Task.Run`, `EventListener`,
  `Register(`, and `Dispose` to confirm the thread/resource is now bounded and disposed.

## Reference artifacts (CI #2160, core-libs shard 0)

- `dotnet-blame-core-libs-shard-0` → `dotnet_6956_20260612T202806_hangdump.dmp` (managed stack — **the
  key new evidence**) and `Sequence_5c18b34680fa45e09fc32a9fd5c665af.xml` (names
  `...RealAzure_resolves_scoped_IAgentCompletionClient`).
- TRX: `full-core-libs-shard-0-_net10.0_20260612202812.trx`.

## Related

- `.cursor/prompts/fix-ci-run-2155-core-libs-shard-host-composition-hang.md` — same hang; added the
  mini-dump + `.dmp` upload this run finally exercised (Step 1, now merged).
- `.cursor/prompts/fix-ci-run-2138-core-libs-shard-no-blame-hang.md` — added the original blame guard.
- `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` — unbounded-host-lifecycle hang on API
  shards (same blame-then-fix + mini-dump methodology).
- `.cursor/prompts/fix-ci-run-2138-trial-preseed-shard-timeout.md` — background-worker-not-disabled
  pattern for test hosts.
- CI workflow: `.github/workflows/ci.yml` — `dotnet-full-regression-core-libs`
  (`Invoke-CoreLibsTestShard.ps1`, `-BlameHangTimeout 30min`, `-BlameHangDumpType mini`).
