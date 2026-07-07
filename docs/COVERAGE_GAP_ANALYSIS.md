> **Scope:** Coverage gap analysis (merged Cobertura) - tables from the Cobertura file named under **Data source**; stale or partial local merges (or leftover shards under `coverage-gap-1a`) produce misleading percentages — clean the folder before `dotnet test` or use the CI **`coverage-merged-cobertura`** artifact.
>
> **Spine doc:** [`START_HERE.md`](../START_HERE.md). Read this file only if you have a specific reason beyond those five entry documents.

# Coverage gap analysis (merged Cobertura)

## Objective

Describe how **line/branch coverage** is collected in CI, how to reproduce reports locally, and interpret trends vs CI gates.

## Recommended workflow: Persistence and strict gates (CI-first)

**Merged line / branch / per-package floors** (including **`ArchLucid.Persistence`** at **≥ 63%** line for its assembly) are enforced **only** in GitHub Actions on the merged Cobertura from the full solution test run with SQL — job id **`dotnet-full-regression`**, display name **`.NET: full regression (SQL)`** in **`.github/workflows/ci.yml`**. That job sets **`ARCHLUCID_SQL_TEST`**, runs **`dotnet test ArchLucid.sln`** with **`coverage.runsettings`**, merges reports, then runs **`scripts/ci/assert_merged_line_coverage_min.py`**. **Treat that result and the uploaded artifact `coverage-merged-cobertura` (`Cobertura.xml`) as authoritative** when debugging a red coverage gate.

**Local default (fast iteration).** When adding **`ArchLucid.Persistence.Tests`**, verify behavior without Coverlet so runs stay short:

- **Cross-platform:** `scripts/ci/test-persistence-local-fast.sh`
- **Windows:** `scripts/ci/test-persistence-local-fast.ps1`

Or manually:

```bash
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj -c Release
```

Many SQL-backed tests **skip** unless **`ARCHLUCID_SQL_TEST`** points at a reachable database (same idea as CI). A green local **InMemory-only** run does **not** prove the strict merged package percentages; **push and rely on `dotnet-full-regression`** (or run the full solution test + merge flow locally only when you intentionally reproduce CI).

**`ArchLucid.Api` measurement vs testing (TB-638):** Low **`ArchLucid.Api`** line % in merged Cobertura is often a **measurement artifact**, not missing tests. `Category=Integration` HTTP tests run on six parallel shards via **`scripts/ci/Invoke-ApiIntegrationTestShard.ps1`** with **`test.runsettings`** (Coverlet off — collector finalization unstable under chunked SQL load). Before adding unit tests solely to move percentages, read **`docs/library/coverage-exclusions.md`** § **ArchLucid.Api measurement vs testing** and the **TB-635** triage inventory (`integration-covered` bucket). CI intentionally passes **`--skip-package-line-gate ArchLucid.Api`** until reported % reflects real risk after DTO exclusions and genuine-gap closure (**TB-639**).

**Optional local strict reproduction.** To approximate CI before push: Release-build the solution, set **`ARCHLUCID_SQL_TEST`** to a local SQL instance, run **`dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:"XPlat Code Coverage"`**, merge Cobertura with ReportGenerator, then run **`assert_merged_line_coverage_min.py`** with the same arguments as the workflow. Expect **long** wall time; this path is for deep debugging, not every edit.

## Strict profile (product target)

The **V1.1** merge-blocking target (ratchet goal) for merged line + ratchet is:

- **Merged line ≥ 95%**
- **Merged branch ≥ 63%**
- **Per-product-package line ≥ 63%** for every gated **`ArchLucid.*`** assembly with coverable lines

**Compliance status:** **`.github/workflows/ci.yml`** (`dotnet-coverage-merge` after **`dotnet-full-regression`**) enforces **merged line**, **merged branch**, and **per-product-package line** on merged Cobertura. **Merged line** uses **`assert_merged_line_coverage_min.py`** with **`75`** minimum (merge-blocking overall line floor). **`assert_coverage_floor_ratchet.py`** is **not** invoked until **V1.1** (**`docs/library/V1_DEFERRED.md`**).

To verify **CI parity**, run **`assert_merged_line_coverage_min.py`** on merged **`Cobertura.xml`** with **`75`**, **`--min-branch-pct 63`**, **`--min-package-line-pct 63`** (same as CI; no **`--skip-package-line-gate`**). For the **strict-profile / V1.1** dry run, use **`95`** instead of **`75`** and **`assert_coverage_floor_ratchet.py`**.

## Current merge-blocking gates

The merge step in **`.github/workflows/ci.yml`** (`dotnet-coverage-merge`) enforces:

- **Merged line ≥ 75%**
- **Branch coverage ≥ 63%**
- **Per-product-package line ≥ 63%** for every gated **`ArchLucid.*`** assembly with coverable lines (see **`scripts/ci/assert_merged_line_coverage_min.py`** invocation in the workflow)

**Merged line ≥ 95%** (tighter than the **75%** CI floor) and the **ratchet** are deferred to **V1.1** (see **`docs/library/V1_DEFERRED.md`**).

**Advisory (non-blocking):** packages with line % in **[63%, 70%)** emit **`::warning::`** annotations when **`--warn-below-package-line-pct 70`** is set (see workflow).

**Fast core + full regression merge:** ReportGenerator **`-reports:`** is built with **`find … -name coverage.cobertura.xml`** (semicolon-separated list). GitHub’s bash often has **`globstar` off**, so a literal **`**/coverage.cobertura.xml`** shell glob can fail to expand; **`find`** avoids silent empty merges.

**Weakening gates** (lowering percentages or adding **`--skip-package-line-gate`**) requires explicit product / maintainer sign-off and doc updates in this file and **`docs/library/coverage-exclusions.md`**.

## Local run (merged HTML)

From repo root (after a **Release** build of tests):

```bash
dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:"XPlat Code Coverage" --results-directory ./coverage-raw
dotnet tool run reportgenerator "-reports:./coverage-raw/**/coverage.cobertura.xml" "-targetdir:./coverage-report" "-reporttypes:HtmlSummary"
```

Open **`coverage-report/index.html`**.

## Exclusions

See **`docs/library/coverage-exclusions.md`** and **`coverage.runsettings`** (generated OpenAPI client, templates, etc.).

## Hotspots and backlog hooks

Class-level rankings (uncovered line entries, partial types merged) and **test-backfill notes** are maintained in the tables below. Highest-impact themes aligned with the snapshot:

1. **`ArchLucid.Persistence`** — lowest line % in that merge (**~40%** for the main **`ArchLucid.Persistence`** package); **`DapperTenantRepository`** and relational read paths dominate uncovered entries.
2. **`ArchLucid.Api`** — **~61%** line; **`AdminDiagnosticsService`**, **`GovernanceController`**, **`EvolutionSimulationService`** drive gaps in the hotspot table.
3. **`ArchLucid.Cli`** — CLI commands and config evaluation remain expensive to cover end-to-end.
4. **`ArchLucid.Host.Core` / `ArchLucid.Host.Composition`** — background processing, DI composition extension methods, and consistency probes carry integration-heavy paths.

## Security, scalability, reliability, cost

| Dimension | Tie-in |
|-----------|--------|
| **Security** | Raising coverage on **auth-adjacent**, **tenant isolation**, and **ingest/export** paths reduces regressions in trust boundaries (maps to Persistence + Api + Host layers above). |
| **Scalability** | Coverage does not replace load tests; focus tests on **queue/back-pressure** and **repository batch** branches where complexity sits (**Host.Core**, Persistence reads/writes). |
| **Reliability** | SQL-backed integration tests (**`ARCHLUCID_SQL_TEST`**) materially change Cobertura for Persistence and Api — missing DB ⇒ **under-count** vs CI. |
| **Cost** | Full merges are expensive wall-clock; use **`scripts/ci/test-persistence-local-fast.ps1`** (Windows) / **`.sh`** for tight loops, then **`dotnet-full-regression`** for gate truth. |

---

## Snapshot Data

**Data source:** `coverage-report-full\Cobertura.xml` (file mtime **2026-04-20 13:28:07 UTC**). For CI gate parity, prefer the **`coverage-merged-cobertura`** artifact from job **`.NET: merge coverage + gates`** (copy **`Cobertura.xml`** and run **`python scripts/ci/coverage_gap_analysis.py --cobertura <path>`**). See **`docs/COVERAGE_GAP_ANALYSIS.md`** — local merges without **`ARCHLUCID_SQL_TEST`** under-count SQL-only paths.

**Measurement:** Production `ArchLucid.*` assemblies only; excludes `*.Tests`, TestSupport, Benchmarks, and `ArchLucid.Worker` (`Program.cs` omitted per **`coverage.runsettings`** **`ExcludeByFile`**).

## All assemblies by line coverage (lowest first)

