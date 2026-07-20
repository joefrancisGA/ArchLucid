# Fix: `RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization` returns 201 instead of 409

## Symptom

```text
Failed ArchLucid.Api.Tests.RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization
  Error Message:
   Expected duplicate.StatusCode to be HttpStatusCode.Conflict {value: 409}, but found HttpStatusCode.Created {value: 201}.
  Stack Trace:
     at ArchLucid.Api.Tests.RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization()
        in ArchLucid.Api.Tests/RegistrationControllerTests.cs:line 37
```

The integration test posts `POST /v1/register` twice with the **same** `organizationName` (different admin emails). Expected behavior:

| Call | Status | Meaning |
|------|--------|---------|
| 1st | `201 Created` | New tenant provisioned |
| 2nd | `409 Conflict` | Duplicate organization rejected |

The second call is returning `201 Created` — duplicate-organization detection is not firing end-to-end.

## Contract (what must hold)

1. `RegistrationController.RegisterAsync` (`ArchLucid.Api/Controllers/RegistrationController.cs`) returns `409` when `TenantProvisioningResult.WasAlreadyProvisioned == true` (lines 253–277) **or** when `TenantOrganizationDuplicateDetector.IsDuplicateOrganization(ex)` catches a SQL unique-constraint violation (lines 403–427).
2. `TenantProvisioningService.ProvisionAsync` (`ArchLucid.Application/Tenancy/TenantProvisioningService.cs`) must detect an existing tenant **before insert** via `ResolveExistingTenantForProvisionAsync` (lines 151–174), which queries:
   - `GetByNormalizedOrganizationNameAsync` (org name, case/whitespace normalized)
   - `GetBySlugFromControlPlaneCatalogAsync` (slug from `TenantSlugNormalizer.FromName`)
   - `GetBySlugAsync` (fallback)
3. DB safety net: `dbo.Tenants` has `UQ_Tenants_Slug2 UNIQUE (Slug)` (`ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql`). If the pre-check misses, the insert should throw and be converted to `WasAlreadyProvisioned` (lines 90–98).

Because the test sees `201` (not `500`), either the pre-check returns `null` on the second call **and** the insert succeeds — implying the two writes are not visible to the same lookup catalog — or provisioning is not reaching the duplicate path at all.

## Key files (read in this order)

| Area | File |
|------|------|
| Failing test | `ArchLucid.Api.Tests/RegistrationControllerTests.cs` |
| HTTP handler | `ArchLucid.Api/Controllers/RegistrationController.cs` |
| Provisioning orchestration | `ArchLucid.Application/Tenancy/TenantProvisioningService.cs` |
| Duplicate detection helper | `ArchLucid.Application/Tenancy/TenantOrganizationDuplicateDetector.cs` |
| SQL reads/writes | `ArchLucid.Persistence/Tenancy/DapperTenantRepository.cs` — especially `GetByNormalizedOrganizationNameAsync`, `GetBySlugFromControlPlaneCatalogAsync`, `QueryTenantByNormalizedOrganizationNameAsync` |
| Connection routing | `ArchLucid.Persistence/Connections/ScopedRoutingSqlConnectionFactory.cs`, `ArchLucid.Host.Composition/Configuration/SqlStorageProviderRegistrar.cs` |
| Test fixture | `ArchLucid.Api.Tests/GreenfieldSqlApiFactory.cs`, `ArchLucid.Api.Tests/IntegrationTestSqlCatalogEnvironment.cs` |
| Repository-level proof | `ArchLucid.Persistence.Tests/Tenancy/DapperTenantRepositorySqlIntegrationTests.cs` — `Insert_duplicate_normalized_organization_name_is_visible_to_lookup` |
| Controller unit test (mocked) | `ArchLucid.Api.Tests/RegistrationControllerTrialRegistrationFailedTests.cs` — `RegisterAsync_duplicate_org_emits_TrialRegistrationFailed_conflict` |

## Reproduce locally

Requires reachable SQL Server (`docs/engineering/BUILD.md` — set `ARCHLUCID_SQL_TEST` or `ARCHLUCID_API_TEST_SQL` on non-Windows):

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization"
```

## Investigation (evidence before fix)

Do **not** guess. Confirm which layer fails on the **second** `ProvisionAsync` call:

1. **Instrument** `TenantProvisioningService.ResolveExistingTenantForProvisionAsync` — does `existing` come back `null`?
   - **Yes → read-path bug** (query, normalization, or connection routing).
   - **No but still 201 → controller/result bug** (`WasAlreadyProvisioned` not set or not handled).
2. **Verify the first insert is visible** — after the first `POST /v1/register`, query `dbo.Tenants` on the same connection string the fixture uses and confirm a row exists with the expected `Name` / `Slug`.
3. **Normalization parity** — test uses `"Reg Org " + Guid.NewGuid().ToString("N")`. Confirm `TenantOrganizationDuplicateDetector.NormalizeOrganizationName` and SQL `WHERE UPPER(LTRIM(RTRIM(Name))) = @NormalizedOrganizationName` agree.
4. **Catalog split / fixture isolation** — `IntegrationTestSqlCatalogEnvironment` sets **process-wide** env vars (`ConnectionStrings__ArchLucid`, `ConnectionStrings__ArchLucidSystem`, `ArchLucid__SqlTopology__Mode`) because `Program` calls `AddEnvironmentVariables()` after in-memory config. Multiple `GreenfieldSqlApiFactory` subclasses in parallel collections can race on these keys. `RegistrationControllerTests` is `[Collection("ArchLucidEnvMutation")]` (serializes within that collection), but other collections using different factories may still interleave env mutation.
   - Check CI history: deterministic every run vs intermittent → catalog-split race vs logic bug.
   - Note: `SqlTopologyOptions.Mode` defaults to `SingleCatalog`; pinning topology in the fixture may be inert if both factories already resolve to the same connection string — do not assume catalog-split is the cause without evidence.
5. **Constraint fallback** — if pre-check misses, does the second `InsertTenantAsync` throw `SqlException` for `UQ_Tenants_Slug2`? If not, inserts may be landing in different physical databases (reopens step 4).

## Fix guidelines

1. Implement the **minimal** correct fix for the confirmed root cause.
2. Prefer removing shared-mutable-state hazards (process env races) over only widening `[Collection(...)]` attributes — the latter is easy to regress when new SQL fixtures are added.
3. If existing partial fixes (catalog pinning in `GreenfieldSqlApiFactory`, tenant-plane fallback in `DapperTenantRepository`) are inert for this failure mode, remove or document them in the commit message — avoid dead code.
4. Add a regression test at the layer where the bug actually lived (repository unit test, fixture isolation test, or provisioning service test) — not only the HTTP integration test.

## Verification

Run all registration-related API tests (share `GreenfieldSqlApiFactory`):

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~RegistrationController"
```

Also run persistence duplicate lookup tests if you touched `DapperTenantRepository`:

```powershell
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj --filter "FullyQualifiedName~DapperTenantRepositorySqlIntegrationTests.Insert_duplicate"
```

Scoped compile check:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj
```

## Quality gate (before commit)

1. `/check-compiler-errors`
2. `/deslop` on the diff
3. `/review-bugbot` (`Diff: uncommitted changes`)

## Commit message template

```text
fix(registration): <concrete root cause>, so duplicate-organization registration returns 409
```

Example: `fix(registration): align duplicate org lookup with control-plane catalog, so second /v1/register returns 409`
