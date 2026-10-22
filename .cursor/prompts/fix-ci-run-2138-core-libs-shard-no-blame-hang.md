# Fix: CI run #2138 — core-libs shard 1/4 cancelled at 3-hour job timeout (no blame-hang guard)

> Branch: `ci/fix-idempotency-concurrency-hang-guard`.
> Third issue from CI run 27339170645, alongside the InMemory host hang (shards 3/6 + 4/6) and the
> trial-preseed background service hang (API shard 2/6).

## Symptom

`.NET: full regression — core libraries shard 1/4 (SQL, non-Api Category!=Slow)` (matrix `shard=0`)
ran for **3 hours 01 minute** and was canceled at the `timeout-minutes: 180` GitHub job ceiling.

- No blame dump was produced (see **Root cause** below).
- No TRX was uploaded (the run was killed before artifact upload completed for that project).
- The 6 assigned test projects are:
  - `ArchLucid.AgentRuntime.Tests`
  - `ArchLucid.Architecture.Tests`
  - `ArchLucid.ContextIngestion.Tests`
  - `ArchLucid.Host.Composition.Tests`
  - `ArchLucid.Jobs.Cli.Tests`
  - `ArchLucid.Provenance.Tests`

## Root cause

`Invoke-CoreLibsTestShard.ps1` runs each project with `dotnet test` **without `--blame-hang`**:

```powershell
& dotnet test $projectPath `
    --no-build `
    -c $Configuration `
    --settings $RunSettingsPath `
    --filter $Filter `
    --collect:'XPlat Code Coverage' `
    --results-directory $ResultsDirectory `
    --logger 'console;verbosity=minimal' `
    --logger "trx;LogFilePrefix=full-core-libs-shard-$ShardIndex-"
```

Without `--blame-hang`, any stuck test runs silently until the GitHub `timeout-minutes` kills the
runner. No Sequence XML is produced, no dump is collected, no blame artifact appears — the test
host just goes dark. Compare with `Invoke-ApiIntegrationTestShard.ps1`, which already uses
`--blame-hang --blame-hang-timeout 75min` for every integration shard chunk.

### Why the exact stuck test is unknown for this run

Because the shard ran for 3 hours without a blame file, the specific test or project cannot be
identified from the current artifacts. The TRX upload was also aborted. The most likely candidates
(based on project contents) are:

- `ArchLucid.AgentRuntime.Tests` — agent execution tests that may involve timed async pipelines,
  `Task.Delay`-driven retries, or background services started during test host composition.
- `ArchLucid.Host.Composition.Tests` — DI composition validation; if any test calls
  `IHost.StartAsync` directly and the host starts a background worker that doesn't respect
  `stoppingToken`, the test process never exits.

## Fix — two changes

### 1. Add `--blame-hang` to `Invoke-CoreLibsTestShard.ps1`

**File:** `scripts/ci/Invoke-CoreLibsTestShard.ps1`

Add a `BlameHangTimeout` parameter and pass it to every `dotnet test` invocation:

```powershell
param(
    [Parameter(Mandatory)]
    [int]$ShardIndex,

    [int]$ShardCount = 4,

    [string]$Configuration = 'Release',

    [Parameter(Mandatory)]
    [string]$ResultsDirectory,

    [string]$Filter = 'Category!=Slow',

    [string]$RunSettingsPath = 'coverage.runsettings',

    [string]$BlameHangTimeout = '30min'     # ← ADD parameter (30 min is generous for unit/library tests)
)
```

And in the `dotnet test` invocation:

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
    --blame-hang `                          # ← ADD
    --blame-hang-timeout $BlameHangTimeout  # ← ADD
```

Add blame artifact upload to the core-libs shard job in `.github/workflows/ci.yml` (find the step
that runs `Invoke-CoreLibsTestShard.ps1` and add an `actions/upload-artifact` step analogous to
the one already present for `dotnet-blame-api-integration-shard-*`):

```yaml
- uses: actions/upload-artifact@v6
  if: always()
  with:
    name: dotnet-blame-core-libs-shard-${{ matrix.shard }}
    path: ${{ runner.temp }}/coverage-full-core-libs-shard-${{ matrix.shard }}/**/Sequence_*.xml
    if-no-files-found: ignore
```

### 2. Reproduce and fix the underlying stuck test (once blame fires)

With blame-hang in place, the **next** CI run will produce a `Sequence_*.xml` naming the exact
stuck test and project. Follow the investigation steps from
`.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` (Step 1–2) once that artifact is
available.

In the meantime, audit `ArchLucid.AgentRuntime.Tests` and `ArchLucid.Host.Composition.Tests` for:

- Tests that create an `IHost` or `WebApplicationFactory` without a bounded shutdown (same unbounded
  lifecycle pattern identified in `AlertLifecycleWebAppFactory` for API shards).
- Tests that call `Task.Delay` or retry-loops without a `CancellationToken`.
- Tests that depend on external resources (SQL, network, real AI endpoints) without a timeout.

If `Host.Composition.Tests` has composition-validation tests that start a real host
(`Host.CreateDefaultBuilder().Build().StartAsync()`), add the same
`HostOptions.ShutdownTimeout = TimeSpan.FromSeconds(15)` and background-worker disablement
(`TrialArchitecturePreseed:Enabled=false`, `Demo:SeedOnStartup=false`, etc.) that
`BaseIntegrationTestFixture` uses. See `.cursor/prompts/fix-ci-run-2138-trial-preseed-shard-timeout.md`
for the full list of workers that must be disabled in test contexts.

## Acceptance criteria

1. `Invoke-CoreLibsTestShard.ps1` passes `--blame-hang --blame-hang-timeout 30min` to every
   `dotnet test` invocation.
2. The CI workflow uploads `dotnet-blame-core-libs-shard-*` artifacts (Sequence XML) when present.
3. On the next CI run, if the core-libs shard hangs, a `Sequence_*.xml` blame file names the stuck
   test within 30 minutes; the runner is not silently consumed for 3 hours.
4. No changes to test assertions or production code in this step (blame-hang is a CI instrumentation
   change only; the actual stuck-test fix follows in the next iteration once the blame fires).

## Verification

```powershell
# Confirm blame parameter is present in the script
Select-String "blame-hang" scripts/ci/Invoke-CoreLibsTestShard.ps1
```

## Related

- `scripts/ci/Invoke-ApiIntegrationTestShard.ps1` — canonical example that already uses blame-hang
- `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` — InMemory API host lifecycle hang
- `.cursor/prompts/fix-ci-run-2138-trial-preseed-shard-timeout.md` — TrialArchitecturePreseed worker
  not disabled (likely cause of some non-Api host hangs too)
- CI workflow: `.github/workflows/ci.yml` — `dotnet-full-regression-core-libs` job
  (`timeout-minutes: 180`, `Invoke-CoreLibsTestShard.ps1`)
