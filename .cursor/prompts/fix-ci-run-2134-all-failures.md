# Fix: CI run 27319720608 — all failing jobs (branch `ci/fix-idempotency-concurrency-hang-guard`)

## Overview

CI run **27319720608** (run #2134) has seven failing jobs across two failure groups. Fix them in the
order listed below — the TypeScript compile error is the fastest unblock; the three .NET failures are
independent and can follow in sequence.

---

## Failure 1 — All four Operator UI jobs · TypeScript TS2769 / TS18046

### Symptom

```
src/components/cto-demo/CtoDemoHowItWorksTrigger.tsx(52,11): error TS2769: No overload matches this call.
src/components/cto-demo/CtoDemoHowItWorksTrigger.tsx(52,26): error TS18046: 'customTrigger.props' is of type 'unknown'.
Process completed with exit code 2.
```

All four UI jobs fail on this single compile error:
- `Operator UI: lint, typecheck, production build`
- `Operator UI: Playwright mock functional (mock API)`
- `Operator UI: axe-core WCAG 2.1 A/AA (mock)`
- `Containers: Docker build smoke`

### Root cause

In React 19 typings, `ReactElement` without an explicit generic parameter has `props: unknown` instead
of `props: any`. Line 52 reads `customTrigger.props["data-testid"]` directly, but `props` is `unknown`
so TypeScript cannot index it, producing TS18046. The `cloneElement` call fails to match any overload
(TS2769) because the second-argument type cannot be verified against `Partial<unknown>`.

File: `archlucid-ui/src/components/cto-demo/CtoDemoHowItWorksTrigger.tsx`, lines 49–54.

Current:

```typescript
const trigger =
    customTrigger !== undefined && isValidElement(customTrigger)
      ? cloneElement(customTrigger, {
          "data-testid": customTrigger.props["data-testid"] ?? "cto-demo-how-it-works-custom-trigger",
        })
      : defaultTrigger;
```

### Fix

Cast `customTrigger` to `ReactElement<Record<string, unknown>>` before the `cloneElement` call so
TypeScript can verify the props index access and the overload argument:

```typescript
const typedTrigger = customTrigger as ReactElement<Record<string, unknown>>;
const trigger =
    customTrigger !== undefined && isValidElement(customTrigger)
      ? cloneElement(typedTrigger, {
          "data-testid": typedTrigger.props["data-testid"] ?? "cto-demo-how-it-works-custom-trigger",
        })
      : defaultTrigger;
```

The `readonly trigger?: ReactElement` prop type stays unchanged — only the internal cast changes.

### Acceptance criteria

1. Only `CtoDemoHowItWorksTrigger.tsx` changes (the `typedTrigger` local and the two references).
2. `npm run typecheck` exits 0 in `archlucid-ui/`.
3. No Playwright or axe-core functional tests change.

---

## Failure 2 — `.NET integration shard 3/6` · `DualPipelineRegistrationDisciplineTests` (2 failures)

### Symptom

```
Failed DualPipelineRegistrationDisciplineTests.AuthorityGoldenManifestRepository_resolves_to_Decisioning_or_Persistence_concrete
  Error Message:
   System.InvalidOperationException : Cannot resolve scoped service
   'ArchLucid.Core.Manifest.IGoldenManifestRepository' from root provider.

Failed DualPipelineRegistrationDisciplineTests.AuthorityDecisionTraceRepository_resolves_to_Decisioning_or_Persistence_concrete
  Error Message:
   System.InvalidOperationException : Cannot resolve scoped service
   'ArchLucid.Core.Persistence.Ports.IDecisionTraceRepository' from root provider.
```

### Root cause

`IGoldenManifestRepository` and `IDecisionTraceRepository` are now registered as **Scoped** services
in the production DI graph. In .NET, Scoped services cannot be resolved from the root `IServiceProvider`.
The two failing test methods call `factory.Services.GetRequiredService<T>()` directly from the root
provider, which throws `InvalidOperationException`.

The other methods in the same class (lines 64, 75, 137) already resolve from `factory.Services.CreateScope()`
— the two failing methods pre-date that pattern and were not updated when the lifetimes changed.

**File:** `ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs`

### Fix

Wrap each failing method in a scope, following the pattern already used by
`IArchitectureRunCommitOrchestrator_resolves_to_AuthorityDriven_concrete` (line 64):

**Method `AuthorityGoldenManifestRepository_resolves_to_Decisioning_or_Persistence_concrete` (line 29):**

```csharp
[SkippableFact]
public void AuthorityGoldenManifestRepository_resolves_to_Decisioning_or_Persistence_concrete()
{
    using IServiceScope scope = factory.Services.CreateScope();
    IGoldenManifestRepository instance =
        scope.ServiceProvider.GetRequiredService<IGoldenManifestRepository>();

    instance.Should().NotBeNull();

    Type concrete = instance.GetType();

    bool inExpectedNamespace =
        (concrete.Namespace ?? string.Empty).StartsWith("ArchLucid.Decisioning", StringComparison.Ordinal) ||
        (concrete.Namespace ?? string.Empty).StartsWith("ArchLucid.Persistence", StringComparison.Ordinal);

    inExpectedNamespace.Should().BeTrue(
        $"authority IGoldenManifestRepository must resolve from ArchLucid.Decisioning or ArchLucid.Persistence; got {concrete.FullName}");
}
```

**Method `AuthorityDecisionTraceRepository_resolves_to_Decisioning_or_Persistence_concrete` (line 45):**

```csharp
[SkippableFact]
public void AuthorityDecisionTraceRepository_resolves_to_Decisioning_or_Persistence_concrete()
{
    using IServiceScope scope = factory.Services.CreateScope();
    IDecisionTraceRepository instance =
        scope.ServiceProvider.GetRequiredService<IDecisionTraceRepository>();

    instance.Should().NotBeNull();

    Type concrete = instance.GetType();
    bool inExpectedNamespace =
        (concrete.Namespace ?? string.Empty).StartsWith("ArchLucid.Decisioning", StringComparison.Ordinal) ||
        (concrete.Namespace ?? string.Empty).StartsWith("ArchLucid.Persistence", StringComparison.Ordinal);

    inExpectedNamespace.Should().BeTrue(
        $"authority IDecisionTraceRepository must resolve from ArchLucid.Decisioning or ArchLucid.Persistence; got {concrete.FullName}");
}
```

Only the two failing methods change — the rest of the file is untouched.

### Acceptance criteria

1. Both `AuthorityGoldenManifestRepository_resolves_to_Decisioning_or_Persistence_concrete` and
   `AuthorityDecisionTraceRepository_resolves_to_Decisioning_or_Persistence_concrete` pass.
2. The resolved concrete types still satisfy the `ArchLucid.Decisioning` or `ArchLucid.Persistence`
   namespace assertion (confirms the registrations are correct, only the scope was wrong).
3. No other tests in `DualPipelineRegistrationDisciplineTests` change or break.
4. `ArchLucid.Backend.slnf` compile check passes.

---

## Failure 3 — `.NET integration shard 3/6` · `AskThreadIntegrationTests` FK constraint violation

### Symptom

```
Failed AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread [288 ms]
  Error Message:
   Microsoft.Data.SqlClient.SqlException : The INSERT statement conflicted with the FOREIGN KEY
   constraint "FK_GoldenManifests_Runs_RunId". The conflict occurred in database
   "ArchLucidGreenfield_76304bfd240543ed9b8a765029b5eeab", table "dbo.Runs", column 'RunId'.
     at SqlGoldenManifestRepository.SaveCoreAsync(...)  line 451
     at AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(...)  line 50
     at AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread()  line 40
```

### Root cause

`AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync`
(`ArchLucid.Api.Tests/AdvisoryIntegrationSeed.cs`) inserts the **manifest first** (line 50) and the
**run second** (line 63). The schema constraint `FK_GoldenManifests_Runs_RunId` requires the parent
row in `dbo.Runs` to exist before the child row in `dbo.GoldenManifests` is inserted. Inserting in
the wrong order violates the FK and causes the `SqlException`.

### Fix

Swap the insert order so the run is saved before the manifest:

**File:** `ArchLucid.Api.Tests/AdvisoryIntegrationSeed.cs`

```csharp
public static async Task<Guid> SeedDefaultScopeAuthorityRunAsync(IServiceProvider services, CancellationToken ct)
{
    using IServiceScope scope = services.CreateScope();
    AuthorityGoldenManifestRepository goldenRepo =
        scope.ServiceProvider.GetRequiredService<AuthorityGoldenManifestRepository>();
    IRunRepository runRepo = scope.ServiceProvider.GetRequiredService<IRunRepository>();

    Guid runId = Guid.NewGuid();
    Guid manifestId = Guid.NewGuid();

    ManifestDocument manifest = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject,
        ManifestId = manifestId,
        RunId = runId,
        ContextSnapshotId = Guid.NewGuid(),
        GraphSnapshotId = Guid.NewGuid(),
        FindingsSnapshotId = Guid.NewGuid(),
        DecisionTraceId = Guid.NewGuid(),
        CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        ManifestHash = "integration-seed",
        RuleSetId = "test-rs",
        RuleSetVersion = "1",
        RuleSetHash = "test-rh"
    };

    // Save the run first — FK_GoldenManifests_Runs_RunId requires dbo.Runs parent before dbo.GoldenManifests child.
    RunRecord run = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ScopeProjectId = ScopeIds.DefaultProject,
        RunId = runId,
        ProjectId = AdvisoryScanSchedule.DefaultProjectSlug,
        CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        GoldenManifestId = manifestId
    };

    await runRepo.SaveAsync(run, ct);
    await goldenRepo.SaveAsync(manifest, ct);

    return runId;
}
```

The manifest initializer block and the `run` initializer block are unchanged — only the `await` call
order is swapped.

### Acceptance criteria

1. `AskThreadIntegrationTests.Ask_with_seeded_run_returns_answer_and_creates_thread` passes without
   a `SqlException`.
2. All other `AskThreadIntegrationTests` tests that call `SeedDefaultScopeAuthorityRunAsync` also pass.
3. No production code changes — seed helper only.
4. `ArchLucid.Backend.slnf` compile check passes.

---

## Failure 4 — `.NET integration shards 2/6, 4/6` · 75-minute blame hang crash

### Symptom

Shards 2/6 (ShardIndex 1) and 4/6 (ShardIndex 3) each run a small batch of quick tests (≤32 in
~13 seconds) and then become permanently idle. After 75 minutes the blame hang collector kills the
test host:

```
The active test run was aborted. Reason: Test host process crashed
The test running when the crash occurred:          ← blank; no test method was executing
```

Shard 3/6 also terminates with a host crash after the three failures above, with 75 minutes of
teardown idle time after all 68 tests complete.

### Root cause (same recurring pattern as CI #2132 and #2133)

The blame tool reports a blank last-running test because no test *method* is executing when the
dump fires. This indicates the test host is stuck in one of two modes:

**Mode A — fixture `InitializeAsync` warmup hang**

After the quick-completing tests finish, xUnit loads the next `ICollectionFixture` and calls
`InitializeAsync`. If that fixture calls
`GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync` without a
bounded timeout, the host appears idle from the blame collector's perspective (no test method is
running, only fixture setup is). Under CI SQL overload the warmup HTTP call can block indefinitely.

