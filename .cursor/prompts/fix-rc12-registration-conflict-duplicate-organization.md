# Fix: `RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization` still failing on `RC12`

## Target branch

`RC12` (exists locally and on `origin`). Check it out before investigating — do not fix this on `master` first and port it over, the branch already carries a partial, apparently-ineffective fix (see below).

## Symptom

```text
Failed ArchLucid.Api.Tests.RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization [3 s]
  Error Message:
   Expected duplicate.StatusCode to be HttpStatusCode.Conflict {value: 409}, but found HttpStatusCode.Created {value: 201}.
  Stack Trace:
     at FluentAssertions.Execution.LateBoundTestFramework.Throw(String message)
   at FluentAssertions.Execution.TestFrameworkProvider.Throw(String message)
   at FluentAssertions.Execution.DefaultAssertionStrategy.HandleFailure(String message)
   at FluentAssertions.Primitives.EnumAssertions`2.Be(TEnum expected, String because, Object[] becauseArgs)
   at ArchLucid.Api.Tests.RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization() in /home/runner/work/ArchLucid/ArchLucid/ArchLucid.Api.Tests/RegistrationControllerTests.cs:line 37
```

The test (`ArchLucid.Api.Tests/RegistrationControllerTests.cs`) posts `/v1/register` twice with the **same** `organizationName`. The first call must return `201 Created`; the second must return `409 Conflict`. It is currently returning `201 Created` twice — the self-service registration duplicate-organization gate is not firing on `RC12`.

## Important: a partial fix for this exact class of bug already exists on `RC12` — and evidently did not close the gap

Diffing `RC12` against `master` shows someone already attempted to fix a **control-plane vs. tenant-plane SQL catalog split** in this exact code path. Do not re-invent this — read it first, understand *why* it doesn't fully work, and finish the job.

Already changed on `RC12` (not on `master`):

| File | What changed |
|---|---|
| `ArchLucid.Api.Tests/GreenfieldSqlApiFactory.cs` | Constructs `IntegrationTestSqlCatalogEnvironment` with `pinSystemCatalogToSameDatabase: true, pinSingleCatalogTopology: true`; `AddCustomSettings` now also sets `ArchLucid:SqlTopology:Mode = "SingleCatalog"` and `ConnectionStrings:ArchLucidSystem` to the same ephemeral connection string. Comment: *"Pin control-plane + tenant-plane to the same ephemeral catalog so /v1/register duplicate gates cannot split inserts and lookups across different SQL catalogs when env/config layers SqlTopology."* |
| `ArchLucid.Api.Tests/IntegrationTestSqlCatalogEnvironment.cs` | New overload takes `pinSystemCatalogToSameDatabase` / `pinSingleCatalogTopology` and additionally pins the **environment variables** `ConnectionStrings__ArchLucidSystem` and `ArchLucid__SqlTopology__Mode=SingleCatalog` (not just in-memory `WebApplicationFactory` config) — because `Program` calls `AddEnvironmentVariables()` *after* JSON/in-memory config, so a stray process-level env var (e.g. exported by a developer shell or a CI runner for a different job) silently wins over `AddCustomSettings` otherwise. |
| `ArchLucid.Api.Tests/RegistrationControllerTests.cs` | Both tests switched from `fixture.CreateClient()` to `await fixture.CreateBoundedClientAsync()` (waits for host startup + wraps `CreateClient()` with a timeout). |
| `ArchLucid.Persistence/Tenancy/DapperTenantRepository.cs` | `GetByNormalizedOrganizationNameAsync` now also queries the **tenant-plane** connection (in addition to the catalog connection) before falling back to `QueryTenantDirectoryByNormalizedOrganizationNameAsync`. |
| `ArchLucid.Application/Tenancy/TenantOrganizationDuplicateDetector.cs` | `IsDuplicateOrganization` text-sniffing now also matches `"already exists"`. |

**This partial fix is provably a no-op for the reported failure mode**, which means the real bug is still open:

- `ArchLucid.Host.Composition/Configuration/SqlStorageProviderRegistrar.cs` (`RegisterSystemRuntimeInfrastructure`) already computes `effectiveSystemConnectionString = connectionString` (the plain `ArchLucid` connection string) for **any** topology mode other than `SystemWithPerTenantCatalogs`. `SqlTopologyOptions.Mode` **defaults to `SingleCatalog`** (`ArchLucid.Core/Configuration/SqlTopologyOptions.cs`), which is what this test fixture already uses. So pinning `ArchLucid:SqlTopology:Mode=SingleCatalog` / `ConnectionStrings:ArchLucidSystem` changes nothing here — it was already resolving to the same connection string.
- `ArchLucid.Persistence/Connections/ScopedRoutingSqlConnectionFactory.cs` (`CreateOpenConnectionAsync`) **unconditionally** returns the single connection string whenever `SqlTopologyOptions.Mode == SingleCatalog`, regardless of ambient scope. So the tenant-plane connection factory (`ISqlConnectionFactory`) and the system/catalog connection factory (`ISystemSqlConnectionFactory`) were *already* pointed at the exact same physical ephemeral database in this test, before and after the `RC12` change.
- In other words: `InsertTenantAsync` (always via `_catalogConnectionFactory`) and `GetByNormalizedOrganizationNameAsync`'s **first** query (also via `_catalogConnectionFactory`, unchanged by the `RC12` diff) were always hitting the same catalog. If the second `/v1/register` call truly re-inserts successfully, the pre-existing catalog-read added in this branch for the tenant-plane connection is irrelevant — the bug must be somewhere else in the duplicate-detection path, not a catalog split.

## What to actually investigate (in order)

1. **Reproduce locally first**, against real SQL (per `docs/BUILD.md` — set `ARCHLUCID_SQL_TEST` or `ARCHLUCID_API_TEST_SQL`), and confirm the failure still repros on `RC12` HEAD before changing anything:
   ```powershell
   dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization"
   ```
2. **Instrument, don't guess.** Add temporary diagnostic logging (or a debugger breakpoint) around `TenantProvisioningService.ResolveExistingTenantForProvisionAsync` (`ArchLucid.Application/Tenancy/TenantProvisioningService.cs`) for the *second* `ProvisionAsync` call, and confirm whether `existing` comes back `null`. If it does, the bug is in the read path (query or connection routing); if it comes back non-null but the controller still returns `201`, the bug is in `TenantProvisioningService.BuildAlreadyProvisionedResultAsync` / `RegistrationController.RegisterAsync`'s handling of `result.WasAlreadyProvisioned`.
3. **Check for a global-mutable-state race**, since it's the most plausible remaining explanation now that the catalog-split theory is ruled out: `IntegrationTestSqlCatalogEnvironment` calls `Environment.SetEnvironmentVariable` — this is **process-wide**, not per-fixture. `RegistrationControllerTests` is `[Collection("ArchLucidEnvMutation")]` (serializes against other tests in that same collection), but **every other `GreenfieldSqlApiFactory`-derived fixture** in `ArchLucid.Api.Tests` (`IdorGreenfieldSqlApiFactory`, `DemoViewerEnabledSqlApiFactory`, `GreenfieldSqlApiFactoryWithLocalArtifactBlob`, `GreenfieldSqlApiFactoryWithoutChunkStaging`, etc. — see `Grep` for `: GreenfieldSqlApiFactory`) goes through the **same base constructor** and pins the **same** env var keys to *its own* ephemeral connection string. If xUnit runs a different collection in parallel while `GreenfieldSqlApiFactory`'s constructor is between "set env var" and "host build reads config," that other fixture's connection string can win the race for this fixture's host. Check:
   - Does the test assembly disable parallel collection execution (no `xunit.runner.json` / `[CollectionBehavior]` found as of this writing — confirm), and if not, should `[Collection("ArchLucidEnvMutation")]` be widened to cover *all* `GreenfieldSqlApiFactory`-derived test classes, or should `IntegrationTestSqlCatalogEnvironment` stop relying on process env vars entirely in favor of a mechanism that can't race (e.g. only `AddCustomSettings` in-memory config, with the “stray CI env var” problem solved a different way — e.g. explicitly clearing/overriding the specific keys per-host build rather than via shared process state)?
   - If this is the true root cause, note that it would be **flaky**, not deterministically reproducible every run — check CI history for this test (`gh run list` / prior CI logs) to see if it's a new deterministic failure or an intermittent one, since that materially changes the fix (deterministic bug in the query/duplicate-detection logic vs. a fixture-isolation race).
4. **Double-check `TenantSlugNormalizer.FromName` and the SQL `WHERE UPPER(LTRIM(RTRIM(Name)))` predicate** (`DapperTenantRepository.QueryTenantByNormalizedOrganizationNameAsync`) against the exact `organizationName` the test generates (`"Reg Org " + Guid.NewGuid().ToString("N")`) — rule out a collation/whitespace edge case, even though it looks correct on read.
5. **Confirm the DB-level safety net still exists and still fires as a fallback**: `dbo.Tenants` has `CONSTRAINT UQ_Tenants_Slug2 UNIQUE (Slug)` (`ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql`). If the app-level pre-check misses the duplicate, the second `InsertTenantAsync` should still throw a unique-constraint violation, which `TenantProvisioningService.ProvisionAsync`'s `catch (Exception ex) when (TenantOrganizationDuplicateDetector.IsDuplicateOrganization(ex))` should catch and convert to `WasAlreadyProvisioned`. Since the test observes `201` (not a 500 or an unhandled exception), this fallback is *also* not firing — confirm whether the second insert is silently succeeding (implying the two inserts landed in genuinely different physical databases — reopening the race-condition hypothesis in step 3) or whether some other code path is swallowing the constraint violation.

## Fix it

Once the actual root cause is confirmed (do not skip straight to a fix based on the hypotheses above — verify with evidence first):

1. Implement the minimal correct fix. If it's the parallelization race in step 3, prefer a fix that removes the shared-mutable-state hazard outright (e.g. don't mutate process env vars for topology/system connection string at all — thread the override through `WebApplicationFactory`'s in-memory configuration with higher precedence, or scope the env var mutation so it can't race) over just widening the `[Collection(...)]` attribute (which only serializes tests within the *same* test assembly's declared collections, not all `GreenfieldSqlApiFactory` subclasses, and is easy to regress again the next time someone adds a new one).
2. Keep or remove the already-present `RC12` changes based on what you find — if the catalog-connection-string pinning is genuinely inert (as the investigation above suggests), say so plainly in the commit message rather than leaving dead code; if it turns out to matter for some other scenario (e.g. a real CI runner env var), keep it and explain why.
3. Add a regression test that would have caught the actual root cause (e.g. if it's the parallel-fixture env race, add/adjust a `[Collection(...)]` boundary and a test asserting the intended isolation, or an assertion inside `TenantProvisioningService`/`DapperTenantRepository` unit tests for the specific miss).
4. Run the full `ArchLucid.Api.Tests` registration-related tests locally (not just the one failing test) — `RegistrationControllerTests`, `RegistrationControllerBaselineCaptureTests`, `RegistrationControllerStructuredBaselineTests`, `RegistrationControllerTrialRegistrationFailedTests` — since several of them share `GreenfieldSqlApiFactory`.
5. Quality gate: `/check-compiler-errors` → `/deslop` (diff vs `RC12`'s upstream) → `/review-bugbot` (`Diff: uncommitted changes`) before committing.

## Commit and push

Commit to `RC12` (already the checked-out target branch — no new branch needed) with a message referencing the concrete root cause found, e.g.:

```text
fix(registration): <root cause>, so duplicate-organization registration returns 409
```

Then run `/fix-ci` against the resulting CI run for `RC12` if this is gated through a PR/CI pipeline, fixing any further failures one at a time until green.