| Assembly | Line coverage % | Coverable lines (approx.) |
|----------|-----------------|---------------------------|
| ArchLucid.Persistence | 39.66 | 11201 |
| ArchLucid.Api | 57.46 | 16812 |
| ArchLucid.Host.Core | 71.86 | 8867 |
| ArchLucid.Application | 73.29 | 17865 |
| ArchLucid.AgentRuntime | 77.82 | 6073 |
| ArchLucid.Host.Composition | 79.42 | 2839 |
| ArchLucid.Persistence.Runtime | 80.05 | 1865 |
| ArchLucid.ArtifactSynthesis | 80.13 | 2738 |
| ArchLucid.Persistence.Alerts | 81.88 | 1920 |
| ArchLucid.Persistence.Coordination | 82.97 | 5824 |
| ArchLucid.Core | 84.48 | 3196 |
| ArchLucid.Persistence.Advisory | 85.35 | 1406 |
| ArchLucid.Cli | 88.64 | 1866 |
| ArchLucid.Contracts | 90.38 | 1999 |
| ArchLucid.ContextIngestion | 91.01 | 1380 |
| ArchLucid.Decisioning | 92.64 | 10404 |
| ArchLucid.Coordinator | 93.31 | 478 |
| ArchLucid.Retrieval | 95.07 | 610 |
| ArchLucid.KnowledgeGraph | 95.07 | 730 |
| ArchLucid.AgentSimulator | 96.45 | 564 |
| ArchLucid.Provenance | 96.70 | 666 |
| ArchLucid.Persistence.Integration | 99.19 | 494 |
| ArchLucid.Jobs.Cli | 100.00 | 36 |

## Per-assembly class gaps (by line coverage %)

Per Cobertura **class** aggregate `<lines>` rows. **Line coverage %** is **(coverable − uncovered) / coverable** for that class. **Partial types** merged by **class name + file**. Sort order: **lowest assembly line % first**, **except** **`ArchLucid.Decisioning`** — that assembly is placed **near the bottom** (after **`ArchLucid.AgentSimulator`**, before **`100.00%`** assemblies) because its class list is large.

**Prior attempt?** — **Yes** if the fully-qualified type name (or its short name, length ≥ **8**) appears as a substring in `docs/COVERAGE_GAP_ANALYSIS.md` (heuristic; very short names are not matched on their own).

