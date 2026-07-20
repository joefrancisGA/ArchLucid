# Fix: `RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization` still failing on `RC13`

## Target branch

`RC13` (exists locally and on `origin`). Check it out before investigating — do **not** fix on `master` / another RC and port over. `RC13` already carries **multiple** attempted fixes for this exact failure (see below); inventing another lookup probe on top will almost certainly fail again.

## Symptom (CI)

```text
Failed ArchLucid.Api.Tests.RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization [4 s]
  Error Message:
   Expected duplicate.StatusCode to be HttpStatusCode.Conflict {value: 409}, but found HttpStatusCode.Created {value: 201}.
  Stack Trace:
     at FluentAssertions.Execution.LateBoundTestFramework.Throw(String message)
   at FluentAssertions.Execution.TestFrameworkProvider.Throw(String message)
   at FluentAssertions.Execution.DefaultAssertionStrategy.HandleFailure(String message)
   at FluentAssertions.Primitives.EnumAssertions`2.Be(TEnum expected, String because, Object[] becauseArgs)
   at ArchLucid.Api.Tests.RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization() in /home/runner/work/ArchLucid/ArchLucid/ArchLucid.Api.Tests/RegistrationControllerTests.cs:line 37
```

The test (`ArchLucid.Api.Tests/RegistrationControllerTests.cs`) posts `/v1/register` twice with the **same** `organizationName` (different admin emails). Contract:

| Call | Expected | Observed on failure |
|------|----------|---------------------|
| 1st | `201 Created` | `201 Created` (OK) |
| 2nd | `409 Conflict` | `201 Created` (BUG) |

Because the second call returns **`201` (not `500`)**, the duplicate gate and the SQL unique-constraint fallback are **both** not firing — the second provision is treated as a brand-new tenant insert that succeeded.

## Critical context: stop re-applying the same class of fix

`RC13` has already tried to close this gap several times. Diff / history to read **before** changing code:

| Commit (on `RC13`) | What it tried |
|---|---|
| `2df2966817` / earlier `fix(tenancy): return 409…` | App-level duplicate → `WasAlreadyProvisioned` / controller `409` |
| `8b523c60a7` | Route duplicate checks through control-plane catalog |
| `cc40c2ec79` | Pin greenfield SQL catalog env (`IntegrationTestSqlCatalogEnvironment` + `SingleCatalog` / `ArchLucidSystem`) |
| `bfb552837f` … `fffdd16c20` | RC13 rounds 2–3 (registration among other CI fixes) |
| `2b75583c0a` (**round-4**) | **Controller pre-check** `TryResolveExistingOrganizationAsync` before `ProvisionAsync`; conflict helper; greenfield pin tweak |
| `7a57140bc4` (**round-5**) | Broaden resolve order: normalized name → control-plane slug → `GetBySlugAsync` fallback (controller + `TenantProvisioningService`) |

Also present on the branch (from the RC12-era catalog work, still in tree):

| File | Already present |
|---|---|
| `ArchLucid.Api.Tests/GreenfieldSqlApiFactory.cs` | `pinSystemCatalogToSameDatabase: true`, `pinSingleCatalogTopology: true`; `AddCustomSettings` sets `ArchLucid:SqlTopology:Mode=SingleCatalog` and `ConnectionStrings:ArchLucidSystem` to the ephemeral string |
| `ArchLucid.Api.Tests/IntegrationTestSqlCatalogEnvironment.cs` | Process env pins for `ConnectionStrings__ArchLucid` / `ArchLucidSystem` / `ArchLucid__SqlTopology__Mode` (because `Program` calls `AddEnvironmentVariables()` after in-memory config) |
| `ArchLucid.Persistence/Tenancy/DapperTenantRepository.cs` | `GetByNormalizedOrganizationNameAsync` queries catalog, then tenant-plane, then directory |
| `ArchLucid.Application/Tenancy/TenantOrganizationDuplicateDetector.cs` | Text-sniff includes `"already exists"` |
| `ArchLucid.Api/Controllers/RegistrationController.cs` | Pre-provision `TryResolveExistingOrganizationAsync` + `RegisterOrganizationConflictAsync` → `409` |
| `ArchLucid.Application/Tenancy/TenantProvisioningService.cs` | Unscoped `ResolveExistingTenantForProvisionAsync` + catch → `WasAlreadyProvisioned` |

**Do not** “fix” this by adding yet another `GetBy*` probe or reordering lookups again unless instrumentation proves a specific query returns the wrong row on a **confirmed single physical catalog**. The lookup surface is already exhaustive relative to the insert path; a second `201` means the second insert is succeeding against a store that does not see the first row (or the first row never landed where the second host reads).

Related prior prompts (do not blindly re-run as-is — they target earlier branches / incomplete diagnosis):

- `.cursor/prompts/fix-rc12-registration-conflict-duplicate-organization.md`
- `.cursor/prompts/fix-registration-duplicate-organization-409.md`

## Why catalog pinning alone is likely inert (unless race)

1. `SqlTopologyOptions.Mode` **defaults to `SingleCatalog`**. For any mode other than `SystemWithPerTenantCatalogs`, `SqlStorageProviderRegistrar` already sets `effectiveSystemConnectionString` to the plain `ArchLibid` / `ArchLucid` connection string.
2. `ScopedRoutingSqlConnectionFactory` in `SingleCatalog` mode returns that one string regardless of ambient scope.
3. Therefore: if the host truly has one ephemeral DB for both planes, `InsertTenantAsync` (catalog factory) and the first query in `GetByNormalizedOrganizationNameAsync` (same catalog factory) already hit the same database — **before and after** the pin commits.
4. If the second `/v1/register` still inserts cleanly, the remaining explanations are: **(A)** two different physical catalogs in play for call 1 vs call 2 (fixture / process-env race), **(B)** the first insert never committed / rolled back while still returning `201`, or **(C)** a logic path that skips provisioning’s conflict handling but still returns `Created` (less likely given current controller code — prove with breakpoints).

## Reproduce first

Requires reachable SQL (`docs/engineering/BUILD.md` — `ARCHLUCID_SQL_TEST` or `ARCHLUCID_API_TEST_SQL` on non-Windows):

```powershell
git checkout RC13
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization"
```

Confirm the failure still repros on current `RC13` HEAD **before** changing anything. Note whether it is **deterministic every run** or **flaky** — that chooses the fix class (logic vs isolation race).

Optional CI history check:

```powershell
gh run list --branch RC13 --limit 20
# then inspect failed api-tests / integration shards for this test name
```

## Investigation order (evidence before code)

### 1. Instrument the second call — do not guess

On the **second** `POST /v1/register`, log or break on:

1. `RegistrationController.TryResolveExistingOrganizationAsync` — null or not?
2. `TenantProvisioningService.ResolveExistingTenantForProvisionAsync` — null or not?
3. Whether `InsertTenantAsync` throws (unique constraint) or succeeds.

Interpretation:

| Pre-check | Insert | HTTP | Likely cause |
|-----------|--------|------|--------------|
| non-null | n/a | should be 409 | Controller not mapping conflict (bug in result path) |
| null | throws, caught | should be 409 | Detector / catch filter miss |
| null | **succeeds** | **201** | **Different physical DB / invisible first row** ← current CI shape |

### 2. Prove one physical database (or two)

After the first `201`, using the **same** connection string the fixture exposes (`GreenfieldSqlApiFactory.SqlConnectionString`):

```sql
SELECT Id, Name, Slug FROM dbo.Tenants WHERE UPPER(LTRIM(RTRIM(Name))) = UPPER(LTRIM(RTRIM(@organizationName)));
```

- Row missing → first call’s `201` did not persist to this catalog (wrong connection, rollback, or different host config).
- Row present, second call still `201` → second call’s host is not using this catalog (env race / config precedence).

Also log at host build time: resolved `ConnectionStrings:ArchLucid`, `ConnectionStrings:ArchLucidSystem`, and `ArchLucid:SqlTopology:Mode` from the **running** `IConfiguration` inside the factory host (not from the dictionary you *intended* to set).

### 3. Process-wide env mutation race (primary remaining hypothesis)

`IntegrationTestSqlCatalogEnvironment` calls `Environment.SetEnvironmentVariable` — **process-wide**, not per-fixture.

- `RegistrationControllerTests` is `[Collection("ArchLucidEnvMutation")]`.
- **Every** `GreenfieldSqlApiFactory`-derived fixture pins the **same** env keys to *its own* ephemeral connection string.
- If xUnit runs another collection in parallel while this factory is between “set env” and “host reads config”, another fixture’s string can win.

Check:

- Is parallel collection execution disabled? (`xunit.runner.json`, `[CollectionBehavior(DisableTestParallelization = true)]`, assembly-level attributes) — confirm current state on `RC13`.
- Which test classes inherit `GreenfieldSqlApiFactory` but are **not** in `ArchLucidEnvMutation`? (`Grep` for `: GreenfieldSqlApiFactory`).

Prefer a fix that **removes** shared mutable env state for topology/system connection strings (thread overrides only through `WebApplicationFactory` / host config with precedence that beats stray CI env vars) over only widening `[Collection(...)]` (easy to regress when the next factory is added).

### 4. Only if single-catalog is proven

Then — and only then — dig into normalization (`TenantSlugNormalizer.FromName`, SQL `UPPER(LTRIM(RTRIM(Name)))`) and `UQ_Tenants_Slug2` fallback. The test org name is `"Reg Org " + Guid.NewGuid().ToString("N")`; collation/whitespace is unlikely but cheap to rule out once the connection identity is proven.

## Fix guidelines

1. Implement the **minimal** fix for the **confirmed** root cause.
2. **Do not** add another duplicate-lookup call site “for safety” without evidence — the branch already has controller pre-check + provisioning resolve + SQL catch + catalog/tenant-plane queries.
3. If pinning / env mutation is inert or harmful, remove or replace it and say so in the commit message; do not leave dead dual paths.
4. Add a regression test at the layer that actually broke (e.g. fixture isolation assertion, or a test that two sequential registers against one factory share one catalog and get `409`). The existing HTTP test is necessary but has not been sufficient to keep CI green through rounds 4–5.
5. Keep product behavior: second self-service register with the same organization name must remain **`409 Conflict`** with the existing problem copy / audit (`TrialRegistrationFailed` / `duplicate_slug` or equivalent).

## Verification

```powershell
# Failing case
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization"

