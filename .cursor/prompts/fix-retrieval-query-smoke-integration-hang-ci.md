# Fix: RetrievalQuerySmokeIntegrationTests CI test-host hang (75 min blame)

## Symptom

`dotnet-full-regression-core-api-integration` shard aborts after the 75-minute `--blame-hang` budget:

```
Passed!  - Failed: 0, Passed: 1, Skipped: 0, Total: 1, Duration: 3 s
The active test run was aborted. Reason: Test host process crashed
Data collector 'Blame' message: The specified inactivity time of 75 minutes has elapsed.
The test running when the crash occurred:
  ArchLucid.Api.Tests.RetrievalQuerySmokeIntegrationTests.Index_documents_then_query_returns_matching_hits
```

The test body **passes in ~3 seconds**; the process then sits idle until Blame kills `testhost`. This is a **post-assertion / host-teardown hang**, not a retrieval-logic failure.

## Root cause

`RetrievalQuerySmokeIntegrationTests` (and sibling advisory/ask integration tests) use
`AlertLifecycleWebAppFactory`, which:

1. Sets `ArchLucid:StorageProvider=InMemory` (persistence never touches SQL).
2. **Still** creates an ephemeral SQL catalog per factory (`EnsureCatalogExists` in the ctor,
   `DropCatalogIfExists` in `Dispose`) against the shared CI SQL container
   (`ARCHLUCID_SQL_TEST`).
3. Does **not** clear `IntegrationEvents` Service Bus settings (unlike `OpenApiContractWebAppFactory`).

Each of the four retrieval smoke tests does `await using AlertLifecycleWebAppFactory factory = new()`,
so one shard run spins up **four** full API hosts plus **four** create/drop-database cycles on an
already-loaded SQL service — while ~30+ `BackgroundService` loops start and must shut down cleanly on
`WebApplicationFactory.Dispose`. On overloaded integration shards this intermittently deadlocks host
teardown for tens of minutes.

`ArchLucidPersistenceStartup` skips DbUp when storage is InMemory (`storageIsSql` guard), so the
ephemeral catalogs are **pure overhead**.

**Precedent:** `OpenApiContractWebAppFactory` already uses `InMemoryStartupSqlConnectionStringSentinel`
and clears `IntegrationEvents:*` for the same “full host, no real SQL” pattern.

## Fix

**Primary file:** `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs`

Align the factory with `OpenApiContractWebAppFactory` for in-memory-only integration hosts:

1. **Remove** ephemeral SQL catalog lifecycle (`_connectionString` field, ctor `EnsureCatalogExists`,
   `Dispose` override with `DropCatalogIfExists`). Rely on `BaseIntegrationTestFixture.Dispose` only.
2. In `AddCustomSettings`, set
   `settings["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value`.
3. **Add** IntegrationEvents clears (copy from `OpenApiContractWebAppFactory`):
   - `IntegrationEvents:QueueOrTopicName` = `""`
   - `IntegrationEvents:ServiceBusConnectionString` = `""`
   - `IntegrationEvents:ServiceBusFullyQualifiedNamespace` = `""`
   - `IntegrationEvents:ServiceBusManagedIdentityClientId` = `""`
4. **Keep** existing alert/retrieval settings unchanged:
   - `ArchLucid:StorageProvider` = `InMemory`
   - `ArchLucidAuth:Mode` = `DevelopmentBypass`
   - `Authentication:ApiKey:DevelopmentBypassAll` = `true`
   - `ArchLucidAuth:AllowTestActorHeaders` = `true`
   - `Demo:Enabled` = `false`
5. Update the class XML doc to state that no SQL catalog is provisioned because storage is InMemory.

**Do not** convert `RetrievalQuerySmokeIntegrationTests` to `IClassFixture` — tests share an in-memory
vector index singleton; a shared host would leak indexed documents between
`Index_documents_then_query_returns_matching_hits` and `Query_with_no_indexed_documents_returns_empty_list`.

No production code changes.

### Target shape (illustrative)

```csharp
public sealed class AlertLifecycleWebAppFactory : BaseIntegrationTestFixture
{
    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = "InMemory";
        settings["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value;
        settings["IntegrationEvents:QueueOrTopicName"] = "";
        settings["IntegrationEvents:ServiceBusConnectionString"] = "";
        settings["IntegrationEvents:ServiceBusFullyQualifiedNamespace"] = "";
        settings["IntegrationEvents:ServiceBusManagedIdentityClientId"] = "";
        settings["ArchLucidAuth:Mode"] = "DevelopmentBypass";
        settings["Authentication:ApiKey:DevelopmentBypassAll"] = "true";
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        settings["Demo:Enabled"] = "false";
    }
}
```

Add `using ArchLucid.TestSupport;` if not already present. Remove `Microsoft.Data.SqlClient` import if
unused.

## Acceptance criteria

1. `AlertLifecycleWebAppFactory` has **no** SQL catalog create/drop and uses the in-memory connection
   sentinel.
2. All consumers unchanged at call sites:
   `RetrievalQuerySmokeIntegrationTests`, `AskThreadIntegrationTests`,
   `AlertLifecycleIntegrationTests`, `DigestDeliveryLifecycleIntegrationTests`,
   `ArchitectureFindingAskControllerIntegrationTests`.
3. Retrieval smoke assertions unchanged (index → `GET v1/retrieval/search` → hits / empty / validation).
4. `ArchLucid.Backend.slnf` compiles.

## Verification

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
  --filter "FullyQualifiedName~RetrievalQuerySmokeIntegrationTests" `
  -c Release
```

Optional broader regression (same factory family):

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
  --filter "FullyQualifiedName~AlertLifecycleIntegrationTests|FullyQualifiedName~AskThreadIntegrationTests" `
  -c Release
```

## Related

- Pattern: `ArchLucid.Api.Tests/OpenApiContractWebAppFactory.cs`
- CI job: `.github/workflows/ci.yml` → `dotnet-full-regression-core-api-integration` (6 shards,
  `-BlameHangTimeout 75min` via `scripts/ci/Invoke-ApiIntegrationTestShard.ps1`)
- Sibling CI prompts: `.cursor/prompts/fix-audit-trail-warmup-timeout-ci.md`,
  `.cursor/prompts/fix-tenant-isolation-warmup-timeout-ci.md` (SQL warmup hard-fail class; different
  failure mode from this host-teardown hang)