### ArchLucid.Persistence (39.66% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleRelationalRead` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleRelationalRead.cs` | 0.00 | 177 | No |
| 2 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleTraceJsonReader` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleTraceJsonReader.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Audit.NoOpAuditEventChangeFeedHandler` | `ArchLucid.Persistence\Audit\NoOpAuditEventChangeFeedHandler.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleRelationalRead` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleRelationalRead.cs` | 0.00 | 177 | No |
| 2 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleTraceJsonReader` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleTraceJsonReader.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Audit.NoOpAuditEventChangeFeedHandler` | `ArchLucid.Persistence\Audit\NoOpAuditEventChangeFeedHandler.cs` | 0.00 | 1 | No |
| 4 | `ArchLucid.Persistence.Billing.BillingTrialConversionGate` | `ArchLucid.Persistence\Billing\BillingTrialConversionGate.cs` | 0.00 | 14 | No |
| 5 | `ArchLucid.Persistence.Billing.SqlBillingLedger` | `ArchLucid.Persistence\Billing\SqlBillingLedger.cs` | 0.00 | 163 | No |
| 6 | `ArchLucid.Persistence.BlobStore.ArtifactBundlePayloadBlobEnvelope` | `ArchLucid.Persistence\BlobStore\ArtifactBundlePayloadBlobEnvelope.cs` | 0.00 | 36 | No |
| 7 | `ArchLucid.Persistence.BlobStore.ArtifactBundlePersistContext` | `ArchLucid.Persistence\BlobStore\ArtifactBundlePersistContext.cs` | 0.00 | 1 | No |
| 8 | `ArchLucid.Persistence.Concurrency.SqlSessionDistributedCreateRunIdempotencyLock` | `ArchLucid.Persistence\Concurrency\SqlSessionDistributedCreateRunIdempotencyLock.cs` | 0.00 | 55 | No |
| 9 | `ArchLucid.Persistence.Connections.SqlPrimaryMirroredReadReplicaConnectionFactory` | `ArchLucid.Persistence\Connections\SqlPrimaryMirroredReadReplicaConnectionFactory.cs` | 0.00 | 4 | No |
| 10 | `ArchLucid.Persistence.ContextSnapshots.ContextSnapshotRelationalRead` | `ArchLucid.Persistence\ContextSnapshots\ContextSnapshotRelationalRead.cs` | 0.00 | 168 | No |
| 11 | `ArchLucid.Persistence.Cosmos.AgentTraceDocument` | `ArchLucid.Persistence\Cosmos\AgentTraceDocument.cs` | 0.00 | 6 | No |
| 12 | `ArchLucid.Persistence.Cosmos.AuditEventDocument` | `ArchLucid.Persistence\Cosmos\AuditEventDocument.cs` | 0.00 | 13 | No |
| 13 | `ArchLucid.Persistence.Cosmos.GraphSnapshotDocument` | `ArchLucid.Persistence\Cosmos\GraphSnapshotDocument.cs` | 0.00 | 9 | No |
| 14 | `ArchLucid.Persistence.Data.Infrastructure.ExternalDbConnection` | `ArchLucid.Persistence\Data\Infrastructure\ExternalDbConnection.cs` | 0.00 | 9 | No |
| 15 | `ArchLucid.Persistence.Data.Repositories.ArchitectureRunListItem` | `ArchLucid.Persistence\Data\Repositories\ArchitectureRunListItem.cs` | 0.00 | 7 | No |
| 16 | `ArchLucid.Persistence.Data.Repositories.BackgroundJobRow` | `ArchLucid.Persistence\Data\Repositories\BackgroundJobRow.cs` | 0.00 | 12 | No |
| 17 | `ArchLucid.Persistence.Data.Repositories.ComparisonRecordSearchPredicateBuilder` | `ArchLucid.Persistence\Data\Repositories\ComparisonRecordSearchPredicateBuilder.cs` | 0.00 | 34 | No |
| 18 | `ArchLucid.Persistence.Data.Repositories.HostLeaderLeaseSnapshot` | `ArchLucid.Persistence\Data\Repositories\HostLeaderLeaseSnapshot.cs` | 0.00 | 3 | No |
| 19 | `ArchLucid.Persistence.Data.Repositories.NoOpAgentOutputEvaluationResultRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpAgentOutputEvaluationResultRepository.cs` | 0.00 | 3 | No |
| 20 | `ArchLucid.Persistence.Data.Repositories.QueuedBackgroundJobPrepareResult` | `ArchLucid.Persistence\Data\Repositories\QueuedBackgroundJobPrepareResult.cs` | 0.00 | 5 | No |
| 21 | `ArchLucid.Persistence.Findings.FindingsSnapshotRelationalRead` | `ArchLucid.Persistence\Findings\FindingsSnapshotRelationalRead.cs` | 0.00 | 185 | No |
| 22 | `ArchLucid.Persistence.GoldenManifests.GoldenManifestPhase1RelationalRead` | `ArchLucid.Persistence\GoldenManifests\GoldenManifestPhase1RelationalRead.cs` | 0.00 | 258 | No |
| 23 | `ArchLucid.Persistence.Governance.CachingPolicyPackRepository` | `ArchLucid.Persistence\Governance\CachingPolicyPackRepository.cs` | 0.00 | 16 | No |
| 24 | `ArchLucid.Persistence.Governance.SqlExternalConnection` | `ArchLucid.Persistence\Governance\SqlExternalConnection.cs` | 0.00 | 11 | No |
| 25 | `ArchLucid.Persistence.GraphSnapshots.GraphSnapshotRelationalRead` | `ArchLucid.Persistence\GraphSnapshots\GraphSnapshotRelationalRead.cs` | 0.00 | 198 | No |
| 26 | `ArchLucid.Persistence.Identity.InMemoryNoTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\InMemoryNoTrialIdentityUserRepository.cs` | 0.00 | 7 | No |
| 27 | `ArchLucid.Persistence.Identity.SqlTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\SqlTrialIdentityUserRepository.cs` | 0.00 | 71 | No |
| 28 | `ArchLucid.Persistence.Notifications.DapperSentEmailLedger` | `ArchLucid.Persistence\Notifications\DapperSentEmailLedger.cs` | 0.00 | 18 | No |
| 29 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationEmailApi` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationEmailApi.cs` | 0.00 | 35 | No |
| 30 | `ArchLucid.Persistence.Notifications.Email.NoopEmailProvider` | `ArchLucid.Persistence\Notifications\Email\NoopEmailProvider.cs` | 0.00 | 2 | No |
| 31 | `ArchLucid.Persistence.Notifications.Email.SmtpEmailProvider` | `ArchLucid.Persistence\Notifications\Email\SmtpEmailProvider.cs` | 0.00 | 30 | No |
| 32 | `ArchLucid.Persistence.Notifications.InMemorySentEmailLedger` | `ArchLucid.Persistence\Notifications\InMemorySentEmailLedger.cs` | 0.00 | 5 | No |
| 33 | `ArchLucid.Persistence.Queries.DapperArtifactQueryService` | `ArchLucid.Persistence\Queries\DapperArtifactQueryService.cs` | 0.00 | 11 | No |
| 34 | `ArchLucid.Persistence.Queries.InMemoryArtifactQueryService` | `ArchLucid.Persistence\Queries\InMemoryArtifactQueryService.cs` | 0.00 | 11 | No |
| 35 | `ArchLucid.Persistence.RelationalRead.SqlRelationalScalarCount` | `ArchLucid.Persistence\RelationalRead\SqlRelationalScalarCount.cs` | 0.00 | 3 | No |
| 36 | `ArchLucid.Persistence.Repositories.CachingGoldenManifestRepository` | `ArchLucid.Persistence\Repositories\CachingGoldenManifestRepository.cs` | 0.00 | 22 | No |
| 37 | `ArchLucid.Persistence.Repositories.RunConcurrencyConflictException` | `ArchLucid.Persistence\Repositories\RunConcurrencyConflictException.cs` | 0.00 | 4 | No |
| 38 | `ArchLucid.Persistence.Scoping.EmptyPersistenceScopeContextProvider` | `ArchLucid.Persistence\Scoping\EmptyPersistenceScopeContextProvider.cs` | 0.00 | 6 | No |
| 39 | `ArchLucid.Persistence.Sql.SqlSchemaBootstrapper` | `ArchLucid.Persistence\Sql\SqlSchemaBootstrapper.cs` | 0.00 | 14 | No |
| 40 | `ArchLucid.Persistence.Tenancy.DapperTenantRepository` | `ArchLucid.Persistence\Tenancy\DapperTenantRepository.cs` | 0.00 | 342 | No |
| 41 | `ArchLucid.Persistence.Tenancy.DapperTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\DapperTenantTrialEmailContactLookup.cs` | 0.00 | 14 | No |
| 42 | `ArchLucid.Persistence.Tenancy.DapperUsageEventRepository` | `ArchLucid.Persistence\Tenancy\DapperUsageEventRepository.cs` | 0.00 | 118 | No |
| 43 | `ArchLucid.Persistence.Tenancy.Diagnostics.DapperTrialFunnelOperationalMetricsReader` | `ArchLucid.Persistence\Tenancy\Diagnostics\DapperTrialFunnelOperationalMetricsReader.cs` | 0.00 | 14 | No |
| 44 | `ArchLucid.Persistence.Tenancy.NoOpTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\NoOpTenantHardPurgeService.cs` | 0.00 | 1 | No |
| 45 | `ArchLucid.Persistence.Tenancy.NullTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\NullTenantTrialEmailContactLookup.cs` | 0.00 | 1 | No |
| 46 | `ArchLucid.Persistence.Tenancy.SqlFirstSessionLifecycleHook` | `ArchLucid.Persistence\Tenancy\SqlFirstSessionLifecycleHook.cs` | 0.00 | 10 | No |
| 47 | `ArchLucid.Persistence.Tenancy.SqlTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\SqlTenantHardPurgeService.cs` | 0.00 | 263 | No |
| 48 | `ArchLucid.Persistence.Tenancy.SqlTenantOnboardingStateRepository` | `ArchLucid.Persistence\Tenancy\SqlTenantOnboardingStateRepository.cs` | 0.00 | 8 | No |
| 49 | `ArchLucid.Persistence.Tenancy.TenantTierSql` | `ArchLucid.Persistence\Tenancy\TenantTierSql.cs` | 0.00 | 14 | No |
| 50 | `ArchLucid.Persistence.Tenancy.UsageMeterKindSql` | `ArchLucid.Persistence\Tenancy\UsageMeterKindSql.cs` | 0.00 | 20 | No |
| 51 | `ArchLucid.Persistence.Tenancy.InMemoryUsageEventRepository` | `ArchLucid.Persistence\Tenancy\InMemoryUsageEventRepository.cs` | 3.57 | 27 | No |
| 52 | `ArchLucid.Persistence.Billing.Stripe.StripeBillingProvider` | `ArchLucid.Persistence\Billing\Stripe\StripeBillingProvider.cs` | 9.66 | 131 | No |
| 53 | `ArchLucid.Persistence.Billing.BillingWebhookTrialActivator` | `ArchLucid.Persistence\Billing\BillingWebhookTrialActivator.cs` | 17.78 | 37 | No |
| 54 | `ArchLucid.Persistence.Billing.InMemoryBillingLedger` | `ArchLucid.Persistence\Billing\InMemoryBillingLedger.cs` | 22.97 | 57 | No |
| 55 | `ArchLucid.Persistence.Provenance.ProvenanceQueryService` | `ArchLucid.Persistence\Provenance\ProvenanceQueryService.cs` | 26.32 | 28 | No |
| 56 | `ArchLucid.Persistence.Billing.AzureMarketplace.MicrosoftMarketplaceJwtVerifier` | `ArchLucid.Persistence\Billing\AzureMarketplace\MicrosoftMarketplaceJwtVerifier.cs` | 26.47 | 25 | No |
| 57 | `ArchLucid.Persistence.Tenancy.SqlTrialFunnelCommitHook` | `ArchLucid.Persistence\Tenancy\SqlTrialFunnelCommitHook.cs` | 27.03 | 27 | No |
| 58 | `ArchLucid.Persistence.Repositories.GraphSnapshotEdgeRow` | `ArchLucid.Persistence\Repositories\GraphSnapshotEdgeIndexer.cs` | 28.57 | 5 | No |
| 59 | <code>ArchLucid.Persistence.Options.FixedOptionsMonitor`1</code> | `ArchLucid.Persistence\Options\FixedOptionsMonitor.cs` | 33.33 | 4 | No |
| 60 | `ArchLucid.Persistence.Tenancy.InMemoryTenantRepository` | `ArchLucid.Persistence\Tenancy\InMemoryTenantRepository.cs` | 33.85 | 170 | No |
| 61 | `ArchLucid.Persistence.Caching.HotPathCacheEviction` | `ArchLucid.Persistence\Caching\HotPathCacheEviction.cs` | 35.71 | 9 | No |
| 62 | `ArchLucid.Persistence.BlobStore.LargePayloadOffloadEvaluator` | `ArchLucid.Persistence\BlobStore\LargePayloadOffloadEvaluator.cs` | 41.67 | 7 | No |
| 63 | `ArchLucid.Persistence.Repositories.CachingRunRepository` | `ArchLucid.Persistence\Repositories\CachingRunRepository.cs` | 43.75 | 27 | No |
| 64 | `ArchLucid.Persistence.Billing.AzureMarketplace.AzureMarketplaceBillingProvider` | `ArchLucid.Persistence\Billing\AzureMarketplace\AzureMarketplaceBillingProvider.cs` | 49.24 | 100 | No |
| 65 | `ArchLucid.Persistence.Metering.UsageMeteringService` | `ArchLucid.Persistence\Metering\UsageMeteringService.cs` | 52.38 | 10 | No |
| 66 | `ArchLucid.Persistence.Serialization.GraphNodeJsonConverter` | `ArchLucid.Persistence\Serialization\GraphNodeJsonConverter.cs` | 57.14 | 21 | No |
| 67 | `ArchLucid.Persistence.Data.Infrastructure.MigrationCatalogMutexScope` | `ArchLucid.Persistence\Data\Infrastructure\MigrationCatalogMutexScope.cs` | 60.61 | 13 | No |
| 68 | `ArchLucid.Persistence.Serialization.GraphEdgeJsonConverter` | `ArchLucid.Persistence\Serialization\GraphEdgeJsonConverter.cs` | 62.50 | 15 | No |
| 69 | `ArchLucid.Persistence.Data.Repositories.NoOpHostLeaderLeaseRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpHostLeaderLeaseRepository.cs` | 66.67 | 1 | No |
| 70 | `ArchLucid.Persistence.Caching.HotPathCacheKeys` | `ArchLucid.Persistence\Caching\HotPathCacheKeys.cs` | 70.00 | 3 | No |
| 71 | `ArchLucid.Persistence.Data.Infrastructure.GreenfieldBaselineMigrationRunner` | `ArchLucid.Persistence\Data\Infrastructure\GreenfieldBaselineMigrationRunner.cs` | 72.33 | 44 | No |
| 72 | `ArchLucid.Persistence.Queries.DapperAuthorityQueryService` | `ArchLucid.Persistence\Queries\DapperAuthorityQueryService.cs` | 72.73 | 15 | No |
| 73 | `System.Text.RegularExpressions.Generated.<RegexGenerator_g>F784EB680C21B4686F463E7BD9AB24CC1A1B996DCF3A8FED908D40FD2DF951F37__MigrationNumberRegex_0` | `ArchLucid.Persistence\obj\Release\net10.0\System.Text.RegularExpressions.Generator\System.Text.RegularExpressions.Generator.RegexGenerator\RegexGenerator.g.cs` | 74.07 | 14 | No |
| 74 | `ArchLucid.Persistence.Queries.RunSummaryDto` | `ArchLucid.Persistence\Queries\RunSummaryDto.cs` | 75.00 | 4 | No |
| 75 | `System.Text.RegularExpressions.Generated` | `ArchLucid.Persistence\obj\Release\net10.0\System.Text.RegularExpressions.Generator\System.Text.RegularExpressions.Generator.RegexGenerator\RegexGenerator.g.cs` | 75.44 | 14 | No |
| 76 | `ArchLucid.Persistence.Findings.FindingPayloadJsonCodec` | `ArchLucid.Persistence\Findings\FindingPayloadJsonCodec.cs` | 78.95 | 4 | No |
| 77 | `ArchLucid.Persistence.Data.Infrastructure.DatabaseMigrator` | `ArchLucid.Persistence\Data\Infrastructure\DatabaseMigrator.cs` | 79.17 | 10 | No |
| 78 | `ArchLucid.Persistence.Data.Repositories.InMemoryComparisonRecordRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryComparisonRecordRepository.cs` | 80.23 | 35 | No |
| 79 | `ArchLucid.Persistence.Queries.InMemoryAuthorityQueryService` | `ArchLucid.Persistence\Queries\InMemoryAuthorityQueryService.cs` | 81.82 | 10 | No |
| 80 | `ArchLucid.Persistence.BlobStore.GoldenManifestPayloadBlobEnvelope` | `ArchLucid.Persistence\BlobStore\GoldenManifestPayloadBlobEnvelope.cs` | 82.35 | 15 | No |
| 81 | `ArchLucid.Persistence.Governance.InMemoryPolicyPackVersionRepository` | `ArchLucid.Persistence\Governance\InMemoryPolicyPackVersionRepository.cs` | 83.64 | 9 | No |
| 82 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationServicesEmailProvider` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationServicesEmailProvider.cs` | 85.19 | 4 | No |
| 83 | `ArchLucid.Persistence.Connections.SqlReadReplicaConnectionStringResolver` | `ArchLucid.Persistence\Connections\SqlReadReplicaConnectionStringResolver.cs` | 87.50 | 2 | No |
| 84 | `ArchLucid.Persistence.Billing.BillingProviderRegistry` | `ArchLucid.Persistence\Billing\BillingProviderRegistry.cs` | 88.24 | 2 | No |
| 85 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentEvaluationRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentEvaluationRepository.cs` | 88.46 | 3 | No |
| 86 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentResultRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentResultRepository.cs` | 88.57 | 4 | No |
| 87 | `ArchLucid.Persistence.Findings.FindingsSnapshotLegacyJsonReader` | `ArchLucid.Persistence\Findings\FindingsSnapshotLegacyJsonReader.cs` | 88.89 | 1 | No |
| 88 | `ArchLucid.Persistence.Connections.ReadReplicaRoutedConnectionFactory` | `ArchLucid.Persistence\Connections\ReadReplicaRoutedConnectionFactory.cs` | 90.48 | 2 | No |
| 89 | `ArchLucid.Persistence.Data.Repositories.InMemoryDecisionNodeRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryDecisionNodeRepository.cs` | 91.67 | 2 | No |
| 90 | `ArchLucid.Persistence.Data.Repositories.InMemoryArchitectureRequestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryArchitectureRequestRepository.cs` | 92.86 | 1 | No |
| 91 | `ArchLucid.Persistence.Governance.InMemoryPolicyPackChangeLogRepository` | `ArchLucid.Persistence\Governance\InMemoryPolicyPackChangeLogRepository.cs` | 92.86 | 4 | No |
| 92 | `ArchLucid.Persistence.Data.Repositories.InMemoryCoordinatorGoldenManifestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryCoordinatorGoldenManifestRepository.cs` | 93.33 | 1 | No |
| 93 | `ArchLucid.Persistence.Data.Repositories.InMemoryGovernanceApprovalRequestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryGovernanceApprovalRequestRepository.cs` | 93.75 | 6 | No |
| 94 | `ArchLucid.Persistence.Repositories.InMemoryRunRepository` | `ArchLucid.Persistence\Repositories\InMemoryRunRepository.cs` | 94.35 | 7 | No |
| 95 | `ArchLucid.Persistence.Conversation.InMemoryConversationMessageRepository` | `ArchLucid.Persistence\Conversation\InMemoryConversationMessageRepository.cs` | 94.74 | 1 | No |