**Mode B — factory `DisposeAsync` teardown hang (shard 3/6)**

After the three failures in shard 3 cause `AlertLifecycleWebAppFactory.DisposeAsync` to be called
repeatedly (each `await using` test factory is disposed inline), a background hosted service's
`StopAsync` may block beyond the 15-second `HostOptions.ShutdownTimeout`. The blame collector
fires 75 minutes after the last completed test.

### Investigation steps (read before writing)

1. **Identify which test classes land in ShardIndex 1 and ShardIndex 3.** Run:

   ```powershell
   dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
       --no-build -c Release `
       --filter 'Category!=Slow&Category=Integration' `
       --list-tests 2>&1
   ```

   Then inspect `scripts/ci/ApiIntegrationTestShardSupport.ps1` → `Get-ApiIntegrationTestShardClassNames`
   to see which classes fall into shards 1 and 3 (0-indexed) of 6.

2. **Check each fixture for `WarmArchitectureRequestHostOrSkipOnShardOverloadAsync`** — does its
   `InitializeAsync` call the warm-up helper? If so, is there a `SkipShardOverload()` guard?

3. **Check `AlertLifecycleWebAppFactory` teardown** — does `DisposeAsync` / `Dispose` propagate
   cancellation to all hosted services? The `HostOptions.ShutdownTimeout` is set to 15 s in
   `BaseIntegrationTestFixture`, but if a hosted service ignores the token, teardown can still block.
   Look for `IHostedService` implementations registered in InMemory mode that do not honor
   `CancellationToken` in `StopAsync`.