# Sibling registration tests (same fixture family)
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~RegistrationController"

# If DapperTenantRepository / SQL lookup changed:
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj --filter "FullyQualifiedName~DapperTenantRepositorySqlIntegrationTests.Insert_duplicate"
```

Scoped compile:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj
```

Quality gate before commit: `/check-compiler-errors` → `/deslop` (diff vs `RC13`) → `/review-bugbot` (`Diff: uncommitted changes`).

## Commit and push

Commit **on `RC13`** (user must name the branch in the commit request). Message must name the **concrete** root cause, not “improve duplicate detection”:

```text
fix(registration): <root cause>, so duplicate-organization registration returns 409
```

Examples:

- `fix(registration): stop process-env catalog races in greenfield SQL fixtures, so second /v1/register returns 409`
- `fix(registration): bind register host to fixture catalog after env mutation, so duplicate org returns 409`

Then `/fix-ci` against the resulting `RC13` CI run until this test is green (and no new registration regressions).

## Acceptance criteria

- [ ] Local repro of the failing test on `RC13` before the fix (or documented flake rate).
- [ ] Root cause stated with evidence (logs / SQL / config dump) — not another speculative lookup reorder.
- [ ] Second `/v1/register` with same `organizationName` returns **409**.
- [ ] First call still returns **201**.
- [ ] RegistrationController* suite green; no new flaky env-mutation failures in Api.Tests.
- [ ] Commit on `RC13` with root-cause message; CI recheck green for this test.