### ArchLucid.Api (57.46% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Auth.Services.ExternalIdIssuerPatterns` | `ArchLucid.Api\Auth\Services\ExternalIdIssuerPatterns.cs` | 0.00 | 4 | No |
| 2 | `ArchLucid.Api.Auth.Services.TrialExternalIdJwtBearerSupport` | `ArchLucid.Api\Auth\Services\TrialExternalIdJwtBearerSupport.cs` | 0.00 | 10 | No |
| 3 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsBatchRequest.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Auth.Services.ExternalIdIssuerPatterns` | `ArchLucid.Api\Auth\Services\ExternalIdIssuerPatterns.cs` | 0.00 | 4 | No |
| 2 | `ArchLucid.Api.Auth.Services.TrialExternalIdJwtBearerSupport` | `ArchLucid.Api\Auth\Services\TrialExternalIdJwtBearerSupport.cs` | 0.00 | 10 | No |
| 3 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsBatchRequest.cs` | 0.00 | 1 | No |
| 4 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsByIdsRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsByIdsRequest.cs` | 0.00 | 1 | No |
| 5 | `ArchLucid.Api.Controllers.Admin.AsyncAuthorityPipelineFeatureState` | `ArchLucid.Api\Controllers\Admin\AdminController.cs` | 0.00 | 1 | No |
| 6 | `ArchLucid.Api.Controllers.Admin.DiagnosticsController` | `ArchLucid.Api\Controllers\Admin\DiagnosticsController.cs` | 0.00 | 21 | No |
| 7 | `ArchLucid.Api.Controllers.Admin.TenantProvisionAdminRequest` | `ArchLucid.Api\Controllers\Admin\TenantProvisionAdminRequest.cs` | 0.00 | 3 | No |
| 8 | `ArchLucid.Api.Controllers.Admin.TenantsAdminController` | `ArchLucid.Api\Controllers\Admin\TenantsAdminController.cs` | 0.00 | 24 | No |
| 9 | `ArchLucid.Api.Controllers.Advisory.ProductLearningController` | `ArchLucid.Api\Controllers\Advisory\ProductLearningController.cs` | 0.00 | 166 | No |
| 10 | `ArchLucid.Api.Controllers.Advisory.RecommendationLearningController` | `ArchLucid.Api\Controllers\Advisory\RecommendationLearningController.cs` | 0.00 | 27 | No |
| 11 | `ArchLucid.Api.Controllers.Alerts.AlertRoutingSubscriptionsController` | `ArchLucid.Api\Controllers\Alerts\AlertRoutingSubscriptionsController.cs` | 0.00 | 72 | No |
| 12 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchItemResult` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchResponse.cs` | 0.00 | 3 | No |
| 13 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchRequest` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchRequest.cs` | 0.00 | 2 | No |
| 14 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchResponse` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchResponse.cs` | 0.00 | 1 | No |
| 15 | `ArchLucid.Api.Controllers.Alerts.AlertSimulationController` | `ArchLucid.Api\Controllers\Alerts\AlertSimulationController.cs` | 0.00 | 81 | No |
| 16 | `ArchLucid.Api.Controllers.Alerts.AlertTuningController` | `ArchLucid.Api\Controllers\Alerts\AlertTuningController.cs` | 0.00 | 45 | No |
| 17 | `ArchLucid.Api.Controllers.Alerts.CompositeAlertRulesController` | `ArchLucid.Api\Controllers\Alerts\CompositeAlertRulesController.cs` | 0.00 | 38 | No |
| 18 | `ArchLucid.Api.Controllers.Auth.TrialLocalIdentityAuthController` | `ArchLucid.Api\Controllers\Auth\TrialLocalIdentityAuthController.cs` | 0.00 | 102 | No |
| 19 | `ArchLucid.Api.Controllers.Authority.ArtifactExportController` | `ArchLucid.Api\Controllers\Authority\ArtifactExportController.cs` | 0.00 | 110 | No |
| 20 | `ArchLucid.Api.Controllers.Authority.AuthorityQueryController` | `ArchLucid.Api\Controllers\Authority\AuthorityQueryController.cs` | 0.00 | 117 | No |
| 21 | `ArchLucid.Api.Controllers.Authority.AuthorityReplayController` | `ArchLucid.Api\Controllers\Authority\AuthorityReplayController.cs` | 0.00 | 51 | No |
| 22 | `ArchLucid.Api.Controllers.Authority.AuthorityRunEventsController` | `ArchLucid.Api\Controllers\Authority\AuthorityRunEventsController.cs` | 0.00 | 65 | No |
| 23 | `ArchLucid.Api.Controllers.Authority.RunAgentEvaluationController` | `ArchLucid.Api\Controllers\Authority\RunAgentEvaluationController.cs` | 0.00 | 49 | No |
| 24 | `ArchLucid.Api.Controllers.Billing.BillingMarketplaceWebhookController` | `ArchLucid.Api\Controllers\Billing\BillingMarketplaceWebhookController.cs` | 0.00 | 45 | No |
| 25 | `ArchLucid.Api.Controllers.Billing.BillingStripeWebhookController` | `ArchLucid.Api\Controllers\Billing\BillingStripeWebhookController.cs` | 0.00 | 18 | No |
| 26 | `ArchLucid.Api.Controllers.E2e.E2EHarnessController` | `ArchLucid.Api\Controllers\E2e\E2eHarnessController.cs` | 0.00 | 73 | No |
| 27 | `ArchLucid.Api.Controllers.Governance.GovernanceApprovalBatchReviewRequest` | `ArchLucid.Api\Controllers\Governance\GovernanceApprovalBatchReviewRequest.cs` | 0.00 | 4 | No |
| 28 | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewItemResult` | `ArchLucid.Api\Controllers\Governance\GovernanceBatchReviewResponse.cs` | 0.00 | 4 | No |
| 29 | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewResponse` | `ArchLucid.Api\Controllers\Governance\GovernanceBatchReviewResponse.cs` | 0.00 | 1 | No |
| 30 | `ArchLucid.Api.Controllers.Planning.ComparisonController` | `ArchLucid.Api\Controllers\Planning\ComparisonController.cs` | 0.00 | 18 | No |
| 31 | `ArchLucid.Api.Controllers.Planning.ExplanationController` | `ArchLucid.Api\Controllers\Planning\ExplanationController.cs` | 0.00 | 88 | No |
| 32 | `ArchLucid.Api.Controllers.Planning.GraphController` | `ArchLucid.Api\Controllers\Planning\GraphController.cs` | 0.00 | 64 | No |
| 33 | `ArchLucid.Api.Controllers.Planning.ProvenanceController` | `ArchLucid.Api\Controllers\Planning\ProvenanceController.cs` | 0.00 | 22 | No |
| 34 | `ArchLucid.Api.Controllers.Planning.ProvenanceQueryController` | `ArchLucid.Api\Controllers\Planning\ProvenanceQueryController.cs` | 0.00 | 23 | No |
| 35 | `ArchLucid.Api.Controllers.RegistrationController` | `ArchLucid.Api\Controllers\RegistrationController.cs` | 0.00 | 101 | No |
| 36 | `ArchLucid.Api.Mapping.ConsultingDocxJobPayloadMapper` | `ArchLucid.Api\Mapping\ConsultingDocxJobPayloadMapper.cs` | 0.00 | 24 | No |
| 37 | `ArchLucid.Api.Models.Auth.TrialLocalRegisterRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 38 | `ArchLucid.Api.Models.Auth.TrialLocalRegisterResponse` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 39 | `ArchLucid.Api.Models.Auth.TrialLocalTokenRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 5 | No |
| 40 | `ArchLucid.Api.Models.Auth.TrialLocalTokenResponse` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 3 | No |
| 41 | `ArchLucid.Api.Models.Auth.TrialLocalVerifyEmailRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 42 | `ArchLucid.Api.Models.E2e.E2eHarnessBillingSimulatePostRequest` | `ArchLucid.Api\Models\E2e\E2eHarnessBillingSimulatePostRequest.cs` | 0.00 | 6 | No |
| 43 | `ArchLucid.Api.Models.E2e.E2eHarnessTrialExpiresPostRequest` | `ArchLucid.Api\Models\E2e\E2eHarnessTrialExpiresPostRequest.cs` | 0.00 | 2 | No |
| 44 | `ArchLucid.Api.Models.Evolution.EvolutionSimulationRunResponse` | `ArchLucid.Api\Models\Evolution\EvolutionSimulationRunResponse.cs` | 0.00 | 7 | No |
| 45 | `ArchLucid.Api.Models.Learning.LearningPlanDetailResponse` | `ArchLucid.Api\Models\Learning\LearningPlanDetailResponse.cs` | 0.00 | 12 | No |
| 46 | `ArchLucid.Api.Models.Learning.LearningPlanEvidenceCountsResponse` | `ArchLucid.Api\Models\Learning\LearningPlanEvidenceCountsResponse.cs` | 0.00 | 3 | No |
| 47 | `ArchLucid.Api.Models.Learning.LearningPlanListItemResponse` | `ArchLucid.Api\Models\Learning\LearningPlanListItemResponse.cs` | 0.00 | 9 | No |
| 48 | `ArchLucid.Api.Models.Learning.LearningPlanStepResponse` | `ArchLucid.Api\Models\Learning\LearningPlanStepResponse.cs` | 0.00 | 4 | No |
| 49 | `ArchLucid.Api.Models.Learning.LearningThemeResponse` | `ArchLucid.Api\Models\Learning\LearningThemeResponse.cs` | 0.00 | 15 | No |
| 50 | `ArchLucid.Api.Models.Tenancy.TenantRegistrationRequest` | `ArchLucid.Api\Models\Tenancy\TenantRegistrationRequest.cs` | 0.00 | 3 | No |
| 51 | `ArchLucid.Api.Models.Tenancy.TenantTrialConvertRequest` | `ArchLucid.Api\Models\Tenancy\TenantTrialConvertRequest.cs` | 0.00 | 1 | No |
| 52 | `ArchLucid.Api.Services.Admin.DataConsistencyOrphanCounts` | `ArchLucid.Api\Services\Admin\DataConsistencyOrphanCounts.cs` | 0.00 | 5 | No |
| 53 | `ArchLucid.Api.Services.Admin.OrphanComparisonRemediationResult` | `ArchLucid.Api\Services\Admin\OrphanComparisonRemediationResult.cs` | 0.00 | 4 | No |
| 54 | `ArchLucid.Api.Validators.ConsultingDocxProfileRecommendationRequestValidator` | `ArchLucid.Api\Validators\ConsultingDocxValidators.cs` | 0.00 | 4 | No |
| 55 | `ArchLucid.Api.Controllers.Authority.AuthorityCompareController` | `ArchLucid.Api\Controllers\Authority\AuthorityCompareController.cs` | 15.09 | 45 | No |
| 56 | `ArchLucid.Api.Services.Admin.AdminDiagnosticsService` | `ArchLucid.Api\Services\Admin\AdminDiagnosticsService.cs` | 15.61 | 200 | No |
| 57 | `ArchLucid.Api.Controllers.Alerts.AlertsController` | `ArchLucid.Api\Controllers\Alerts\AlertsController.cs` | 16.33 | 82 | No |
| 58 | `ArchLucid.Api.Controllers.Advisory.AdvisoryController` | `ArchLucid.Api\Controllers\Advisory\AdvisoryController.cs` | 19.58 | 115 | No |
| 59 | `ArchLucid.Api.Controllers.Admin.AdminController` | `ArchLucid.Api\Controllers\Admin\AdminController.cs` | 28.57 | 45 | No |
| 60 | `ArchLucid.Api.OpenApi.MicrosoftOpenApiAnonymousSecurityOperationTransformer` | `ArchLucid.Api\OpenApi\MicrosoftOpenApiAnonymousSecurityOperationTransformer.cs` | 33.33 | 6 | No |
| 61 | `ArchLucid.Api.ProductLearning.ProductLearningQueryParser` | `ArchLucid.Api\ProductLearning\ProductLearningQueryParser.cs` | 35.00 | 52 | No |
| 62 | `ArchLucid.Api.Services.LearningPlanningReadService` | `ArchLucid.Api\Services\LearningPlanningReadService.cs` | 40.77 | 77 | No |
| 63 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationService` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationService.cs` | 42.23 | 119 | No |
| 64 | `ArchLucid.Api.Controllers.Governance.ManifestsController` | `ArchLucid.Api\Controllers\Governance\ManifestsController.cs` | 43.10 | 132 | No |
| 65 | `ArchLucid.Api.Controllers.Governance.GovernanceController` | `ArchLucid.Api\Controllers\Governance\GovernanceController.cs` | 45.39 | 148 | No |
| 66 | `ArchLucid.Api.Controllers.Advisory.AdvisorySchedulingController` | `ArchLucid.Api\Controllers\Advisory\AdvisorySchedulingController.cs` | 46.84 | 42 | No |
| 67 | `ArchLucid.Api.Controllers.Advisory.DigestSubscriptionsController` | `ArchLucid.Api\Controllers\Advisory\DigestSubscriptionsController.cs` | 46.99 | 44 | No |
| 68 | `ArchLucid.Api.Models.Evolution.EvolutionCandidateChangeSetResponseMapper` | `ArchLucid.Api\Models\Evolution\EvolutionCandidateChangeSetResponseMapper.cs` | 52.38 | 10 | No |
| 69 | `ArchLucid.Api.Controllers.Tenancy.TenantTrialController` | `ArchLucid.Api\Controllers\Tenancy\TenantTrialController.cs` | 52.69 | 44 | No |
| 70 | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeShadowReader` | `ArchLucid.Api\Models\Evolution\EvolutionOutcomeShadowReader.cs` | 53.85 | 12 | No |
| 71 | `ArchLucid.Api.Controllers.Governance.GovernanceResolutionController` | `ArchLucid.Api\Controllers\Governance\GovernanceResolutionController.cs` | 54.39 | 26 | No |
| 72 | `ArchLucid.Api.Controllers.Admin.ClientErrorTelemetryController` | `ArchLucid.Api\Controllers\Admin\ClientErrorTelemetryController.cs` | 56.41 | 17 | No |
| 73 | `ArchLucid.Api.Services.ReplayArtifactResponseFactory` | `ArchLucid.Api\Services\ReplayArtifactResponseFactory.cs` | 57.14 | 12 | No |
| 74 | `ArchLucid.Api.ProblemDetails.TrialLimitProblemResponse` | `ArchLucid.Api\ProblemDetails\TrialLimitProblemResponse.cs` | 57.38 | 26 | No |
| 75 | `ArchLucid.Api.ProblemDetails.ProblemDetailsExtensions` | `ArchLucid.Api\ProblemDetails\ProblemDetailsExtensions.cs` | 59.26 | 44 | No |
| 76 | `ArchLucid.Api.Controllers.Planning.ComparisonsController` | `ArchLucid.Api\Controllers\Planning\ComparisonsController.cs` | 61.90 | 112 | No |
| 77 | `ArchLucid.Api.Controllers.Planning.AskController` | `ArchLucid.Api\Controllers\Planning\AskController.cs` | 64.29 | 10 | No |
| 78 | `ArchLucid.Api.Filters.TrialLimitAuthorizationHandler` | `ArchLucid.Api\Filters\TrialLimitFilter.cs` | 65.00 | 7 | No |
| 79 | `ArchLucid.Api.Controllers.Authority.AnalysisReportsController` | `ArchLucid.Api\Controllers\Authority\AnalysisReportsController.cs` | 65.55 | 72 | No |
| 80 | `ArchLucid.Api.Controllers.Planning.ConversationController` | `ArchLucid.Api\Controllers\Planning\ConversationController.cs` | 65.79 | 13 | No |
| 81 | `ArchLucid.Api.Controllers.Authority.RunsController` | `ArchLucid.Api\obj\Release\net10.0\Microsoft.Gen.Logging\Microsoft.Gen.Logging.LoggingGenerator\Logging.g.cs` | 66.67 | 48 | No |
| 82 | `ArchLucid.Api.Filters.TrialLimitExceededAuditFilter` | `ArchLucid.Api\Filters\TrialLimitExceededAuditFilter.cs` | 66.67 | 1 | No |
| 83 | `ArchLucid.Api.Middleware.ApiDeprecationHeadersMiddleware` | `ArchLucid.Api\Middleware\ApiDeprecationHeadersMiddleware.cs` | 66.67 | 9 | No |
| 84 | `ArchLucid.Api.Controllers.Authority.RunQueryController` | `ArchLucid.Api\Controllers\Authority\RunQueryController.cs` | 67.96 | 33 | No |
| 85 | `ArchLucid.Api.Mapping.ComparisonResponseMapper` | `ArchLucid.Api\Mapping\ComparisonResponseMapper.cs` | 68.00 | 8 | No |
| 86 | `ArchLucid.Api.Controllers.Governance.GovernancePreviewController` | `ArchLucid.Api\Controllers\Governance\GovernancePreviewController.cs` | 69.44 | 11 | No |
| 87 | `ArchLucid.Api.Controllers.Authority.RunsController` | `ArchLucid.Api\Controllers\Authority\RunsController.cs` | 69.80 | 45 | No |
| 88 | `ArchLucid.Api.Models.PagingParameters` | `ArchLucid.Api\Models\PagingParameters.cs` | 70.00 | 3 | No |
| 89 | `ArchLucid.Api.Startup.PipelineExtensions` | `ArchLucid.Api\Startup\PipelineExtensions.cs` | 70.00 | 36 | No |
| 90 | `ArchLucid.Api.Swagger.OpenApiAuthDocumentMutator` | `ArchLucid.Api\Swagger\OpenApiAuthDocumentMutator.cs` | 72.09 | 12 | No |
| 91 | `ArchLucid.Api.Controllers.Authority.RunComparisonController` | `ArchLucid.Api\Controllers\Authority\RunComparisonController.cs` | 74.19 | 24 | No |
| 92 | `ArchLucid.Api.ApiFileResults` | `ArchLucid.Api\ApiFileResults.cs` | 75.00 | 1 | No |
| 93 | `ArchLucid.Api.ProblemDetails.ProblemCorrelation` | `ArchLucid.Api\ProblemDetails\ProblemCorrelation.cs` | 75.00 | 2 | No |
| 94 | `ArchLucid.Api.Swagger.OpenApiAuthAnonymousDetection` | `ArchLucid.Api\Swagger\OpenApiAuthAnonymousDetection.cs` | 75.00 | 2 | No |
| 95 | `ArchLucid.Api.Controllers.Authority.ExportsController` | `ArchLucid.Api\Controllers\Authority\ExportsController.cs` | 76.15 | 31 | No |
| 96 | `ArchLucid.Api.Mapping.ReplayComparisonRequestMapper` | `ArchLucid.Api\Mapping\ReplayComparisonRequestMapper.cs` | 76.47 | 8 | No |
| 97 | `ArchLucid.Api.FileWithRangeResult` | `ArchLucid.Api\FileWithRangeResult.cs` | 77.05 | 14 | No |
| 98 | `ArchLucid.Api.Auth.Services.AuthServiceCollectionExtensions` | `ArchLucid.Api\Auth\Services\AuthServiceCollectionExtensions.cs` | 77.42 | 21 | No |
| 99 | `ArchLucid.Api.Filters.TrialLimitAuthorizationResultHandler` | `ArchLucid.Api\Filters\TrialLimitFilter.cs` | 80.00 | 2 | No |
| 100 | `ArchLucid.Api.Startup.RateLimitingRolePartitionBuilder` | `ArchLucid.Api\Startup\RateLimitingRolePartitionBuilder.cs` | 80.65 | 6 | No |
| 101 | `ArchLucid.Api.Controllers.Billing.BillingCheckoutController` | `ArchLucid.Api\Controllers\Billing\BillingCheckoutController.cs` | 81.19 | 19 | No |
| 102 | `ArchLucid.Api.Controllers.Admin.AuditController` | `ArchLucid.Api\Controllers\Admin\AuditController.cs` | 83.33 | 12 | No |
| 103 | `ArchLucid.Api.Controllers.Governance.PolicyPacksController` | `ArchLucid.Api\Controllers\Governance\PolicyPacksController.cs` | 85.11 | 14 | No |
| 104 | `ArchLucid.Api.ProblemDetails.ApiProblemDetailsExceptionFilter` | `ArchLucid.Api\ProblemDetails\ApiProblemDetailsExceptionFilter.cs` | 85.71 | 1 | No |
| 105 | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeParser` | `ArchLucid.Api\Models\Evolution\EvolutionOutcomeParser.cs` | 86.36 | 6 | No |
| 106 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportMarkdownFormatter` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationReportMarkdownFormatter.cs` | 87.50 | 16 | No |
| 107 | `ArchLucid.Api.Controllers.Authority.DocxExportController` | `ArchLucid.Api\Controllers\Authority\DocxExportController.cs` | 88.06 | 8 | No |
| 108 | `ArchLucid.Api.ProblemDetails.ApplicationProblemMapper` | `ArchLucid.Api\ProblemDetails\ApplicationProblemMapper.cs` | 88.12 | 19 | No |
| 109 | `ArchLucid.Api.Controllers.Notifications.CustomerNotificationChannelPreferencesController` | `ArchLucid.Api\Controllers\Notifications\CustomerNotificationChannelPreferencesController.cs` | 88.46 | 6 | No |
| 110 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportBuilder` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationReportBuilder.cs` | 88.89 | 12 | No |
| 111 | `ArchLucid.Api.Authentication.ApiKeyAuthenticationHandler` | `ArchLucid.Api\Authentication\ApiKeyAuthenticationHandler.cs` | 89.87 | 8 | No |
| 112 | `ArchLucid.Api.Auth.Services.ArchLucidRoleClaimsTransformation` | `ArchLucid.Api\Auth\Services\ArchLucidRoleClaimsTransformation.cs` | 90.24 | 4 | No |
| 113 | `ArchLucid.Api.Controllers.Advisory.LearningController` | `ArchLucid.Api\Controllers\Advisory\LearningController.cs` | 90.48 | 12 | No |
| 114 | `ArchLucid.Api.Formatters.AuditEventCsvFormatter` | `ArchLucid.Api\Formatters\AuditEventCsvFormatter.cs` | 90.62 | 6 | No |
| 115 | `ArchLucid.Api.Startup.InfrastructureExtensions` | `ArchLucid.Api\Startup\InfrastructureExtensions.cs` | 91.60 | 11 | No |
| 116 | `ArchLucid.Api.Controllers.Evolution.EvolutionController` | `ArchLucid.Api\Controllers\Evolution\EvolutionController.cs` | 92.31 | 10 | No |
| 117 | `ArchLucid.Api.Swagger.ProblemDetailsResponsesOperationFilter` | `ArchLucid.Api\Swagger\ProblemDetailsResponsesOperationFilter.cs` | 92.31 | 1 | No |
| 118 | `ArchLucid.Api.Auth.Services.LocalTrialJwtIssuer` | `ArchLucid.Api\Auth\Services\LocalTrialJwtIssuer.cs` | 93.62 | 3 | No |
| 119 | `ArchLucid.Api.Controllers.Alerts.AlertRulesController` | `ArchLucid.Api\Controllers\Alerts\AlertRulesController.cs` | 94.59 | 2 | No |
| 120 | `ArchLucid.Api.Validators.PolicyPackRequestValidationRules` | `ArchLucid.Api\Validators\PolicyPackRequestValidationRules.cs` | 94.74 | 1 | No |
<!-- TB-635-API-COBERTURA-TRIAGE-START -->