### Fix

Apply whichever of the following is confirmed by investigation. Prefer both if both modes are
plausible.

#### Fix A — `SkipShardOverload` guard in fixture `InitializeAsync` (Mode A)

For every collection fixture in the hanging shards whose `InitializeAsync` calls the warmup helper
without a skip guard:

```csharp
public async Task InitializeAsync()
{
    await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
        _primer,
        includePostCreateRunWarmup: true);
    // ... rest of fixture setup
}
```

This converts a cold-host timeout into a graceful `Skip` instead of a 75-minute blame hang.
See `AuditTrailCommitIntegrityIntegrationTests` for the canonical example of this pattern.

#### Fix B — bounded hosted-service teardown (Mode B)

If the `AlertLifecycleWebAppFactory` teardown hangs because a hosted service's `StopAsync` blocks:

1. Identify the service (check `IHostedService` implementations active in InMemory mode — background
   workers, connection-pool drainers, retry loops).
2. Add or verify that `StopAsync` uses `CancellationToken.WhenCancelled()` or a linked token with a
   hard deadline. The base `HostOptions.ShutdownTimeout = TimeSpan.FromSeconds(15)` should be
   sufficient if all services honor it.

Do **not** raise `--blame-hang-timeout` in CI — 75 minutes is already generous.

