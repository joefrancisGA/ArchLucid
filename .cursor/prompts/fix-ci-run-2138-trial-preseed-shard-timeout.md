# Fix: CI run #2138 — Api.Tests integration shard 2/6 (SQL) cancelled at 4-hour job timeout

> Branch: `ci/fix-idempotency-concurrency-hang-guard`.
> Companion issue to `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` (InMemory hosts).
> This prompt covers the **SQL**-backed factory hang on the same CI run.

## Symptom

`.NET: full regression — Api.Tests integration shard 2/6 (SQL)` (matrix `shard=1`) ran for exactly
**4 hours 01 minute** and was killed by GitHub's `timeout-minutes: 240` job ceiling — **not** the
75-minute `--blame-hang-timeout`. No blame dump was produced. The job was `canceled`, not `failure`.

## Evidence — vstest-diag shows the exact culprit

`vstest-diag-api-integration-shard-1` (artifact from run 27339170645, 468K lines) shows the test
host was alive and **outputting SQL traces** continuously until GitHub killed the runner at 14:42:19.
The last 360K lines of the log are dominated by a repeating 5-minute cycle:

```
TestHostManagerCallbacks: ... TrialArchitecturePreseedFailedUtc, TrialArchitecturePreseedLastError,
TestHostManagerCallbacks: ... AND TrialArchitecturePreseedFailedUtc IS NULL
TestHostManagerCallbacks: ... Authority pipeline failed; transaction rolled back. RunId=<guid>
```

The cycle repeats at exactly 14:30, 14:35, 14:40 (every 5 minutes), then the job is killed at
14:42:19. The test host was NOT idle — it was actively executing — so the blame-hang timer never
fired (blame only triggers on **inactivity**, not slow execution). Every test in the shard had
already completed; the host was alive because a background `IHostedService` was running inside the
last-alive `WebApplicationFactory`-backed SQL host.

### Root cause: `TrialArchitecturePreseedHostedService` not disabled in integration fixtures

`TrialArchitecturePreseedHostedService` (`ArchLucid.Host.Core/Hosted/TrialArchitecturePreseedHostedService.cs`):

- Registered automatically when `TrialArchitecturePreseed:Enabled` = `true` (the default; see
  `TrialArchitecturePreseedOptions.Enabled = true` in `ArchLucid.Core/Configuration/TrialArchitecturePreseedOptions.cs`).
- Runs a poll loop: selects tenants with `TrialArchitecturePreseedFailedUtc IS NULL` from the SQL
  catalog, calls `TrialArchitecturePreseedExecutor.TryProcessTenantAsync` for each, catches
  exceptions, waits `PollIntervalSeconds` (default 15s), and repeats.
- In a SQL integration test host the test catalog contains real tenant rows. The executor runs the
  authority pipeline (configured at `AuthorityPipeline:PipelineTimeout = 00:05:00` in integration
  tests), which fails with "transaction rolled back" — so each iteration takes ~5 minutes. The 15s
  poll delay is overwhelmed by the 5-min pipeline execution.

`BaseIntegrationTestFixture.ConfigureWebHost` disables many background workers:

```csharp
[ArchitectureProjectRetentionPurgeOptions.SectionName + ":Enabled"] = "false",
[SampleRunPurgeOptions.SectionName + ":Enabled"] = "false",
[DraftIntakeReaperOptions.SectionName + ":Enabled"] = "false",
[TenantErasurePurgeOptions.SectionName + ":Enabled"] = "false",
```

**`TrialArchitecturePreseed:Enabled` is absent from this list.** The service runs unchecked in every
SQL-backed API integration test factory, keeping hosts alive for hours after tests complete.

## File

`ArchLucid.Api.Tests/BaseIntegrationTestFixture.cs` — the `settings` dictionary inside
`ConfigureWebHost` → `builder.ConfigureAppConfiguration((_, config) => …)` (lines ~46–86).

## Fix — one-line addition

Add the following entry to the settings dictionary in `BaseIntegrationTestFixture.ConfigureWebHost`,
**alongside** the existing `*:Enabled = "false"` entries:

```csharp
[TrialArchitecturePreseedOptions.SectionName + ":Enabled"] = "false",
```

Add the required `using ArchLucid.Core.Configuration;` import if not already present.

**Do not** change the registration guard in `ServiceCollectionExtensions.TrialArchitecturePreseed.cs`
— the guard already respects `snapshot.Enabled` at startup, so the setting change is all that is
needed. No production code changes.

### Target shape (the addition is marked):

```csharp
builder.ConfigureAppConfiguration((_, config) =>
{
    Dictionary<string, string?> settings = new()
    {
        // ... existing entries ...
        [ArchitectureProjectRetentionPurgeOptions.SectionName + ":Enabled"] = "false",
        [SampleRunPurgeOptions.SectionName + ":Enabled"] = "false",
        [DraftIntakeReaperOptions.SectionName + ":Enabled"] = "false",
        [TenantErasurePurgeOptions.SectionName + ":Enabled"] = "false",
        [TrialArchitecturePreseedOptions.SectionName + ":Enabled"] = "false",   // ← ADD
        // ... rest of entries ...
    };
    // ...
});
```

## Acceptance criteria

1. `TrialArchitecturePreseedHostedService` does **not** start in any API integration test host; the
   `TrialArchitecturePreseed:Enabled = false` setting short-circuits registration at startup.
2. SQL-backed `WebApplicationFactory` instances (e.g., `GreenfieldSqlApiFactory`) dispose promptly
   after tests complete — no `TrialArchitecturePreseedFailedUtc` queries appear in a local vstest
   diag run.
3. Api.Tests integration shard 2/6 completes within the 75-minute blame-hang window (likely well
   under 30 minutes once the service is disabled).
4. No production behavior changes — the service is only suppressed in test fixtures.
5. `ArchLucid.Backend.slnf` compile check passes.

## Verification (read-only — no full shard needed)

```powershell
# Search confirms no TrialArchitecturePreseed log output during a short targeted test run:
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter "FullyQualifiedName~ArchitectureQuickScanIntegrationTests|FullyQualifiedName~AuditExportTenantIsolationIntegrationTests" `
    --diag "$env:TEMP\check-preseed.log"
# Then: Select-String "TrialArchitecture" "$env:TEMP\check-preseed.log" should return nothing.
```

## Audit — other workers that may also be missing from the disable list

While fixing this, quickly scan `InMemoryStorageProviderRegistrar.cs` and
`ServiceCollectionExtensions.*.cs` for any `AddHostedService` calls whose corresponding
`*Options.Enabled` flag is **not** already in `BaseIntegrationTestFixture`'s settings dictionary.
Common patterns to watch for:

- Any worker that polls SQL on a timer and runs the authority or agent pipeline
- Any worker whose `StartAsync` makes network calls (SQL, Service Bus, external HTTP) that would
  block or retry indefinitely in a disconnected test environment

Add matching `:Enabled = "false"` entries for any found, following the established pattern.

## Related

- CI artifact: `vstest-diag-api-integration-shard-1` (run 27339170645) — 5-min cycle at 14:30–14:40
- `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md` — InMemory host lifecycle hang
  (shards 3/6 and 4/6) on the same CI run
- `ArchLucid.Host.Core/Hosted/TrialArchitecturePreseedHostedService.cs`
- `ArchLucid.Core/Configuration/TrialArchitecturePreseedOptions.cs`
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.TrialArchitecturePreseed.cs`
