# Fix: TenantIsolationSmokeTests greenfield warmup hard-fail (50 m CI hang)

## Symptom

Three (and potentially all seven) tests in `TenantIsolationSmokeTests` hard-fail after ~50 minutes:

```
ArchLucid.Api.Tests.WarmupTimedOutException :
Greenfield SQL host warmup exceeded GreenfieldSqlHostBootstrapBudget (00:50:00).
See WarmGreenfieldSqlHostForArchitectureRequestTestsAsync and WarmSingleCreateRunPathAsync.
```

Known failing methods from CI:

- `Tenant_b_cannot_see_tenant_a_run_sql_rls`
- `Tenant_b_cannot_access_tenant_a_run_roi_sql_rls`
- `Tenant_b_cannot_read_tenant_a_run_provenance_sql_rls`

## Root cause

These tests call the raw warmup helper:

```csharp
await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(primer);
```

When an overloaded CI SQL shard cannot finish create-run warmup within
`GreenfieldSqlHostBootstrapBudget` (50 min), `RunUnderGreenfieldHostBootstrapBudgetAsync` throws
`WarmupTimedOutException`. **TenantIsolationSmokeTests does not catch it**, so xUnit reports a hard
failure and burns ~50 minutes per test.

Other integration tests already migrated to the shared skip wrapper in
`ArchLucid.Api.Tests/GreenfieldSqlIntegrationWarmup.cs`:

- `ReferenceEvidenceAdminExportIntegrationTests` (TB-291)
- `AuditTrailCommitIntegrityIntegrationTests` (TB-290)
- `AuditExportTenantIsolationIntegrationTests` (TB-295)
- `ValueReportDemoRunIsolationIntegrationTests` (TB-294)
- `CreateRunIdempotencyConcurrencyIntegrationTests`

`TenantIsolationSmokeTests` is the outlier — same warmup path, no skip posture.

**This is CI infrastructure flake on cold shards, not a tenant-isolation regression.** When warmup
succeeds, the isolation assertions are unchanged.

## Fix

**File:** `ArchLucid.Api.Tests/Security/TenantIsolationSmokeTests.cs`

Replace every direct call to
`ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync`
(7 occurrences, lines ~83, 123, 155, 183, 230, 262, 294) with:

```csharp
await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
```

Preserve any existing `includePostCreateRunWarmup` argument if present (line ~155 may pass explicit
args — pass them through to the wrapper).

Do **not** wrap the entire test body in try/catch unless a test performs additional create-run POSTs
after warmup that can also time out. The wrapper alone is sufficient for the primer warmup block (same
as TB-290/TB-291).

### Example change

```csharp
// BEFORE
using (HttpClient primer = factory.CreateClient())
{
    IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
    await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(primer);
}

// AFTER
using (HttpClient primer = factory.CreateClient())
{
    IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
    await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
}
```

No production code changes. Do not increase `GreenfieldSqlHostBootstrapBudget`.

## Acceptance criteria

1. All 7 warmup call sites in `TenantIsolationSmokeTests.cs` use
   `GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync`.
2. Tenant isolation assertions (404 / empty list / cross-tenant hide) are unchanged.
3. On shard overload, tests **skip** with `GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason`, not
   hard-fail after 50 minutes.
4. `ArchLucid.Backend.slnf` compiles.

## Verification

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
  --filter "FullyQualifiedName~TenantIsolationSmokeTests"
```

Optional local skip-path check: temporarily lower `GreenfieldSqlHostBootstrapBudget` to 1 second in a
local branch, run one test → expect skip, not fail; revert before commit.

## Related

- Precedent: `.cursor/prompts/fix-audit-trail-warmup-timeout-ci.md` (TB-290 partial warmup fix)
- Archived broader prompt: `docs/archive/agent-prompts/COMPOSER_PROMPT_TB294_GREENFIELD_WARMUP_TIMEOUT.md`