### Acceptance criteria

1. ShardIndex 1 and ShardIndex 3 complete all assigned tests (pass, fail, or explicit `Skip`) without
   a blame hang. The process exits cleanly.
2. No test silently swallows a cancellation — either surface as failure or `Skip` with a message.
3. The blame dump artifact is no longer produced for these shards (or the last-running test field is
   non-blank — at most one stuck test, not a wholesale host hang).
4. `ArchLucid.Backend.slnf` compile check passes.

---

## Execution order

1. **Failure 1** (TypeScript cast) — one-line change; fixes all four UI jobs immediately.
2. **Failure 2** (DI scope in DualPipeline tests) — two methods, surgical change.
3. **Failure 3** (FK order in AdvisoryIntegrationSeed) — swap two `await` lines.
4. **Failure 4** (blame hang) — investigate shard class assignments first, then apply Fix A / Fix B.

## Verification

After all fixes:

```powershell
# UI typecheck (fast — no SQL)
.\scripts\ci\agent-compile-check.ps1 -Ui

# .NET scope compile
.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"
```

Do **not** run the full SQL integration shard suite locally unless the user explicitly requests it.

## Related

- Prior run: `.cursor/prompts/fix-ci-run-2133-all-failures.md` (Vitest caption casing, blame hang
  shards 3 and 4 — warmup + teardown pattern)
- Prior run: `.cursor/prompts/fix-ci-run-2132-all-failures.md` (BuyerCtoDemoTourOverlay mock, nav
  guard regex, Ask/Retrieval hang, DemoSeedServiceTests)
- Warmup skip pattern: `.cursor/prompts/fix-audit-trail-warmup-timeout-ci.md`
- Resolution timeout fix: `.cursor/prompts/fix-idempotency-concurrency-resolution-timeout-ci.md`
- CI workflow: `.github/workflows/ci.yml` (`--blame-hang-timeout 75min` for integration shards)