#### TB-635 Cobertura triage inventory (generated 2026-07-07)

Owner-classified inventory for **ArchLucid.Api** classes below 95% line coverage in merged Cobertura.
Prerequisite for **TB-636**–**TB-639**; regenerate with `python scripts/ci/api_cobertura_triage_inventory.py --write-inventory`.

| Bucket | Count | Follow-up |
|--------|------:|-----------|
| pure-DTO | 21 | **TB-636** `[ExcludeFromCodeCoverage]` batch |
| integration-covered | 33 | **TB-638** measurement-gap doc (**Done** 2026-07-07) |
| small-logic | 34 | **TB-637** cheap unit tests |
| genuinely-untested | 0 | **TB-639** closed 2026-07-07 |

| Bucket | Class | Line % | Test references (sample) |
|--------|-------|-------:|--------------------------|
| small-logic | `ArchLucid.Api.Auth.Services.ExternalIdIssuerPatterns` | 0.00 | Auth/ExternalIdIssuerPatternsTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Auth.Services.TrialExternalIdJwtBearerSupport` | 0.00 | Auth/TrialExternalIdJwtBearerSupportTests.cs (Unit) |
| pure-DTO | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsByIdsRequest` | 0.00 | Security/TenantIsolationSmokeTests.cs (Slow) |
| small-logic | `ArchLucid.Api.Controllers.Admin.AsyncAuthorityPipelineFeatureState` | 0.00 | AdminControllerTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Admin.DiagnosticsController` | 0.00 | Admin/AuthConfigurationDiagnosticsComposerTests.cs (no Category trait); Admin/IdentityProviderDiagnosticsHealthEvaluatorTests.cs (Unit); Admin/OidcWellKnownDiagnosticsServiceTests.cs (no Category trait) |
| pure-DTO | `ArchLucid.Api.Controllers.Admin.TenantProvisionAdminRequest` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Admin.TenantsAdminController` | 0.00 | — |
| integration-covered | `ArchLucid.Api.Controllers.Advisory.ProductLearningController` | 0.00 | EvolutionControllerFlowTests.cs (Integration); LearningControllerTests.cs (Integration); ProductLearningControllerTests.cs (Integration) |
| genuinely-untested | `ArchLucid.Api.Controllers.Advisory.RecommendationLearningController` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Alerts.AlertRoutingSubscriptionsController` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchItemResult` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchRequest` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchResponse` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Alerts.AlertSimulationController` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Alerts.AlertTuningController` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Alerts.CompositeAlertRulesController` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Auth.TrialLocalIdentityAuthController` | 0.00 | — |
| small-logic | `ArchLucid.Api.Controllers.Authority.ArtifactExportController` | 0.00 | Controllers/ArtifactExportControllerRunExportTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Authority.AuthorityQueryController` | 0.00 | AuditCoverageControllerLogAsyncTests.cs (Unit); AuthorityQueryControllerAnonymousIntegrationTests.cs (Integration); AuthorityQueryControllerListRunsPagedIntegrationTests.cs (Integration) |
| genuinely-untested | `ArchLucid.Api.Controllers.Authority.AuthorityReplayController` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Authority.AuthorityRunEventsController` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Controllers.Authority.RunAgentEvaluationController` | 0.00 | — |
| integration-covered | `ArchLucid.Api.Controllers.Billing.BillingMarketplaceWebhookController` | 0.00 | Billing/BillingMarketplaceWebhookApiFactoryBase.cs (no Category trait); Billing/BillingMarketplaceWebhookHttpTests.cs (Integration); Billing/BillingMarketplaceWebhookLedgerDispatchHttpTests.cs (Integration) |
| integration-covered | `ArchLucid.Api.Controllers.Billing.BillingStripeWebhookController` | 0.00 | Billing/BillingStripeWebhookControllerIntegrationTests.cs (Integration); Billing/StripeCheckoutNoNetworkBillingProvider.cs (no Category trait); WebhookMiddlewareOrderingTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.Controllers.E2e.E2EHarnessController` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Controllers.Governance.GovernanceApprovalBatchReviewRequest` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewItemResult` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewResponse` | 0.00 | — |
| integration-covered | `ArchLucid.Api.Controllers.Planning.ComparisonController` | 0.00 | AdditionalFluentValidationTests.cs (Unit); Admin/AuthConfigurationDiagnosticsComposerTests.cs (no Category trait); AdminApiKeySettingsEndpointTests.cs (Integration) |
| integration-covered | `ArchLucid.Api.Controllers.Planning.ExplanationController` | 0.00 | AdminDiagnosticsServiceNonSqlTests.cs (no Category trait); ArchitectureProvenanceExplanationEndpointTests.cs (Slow); AuditCoverageControllerLogAsyncTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Planning.GraphController` | 0.00 | AdminDiagnosticsServiceNonSqlTests.cs (no Category trait); AdminDiagnosticsServiceSqlPathTests.cs (no Category trait); AdvisoryIntegrationSeed.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Planning.ProvenanceController` | 0.00 | ArchitectureProvenanceExplanationEndpointTests.cs (Slow); ArchitectureRunOrchestrationAuditTests.cs (Unit); AuditCoverageControllerLogAsyncTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Controllers.Planning.ProvenanceQueryController` | 0.00 | ProvenanceControllerTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.RegistrationController` | 0.00 | BaseIntegrationTestFixture.cs (no Category trait); ContextIngestionConnectorRegistrationTests.cs (Integration); DetailedHealthCheckResponseWriterTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Mapping.ConsultingDocxJobPayloadMapper` | 0.00 | Mapping/ConsultingDocxJobPayloadMapperTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.Models.Auth.TrialLocalRegisterRequest` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Models.Auth.TrialLocalRegisterResponse` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Models.Auth.TrialLocalTokenRequest` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Models.Auth.TrialLocalTokenResponse` | 0.00 | — |
| genuinely-untested | `ArchLucid.Api.Models.Auth.TrialLocalVerifyEmailRequest` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.E2e.E2eHarnessBillingSimulatePostRequest` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.E2e.E2eHarnessTrialExpiresPostRequest` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.Evolution.EvolutionSimulationRunResponse` | 0.00 | Models/Evolution/EvolutionCandidateChangeSetResponseMapperTests.cs (Unit) |
| pure-DTO | `ArchLucid.Api.Models.Learning.LearningPlanDetailResponse` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.Learning.LearningPlanEvidenceCountsResponse` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.Learning.LearningPlanListItemResponse` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.Learning.LearningPlanStepResponse` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.Learning.LearningThemeResponse` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Models.Tenancy.TenantRegistrationRequest` | 0.00 | RegistrationControllerTrialRegistrationFailedTests.cs (no Category trait) |
| pure-DTO | `ArchLucid.Api.Models.Tenancy.TenantTrialConvertRequest` | 0.00 | — |
| pure-DTO | `ArchLucid.Api.Services.Admin.DataConsistencyOrphanCounts` | 0.00 | AdminDiagnosticsServiceNonSqlTests.cs (no Category trait); AdminDiagnosticsServiceSqlPathTests.cs (no Category trait) |
| pure-DTO | `ArchLucid.Api.Services.Admin.OrphanComparisonRemediationResult` | 0.00 | AdminDiagnosticsServiceNonSqlTests.cs (no Category trait); AdminDiagnosticsServiceSqlPathTests.cs (no Category trait) |
| small-logic | `ArchLucid.Api.Validators.ConsultingDocxProfileRecommendationRequestValidator` | 0.00 | ConsultingDocxValidatorsTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Controllers.Authority.AuthorityCompareController` | 15.09 | AuthorityCompareControllerTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Services.Admin.AdminDiagnosticsService` | 15.61 | AdminControllerTests.cs (Unit); AdminDiagnosticsServiceNonSqlTests.cs (no Category trait); AdminDiagnosticsServiceSqlPathTests.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Alerts.AlertsController` | 16.33 | AdditionalFluentValidationTests.cs (Unit); AlertLifecycleIntegrationTests.cs (Integration); AlertRuleBodyValidatorTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Advisory.AdvisoryController` | 19.58 | AdditionalFluentValidationTests.cs (Unit); AdminConfigLintEndpointTests.cs (Integration); AdminControllerTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Admin.AdminController` | 28.57 | ActorContextTests.cs (Unit); Admin/AdminCrossTenantUsageRollupAuthorizationIntegrationTests.cs (Integration); Admin/AuthConfigurationDiagnosticsComposerTests.cs (no Category trait) |
| small-logic | `ArchLucid.Api.OpenApi.MicrosoftOpenApiAnonymousSecurityOperationTransformer` | 33.33 | — |
| small-logic | `ArchLucid.Api.ProductLearning.ProductLearningQueryParser` | 35.00 | ProductLearningQueryParserTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.Services.LearningPlanningReadService` | 40.77 | — |
| small-logic | `ArchLucid.Api.Services.Evolution.EvolutionSimulationService` | 42.23 | Services/Evolution/EvolutionSimulationServiceEvaluateLinkedRunsHappyPathTests.cs (Unit); Services/Evolution/EvolutionSimulationServiceInvalidPlanSnapshotJsonTests.cs (Unit); Services/Evolution/EvolutionSimulationServiceTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Governance.ManifestsController` | 43.10 | AdminDiagnosticsServiceNonSqlTests.cs (no Category trait); AdminDiagnosticsServiceSqlPathTests.cs (no Category trait); AdvisoryIntegrationSeed.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Governance.GovernanceController` | 45.39 | ApproveGovernanceRequestValidatorTests.cs (Unit); ArchitectureControllerTests.cs (Slow); ArchitectureTests.cs (Integration) |
| integration-covered | `ArchLucid.Api.Controllers.Advisory.AdvisorySchedulingController` | 46.84 | AdvisorySchedulingControllerIntegrationTests.cs (Integration) |
| integration-covered | `ArchLucid.Api.Controllers.Advisory.DigestSubscriptionsController` | 46.99 | DigestDeliveryLifecycleIntegrationTests.cs (Integration); DigestSubscriptionsControllerAuthorizationIntegrationTests.cs (Integration) |
| small-logic | `ArchLucid.Api.Models.Evolution.EvolutionCandidateChangeSetResponseMapper` | 52.38 | Models/Evolution/EvolutionCandidateChangeSetResponseMapperTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Tenancy.TenantTrialController` | 52.69 | Billing/StripeCheckoutEndToEndTests.cs (Slow); Hosting/SamlCertExpiryNotificationWorkTests.cs (no Category trait); TenantTrialControllerTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeShadowReader` | 53.85 | — |
| integration-covered | `ArchLucid.Api.Controllers.Governance.GovernanceResolutionController` | 54.39 | GovernanceResolutionControllerAuthorizationIntegrationTests.cs (Integration); PolicyPacksIntegrationTests.cs (Slow) |
| small-logic | `ArchLucid.Api.Controllers.Admin.ClientErrorTelemetryController` | 56.41 | ClientErrorTelemetryControllerTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.Services.ReplayArtifactResponseFactory` | 57.14 | — |
| genuinely-untested | `ArchLucid.Api.ProblemDetails.TrialLimitProblemResponse` | 57.38 | Filters/TrialLimitFilterTests.cs (no Category trait) |
| small-logic | `ArchLucid.Api.ProblemDetails.ProblemDetailsExtensions` | 59.26 | ApiControllerProblemDetailsSourceGuardTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Planning.ComparisonsController` | 61.90 | ArchitectureComparisonSearchTests.cs (Integration); ComparisonsControllerTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Controllers.Planning.AskController` | 64.29 | AdvisoryIntegrationSeed.cs (no Category trait); ArchitectureFindingAskControllerTests.cs (Unit); AskThreadIntegrationTests.cs (Slow) |
| genuinely-untested | `ArchLucid.Api.Filters.TrialLimitAuthorizationHandler` | 65.00 | — |
| small-logic | `ArchLucid.Api.Controllers.Authority.AnalysisReportsController` | 65.55 | AuditCoverageControllerLogAsyncTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Controllers.Planning.ConversationController` | 65.79 | AskThreadIntegrationTests.cs (Slow); ConversationServiceTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Authority.RunsController` | 66.67 | AdminCustomerSuccessControllerTests.cs (Unit); AdminDataConsistencyOrphanRemediationEndpointsIntegrationTests.cs (Integration); AdminDiagnosticsServiceNonSqlTests.cs (no Category trait) |
| genuinely-untested | `ArchLucid.Api.Filters.TrialLimitExceededAuditFilter` | 66.67 | — |
| small-logic | `ArchLucid.Api.Middleware.ApiDeprecationHeadersMiddleware` | 66.67 | ApiDeprecationHeadersMiddlewareTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Controllers.Authority.RunQueryController` | 67.96 | RunQueryControllerTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Mapping.ComparisonResponseMapper` | 68.00 | — |
| integration-covered | `ArchLucid.Api.Controllers.Governance.GovernancePreviewController` | 69.44 | CreateGovernancePreviewRequestValidatorTests.cs (Unit); DemoSeedServiceTests.cs (Integration); GovernancePreviewControllerTests.cs (Integration) |
| integration-covered | `ArchLucid.Api.Controllers.Authority.RunsController` | 69.80 | AdminCustomerSuccessControllerTests.cs (Unit); AdminDataConsistencyOrphanRemediationEndpointsIntegrationTests.cs (Integration); AdminDiagnosticsServiceNonSqlTests.cs (no Category trait) |
| genuinely-untested | `ArchLucid.Api.Models.PagingParameters` | 70.00 | — |
| genuinely-untested | `ArchLucid.Api.Startup.PipelineExtensions` | 70.00 | — |
| genuinely-untested | `ArchLucid.Api.Swagger.OpenApiAuthDocumentMutator` | 72.09 | — |
| small-logic | `ArchLucid.Api.Controllers.Authority.RunComparisonController` | 74.19 | ComparisonsControllerTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.ApiFileResults` | 75.00 | — |
| integration-covered | `ArchLucid.Api.ProblemDetails.ProblemCorrelation` | 75.00 | ApiProblemDetailsExceptionFilterTests.cs (Unit); ApplicationProblemMapperTests.cs (Unit); Integrations/ItsmOutboundIssuesEndpointIntegrationTests.cs (Integration) |
| small-logic | `ArchLucid.Api.Swagger.OpenApiAuthAnonymousDetection` | 75.00 | OpenApiAuthAnonymousDetectionTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Authority.ExportsController` | 76.15 | AdminControllerTests.cs (Unit); ArchitectureExportAuditTests.cs (Integration); ArchitectureExportRecordDiffTests.cs (Integration) |
| small-logic | `ArchLucid.Api.Mapping.ReplayComparisonRequestMapper` | 76.47 | ReplayComparisonRequestMapperTests.cs (Unit) |
| small-logic | `ArchLucid.Api.FileWithRangeResult` | 77.05 | FileWithRangeResultTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Auth.Services.AuthServiceCollectionExtensions` | 77.42 | ApiKeyAuthenticationHandlerTests.cs (Unit); Auth/ApiAuthBehaviorContractTests.cs (Unit); Auth/ArchLucidSaml2AuthenticationCoexistenceConfigurerTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.Filters.TrialLimitAuthorizationResultHandler` | 80.00 | — |
| genuinely-untested | `ArchLucid.Api.Startup.RateLimitingRolePartitionBuilder` | 80.65 | — |
| integration-covered | `ArchLucid.Api.Controllers.Billing.BillingCheckoutController` | 81.19 | Billing/BillingCheckoutControllerTests.cs (Integration); Billing/BillingCheckoutEndToEndSqlJwtFactoryBase.cs (no Category trait); Billing/MarketplaceCheckoutEndToEndWebAppFactory.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Admin.AuditController` | 83.33 | AdminApiKeySettingsEndpointTests.cs (Integration); AdminControllerTests.cs (Unit); AdminDiagnosticsServiceNonSqlTests.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Governance.PolicyPacksController` | 85.11 | CreatePolicyPackRequestValidatorTests.cs (Unit); GovernancePolicyPackContentPropertyTests.cs (Unit); OperatorDemoReviewServiceTests.cs (no Category trait) |
| small-logic | `ArchLucid.Api.ProblemDetails.ApiProblemDetailsExceptionFilter` | 85.71 | ApiProblemDetailsExceptionFilterTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeParser` | 86.36 | — |
| small-logic | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportMarkdownFormatter` | 87.50 | EvolutionSimulationReportBuilderTests.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Authority.DocxExportController` | 88.06 | ArchitectureExportAuditTests.cs (Integration); AuditCoverageControllerLogAsyncTests.cs (Unit); ComparisonsControllerTests.cs (Unit) |
| small-logic | `ArchLucid.Api.ProblemDetails.ApplicationProblemMapper` | 88.12 | ApiProblemDetailsExceptionFilterTests.cs (Unit); ApplicationProblemMapperTests.cs (Unit) |
| integration-covered | `ArchLucid.Api.Controllers.Notifications.CustomerNotificationChannelPreferencesController` | 88.46 | CustomerNotificationChannelPreferencesControllerTests.cs (Unit); CustomerNotificationChannelPreferencesIntegrationTests.cs (Integration); CustomerNotificationChannelPreferencesWriteIntegrationTests.cs (Integration) |
| genuinely-untested | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportBuilder` | 88.89 | EvolutionSimulationReportBuilderTests.cs (no Category trait) |
| small-logic | `ArchLucid.Api.Authentication.ApiKeyAuthenticationHandler` | 89.87 | ApiKeyAuthenticationHandlerTests.cs (Unit) |
| small-logic | `ArchLucid.Api.Auth.Services.ArchLucidRoleClaimsTransformation` | 90.24 | Auth/ArchLucidRoleClaimsTransformationSamlTests.cs (Unit); Auth/TokenClaimsDiagnosticServiceTests.cs (Unit); FineGrainedAuthorizationPolicyApiFactories.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Advisory.LearningController` | 90.48 | EvolutionControllerFlowTests.cs (Integration); EvolutionControllerQueryTests.cs (Integration); LearningControllerTests.cs (Integration) |
| small-logic | `ArchLucid.Api.Formatters.AuditEventCsvFormatter` | 90.62 | AuditEventCsvFormatterTests.cs (Unit) |
| genuinely-untested | `ArchLucid.Api.Startup.InfrastructureExtensions` | 91.60 | — |
| integration-covered | `ArchLucid.Api.Controllers.Evolution.EvolutionController` | 92.31 | EvolutionControllerFlowTests.cs (Integration); EvolutionControllerQueryTests.cs (Integration); EvolutionSimulationReportBuilderTests.cs (no Category trait) |
| genuinely-untested | `ArchLucid.Api.Swagger.ProblemDetailsResponsesOperationFilter` | 92.31 | — |
| genuinely-untested | `ArchLucid.Api.Auth.Services.LocalTrialJwtIssuer` | 93.62 | Billing/BillingCheckoutEndToEndSqlJwtFactoryBase.cs (no Category trait); JwtLocalSigningIntegrationTestTokens.cs (no Category trait) |
| integration-covered | `ArchLucid.Api.Controllers.Alerts.AlertRulesController` | 94.59 | AlertLifecycleIntegrationTests.cs (Integration); AlertRuleConcurrencyIntegrationTests.cs (Slow); AlertRulesIntegrationTests.cs (Integration) |
| small-logic | `ArchLucid.Api.Validators.PolicyPackRequestValidationRules` | 94.74 | PolicyPackRequestValidationRulesTests.cs (Unit) |

<!-- TB-635-API-COBERTURA-TRIAGE-END -->

### ArchLucid.Host.Core 