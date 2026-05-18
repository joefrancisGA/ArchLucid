> **Scope:** Coverage gap analysis (merged Cobertura) - tables from the Cobertura file named under **Data source**; stale or partial local merges (or leftover shards under `coverage-gap-1a`) produce misleading percentages — clean the folder before `dotnet test` or use the CI **`coverage-merged-cobertura`** artifact.
>
> **Spine doc:** [`START_HERE.md`](START_HERE.md).

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

**Optional local strict reproduction.** To approximate CI before push: Release-build the solution, set **`ARCHLUCID_SQL_TEST`** to a local SQL instance, run **`dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:"XPlat Code Coverage"`**, merge Cobertura with ReportGenerator, then run **`assert_merged_line_coverage_min.py`** with the same arguments as the workflow. Expect **long** wall time; this path is for deep debugging, not every edit.

## Strict profile (product target)

The **V1.1** merge-blocking target (ratchet goal) for merged line + ratchet is:

- **Merged line ≥ 95%**
- **Merged branch ≥ 63%**
- **Per-product-package line ≥ 63%** for every gated **`ArchLucid.*`** assembly with coverable lines

**Compliance status:** **`.github/workflows/ci.yml`** (`dotnet-coverage-merge` after **`dotnet-full-regression`**) enforces **merged branch** and **per-product-package line** on merged Cobertura. **Merged line** uses **`assert_merged_line_coverage_min.py`** with **`0`** minimum (no merge-blocking overall line floor). **`assert_coverage_floor_ratchet.py`** is **not** invoked until **V1.1** (**`docs/library/V1_DEFERRED.md`**).

To verify **CI parity**, run **`assert_merged_line_coverage_min.py`** on merged **`Cobertura.xml`** with **`0`**, **`--min-branch-pct 63`**, **`--min-package-line-pct 63`** (same as CI; no **`--skip-package-line-gate`**). For the **strict-profile / V1.1** dry run, use **`95`** instead of **`0`** and **`assert_coverage_floor_ratchet.py`**.

## Current merge-blocking gates

The merge step in **`.github/workflows/ci.yml`** (`dotnet-coverage-merge`) enforces:

- **Branch coverage ≥ 63%**
- **Per-product-package line ≥ 63%** for every gated **`ArchLucid.*`** assembly with coverable lines (see **`scripts/ci/assert_merged_line_coverage_min.py`** invocation in the workflow)

**Merged line ≥ 95%** and the **ratchet** are deferred to **V1.1** (see **`docs/library/V1_DEFERRED.md`**).

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

**Data source:** `coverage-gap-1a\merged\Cobertura.xml` (file mtime **2026-05-15 18:35:56 UTC**). For CI gate parity, prefer the **`coverage-merged-cobertura`** artifact from job **`.NET: merge coverage + gates`** (copy **`Cobertura.xml`** and run **`python scripts/ci/coverage_gap_analysis.py --cobertura <path>`**). See **`docs/COVERAGE_GAP_ANALYSIS.md`** — local merges without **`ARCHLUCID_SQL_TEST`** under-count SQL-only paths.

**Measurement:** Production `ArchLucid.*` assemblies only; excludes `*.Tests`, TestSupport, Benchmarks, and `ArchLucid.Worker` (`Program.cs` omitted per **`coverage.runsettings`** **`ExcludeByFile`**).

## All assemblies by line coverage (lowest first)

| Assembly | Line coverage % | Coverable lines (approx.) |
|----------|-----------------|---------------------------|
| ArchLucid.Notifications | 2.90 | 414 |
| ArchLucid.Capabilities.Cost | 14.75 | 122 |
| ArchLucid.Decisioning | 22.30 | 13406 |
| ArchLucid.Host.Core | 24.44 | 12168 |
| ArchLucid.Application | 51.41 | 41745 |
| ArchLucid.ArtifactSynthesis | 62.22 | 3664 |
| ArchLucid.Retrieval | 62.54 | 714 |
| ArchLucid.Persistence | 65.35 | 29261 |
| ArchLucid.Cli | 69.49 | 12367 |
| ArchLucid.Host.Composition | 72.64 | 4628 |
| ArchLucid.AgentRuntime | 72.96 | 11468 |
| ArchLucid.Core | 75.63 | 11946 |
| ArchLucid.ContextIngestion | 76.93 | 2025 |
| ArchLucid.Contracts | 81.63 | 7013 |
| ArchLucid.Analyzers | 82.18 | 1794 |
| ArchLucid.KnowledgeGraph | 88.02 | 1180 |
| ArchLucid.Integrations.AzureDevOps | 90.15 | 671 |
| ArchLucid.Provenance | 92.27 | 730 |
| ArchLucid.AgentSimulator | 97.59 | 582 |
| ArchLucid.Api.Client | 100.00 | 32 |

## Per-assembly class gaps (by line coverage %)

Per Cobertura **class** aggregate `<lines>` rows. **Line coverage %** is **(coverable − uncovered) / coverable** for that class. **Partial types** merged by **class name + file**. Sort order: **lowest assembly line % first**, **except** **`ArchLucid.Decisioning`** — that assembly is placed **near the bottom** (after **`ArchLucid.AgentSimulator`**, before **`100.00%`** assemblies) because its class list is large.

**Prior attempt?** — **Yes** if the fully-qualified type name (or its short name, length ≥ **8**) appears as a substring in `docs/COVERAGE_GAP_ANALYSIS.md` (heuristic; very short names are not matched on their own).

### ArchLucid.Notifications (2.90% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Notifications.AuthorityRunCommittedChatOpsHook` | `ArchLucid.Notifications\AuthorityRunCommittedChatOpsHook.cs` | 0.00 | 63 | No |
| 2 | `ArchLucid.Notifications.ChatOpsIncomingWebhookBodies` | `ArchLucid.Notifications\ChatOpsIncomingWebhookBodies.cs` | 0.00 | 71 | No |
| 3 | `ArchLucid.Notifications.ChatOpsIncomingWebhooksOptions` | `ArchLucid.Notifications\ChatOpsIncomingWebhooksOptions.cs` | 0.00 | 10 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Notifications.AuthorityRunCommittedChatOpsHook` | `ArchLucid.Notifications\AuthorityRunCommittedChatOpsHook.cs` | 0.00 | 63 | No |
| 2 | `ArchLucid.Notifications.ChatOpsIncomingWebhookBodies` | `ArchLucid.Notifications\ChatOpsIncomingWebhookBodies.cs` | 0.00 | 71 | No |
| 3 | `ArchLucid.Notifications.ChatOpsIncomingWebhooksOptions` | `ArchLucid.Notifications\ChatOpsIncomingWebhooksOptions.cs` | 0.00 | 10 | No |
| 4 | `ArchLucid.Notifications.ChatOpsWebhookDeliveryService` | `ArchLucid.Notifications\ChatOpsWebhookDeliveryService.cs` | 0.00 | 14 | No |
| 5 | `ArchLucid.Notifications.ChatOpsWebhookMessage` | `ArchLucid.Notifications\ChatOpsWebhookMessage.cs` | 0.00 | 8 | No |
| 6 | `ArchLucid.Notifications.SlackInteractivityVerifier` | `ArchLucid.Notifications\SlackInteractivityVerifier.cs` | 0.00 | 29 | No |
| 7 | `ArchLucid.Notifications.AuthorityRunCommittedChatOpsNotice` | `ArchLucid.Notifications\AuthorityRunCommittedChatOpsNotice.cs` | 50.00 | 6 | No |

### ArchLucid.Capabilities.Cost (14.75% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Capabilities.Cost.CostConstraintFindingEngine` | `ArchLucid.Capabilities.Cost\CostConstraintFindingEngine.cs` | 0.00 | 51 | No |
| 2 | `ArchLucid.Capabilities.Cost.CostAgentHandler` | `ArchLucid.Capabilities.Cost\CostAgentHandler.cs` | 90.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Capabilities.Cost.CostConstraintFindingEngine` | `ArchLucid.Capabilities.Cost\CostConstraintFindingEngine.cs` | 0.00 | 51 | No |
| 2 | `ArchLucid.Capabilities.Cost.CostAgentHandler` | `ArchLucid.Capabilities.Cost\CostAgentHandler.cs` | 90.00 | 1 | No |

### ArchLucid.Host.Core (24.44% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Core.Ask.ConversationService` | `ArchLucid.Host.Core\Ask\ConversationService.cs` | 0.00 | 54 | No |
| 2 | `ArchLucid.Host.Core.Auth.Services.HttpScopeContextProvider` | `ArchLucid.Host.Core\Auth\Services\HttpScopeContextProvider.cs` | 0.00 | 22 | No |
| 3 | `ArchLucid.Host.Core.Auth.Services.NoOpRoleSyncService` | `ArchLucid.Host.Core\Auth\Services\NoOpRoleSyncService.cs` | 0.00 | 3 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Core.Ask.ConversationService` | `ArchLucid.Host.Core\Ask\ConversationService.cs` | 0.00 | 54 | No |
| 2 | `ArchLucid.Host.Core.Auth.Services.HttpScopeContextProvider` | `ArchLucid.Host.Core\Auth\Services\HttpScopeContextProvider.cs` | 0.00 | 22 | No |
| 3 | `ArchLucid.Host.Core.Auth.Services.NoOpRoleSyncService` | `ArchLucid.Host.Core\Auth\Services\NoOpRoleSyncService.cs` | 0.00 | 3 | No |
| 4 | `ArchLucid.Host.Core.Authorization.TenantOrProjectCapabilityAuthorizationHandler` | `ArchLucid.Host.Core\Authorization\TenantOrProjectCapabilityAuthorizationHandler.cs` | 0.00 | 98 | No |
| 5 | `ArchLucid.Host.Core.Configuration.ApiDeprecationOptions` | `ArchLucid.Host.Core\Configuration\ApiDeprecationOptions.cs` | 0.00 | 9 | No |
| 6 | `ArchLucid.Host.Core.Configuration.ArchLucidLegacyConfigurationWarnings` | `ArchLucid.Host.Core\Configuration\ArchLucidLegacyConfigurationWarnings.cs` | 0.00 | 17 | No |
| 7 | `ArchLucid.Host.Core.Configuration.ArchLucidStorageMode` | `ArchLucid.Host.Core\Configuration\ArchLucidStorageMode.cs` | 0.00 | 4 | No |
| 8 | `ArchLucid.Host.Core.Configuration.AuthorityPipelineWorkProcessorOptions` | `ArchLucid.Host.Core\Configuration\AuthorityPipelineWorkProcessorOptions.cs` | 0.00 | 12 | No |
| 9 | `ArchLucid.Host.Core.Configuration.BatchReplayOptions` | `ArchLucid.Host.Core\Configuration\BatchReplayOptions.cs` | 0.00 | 3 | No |
| 10 | `ArchLucid.Host.Core.Configuration.DeveloperExperienceOptions` | `ArchLucid.Host.Core\Configuration\DeveloperExperienceOptions.cs` | 0.00 | 2 | No |
| 11 | `ArchLucid.Host.Core.Configuration.E2EHarnessOptions` | `ArchLucid.Host.Core\Configuration\E2eHarnessOptions.cs` | 0.00 | 4 | No |
| 12 | `ArchLucid.Host.Core.Configuration.ObservabilityHostOptions` | `ArchLucid.Host.Core\Configuration\ObservabilityHostOptions.cs` | 0.00 | 6 | No |
| 13 | `ArchLucid.Host.Core.Configuration.ObservabilityPrometheusOptions` | `ArchLucid.Host.Core\Configuration\ObservabilityHostOptions.cs` | 0.00 | 12 | No |
| 14 | `ArchLucid.Host.Core.Configuration.ObservabilityTracingOptions` | `ArchLucid.Host.Core\Configuration\ObservabilityTracingOptions.cs` | 0.00 | 5 | No |
| 15 | `ArchLucid.Host.Core.Configuration.ReplayDiagnosticsOptions` | `ArchLucid.Host.Core\Configuration\ReplayDiagnosticsOptions.cs` | 0.00 | 6 | No |
| 16 | `ArchLucid.Host.Core.Configuration.Secrets.EnvironmentVariableSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\EnvironmentVariableSecretProvider.cs` | 0.00 | 6 | No |
| 17 | `ArchLucid.Host.Core.Configuration.Secrets.KeyVaultSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\KeyVaultSecretProvider.cs` | 0.00 | 21 | No |
| 18 | `ArchLucid.Host.Core.Configuration.WebhookDeliveryOptions` | `ArchLucid.Host.Core\Configuration\WebhookDeliveryOptions.cs` | 0.00 | 10 | No |
| 19 | `ArchLucid.Host.Core.Diagnostics.ConfigurationHealthCheckResult` | `ArchLucid.Host.Core\Diagnostics\ConfigurationHealthReport.cs` | 0.00 | 6 | No |
| 20 | `ArchLucid.Host.Core.Diagnostics.ConfigurationHealthReport` | `ArchLucid.Host.Core\Diagnostics\ConfigurationHealthReport.cs` | 0.00 | 2 | No |
| 21 | `ArchLucid.Host.Core.Health.BlobStorageHealthCheck` | `ArchLucid.Host.Core\Health\BlobStorageHealthCheck.cs` | 0.00 | 16 | No |
| 22 | `ArchLucid.Host.Core.Health.CircuitBreakerHealthCheck` | `ArchLucid.Host.Core\Health\CircuitBreakerHealthCheck.cs` | 0.00 | 34 | No |
| 23 | `ArchLucid.Host.Core.Health.ComplianceRulePackHealthCheck` | `ArchLucid.Host.Core\Health\ComplianceRulePackHealthCheck.cs` | 0.00 | 7 | No |
| 24 | `ArchLucid.Host.Core.Health.DataArchivalHostHealthCheck` | `ArchLucid.Host.Core\Health\DataArchivalHostHealthCheck.cs` | 0.00 | 13 | No |
| 25 | `ArchLucid.Host.Core.Health.DemoViewerDataHealthCheck` | `ArchLucid.Host.Core\Health\DemoViewerDataHealthCheck.cs` | 0.00 | 14 | No |
| 26 | `ArchLucid.Host.Core.Health.DetailedHealthCheckResponseWriter` | `ArchLucid.Host.Core\Health\DetailedHealthCheckResponseWriter.cs` | 0.00 | 35 | No |
| 27 | `ArchLucid.Host.Core.Health.ProcessTempDirectoryHealthCheck` | `ArchLucid.Host.Core\Health\ProcessTempDirectoryHealthCheck.cs` | 0.00 | 16 | No |
| 28 | `ArchLucid.Host.Core.Health.RlsSessionContextInfrastructureHealthCheck` | `ArchLucid.Host.Core\Health\RlsSessionContextInfrastructureHealthCheck.cs` | 0.00 | 36 | No |
| 29 | `ArchLucid.Host.Core.Health.RunGoldenManifestConsistencyHealthCheck` | `ArchLucid.Host.Core\Health\RunGoldenManifestConsistencyHealthCheck.cs` | 0.00 | 23 | No |
| 30 | `ArchLucid.Host.Core.Health.SchemaFilesHealthCheck` | `ArchLucid.Host.Core\Health\SchemaFilesHealthCheck.cs` | 0.00 | 33 | No |
| 31 | `ArchLucid.Host.Core.Health.SqlConnectionHealthCheck` | `ArchLucid.Host.Core\Health\SqlConnectionHealthCheck.cs` | 0.00 | 18 | No |
| 32 | `ArchLucid.Host.Core.Health.SqlSystemPlaneHealthCheck` | `ArchLucid.Host.Core\Health\SqlSystemPlaneHealthCheck.cs` | 0.00 | 25 | No |
| 33 | `ArchLucid.Host.Core.Hosted.ArchitectureProjectRetentionPurgeBackgroundWork` | `ArchLucid.Host.Core\Hosted\ArchitectureProjectRetentionPurgeBackgroundWork.cs` | 0.00 | 42 | No |
| 34 | `ArchLucid.Host.Core.Hosted.ArchitectureProjectRetentionPurgeHostedService` | `ArchLucid.Host.Core\Hosted\ArchitectureProjectRetentionPurgeHostedService.cs` | 0.00 | 31 | No |
| 35 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkHostedService` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkHostedService.cs` | 0.00 | 27 | No |
| 36 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkProcessor` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkProcessor.cs` | 0.00 | 141 | No |
| 37 | `ArchLucid.Host.Core.Hosted.AzureExtractorAutoPullHostedService` | `ArchLucid.Host.Core\Hosted\AzureExtractorAutoPullHostedService.cs` | 0.00 | 31 | No |
| 38 | `ArchLucid.Host.Core.Hosted.BackgroundJobStuckRunningWatchdogHostedService` | `ArchLucid.Host.Core\Hosted\BackgroundJobStuckRunningWatchdogHostedService.cs` | 0.00 | 27 | No |
| 39 | `ArchLucid.Host.Core.Hosted.DataArchivalHostedService` | `ArchLucid.Host.Core\Hosted\DataArchivalHostedService.cs` | 0.00 | 37 | No |
| 40 | `ArchLucid.Host.Core.Hosted.DataConsistencyOrphanProbeHostedService` | `ArchLucid.Host.Core\Hosted\DataConsistencyOrphanProbeHostedService.cs` | 0.00 | 32 | No |
| 41 | `ArchLucid.Host.Core.Hosted.ExecDigestWeeklyHostedService` | `ArchLucid.Host.Core\Hosted\ExecDigestWeeklyHostedService.cs` | 0.00 | 28 | No |
| 42 | `ArchLucid.Host.Core.Hosted.FirstTenantFunnelArchivalHostedService` | `ArchLucid.Host.Core\Hosted\FirstTenantFunnelArchivalHostedService.cs` | 0.00 | 34 | No |
| 43 | `ArchLucid.Host.Core.Hosted.HotPathMemoryReplicaCoherenceHostedLogger` | `ArchLucid.Host.Core\Hosted\HotPathMemoryReplicaCoherenceHostedLogger.cs` | 0.00 | 23 | No |
| 44 | `ArchLucid.Host.Core.Hosted.IntegrationEventOutboxHostedService` | `ArchLucid.Host.Core\Hosted\IntegrationEventOutboxHostedService.cs` | 0.00 | 27 | No |
| 45 | `ArchLucid.Host.Core.Hosted.LeaderElectionWorkRunner` | `ArchLucid.Host.Core\Hosted\LeaderElectionWorkRunner.cs` | 0.00 | 4 | No |
| 46 | `ArchLucid.Host.Core.Hosted.LlmCostEstimationUsdRateOverrideWarmupHostedService` | `ArchLucid.Host.Core\Hosted\LlmCostEstimationUsdRateOverrideWarmupHostedService.cs` | 0.00 | 27 | No |
| 47 | `ArchLucid.Host.Core.Hosted.OutboxOperationalMetricsHostedService` | `ArchLucid.Host.Core\Hosted\OutboxOperationalMetricsHostedService.cs` | 0.00 | 43 | No |
| 48 | `ArchLucid.Host.Core.Hosted.RetrievalIndexingOutboxHostedService` | `ArchLucid.Host.Core\Hosted\RetrievalIndexingOutboxHostedService.cs` | 0.00 | 27 | No |
| 49 | `ArchLucid.Host.Core.Hosted.TrialArchitecturePreseedHostedService` | `ArchLucid.Host.Core\Hosted\TrialArchitecturePreseedHostedService.cs` | 0.00 | 42 | No |
| 50 | `ArchLucid.Host.Core.Hosted.TrialLifecycleEmailScanHostedService` | `ArchLucid.Host.Core\Hosted\TrialLifecycleEmailScanHostedService.cs` | 0.00 | 28 | No |
| 51 | `ArchLucid.Host.Core.Hosted.TrialLifecycleSchedulerHostedService` | `ArchLucid.Host.Core\Hosted\TrialLifecycleSchedulerHostedService.cs` | 0.00 | 36 | No |
| 52 | `ArchLucid.Host.Core.Hosted.WeeklyArchitectureDigestHostedService` | `ArchLucid.Host.Core\Hosted\WeeklyArchitectureDigestHostedService.cs` | 0.00 | 49 | No |
| 53 | `ArchLucid.Host.Core.Hosting.GracefulShutdownNotificationHostedService` | `ArchLucid.Host.Core\Hosting\GracefulShutdownNotificationHostedService.cs` | 0.00 | 16 | No |
| 54 | `ArchLucid.Host.Core.Hosting.GracefulShutdownWebApplicationBuilderExtensions` | `ArchLucid.Host.Core\Hosting\GracefulShutdownWebApplicationBuilderExtensions.cs` | 0.00 | 7 | No |
| 55 | `ArchLucid.Host.Core.Hosting.HostingRoleResolver` | `ArchLucid.Host.Core\Hosting\HostingRoleResolver.cs` | 0.00 | 7 | No |
| 56 | `ArchLucid.Host.Core.Integration.IntegrationEventServiceBusMessageDispatch` | `ArchLucid.Host.Core\Integration\IntegrationEventServiceBusMessageDispatch.cs` | 0.00 | 54 | No |
| 57 | `ArchLucid.Host.Core.Integration.LoggingIntegrationEventHandler` | `ArchLucid.Host.Core\Integration\LoggingIntegrationEventHandler.cs` | 0.00 | 18 | No |
| 58 | `ArchLucid.Host.Core.Integration.ProcessMessageEventArgsSettlement` | `ArchLucid.Host.Core\Integration\IntegrationEventPeekLockSettlements.cs` | 0.00 | 3 | No |
| 59 | `ArchLucid.Host.Core.Integration.ServiceBusReceiverSettlement` | `ArchLucid.Host.Core\Integration\IntegrationEventPeekLockSettlements.cs` | 0.00 | 3 | No |
| 60 | `ArchLucid.Host.Core.Integration.TrialLifecycleEmailIntegrationEventHandler` | `ArchLucid.Host.Core\Integration\TrialLifecycleEmailIntegrationEventHandler.cs` | 0.00 | 26 | No |
| 61 | `ArchLucid.Host.Core.Jobs.AzureBlobBackgroundJobResultBlobAccessor` | `ArchLucid.Host.Core\Jobs\AzureBlobBackgroundJobResultBlobAccessor.cs` | 0.00 | 34 | No |
| 62 | `ArchLucid.Host.Core.Jobs.AzureStorageQueueBackgroundJobNotifySender` | `ArchLucid.Host.Core\Jobs\AzureStorageQueueBackgroundJobNotifySender.cs` | 0.00 | 6 | No |
| 63 | `ArchLucid.Host.Core.Jobs.BackgroundJobPersistenceMapper` | `ArchLucid.Host.Core\Jobs\BackgroundJobPersistenceMapper.cs` | 0.00 | 15 | No |
| 64 | `ArchLucid.Host.Core.Jobs.BackgroundJobQueueAddress` | `ArchLucid.Host.Core\Jobs\BackgroundJobQueueAddress.cs` | 0.00 | 11 | No |
| 65 | `ArchLucid.Host.Core.Jobs.BackgroundJobQueueProcessorHostedService` | `ArchLucid.Host.Core\Jobs\BackgroundJobQueueProcessorHostedService.cs` | 0.00 | 102 | No |
| 66 | `ArchLucid.Host.Core.Jobs.DurableBackgroundJobQueue` | `ArchLucid.Host.Core\Jobs\DurableBackgroundJobQueue.cs` | 0.00 | 46 | No |
| 67 | `ArchLucid.Host.Core.Jobs.InMemoryBackgroundJobQueue` | `ArchLucid.Host.Core\Jobs\InMemoryBackgroundJobQueue.cs` | 0.00 | 116 | No |
| 68 | `ArchLucid.Host.Core.Marketing.PublicShowcaseCommitPageClient` | `ArchLucid.Host.Core\Marketing\PublicShowcaseCommitPageClient.cs` | 0.00 | 54 | No |
| 69 | `ArchLucid.Host.Core.Middleware.CorrelationIdHeaderParser` | `ArchLucid.Host.Core\Middleware\CorrelationIdHeaderParser.cs` | 0.00 | 15 | No |
| 70 | `ArchLucid.Host.Core.Middleware.CorrelationIdMiddleware` | `ArchLucid.Host.Core\Middleware\CorrelationIdMiddleware.cs` | 0.00 | 18 | No |
| 71 | `ArchLucid.Host.Core.Middleware.InboundWebhookCorrelationBinder` | `ArchLucid.Host.Core\Middleware\InboundWebhookCorrelationBinder.cs` | 0.00 | 9 | No |
| 72 | `ArchLucid.Host.Core.Middleware.PrometheusScrapeAuthMiddleware` | `ArchLucid.Host.Core\Middleware\PrometheusScrapeAuthMiddleware.cs` | 0.00 | 54 | No |
| 73 | `ArchLucid.Host.Core.Middleware.SecurityHeadersMiddleware` | `ArchLucid.Host.Core\Middleware\SecurityHeadersMiddleware.cs` | 0.00 | 18 | No |
| 74 | `ArchLucid.Host.Core.Middleware.TraceResponseHeaderMiddleware` | `ArchLucid.Host.Core\Middleware\TraceResponseHeaderMiddleware.cs` | 0.00 | 16 | No |
| 75 | `ArchLucid.Host.Core.ProblemDetails.ProblemErrorCodes` | `ArchLucid.Host.Core\ProblemDetails\ProblemErrorCodes.cs` | 0.00 | 62 | No |
| 76 | `ArchLucid.Host.Core.ProblemDetails.ProblemSupportHints` | `ArchLucid.Host.Core\ProblemDetails\ProblemSupportHints.cs` | 0.00 | 66 | No |
| 77 | `ArchLucid.Host.Core.Services.Ask.AskService` | `ArchLucid.Host.Core\Services\Ask\AskService.cs` | 0.00 | 209 | No |
| 78 | `ArchLucid.Host.Core.Services.Ask.ContextBuilder` | `ArchLucid.Host.Core\Services\Ask\ContextBuilder.cs` | 0.00 | 61 | No |
| 79 | `ArchLucid.Host.Core.Services.AuditRetryDrainHostedService` | `ArchLucid.Host.Core\Services\AuditRetryDrainHostedService.cs` | 0.00 | 31 | No |
| 80 | `ArchLucid.Host.Core.Services.AuthDiagnosticEntry` | `ArchLucid.Host.Core\Services\AuthDiagnosticEntry.cs` | 0.00 | 7 | No |
| 81 | `ArchLucid.Host.Core.Services.AuthDiagnosticsRingBuffer` | `ArchLucid.Host.Core\Services\AuthDiagnosticsRingBuffer.cs` | 0.00 | 15 | No |
| 82 | `ArchLucid.Host.Core.Services.ComparisonReplayApiService` | `ArchLucid.Host.Core\Services\ComparisonReplayApiService.cs` | 0.00 | 58 | No |
| 83 | `ArchLucid.Host.Core.Services.Delivery.CloudEventsWrappingWebhookPoster` | `ArchLucid.Host.Core\Services\Delivery\CloudEventsWrappingWebhookPoster.cs` | 0.00 | 41 | No |
| 84 | `ArchLucid.Host.Core.Services.Delivery.FakeEmailSender` | `ArchLucid.Host.Core\Services\Delivery\FakeEmailSender.cs` | 0.00 | 7 | No |
| 85 | `ArchLucid.Host.Core.Services.Delivery.FakeWebhookPoster` | `ArchLucid.Host.Core\Services\Delivery\FakeWebhookPoster.cs` | 0.00 | 13 | No |
| 86 | `ArchLucid.Host.Core.Services.Delivery.WebhookHmacEnvelopePoster` | `ArchLucid.Host.Core\Services\Delivery\WebhookHmacEnvelopePoster.cs` | 0.00 | 5 | No |
| 87 | `ArchLucid.Host.Core.Services.Governance.PolicyPackMarkdownExplainService` | `ArchLucid.Host.Core\Services\Governance\PolicyPackMarkdownExplainService.cs` | 0.00 | 14 | No |
| 88 | `ArchLucid.Host.Core.Services.PolicyPacksAppService` | `ArchLucid.Host.Core\Services\PolicyPacksAppService.cs` | 0.00 | 59 | No |
| 89 | `ArchLucid.Host.Core.Services.ReplayDiagnosticsEntry` | `ArchLucid.Host.Core\Services\ReplayDiagnosticsEntry.cs` | 0.00 | 28 | No |
| 90 | `ArchLucid.Host.Core.Services.ReplayDiagnosticsRecorder` | `ArchLucid.Host.Core\Services\ReplayDiagnosticsRecorder.cs` | 0.00 | 26 | No |
| 91 | `ArchLucid.Host.Core.Startup.ArchLucidPersistenceStartup` | `ArchLucid.Host.Core\Startup\ArchLucidPersistenceStartup.cs` | 0.00 | 105 | No |
| 92 | `ArchLucid.Host.Core.Startup.ArchLucidSerilogConfiguration` | `ArchLucid.Host.Core\Startup\ArchLucidSerilogConfiguration.cs` | 0.00 | 14 | No |
| 93 | `ArchLucid.Host.Core.Startup.DevelopmentDefaultScopeTenantBootstrap` | `ArchLucid.Host.Core\Startup\DevelopmentDefaultScopeTenantBootstrap.cs` | 0.00 | 65 | No |
| 94 | `ArchLucid.Host.Core.Startup.Diagnostics.StartupConfigurationDiagnostics` | `ArchLucid.Host.Core\Startup\Diagnostics\StartupConfigurationDiagnostics.cs` | 0.00 | 32 | No |
| 95 | `ArchLucid.Host.Core.Startup.Diagnostics.StartupConfigurationFacts` | `ArchLucid.Host.Core\Startup\Diagnostics\StartupConfigurationFacts.cs` | 0.00 | 24 | No |
| 96 | `ArchLucid.Host.Core.Startup.Diagnostics.StartupConfigurationFactsReader` | `ArchLucid.Host.Core\Startup\Diagnostics\StartupConfigurationFacts.cs` | 0.00 | 41 | No |
| 97 | `ArchLucid.Host.Core.Startup.ObservabilityExtensions` | `ArchLucid.Host.Core\Startup\ObservabilityExtensions.cs` | 0.00 | 102 | No |
| 98 | `ArchLucid.Host.Core.Startup.ObservabilityTraceSamplingConfigurator` | `ArchLucid.Host.Core\Startup\ObservabilityTraceSamplingConfigurator.cs` | 0.00 | 21 | No |
| 99 | `ArchLucid.Host.Core.Startup.StartupMigrationHealthState` | `ArchLucid.Host.Core\Startup\StartupMigrationHealthState.cs` | 0.00 | 3 | No |
| 100 | `ArchLucid.Host.Core.Startup.Validation.ArchLucidConfigurationRules` | `ArchLucid.Host.Core\Startup\Validation\ArchLucidConfigurationRules.cs` | 0.00 | 65 | No |
| 101 | `ArchLucid.Host.Core.Startup.Validation.Rules.AgentExecutionRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\AgentExecutionRules.cs` | 0.00 | 48 | No |
| 102 | `ArchLucid.Host.Core.Startup.Validation.Rules.ApiDeprecationRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ApiDeprecationRules.cs` | 0.00 | 16 | No |
| 103 | `ArchLucid.Host.Core.Startup.Validation.Rules.ApiKeyPlaceholderDetection` | `ArchLucid.Host.Core\Startup\Validation\Rules\ApiKeyPlaceholderDetection.cs` | 0.00 | 33 | No |
| 104 | `ArchLucid.Host.Core.Startup.Validation.Rules.AuthenticationRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\AuthenticationRules.cs` | 0.00 | 49 | No |
| 105 | `ArchLucid.Host.Core.Startup.Validation.Rules.BackgroundJobsRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\BackgroundJobsRules.cs` | 0.00 | 24 | No |
| 106 | `ArchLucid.Host.Core.Startup.Validation.Rules.BatchReplayRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\BatchReplayRules.cs` | 0.00 | 6 | No |
| 107 | `ArchLucid.Host.Core.Startup.Validation.Rules.ContentSafetyRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ContentSafetyRules.cs` | 0.00 | 18 | No |
| 108 | `ArchLucid.Host.Core.Startup.Validation.Rules.ContextIngestionRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ContextIngestionRules.cs` | 0.00 | 10 | No |
| 109 | `ArchLucid.Host.Core.Startup.Validation.Rules.CosmosPolyglotRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\CosmosPolyglotRules.cs` | 0.00 | 17 | No |
| 110 | `ArchLucid.Host.Core.Startup.Validation.Rules.DataArchivalRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\DataArchivalRules.cs` | 0.00 | 25 | No |
| 111 | `ArchLucid.Host.Core.Startup.Validation.Rules.E2EHarnessRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\E2eHarnessRules.cs` | 0.00 | 9 | No |
| 112 | `ArchLucid.Host.Core.Startup.Validation.Rules.HostLeaderElectionRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\HostLeaderElectionRules.cs` | 0.00 | 19 | No |
| 113 | `ArchLucid.Host.Core.Startup.Validation.Rules.HotPathCacheRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\HotPathCacheRules.cs` | 0.00 | 23 | No |
| 114 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmCompletionCacheRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmCompletionCacheRules.cs` | 0.00 | 32 | No |
| 115 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmDailyTenantBudgetRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmDailyTenantBudgetRules.cs` | 0.00 | 13 | No |
| 116 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmMonthlyTenantDollarBudgetRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmMonthlyTenantDollarBudgetRules.cs` | 0.00 | 33 | No |
| 117 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmTokenQuotaRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmTokenQuotaRules.cs` | 0.00 | 20 | No |
| 118 | `ArchLucid.Host.Core.Startup.Validation.Rules.ObservabilityRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ObservabilityRules.cs` | 0.00 | 27 | No |
| 119 | `ArchLucid.Host.Core.Startup.Validation.Rules.ProductionSafetyRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ProductionSafetyRules.cs` | 0.00 | 98 | No |
| 120 | `ArchLucid.Host.Core.Startup.Validation.Rules.RateLimitingRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\RateLimitingRules.cs` | 0.00 | 43 | No |
| 121 | `ArchLucid.Host.Core.Startup.Validation.Rules.RetrievalRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\RetrievalRules.cs` | 0.00 | 17 | No |
| 122 | `ArchLucid.Host.Core.Startup.Validation.Rules.SchemaValidationRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\SchemaValidationRules.cs` | 0.00 | 28 | No |
| 123 | `ArchLucid.Host.Core.Startup.Validation.Rules.StorageRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\StorageRules.cs` | 0.00 | 26 | No |
| 124 | `ArchLucid.Host.Core.Startup.WorkerHostPipelineExtensions` | `ArchLucid.Host.Core\Startup\WorkerHostPipelineExtensions.cs` | 0.00 | 65 | No |
| 125 | `ArchLucid.Host.Core.Auth.Services.AuditService` | `ArchLucid.Host.Core\Auth\Services\AuditService.cs` | 8.89 | 41 | No |
| 126 | `ArchLucid.Host.Core.Hosted.FirstTenantFunnelArchivalIteration` | `ArchLucid.Host.Core\Hosted\FirstTenantFunnelArchivalIteration.cs` | 10.00 | 63 | No |
| 127 | `ArchLucid.Host.Core.Auth.Services.HttpActorContext` | `ArchLucid.Host.Core\Auth\Services\HttpActorContext.cs` | 13.64 | 19 | No |
| 128 | `ArchLucid.Host.Core.Notifications.Email.TrialLifecycleEmailPublishingAuditDecorator` | `ArchLucid.Host.Core\Notifications\Email\TrialLifecycleEmailPublishingAuditDecorator.cs` | 17.44 | 71 | No |
| 129 | `ArchLucid.Host.Core.Services.CircuitBreakerAuditBridge` | `ArchLucid.Host.Core\Services\CircuitBreakerAuditBridge.cs` | 25.58 | 64 | No |
| 130 | `ArchLucid.Host.Core.Hosted.HostLeaderElectionCoordinator` | `ArchLucid.Host.Core\Hosted\HostLeaderElectionCoordinator.cs` | 26.92 | 57 | No |
| 131 | `ArchLucid.Host.Core.Hosted.DataArchivalHostHealthState` | `ArchLucid.Host.Core\Hosted\DataArchivalHostHealthState.cs` | 30.00 | 21 | No |
| 132 | `ArchLucid.Host.Core.Configuration.BackgroundJobsOptions` | `ArchLucid.Host.Core\Configuration\BackgroundJobsOptions.cs` | 34.78 | 15 | No |
| 133 | `ArchLucid.Host.Core.Jobs.ServiceBusIntegrationEventsArchLucidJob` | `ArchLucid.Host.Core\Jobs\ServiceBusIntegrationEventsArchLucidJob.cs` | 35.06 | 50 | No |
| 134 | `ArchLucid.Host.Core.Demo.DemoPreviewArtifact` | `ArchLucid.Host.Core\Demo\DemoPreviewArtifact.cs` | 50.00 | 6 | No |
| 135 | `ArchLucid.Host.Core.Demo.DemoPreviewTimelineItem` | `ArchLucid.Host.Core\Demo\DemoPreviewTimelineItem.cs` | 50.00 | 5 | No |
| 136 | `ArchLucid.Host.Core.Integration.NullIntegrationEventPublisher` | `ArchLucid.Host.Core\Integration\NullIntegrationEventPublisher.cs` | 50.00 | 3 | No |
| 137 | `ArchLucid.Host.Core.DataAccess.SqlScopedResolutionDbConnectionFactory` | `ArchLucid.Host.Core\DataAccess\SqlScopedResolutionDbConnectionFactory.cs` | 53.85 | 6 | No |
| 138 | `ArchLucid.Host.Core.Demo.DemoPreviewManifestSummary` | `ArchLucid.Host.Core\Demo\DemoPreviewManifestSummary.cs` | 53.85 | 12 | No |
| 139 | `ArchLucid.Host.Core.Coordination.Retrieval.RetrievalIndexingOutboxProcessor` | `ArchLucid.Host.Core\Coordination\Retrieval\RetrievalIndexingOutboxProcessor.cs` | 57.97 | 29 | No |
| 140 | `ArchLucid.Host.Core.Hosted.DataArchivalHostIteration` | `ArchLucid.Host.Core\Hosted\DataArchivalHostIteration.cs` | 58.06 | 13 | No |
| 141 | `ArchLucid.Host.Core.Demo.DemoPreviewAuthorityChain` | `ArchLucid.Host.Core\Demo\DemoPreviewAuthorityChain.cs` | 58.33 | 5 | No |
| 142 | `ArchLucid.Host.Core.Demo.DemoPreviewRun` | `ArchLucid.Host.Core\Demo\DemoPreviewRun.cs` | 62.50 | 3 | No |
| 143 | `ArchLucid.Host.Core.Hosted.HostInstanceIdentifier` | `ArchLucid.Host.Core\Hosted\HostInstanceIdentifier.cs` | 62.50 | 3 | No |
| 144 | `ArchLucid.Host.Core.Authorization.TenantOrProjectCapabilityRequirement` | `ArchLucid.Host.Core\Authorization\TenantOrProjectCapabilityRequirement.cs` | 66.67 | 1 | No |
| 145 | `ArchLucid.Host.Core.Services.Delivery.HttpWebhookPoster` | `ArchLucid.Host.Core\Services\Delivery\HttpWebhookPoster.cs` | 67.29 | 35 | No |
| 146 | `ArchLucid.Host.Core.DataConsistency.DataConsistencyOrphanProbeExecutor` | `ArchLucid.Host.Core\DataConsistency\DataConsistencyOrphanProbeExecutor.cs` | 67.48 | 93 | No |
| 147 | `ArchLucid.Host.Core.Hosted.AdvisoryDueScheduleProcessor` | `ArchLucid.Host.Core\Hosted\AdvisoryDueScheduleProcessor.cs` | 68.75 | 5 | No |
| 148 | `ArchLucid.Host.Core.Jobs.JobRunTelemetry` | `ArchLucid.Host.Core\Jobs\JobRunTelemetry.cs` | 70.59 | 15 | No |
| 149 | `ArchLucid.Host.Core.Startup.Validation.Rules.BillingProductionSafetyRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\BillingProductionSafetyRules.cs` | 71.43 | 14 | No |
| 150 | `ArchLucid.Host.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy` | `ArchLucid.Host.Core\Http\AzureRmAndRetailPricesHttpRetryPolicy.cs` | 74.00 | 13 | No |
| 151 | `ArchLucid.Host.Core.Jobs.ExecDigestWeeklyArchLucidJob` | `ArchLucid.Host.Core\Jobs\ExecDigestWeeklyArchLucidJob.cs` | 75.00 | 5 | No |
| 152 | `ArchLucid.Host.Core.Jobs.WeeklyArchitectureDigestArchLucidJob` | `ArchLucid.Host.Core\Jobs\WeeklyArchitectureDigestArchLucidJob.cs` | 75.00 | 5 | No |
| 153 | `ArchLucid.Host.Core.Configuration.DataConsistencyProbeOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyProbeOptions.cs` | 80.00 | 2 | No |
| 154 | `ArchLucid.Host.Core.Jobs.FirstTenantFunnelArchivalArchLucidJob` | `ArchLucid.Host.Core\Jobs\FirstTenantFunnelArchivalArchLucidJob.cs` | 80.00 | 5 | No |
| 155 | `ArchLucid.Host.Core.Hosted.AdvisoryScanHostedService` | `ArchLucid.Host.Core\Hosted\AdvisoryScanHostedService.cs` | 80.65 | 6 | No |
| 156 | `ArchLucid.Host.Core.Startup.AgentResultSchemaValidationProductionWarningPostConfigure` | `ArchLucid.Host.Core\Startup\AgentResultSchemaValidationProductionWarningPostConfigure.cs` | 80.95 | 4 | No |
| 157 | `ArchLucid.Host.Core.Startup.LlmPromptRedactionProductionWarningPostConfigure` | `ArchLucid.Host.Core\Startup\LlmPromptRedactionProductionWarningPostConfigure.cs` | 80.95 | 4 | No |
| 158 | `ArchLucid.Host.Core.Demo.DemoExplainResponse` | `ArchLucid.Host.Core\Demo\DemoExplainResponse.cs` | 82.35 | 3 | No |
| 159 | `ArchLucid.Host.Core.Jobs.AuditEventChangeFeedArchLucidJob` | `ArchLucid.Host.Core\Jobs\AuditEventChangeFeedArchLucidJob.cs` | 82.61 | 4 | No |
| 160 | `ArchLucid.Host.Core.Hosted.TenantHealthScoringHostedService` | `ArchLucid.Host.Core\Hosted\TenantHealthScoringHostedService.cs` | 82.86 | 6 | No |
| 161 | `ArchLucid.Host.Core.Jobs.DataArchivalArchLucidJob` | `ArchLucid.Host.Core\Jobs\DataArchivalArchLucidJob.cs` | 83.87 | 5 | No |
| 162 | `ArchLucid.Host.Core.Demo.DemoCommitPagePreviewResponse` | `ArchLucid.Host.Core\Demo\DemoCommitPagePreviewResponse.cs` | 85.00 | 3 | No |
| 163 | `ArchLucid.Host.Core.Startup.Validation.Rules.RealModeDeploymentFingerprintRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\RealModeDeploymentFingerprintRules.cs` | 86.21 | 4 | No |
| 164 | `ArchLucid.Host.Core.Auth.Services.RoleSyncService` | `ArchLucid.Host.Core\Auth\Services\RoleSyncService.cs` | 87.50 | 5 | No |
| 165 | `ArchLucid.Host.Core.Jobs.ArchLucidJobsOffload` | `ArchLucid.Host.Core\Jobs\ArchLucidJobsOffload.cs` | 87.50 | 1 | No |
| 166 | `ArchLucid.Host.Core.Services.Delivery.WebhookOutboundHttpRetryPolicy` | `ArchLucid.Host.Core\Services\Delivery\WebhookOutboundHttpRetryPolicy.cs` | 87.50 | 3 | No |
| 167 | `ArchLucid.Host.Core.Services.Delivery.WebhookSignature` | `ArchLucid.Host.Core\Services\Delivery\WebhookSignature.cs` | 87.50 | 1 | No |
| 168 | `ArchLucid.Host.Core.Jobs.TrialLifecycleArchLucidJob` | `ArchLucid.Host.Core\Jobs\TrialLifecycleArchLucidJob.cs` | 88.00 | 3 | No |
| 169 | `ArchLucid.Host.Core.Jobs.OrphanProbeArchLucidJob` | `ArchLucid.Host.Core\Jobs\OrphanProbeArchLucidJob.cs` | 88.24 | 2 | No |
| 170 | `ArchLucid.Host.Core.Startup.Validation.Rules.ContainerJobsOffloadRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ContainerJobsOffloadRules.cs` | 88.89 | 3 | No |
| 171 | `ArchLucid.Host.Core.Jobs.AdvisoryScanArchLucidJob` | `ArchLucid.Host.Core\Jobs\AdvisoryScanArchLucidJob.cs` | 90.00 | 2 | No |
| 172 | `ArchLucid.Host.Core.Jobs.TrialEmailScanArchLucidJob` | `ArchLucid.Host.Core\Jobs\TrialEmailScanArchLucidJob.cs` | 90.00 | 2 | No |
| 173 | `ArchLucid.Host.Core.Authority.FeatureManagementAuthorityPipelineModeResolver` | `ArchLucid.Host.Core\Authority\FeatureManagementAuthorityPipelineModeResolver.cs` | 92.86 | 1 | No |
| 174 | `ArchLucid.Host.Core.Configuration.ContentSafetyConfigurationWarnings` | `ArchLucid.Host.Core\Configuration\ContentSafetyConfigurationWarnings.cs` | 92.86 | 1 | No |

### ArchLucid.Application (51.41% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Application.Advisory.AdvisoryScanRunner` | `ArchLucid.Application\Advisory\AdvisoryScanRunner.cs` | 0.00 | 232 | No |
| 2 | `ArchLucid.Application.Advisory.RecommendationLearningService` | `ArchLucid.Application\Advisory\RecommendationLearningService.cs` | 0.00 | 11 | No |
| 3 | `ArchLucid.Application.Advisory.WeeklyDigestHealthReader` | `ArchLucid.Application\Advisory\WeeklyDigestHealthReader.cs` | 0.00 | 84 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Application.Advisory.AdvisoryScanRunner` | `ArchLucid.Application\Advisory\AdvisoryScanRunner.cs` | 0.00 | 232 | No |
| 2 | `ArchLucid.Application.Advisory.RecommendationLearningService` | `ArchLucid.Application\Advisory\RecommendationLearningService.cs` | 0.00 | 11 | No |
| 3 | `ArchLucid.Application.Advisory.WeeklyDigestHealthReader` | `ArchLucid.Application\Advisory\WeeklyDigestHealthReader.cs` | 0.00 | 84 | No |
| 4 | `ArchLucid.Application.Advisory.WeeklyDigestHealthSnapshot` | `ArchLucid.Application\Advisory\WeeklyDigestHealthSnapshot.cs` | 0.00 | 36 | No |
| 5 | `ArchLucid.Application.Agents.RegisteredAgentHandlerInfo` | `ArchLucid.Application\Agents\RegisteredAgentHandlersInspector.cs` | 0.00 | 12 | No |
| 6 | `ArchLucid.Application.Agents.RegisteredAgentHandlersInspector` | `ArchLucid.Application\Agents\RegisteredAgentHandlersInspector.cs` | 0.00 | 22 | No |
| 7 | `ArchLucid.Application.Alerts.AlertActionLoopReader` | `ArchLucid.Application\Alerts\AlertActionLoopReader.cs` | 0.00 | 28 | No |
| 8 | `ArchLucid.Application.Alerts.AlertActionLoopSnapshot` | `ArchLucid.Application\Alerts\AlertActionLoopSnapshot.cs` | 0.00 | 14 | No |
| 9 | `ArchLucid.Application.Alerts.AlertDeliveryAttemptSummary` | `ArchLucid.Application\Alerts\AlertDeliveryAttemptSummary.cs` | 0.00 | 13 | No |
| 10 | `ArchLucid.Application.Analysis.AnalysisExportRequestRehydrator` | `ArchLucid.Application\Analysis\AnalysisExportRequestRehydrator.cs` | 0.00 | 10 | No |
| 11 | `ArchLucid.Application.Analysis.ArchitectureAnalysisService` | `ArchLucid.Application\Analysis\ArchitectureAnalysisService.cs` | 0.00 | 77 | No |
| 12 | `ArchLucid.Application.Analysis.ComparisonDriftAnalyzer` | `ArchLucid.Application\Analysis\ComparisonDriftAnalyzer.cs` | 0.00 | 65 | No |
| 13 | `ArchLucid.Application.Analysis.ComparisonDriftReportExportService` | `ArchLucid.Application\Analysis\ComparisonDriftReportExportService.cs` | 0.00 | 27 | No |
| 14 | `ArchLucid.Application.Analysis.ComparisonRecordPayloadRehydrator` | `ArchLucid.Application\Analysis\ComparisonRecordPayloadRehydrator.cs` | 0.00 | 19 | No |
| 15 | `ArchLucid.Application.Analysis.ComparisonReplayService` | `ArchLucid.Application\Analysis\ComparisonReplayService.cs` | 0.00 | 183 | No |
| 16 | `ArchLucid.Application.Analysis.ComparisonVerificationFailedException` | `ArchLucid.Application\Analysis\ComparisonVerificationFailedException.cs` | 0.00 | 9 | No |
| 17 | `ArchLucid.Application.Analysis.ConsultingDocxArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\ConsultingDocxArchitectureAnalysisExportService.cs` | 0.00 | 11 | No |
| 18 | `ArchLucid.Application.Analysis.ConsultingDocxCoverPageBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxCoverPageBuilder.cs` | 0.00 | 28 | No |
| 19 | `ArchLucid.Application.Analysis.ConsultingDocxExportProfileSelector` | `ArchLucid.Application\Analysis\ConsultingDocxExportProfileSelector.cs` | 0.00 | 26 | No |
| 20 | `ArchLucid.Application.Analysis.ConsultingDocxFindingsSectionBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxFindingsSectionBuilder.cs` | 0.00 | 26 | No |
| 21 | `ArchLucid.Application.Analysis.ConsultingDocxOpenXmlComposer` | `ArchLucid.Application\Analysis\ConsultingDocxOpenXmlComposer.cs` | 0.00 | 47 | No |
| 22 | `ArchLucid.Application.Analysis.ConsultingDocxOpenXmlPrimitives` | `ArchLucid.Application\Analysis\ConsultingDocxOpenXmlPrimitives.cs` | 0.00 | 127 | No |
| 23 | `ArchLucid.Application.Analysis.ConsultingDocxProfileRecommendation` | `ArchLucid.Application\Analysis\ConsultingDocxProfileRecommendation.cs` | 0.00 | 12 | No |
| 24 | `ArchLucid.Application.Analysis.ConsultingDocxProfileRecommendationRequest` | `ArchLucid.Application\Analysis\ConsultingDocxProfileRecommendationRequest.cs` | 0.00 | 14 | No |
| 25 | `ArchLucid.Application.Analysis.ConsultingDocxRecommendationsSectionBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxRecommendationsSectionBuilder.cs` | 0.00 | 8 | No |
| 26 | `ArchLucid.Application.Analysis.ConsultingDocxSupplementalSections` | `ArchLucid.Application\Analysis\ConsultingDocxSupplementalSections.cs` | 0.00 | 196 | No |
| 27 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateOptions` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateOptions.cs` | 0.00 | 88 | No |
| 28 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateProfileCatalog` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateProfileCatalog.cs` | 0.00 | 3 | No |
| 29 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateProfileInfo` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateProfileCatalog.cs` | 0.00 | 9 | No |
| 30 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateRecommendationService` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateRecommendationService.cs` | 0.00 | 45 | No |
| 31 | `ArchLucid.Application.Analysis.DefaultConsultingDocxTemplateOptionsProvider` | `ArchLucid.Application\Analysis\DefaultConsultingDocxTemplateOptionsProvider.cs` | 0.00 | 3 | No |
| 32 | `ArchLucid.Application.Analysis.DefaultConsultingDocxTemplateProfileResolver` | `ArchLucid.Application\Analysis\DefaultConsultingDocxTemplateProfileResolver.cs` | 0.00 | 22 | No |
| 33 | `ArchLucid.Application.Analysis.DocxArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\DocxArchitectureAnalysisExportService.cs` | 0.00 | 118 | No |
| 34 | `ArchLucid.Application.Analysis.DriftReportDocxExport` | `ArchLucid.Application\Analysis\DriftReportDocxExport.cs` | 0.00 | 25 | No |
| 35 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonService.cs` | 0.00 | 82 | No |
| 36 | `ArchLucid.Application.Analysis.ExportRecordDiffExportService` | `ArchLucid.Application\Analysis\ExportRecordDiffExportService.cs` | 0.00 | 32 | No |
| 37 | `ArchLucid.Application.Analysis.ExportRecordDiffService` | `ArchLucid.Application\Analysis\ExportRecordDiffService.cs` | 0.00 | 80 | No |
| 38 | `ArchLucid.Application.Analysis.ExportReplayService` | `ArchLucid.Application\Analysis\ExportReplayService.cs` | 0.00 | 91 | No |
| 39 | `ArchLucid.Application.Analysis.MarkdownEndToEndReplayComparisonSummaryFormatter` | `ArchLucid.Application\Analysis\MarkdownEndToEndReplayComparisonSummaryFormatter.cs` | 0.00 | 45 | No |
| 40 | `ArchLucid.Application.Analysis.OpenXmlDocxDocumentBuilder` | `ArchLucid.Application\Analysis\OpenXmlDocxDocumentBuilder.cs` | 0.00 | 74 | No |
| 41 | `ArchLucid.Application.Analysis.PersistedAnalysisExportRequest` | `ArchLucid.Application\Analysis\PersistedAnalysisExportRequest.cs` | 0.00 | 38 | No |
| 42 | `ArchLucid.Application.Analysis.ReplayComparisonRequest` | `ArchLucid.Application\Analysis\ReplayComparisonRequest.cs` | 0.00 | 13 | No |
| 43 | `ArchLucid.Application.Analysis.ReplayComparisonResult` | `ArchLucid.Application\Analysis\ReplayComparisonResult.cs` | 0.00 | 39 | No |
| 44 | `ArchLucid.Application.Analysis.ReplayExportRequest` | `ArchLucid.Application\Analysis\ReplayExportRequest.cs` | 0.00 | 5 | No |
| 45 | `ArchLucid.Application.Analysis.ReplayExportResult` | `ArchLucid.Application\Analysis\ReplayExportResult.cs` | 0.00 | 28 | No |
| 46 | `ArchLucid.Application.Analysis.ResolvedConsultingDocxExportProfile` | `ArchLucid.Application\Analysis\ResolvedConsultingDocxExportProfile.cs` | 0.00 | 11 | No |
| 47 | `ArchLucid.Application.Analysis.RunExportBlobPushService` | `ArchLucid.Application\Analysis\RunExportBlobPushService.cs` | 0.00 | 67 | No |
| 48 | `ArchLucid.Application.Analysis.TerraformGitHubPrOptions` | `ArchLucid.Application\Analysis\TerraformGitHubPrOptions.cs` | 0.00 | 5 | No |
| 49 | `ArchLucid.Application.Analysis.TerraformGitHubPrService` | `ArchLucid.Application\Analysis\TerraformGitHubPrService.cs` | 0.00 | 120 | No |
| 50 | `ArchLucid.Application.Analysis.TerraformPrCreationResult` | `ArchLucid.Application\Analysis\TerraformPrCreationResult.cs` | 0.00 | 3 | No |
| 51 | `ArchLucid.Application.Architecture.ArchitectureQuickScanResponseMapper` | `ArchLucid.Application\Architecture\ArchitectureQuickScanResponseMapper.cs` | 0.00 | 22 | No |
| 52 | `ArchLucid.Application.Architecture.QuickScanMinimalContextBuilder` | `ArchLucid.Application\Architecture\QuickScanMinimalContextBuilder.cs` | 0.00 | 16 | No |
| 53 | `ArchLucid.Application.ArchitectureApplicationService` | `ArchLucid.Application\ArchitectureApplicationService.cs` | 0.00 | 186 | No |
| 54 | `ArchLucid.Application.Authority.AuthorityCommittedManifestChainWriter` | `ArchLucid.Application\Authority\AuthorityCommittedManifestChainWriter.cs` | 0.00 | 163 | No |
| 55 | `ArchLucid.Application.AzureExtractor.AzureExtractorChunkedUploadService` | `ArchLucid.Application\AzureExtractor\AzureExtractorChunkedUploadService.cs` | 0.00 | 39 | No |
| 56 | `ArchLucid.Application.AzureExtractor.AzureExtractorChunkUploadStartBody` | `ArchLucid.Application\AzureExtractor\AzureExtractorChunkUploadStartBody.cs` | 0.00 | 7 | No |
| 57 | `ArchLucid.Application.Bootstrap.AuthorityDemoChainIds` | `ArchLucid.Application\Bootstrap\AuthorityDemoChainIds.cs` | 0.00 | 16 | No |
| 58 | `ArchLucid.Application.Bootstrap.DemoSeedService` | `ArchLucid.Application\Bootstrap\DemoSeedService.cs` | 0.00 | 765 | No |
| 59 | `ArchLucid.Application.Bootstrap.TrialWelcomeSeedIds` | `ArchLucid.Application\Bootstrap\TrialWelcomeSeedIds.cs` | 0.00 | 13 | No |
| 60 | `ArchLucid.Application.CommitRunResult` | `ArchLucid.Application\ArchitectureRunServiceResults.cs` | 0.00 | 9 | No |
| 61 | `ArchLucid.Application.CustomerSuccess.OperatorNextBestActionItem` | `ArchLucid.Application\CustomerSuccess\OperatorNextBestActionService.cs` | 0.00 | 1 | No |
| 62 | `ArchLucid.Application.CustomerSuccess.OperatorNextBestActionService` | `ArchLucid.Application\CustomerSuccess\OperatorNextBestActionService.cs` | 0.00 | 29 | No |
| 63 | `ArchLucid.Application.Determinism.DeterminismVersionConstants` | `ArchLucid.Application\Determinism\DeterminismVersionConstants.cs` | 0.00 | 1 | No |
| 64 | `ArchLucid.Application.Diagnostics.FakeAgentResultFactory` | `ArchLucid.Application\Diagnostics\FakeAgentResultFactory.cs` | 0.00 | 306 | No |
| 65 | `ArchLucid.Application.Diagnostics.SyntheticOperatorDemoPackWriter` | `ArchLucid.Application\Diagnostics\SyntheticOperatorDemoPackWriter.cs` | 0.00 | 18 | No |
| 66 | `ArchLucid.Application.Diagrams.DiagramIdSanitizer` | `ArchLucid.Application\Diagrams\DiagramIdSanitizer.cs` | 0.00 | 9 | No |
| 67 | `ArchLucid.Application.Diagrams.ManifestDiagramOptions` | `ArchLucid.Application\Diagrams\ManifestDiagramOptions.cs` | 0.00 | 12 | No |
| 68 | `ArchLucid.Application.Diagrams.ManifestDiagramService` | `ArchLucid.Application\Diagrams\ManifestDiagramService.cs` | 0.00 | 97 | No |
| 69 | `ArchLucid.Application.Diagrams.MermaidDiagramGenerator` | `ArchLucid.Application\Diagrams\MermaidDiagramGenerator.cs` | 0.00 | 37 | No |
| 70 | `ArchLucid.Application.Diffs.ManifestDiffBadgeClassifier` | `ArchLucid.Application\Diffs\ManifestDiffBadgeClassifier.cs` | 0.00 | 34 | No |
| 71 | `ArchLucid.Application.Diffs.MarkdownAgentResultDiffSummaryFormatter` | `ArchLucid.Application\Diffs\MarkdownAgentResultDiffSummaryFormatter.cs` | 0.00 | 46 | No |
| 72 | `ArchLucid.Application.Diffs.MarkdownManifestDiffExportService` | `ArchLucid.Application\Diffs\MarkdownManifestDiffExportService.cs` | 0.00 | 36 | No |
| 73 | `ArchLucid.Application.Diffs.MarkdownManifestDiffSummaryFormatter` | `ArchLucid.Application\Diffs\MarkdownManifestDiffSummaryFormatter.cs` | 0.00 | 51 | No |
| 74 | `ArchLucid.Application.Evidence.EvidencePackageInjectionMitigator` | `ArchLucid.Application\Evidence\EvidencePackageInjectionMitigator.cs` | 0.00 | 81 | No |
| 75 | `ArchLucid.Application.Evidence.MarkdownEvidenceSummaryFormatter` | `ArchLucid.Application\Evidence\MarkdownEvidenceSummaryFormatter.cs` | 0.00 | 86 | No |
| 76 | `ArchLucid.Application.ExecDigest.ExecDigestCompositionMarkdownFormatter` | `ArchLucid.Application\ExecDigest\ExecDigestCompositionMarkdownFormatter.cs` | 0.00 | 26 | No |
| 77 | `ArchLucid.Application.ExecDigest.ExecDigestHighlightedRun` | `ArchLucid.Application\ExecDigest\ExecDigestHighlightedRun.cs` | 0.00 | 1 | No |
| 78 | `ArchLucid.Application.ExecutiveSummary.ExecutiveSummaryService` | `ArchLucid.Application\ExecutiveSummary\ExecutiveSummaryService.cs` | 0.00 | 58 | No |
| 79 | `ArchLucid.Application.Explanation.RunRationaleService` | `ArchLucid.Application\Explanation\RunRationaleService.cs` | 0.00 | 154 | No |
| 80 | `ArchLucid.Application.Findings.FindingInspectResponseReasoningSummaryExtensions` | `ArchLucid.Application\Findings\FindingInspectResponseReasoningSummaryExtensions.cs` | 0.00 | 25 | No |
| 81 | `ArchLucid.Application.GetRunResult` | `ArchLucid.Application\GetRunResult.cs` | 0.00 | 10 | No |
| 82 | `ArchLucid.Application.Governance.GovernanceApprovalReviewConflictException` | `ArchLucid.Application\Governance\GovernanceApprovalReviewConflictException.cs` | 0.00 | 17 | No |
| 83 | `ArchLucid.Application.Governance.GovernanceSelfApprovalException` | `ArchLucid.Application\Governance\GovernanceSelfApprovalException.cs` | 0.00 | 12 | No |
| 84 | `ArchLucid.Application.Governance.GovernanceWorkflowService` | `ArchLucid.Application\Governance\GovernanceWorkflowService.cs` | 0.00 | 500 | No |
| 85 | `ArchLucid.Application.Governance.Preview.GovernanceManifestComparer` | `ArchLucid.Application\Governance\Preview\GovernanceManifestComparer.cs` | 0.00 | 49 | No |
| 86 | `ArchLucid.Application.Governance.Preview.GovernancePreviewService` | `ArchLucid.Application\Governance\Preview\GovernancePreviewService.cs` | 0.00 | 87 | No |
| 87 | `ArchLucid.Application.Identity.TrialBootstrapEmailVerificationPolicy` | `ArchLucid.Application\Identity\TrialBootstrapEmailVerificationPolicy.cs` | 0.00 | 14 | No |
| 88 | `ArchLucid.Application.Identity.TrialLocalAuthResult` | `ArchLucid.Application\Identity\ITrialLocalIdentityService.cs` | 0.00 | 8 | No |
| 89 | `ArchLucid.Application.Import.ArchitectureCsvToGoldenManifestDryRunMapper` | `ArchLucid.Application\Import\ArchitectureCsvToGoldenManifestDryRunMapper.cs` | 0.00 | 124 | No |
| 90 | `ArchLucid.Application.Import.ArchitectureDefinitionCsvImportDryRunResult` | `ArchLucid.Application\Import\ArchitectureDefinitionCsvImportDryRunResult.cs` | 0.00 | 6 | No |
| 91 | `ArchLucid.Application.Import.ArchitectureDefinitionCsvImportDryRunService` | `ArchLucid.Application\Import\ArchitectureDefinitionCsvImportDryRunService.cs` | 0.00 | 24 | No |
| 92 | `ArchLucid.Application.Import.TomlRequestDeserializer` | `ArchLucid.Application\Import\TomlRequestDeserializer.cs` | 0.00 | 52 | No |
| 93 | `ArchLucid.Application.Integrations.ConnectorOperationsSummary` | `ArchLucid.Application\Integrations\ConnectorOperationsSummary.cs` | 0.00 | 6 | No |
| 94 | `ArchLucid.Application.Integrations.ConnectorOperationsSummaryReader` | `ArchLucid.Application\Integrations\ConnectorOperationsSummaryReader.cs` | 0.00 | 161 | No |
| 95 | `ArchLucid.Application.Integrations.ConnectorSurfaceSummary` | `ArchLucid.Application\Integrations\ConnectorOperationsSummary.cs` | 0.00 | 16 | No |
| 96 | `ArchLucid.Application.Integrations.IntegrationEventBusSummary` | `ArchLucid.Application\Integrations\ConnectorOperationsSummary.cs` | 0.00 | 15 | No |
| 97 | `ArchLucid.Application.Jobs.BackgroundJobInfo` | `ArchLucid.Application\Jobs\BackgroundJobInfo.cs` | 0.00 | 11 | No |
| 98 | `ArchLucid.Application.Manifests.ManifestPresentation` | `ArchLucid.Application\Manifests\ManifestPresentation.cs` | 0.00 | 19 | No |
| 99 | `ArchLucid.Application.Notifications.Email.ExecDigestEmailDispatcher` | `ArchLucid.Application\Notifications\Email\ExecDigestEmailDispatcher.cs` | 0.00 | 67 | No |
| 100 | `ArchLucid.Application.Notifications.Email.Models.ExecDigestEmailModel` | `ArchLucid.Application\Notifications\Email\Models\ExecDigestEmailModel.cs` | 0.00 | 26 | No |
| 101 | `ArchLucid.Application.Notifications.Email.TrialLifecycleEmailDispatcher` | `ArchLucid.Application\Notifications\Email\TrialLifecycleEmailDispatcher.cs` | 0.00 | 128 | No |
| 102 | `ArchLucid.Application.Notifications.Email.TrialLifecycleIntegrationEventPublisher` | `ArchLucid.Application\Notifications\Email\TrialLifecycleIntegrationEventPublisher.cs` | 0.00 | 21 | No |
| 103 | `ArchLucid.Application.Pilots.BoardPackPdfBuilder` | `ArchLucid.Application\Pilots\BoardPackPdfBuilder.cs` | 0.00 | 55 | No |
| 104 | `ArchLucid.Application.Pilots.BoardPackQuarterWindow` | `ArchLucid.Application\Pilots\BoardPackQuarterWindow.cs` | 0.00 | 22 | No |
| 105 | `ArchLucid.Application.Pilots.PilotInProductBaselinesView` | `ArchLucid.Application\Pilots\PilotInProductScorecardResult.cs` | 0.00 | 8 | No |
| 106 | `ArchLucid.Application.Pilots.PilotInProductRoiEstimate` | `ArchLucid.Application\Pilots\PilotInProductScorecardResult.cs` | 0.00 | 10 | No |
| 107 | `ArchLucid.Application.Pilots.PilotInProductScorecardResult` | `ArchLucid.Application\Pilots\PilotInProductScorecardResult.cs` | 0.00 | 24 | No |
| 108 | `ArchLucid.Application.Pilots.PilotInProductScorecardService` | `ArchLucid.Application\Pilots\PilotInProductScorecardService.cs` | 0.00 | 77 | No |
| 109 | `ArchLucid.Application.Pilots.PilotOutcomeSummaryService` | `ArchLucid.Application\Pilots\PilotOutcomeSummaryService.cs` | 0.00 | 21 | No |
| 110 | `ArchLucid.Application.Pilots.ReferenceEvidenceAdminExportService` | `ArchLucid.Application\Pilots\ReferenceEvidenceAdminExportService.cs` | 0.00 | 132 | No |
| 111 | `ArchLucid.Application.PilotSeedFakeResultsOptions` | `ArchLucid.Application\PilotSeedFakeResultsOptions.cs` | 0.00 | 1 | No |
| 112 | `ArchLucid.Application.Runs.ArchitectureRunRouteIds` | `ArchLucid.Application\Runs\ArchitectureRunRouteIds.cs` | 0.00 | 5 | No |
| 113 | `ArchLucid.Application.Scim.ScimConflictException` | `ArchLucid.Application\Scim\ScimUserService.cs` | 0.00 | 3 | No |
| 114 | `ArchLucid.Application.Scim.ScimGroupResourceParser` | `ArchLucid.Application\Scim\ScimGroupResourceParser.cs` | 0.00 | 18 | No |
| 115 | `ArchLucid.Application.Scim.ScimNotFoundException` | `ArchLucid.Application\Scim\ScimUserService.cs` | 0.00 | 3 | No |
| 116 | `ArchLucid.Application.Scim.ScimSeatLimitExceededException` | `ArchLucid.Application\Scim\ScimSeatLimitExceededException.cs` | 0.00 | 1 | No |
| 117 | `ArchLucid.Application.Scim.ScimUserResourceParser` | `ArchLucid.Application\Scim\ScimUserResourceParser.cs` | 0.00 | 25 | No |
| 118 | `ArchLucid.Application.Scim.ScimUserService` | `ArchLucid.Application\Scim\ScimUserService.cs` | 0.00 | 172 | No |
| 119 | `ArchLucid.Application.Scim.Tokens.ScimBearerAuthenticationResult` | `ArchLucid.Application\Scim\Tokens\IScimBearerTokenAuthenticator.cs` | 0.00 | 4 | No |
| 120 | `ArchLucid.Application.Scim.Tokens.ScimBearerTokenAuthenticator` | `ArchLucid.Application\Scim\Tokens\ScimBearerTokenAuthenticator.cs` | 0.00 | 40 | No |
| 121 | `ArchLucid.Application.Scim.Tokens.ScimTokenIssuer` | `ArchLucid.Application\Scim\Tokens\ScimTokenIssuer.cs` | 0.00 | 14 | No |
| 122 | `ArchLucid.Application.Scim.Tokens.ScimTokenIssueResult` | `ArchLucid.Application\Scim\Tokens\IScimTokenIssuer.cs` | 0.00 | 8 | No |
| 123 | `ArchLucid.Application.Scim.Tokens.ScimTokenRotationReminderJob` | `ArchLucid.Application\Scim\Tokens\ScimTokenRotationReminderJob.cs` | 0.00 | 39 | No |
| 124 | `ArchLucid.Application.SeedFakeResultsResult` | `ArchLucid.Application\SeedFakeResultsResult.cs` | 0.00 | 1 | No |
| 125 | `ArchLucid.Application.SubmitResultResult` | `ArchLucid.Application\SubmitResultResult.cs` | 0.00 | 1 | No |
| 126 | `ArchLucid.Application.Summaries.ManifestSummaryOptions` | `ArchLucid.Application\Summaries\ManifestSummaryOptions.cs` | 0.00 | 19 | No |
| 127 | `ArchLucid.Application.Summaries.ManifestSummaryService` | `ArchLucid.Application\Summaries\ManifestSummaryService.cs` | 0.00 | 77 | No |
| 128 | `ArchLucid.Application.Summaries.MarkdownManifestSummaryGenerator` | `ArchLucid.Application\Summaries\MarkdownManifestSummaryGenerator.cs` | 0.00 | 106 | No |
| 129 | `ArchLucid.Application.Tenancy.TrialSignupCompanyProfileCapture` | `ArchLucid.Application\Tenancy\TrialSignupCompanyProfileCapture.cs` | 0.00 | 1 | No |
| 130 | `ArchLucid.Application.TrialArchitecturePreseedExecutor` | `ArchLucid.Application\TrialArchitecturePreseedExecutor.cs` | 0.00 | 47 | No |
| 131 | `ArchLucid.Application.Value.ValueReportJobPollResult` | `ArchLucid.Application\Value\ValueReportJobPollResult.cs` | 0.00 | 1 | No |
| 132 | `ArchLucid.Application.Value.ValueReportJobRequest` | `ArchLucid.Application\Value\ValueReportJobRequest.cs` | 0.00 | 6 | No |
| 133 | `ArchLucid.Application.Value.ValueReportSnapshotMarkdownFormatter` | `ArchLucid.Application\Value\ValueReportSnapshotMarkdownFormatter.cs` | 0.00 | 25 | No |
| 134 | `ArchLucid.Application.DataConsistency.DataConsistencyReconciliationService` | `ArchLucid.Application\DataConsistency\DataConsistencyReconciliationService.cs` | 19.55 | 107 | No |
| 135 | `ArchLucid.Application.Notifications.Email.TrialScheduledLifecycleEmailScanner` | `ArchLucid.Application\Notifications\Email\TrialScheduledLifecycleEmailScanner.cs` | 20.91 | 87 | No |
| 136 | `ArchLucid.Application.ExecDigest.ExecDigestWeeklyDeliveryScanner` | `ArchLucid.Application\ExecDigest\ExecDigestWeeklyDeliveryScanner.cs` | 30.49 | 57 | No |
| 137 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonExportService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonExportService.cs` | 34.81 | 264 | No |
| 138 | `ArchLucid.Application.Runs.Orchestration.AuthorityDrivenArchitectureRunCommitOrchestrator` | `ArchLucid.Application\Runs\Orchestration\AuthorityDrivenArchitectureRunCommitOrchestrator.cs` | 35.75 | 266 | No |
| 139 | `ArchLucid.Application.Integrations.Itsm.Outbound.ItsmOutboundArchLucidDeepLinkAppender` | `ArchLucid.Application\Integrations\Itsm\Outbound\ItsmOutboundArchLucidDeepLinkAppender.cs` | 38.46 | 8 | No |
| 140 | `ArchLucid.Application.Integrations.Itsm.Outbound.ItsmJiraPriorityAndIssueTypeResolver` | `ArchLucid.Application\Integrations\Itsm\Outbound\ItsmJiraPriorityAndIssueTypeResolver.cs` | 40.91 | 13 | No |
| 141 | `ArchLucid.Application.ConflictException` | `ArchLucid.Application\ConflictException.cs` | 42.86 | 4 | No |
| 142 | `ArchLucid.Application.ExecDigest.ExecDigestComposition` | `ArchLucid.Application\ExecDigest\ExecDigestComposition.cs` | 44.44 | 5 | No |
| 143 | `ArchLucid.Application.Analysis.MarkdownArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\MarkdownArchitectureAnalysisExportService.cs` | 44.67 | 135 | No |
| 144 | `ArchLucid.Application.Runs.Orchestration.DefaultRequestContentSafetyPrecheck` | `ArchLucid.Application\Runs\Orchestration\DefaultRequestContentSafetyPrecheck.cs` | 47.06 | 9 | No |
| 145 | `ArchLucid.Application.RunDetailQueryService` | `ArchLucid.Application\RunDetailQueryService.cs` | 49.48 | 49 | No |
| 146 | `ArchLucid.Application.Governance.ApprovalSlaMonitor` | `ArchLucid.Application\Governance\ApprovalSlaMonitor.cs` | 50.00 | 44 | No |
| 147 | `ArchLucid.Application.Jobs.BackgroundJobFile` | `ArchLucid.Application\Jobs\BackgroundJobFile.cs` | 50.00 | 5 | No |
| 148 | `ArchLucid.Application.Runs.Finalization.ManifestFinalizationService` | `ArchLucid.Application\Runs\Finalization\ManifestFinalizationService.cs` | 51.42 | 103 | No |
| 149 | `ArchLucid.Application.ReplayAuthorityRunRecordFactory` | `ArchLucid.Application\ReplayAuthorityRunRecordFactory.cs` | 51.72 | 14 | No |
| 150 | `ArchLucid.Application.Bootstrap.ContosoRetailDemoIds` | `ArchLucid.Application\Bootstrap\ContosoRetailDemoIds.cs` | 53.33 | 28 | No |
| 151 | `ArchLucid.Application.TerraformAdvisory.TerraformAdvisorySnippetTemplates` | `ArchLucid.Application\TerraformAdvisory\TerraformAdvisorySnippetTemplates.cs` | 54.55 | 5 | No |
| 152 | `ArchLucid.Application.Governance.GovernanceSlaEscalationWebhookRetryPipeline` | `ArchLucid.Application\Governance\GovernanceSlaEscalationWebhookRetryPipeline.cs` | 54.90 | 23 | No |
| 153 | `ArchLucid.Application.Reporting.ExportFormatterService` | `ArchLucid.Application\Reporting\ExportFormatterService.cs` | 58.97 | 16 | No |
| 154 | `ArchLucid.Application.Scim.ScimGroupMemberPatchPlanner` | `ArchLucid.Application\Scim\ScimGroupMemberPatchPlanner.cs` | 59.78 | 37 | No |
| 155 | `ArchLucid.Application.Analysis.EndToEndComparisonExportProfile` | `ArchLucid.Application\Analysis\EndToEndComparisonExportProfile.cs` | 60.00 | 2 | No |
| 156 | `ArchLucid.Application.Import.ArchitectureRequestImportValidationResult` | `ArchLucid.Application\Import\ArchitectureRequestImportValidationResult.cs` | 60.00 | 2 | No |
| 157 | `ArchLucid.Application.Traceability.TraceabilityBundleTooLargeException` | `ArchLucid.Application\Traceability\TraceabilityBundleTooLargeException.cs` | 60.00 | 2 | No |
| 158 | `ArchLucid.Application.WeeklyArchitectureDigest.WeeklyArchitectureDigestCriticalFindingSummaryLine` | `ArchLucid.Application\WeeklyArchitectureDigest\WeeklyArchitectureDigestCriticalFindingSummaryLine.cs` | 60.00 | 4 | No |
| 159 | `ArchLucid.Application.ExecDigest.ExecDigestComposer` | `ArchLucid.Application\ExecDigest\ExecDigestComposer.cs` | 61.22 | 38 | No |
| 160 | `ArchLucid.Application.Scim.ScimGroupService` | `ArchLucid.Application\Scim\ScimGroupService.cs` | 62.16 | 14 | No |
| 161 | `ArchLucid.Application.Notifications.Email.RazorLightEmailTemplateRenderer` | `ArchLucid.Application\Notifications\Email\RazorLightEmailTemplateRenderer.cs` | 62.50 | 6 | No |
| 162 | `ArchLucid.Application.Runs.ArchitectureRunIdempotencyHashing` | `ArchLucid.Application\Runs\ArchitectureRunIdempotencyHashing.cs` | 62.50 | 3 | No |
| 163 | `ArchLucid.Application.Evidence.DefaultEvidenceBuilder` | `ArchLucid.Application\Evidence\DefaultEvidenceBuilder.cs` | 63.82 | 55 | No |
| 164 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunExecuteOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunExecuteOrchestrator.cs` | 64.86 | 123 | No |
| 165 | `ArchLucid.Application.Pilots.PilotRunDeltasResponseMapper` | `ArchLucid.Application\Pilots\PilotRunDeltasResponseMapper.cs` | 65.38 | 9 | No |
| 166 | `ArchLucid.Application.Identity.TrialLocalIdentityService` | `ArchLucid.Application\Identity\TrialLocalIdentityService.cs` | 66.27 | 28 | No |
| 167 | `ArchLucid.Application.AzureExtractor.AzureExtractorNormalizedManifest` | `ArchLucid.Application\AzureExtractor\AzureExtractorNormalizedManifest.cs` | 66.67 | 3 | No |
| 168 | `ArchLucid.Application.Determinism.DeterminismIterationResult` | `ArchLucid.Application\Determinism\DeterminismIterationResult.cs` | 66.67 | 5 | No |
| 169 | `ArchLucid.Application.ExecuteRunResult` | `ArchLucid.Application\ArchitectureRunServiceResults.cs` | 66.67 | 2 | No |
| 170 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunCreateOptions` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunCreateOptions.cs` | 66.67 | 1 | No |
| 171 | `ArchLucid.Application.Evolution.SimulationEvaluationRequest` | `ArchLucid.Application\Evolution\SimulationEvaluationRequest.cs` | 70.00 | 3 | No |
| 172 | `ArchLucid.Application.Jobs.AnalysisReportDocxWorkUnit` | `ArchLucid.Application\Jobs\BackgroundJobWorkUnit.cs` | 70.00 | 3 | No |
| 173 | `ArchLucid.Application.Jobs.ConsultingDocxWorkUnit` | `ArchLucid.Application\Jobs\BackgroundJobWorkUnit.cs` | 70.00 | 3 | No |
| 174 | `ArchLucid.Application.Pilots.PilotScorecardSummary` | `ArchLucid.Application\Pilots\PilotScorecardSummary.cs` | 70.00 | 3 | No |
| 175 | `ArchLucid.Application.Pilots.PilotValueReportSeverityBreakdown` | `ArchLucid.Application\Pilots\PilotValueReport.cs` | 70.00 | 3 | No |
| 176 | `ArchLucid.Application.Templates.ArchitectureRequestTemplateSummary` | `ArchLucid.Application\Templates\ArchitectureRequestTemplateSummary.cs` | 70.00 | 3 | No |
| 177 | `ArchLucid.Application.Trust.RunTrustEvidenceCardBuilder` | `ArchLucid.Application\Trust\RunTrustEvidenceCardBuilder.cs` | 70.00 | 72 | No |
| 178 | `ArchLucid.Application.AzureExtractor.AzureExtractorIngestService` | `ArchLucid.Application\AzureExtractor\AzureExtractorIngestService.cs` | 70.42 | 71 | No |
| 179 | `ArchLucid.Application.Scim.Patching.ScimPatchValuePathParser` | `ArchLucid.Application\Scim\Patching\ScimPatchValuePathParser.cs` | 70.43 | 34 | No |
| 180 | `ArchLucid.Application.Common.BaselineMutationAuditService` | `ArchLucid.Application\Common\BaselineMutationAuditService.cs` | 70.45 | 13 | No |
| 181 | `ArchLucid.Application.Integrations.Itsm.Outbound.ItsmOutboundIntegrationHealthService` | `ArchLucid.Application\Integrations\Itsm\Outbound\ItsmOutboundIntegrationHealthService.cs` | 70.97 | 27 | No |
| 182 | `ArchLucid.Application.Analysis.ArchitectureAnalysisRequest` | `ArchLucid.Application\Analysis\ArchitectureAnalysisRequest.cs` | 71.43 | 10 | No |
| 183 | `ArchLucid.Application.Billing.TenantCostEstimate` | `ArchLucid.Application\Billing\TenantCostEstimate.cs` | 71.43 | 2 | No |
| 184 | `ArchLucid.Application.Marketing.EvidencePackEntry` | `ArchLucid.Application\Marketing\EvidencePackEntry.cs` | 71.43 | 2 | No |
| 185 | `ArchLucid.Application.Notifications.Email.Models.TrialConvertedEmailModel` | `ArchLucid.Application\Notifications\Email\Models\TrialEmailModels.cs` | 71.43 | 2 | No |
| 186 | `ArchLucid.Application.Notifications.Email.Models.TrialExpiredEmailModel` | `ArchLucid.Application\Notifications\Email\Models\TrialEmailModels.cs` | 71.43 | 2 | No |
| 187 | `ArchLucid.Application.Notifications.Email.Models.TrialFirstRunEmailModel` | `ArchLucid.Application\Notifications\Email\Models\TrialEmailModels.cs` | 71.43 | 2 | No |
| 188 | `ArchLucid.Application.Notifications.Email.Models.TrialMidTrialEmailModel` | `ArchLucid.Application\Notifications\Email\Models\TrialEmailModels.cs` | 71.43 | 2 | No |
| 189 | `ArchLucid.Application.Notifications.Email.Models.TrialWelcomeEmailModel` | `ArchLucid.Application\Notifications\Email\Models\TrialEmailModels.cs` | 71.43 | 2 | No |
| 190 | `ArchLucid.Application.Pilots.TenantMeasuredRoiSummary` | `ArchLucid.Application\Pilots\TenantMeasuredRoiSummary.cs` | 71.43 | 2 | No |
| 191 | `ArchLucid.Application.Runs.GoldenManifestSchemaValidationException` | `ArchLucid.Application\Runs\GoldenManifestSchemaValidationException.cs` | 71.43 | 2 | No |
| 192 | `ArchLucid.Application.Governance.PreCommitGovernanceGate` | `ArchLucid.Application\Governance\PreCommitGovernanceGate.cs` | 71.88 | 18 | No |
| 193 | `ArchLucid.Application.Tenancy.TrialLifecyclePolicy` | `ArchLucid.Application\Tenancy\TrialLifecyclePolicy.cs` | 72.09 | 12 | No |
| 194 | `ArchLucid.Application.Billing.BillingUnitRatesOptions` | `ArchLucid.Application\Billing\BillingUnitRatesOptions.cs` | 72.22 | 5 | No |
| 195 | `ArchLucid.Application.Diffs.AgentResultDelta` | `ArchLucid.Application\Diffs\AgentResultDelta.cs` | 72.50 | 11 | No |
| 196 | `ArchLucid.Application.Analysis.RunMetadataDiffResult` | `ArchLucid.Application\Analysis\RunMetadataDiffResult.cs` | 72.73 | 3 | No |
| 197 | `ArchLucid.Application.Architecture.ArchitectureRunProvenanceService` | `ArchLucid.Application\Architecture\ArchitectureRunProvenanceService.cs` | 72.90 | 84 | No |
| 198 | `ArchLucid.Application.DataConsistency.DataConsistencyReconciliationHostedService` | `ArchLucid.Application\DataConsistency\DataConsistencyReconciliationHostedService.cs` | 73.24 | 19 | No |
| 199 | `ArchLucid.Application.Determinism.DeterminismCheckResult` | `ArchLucid.Application\Determinism\DeterminismCheckResult.cs` | 73.68 | 5 | No |
| 200 | `ArchLucid.Application.Marketing.SyntheticCaseStudyDataProvider` | `ArchLucid.Application\Marketing\SyntheticCaseStudyDataProvider.cs` | 73.91 | 6 | No |
| 201 | `ArchLucid.Application.Jobs.AnalysisReportDocxJobPayload` | `ArchLucid.Application\Jobs\AnalysisReportDocxJobPayload.cs` | 74.19 | 16 | No |
| 202 | `ArchLucid.Application.Diffs.ManifestDiffService` | `ArchLucid.Application\Diffs\ManifestDiffService.cs` | 74.26 | 26 | No |
| 203 | `ArchLucid.Application.Analysis.ComparisonReplayCostEstimate` | `ArchLucid.Application\Analysis\ComparisonReplayCostEstimate.cs` | 75.00 | 4 | No |
| 204 | `ArchLucid.Application.Diffs.AgentResultDiffResult` | `ArchLucid.Application\Diffs\AgentResultDiffResult.cs` | 75.00 | 3 | No |
| 205 | `ArchLucid.Application.Integrations.Itsm.Outbound.ItsmOutboundLocalConfigurationEvaluator` | `ArchLucid.Application\Integrations\Itsm\Outbound\ItsmOutboundLocalConfigurationEvaluator.cs` | 75.00 | 9 | No |
| 206 | `ArchLucid.Application.RunNotFoundException` | `ArchLucid.Application\RunNotFoundException.cs` | 75.00 | 1 | No |
| 207 | `ArchLucid.Application.Scim.Patching.ScimPatchFlatAttributePathOutcome` | `ArchLucid.Application\Scim\Patching\ScimPatchPathParseResult.cs` | 75.00 | 1 | No |
| 208 | `ArchLucid.Application.Scim.Patching.ScimPatchPathInvalidOutcome` | `ArchLucid.Application\Scim\Patching\ScimPatchPathParseResult.cs` | 75.00 | 1 | No |
| 209 | `ArchLucid.Application.Scim.Patching.ScimPatchPathNotImplementedOutcome` | `ArchLucid.Application\Scim\Patching\ScimPatchPathParseResult.cs` | 75.00 | 1 | No |
| 210 | `ArchLucid.Application.Pilots.WhyArchLucidPackSourceDto` | `ArchLucid.Application\Pilots\WhyArchLucidPackSourceDto.cs` | 75.68 | 9 | No |
| 211 | `ArchLucid.Application.Tenancy.TrialLifecycleTransitionEngine` | `ArchLucid.Application\Tenancy\TrialLifecycleTransitionEngine.cs` | 76.19 | 15 | No |
| 212 | `ArchLucid.Application.Notifications.Email.ExecDigestUnsubscribeTokenFactory` | `ArchLucid.Application\Notifications\Email\ExecDigestUnsubscribeTokenFactory.cs` | 76.47 | 4 | No |
| 213 | `ArchLucid.Application.Decisions.DefaultAgentEvaluationService` | `ArchLucid.Application\Decisions\DefaultAgentEvaluationService.cs` | 76.92 | 3 | No |
| 214 | `ArchLucid.Application.Scim.Patching.ScimPatchOpEvaluator` | `ArchLucid.Application\Scim\Patching\ScimPatchOpEvaluator.cs` | 77.42 | 7 | No |
| 215 | `ArchLucid.Application.Architecture.AuthorityCommitTraceabilityRules` | `ArchLucid.Application\Architecture\AuthorityCommitTraceabilityRules.cs` | 77.78 | 6 | No |
| 216 | `ArchLucid.Application.Import.ImportRequestFileResult` | `ArchLucid.Application\Import\ImportRequestFileResult.cs` | 77.78 | 4 | No |
| 217 | `ArchLucid.Application.Tenancy.TrialTenantBootstrapService` | `ArchLucid.Application\Tenancy\TrialTenantBootstrapService.cs` | 78.18 | 24 | No |
| 218 | `ArchLucid.Application.Determinism.DeterminismCheckService` | `ArchLucid.Application\Determinism\DeterminismCheckService.cs` | 78.26 | 10 | No |
| 219 | `ArchLucid.Application.Architecture.CommittedManifestTraceabilityRules` | `ArchLucid.Application\Architecture\CommittedManifestTraceabilityRules.cs` | 78.57 | 6 | No |
| 220 | `ArchLucid.Application.Governance.GovernanceLineageService` | `ArchLucid.Application\Governance\GovernanceLineageService.cs` | 78.82 | 18 | No |
| 221 | `ArchLucid.Application.Billing.TenantCostEstimateService` | `ArchLucid.Application\Billing\TenantCostEstimateService.cs` | 78.95 | 4 | No |
| 222 | `ArchLucid.Application.Analysis.MarkdownDriftReportFormatter` | `ArchLucid.Application\Analysis\MarkdownDriftReportFormatter.cs` | 79.17 | 10 | No |
| 223 | `ArchLucid.Application.Runs.Coordination.ArchitectureRunAuthorityCoordination` | `ArchLucid.Application\Runs\Coordination\ArchitectureRunAuthorityCoordination.cs` | 79.27 | 17 | No |
| 224 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunCreateOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunCreateOrchestrator.cs` | 79.74 | 46 | No |
| 225 | `ArchLucid.Application.Analysis.ExportRecordRequestDiff` | `ArchLucid.Application\Analysis\ExportRecordRequestDiff.cs` | 80.00 | 2 | No |
| 226 | `ArchLucid.Application.Authority.AuthorityCommittedChainDurableAudit` | `ArchLucid.Application\Authority\AuthorityCommittedChainDurableAudit.cs` | 80.00 | 9 | No |
| 227 | `ArchLucid.Application.Pilots.FirstValueReportBuildResult` | `ArchLucid.Application\Pilots\FirstValueReportBuildResult.cs` | 80.00 | 1 | No |
| 228 | `ArchLucid.Application.Runs.AgentExecutionFailureSummaryJson` | `ArchLucid.Application\Runs\AgentExecutionFailureSummaryJson.cs` | 80.00 | 3 | No |
| 229 | `ArchLucid.Application.WeeklyArchitectureDigest.WeeklyArchitectureDigestOptions` | `ArchLucid.Application\WeeklyArchitectureDigest\WeeklyArchitectureDigestOptions.cs` | 80.00 | 3 | No |
| 230 | `ArchLucid.Application.Connectors.Publishing.ConfluenceCloudPublisherConnector` | `ArchLucid.Application\Connectors\Publishing\ConfluenceCloudPublisherConnector.cs` | 80.28 | 14 | No |
| 231 | `ArchLucid.Application.Import.ArchitectureCsvDryRunParser` | `ArchLucid.Application\Import\ArchitectureCsvDryRunParser.cs` | 80.49 | 8 | No |
| 232 | `ArchLucid.Application.Runs.Coordination.CoordinationResult` | `ArchLucid.Application\Runs\Coordination\CoordinationResult.cs` | 81.25 | 3 | No |
| 233 | `ArchLucid.Application.Findings.ReasoningSummaryBuilder` | `ArchLucid.Application\Findings\ReasoningSummaryBuilder.cs` | 82.14 | 15 | No |
| 234 | `ArchLucid.Application.ReplayRunService` | `ArchLucid.Application\ReplayRunService.cs` | 82.20 | 34 | No |
| 235 | `ArchLucid.Application.Integrations.Itsm.Outbound.ServiceNowOutboundIncidentClient` | `ArchLucid.Application\Integrations\Itsm\Outbound\ServiceNowOutboundIncidentClient.cs` | 82.39 | 25 | No |
| 236 | `ArchLucid.Application.Identity.PwnedPasswordRangeClient` | `ArchLucid.Application\Identity\PwnedPasswordRangeClient.cs` | 82.86 | 6 | No |
| 237 | `ArchLucid.Application.Import.ImportRequestFileService` | `ArchLucid.Application\Import\ImportRequestFileService.cs` | 83.02 | 18 | No |
| 238 | `ArchLucid.Application.Billing.MarketplaceChangeQuantityWebhookMutationHandler` | `ArchLucid.Application\Billing\MarketplaceChangeQuantityWebhookMutationHandler.cs` | 83.33 | 3 | No |
| 239 | `ArchLucid.Application.Evolution.SimulationEvaluationResult` | `ArchLucid.Application\Evolution\SimulationEvaluationResult.cs` | 83.33 | 1 | No |
| 240 | `ArchLucid.Application.Pilots.SponsorEvidencePackService` | `ArchLucid.Application\Pilots\SponsorEvidencePackService.cs` | 83.33 | 11 | No |
| 241 | `ArchLucid.Application.Integrations.Itsm.Outbound.ItsmFindingAuthorityPayloadMapper` | `ArchLucid.Application\Integrations\Itsm\Outbound\ItsmFindingAuthorityPayloadMapper.cs` | 83.78 | 6 | No |
| 242 | `ArchLucid.Application.Tenancy.TrialLimitGate` | `ArchLucid.Application\Tenancy\TrialLimitGate.cs` | 84.00 | 8 | No |
| 243 | `ArchLucid.Application.Notifications.Email.MarketingPricingQuoteSalesNotifier` | `ArchLucid.Application\Notifications\Email\MarketingPricingQuoteSalesNotifier.cs` | 84.62 | 8 | No |
| 244 | `ArchLucid.Application.Integrations.Itsm.ItsmInboundWebhookSyncService` | `ArchLucid.Application\Integrations\Itsm\ItsmInboundWebhookSyncService.cs` | 84.64 | 53 | No |
| 245 | `ArchLucid.Application.ReplayRunResult` | `ArchLucid.Application\ReplayRunResult.cs` | 85.00 | 3 | No |
| 246 | `ArchLucid.Application.Governance.GovernanceDashboardService` | `ArchLucid.Application\Governance\GovernanceDashboardService.cs` | 85.19 | 4 | No |
| 247 | `ArchLucid.Application.Integrations.Itsm.Outbound.JiraAdfDescriptionBuilder` | `ArchLucid.Application\Integrations\Itsm\Outbound\JiraAdfDescriptionBuilder.cs` | 85.29 | 5 | No |
| 248 | `ArchLucid.Application.Runs.AgentExecutionFailureSummaryFactory` | `ArchLucid.Application\Runs\AgentExecutionFailureSummaryFactory.cs` | 85.42 | 7 | No |
| 249 | `ArchLucid.Application.Alerts.IntegrationDestinationRedactor` | `ArchLucid.Application\Alerts\IntegrationDestinationRedactor.cs` | 85.71 | 1 | No |
| 250 | `ArchLucid.Application.Billing.MarketplaceChangePlanWebhookMutationHandler` | `ArchLucid.Application\Billing\MarketplaceChangePlanWebhookMutationHandler.cs` | 85.71 | 3 | No |
| 251 | `ArchLucid.Application.Support.SupportBundleSensitivePatternRedactor` | `ArchLucid.Application\Support\SupportBundleSensitivePatternRedactor.cs` | 85.71 | 7 | No |
| 252 | `ArchLucid.Application.Tenancy.TenantSlugNormalizer` | `ArchLucid.Application\Tenancy\TenantSlugNormalizer.cs` | 85.71 | 3 | No |
| 253 | `ArchLucid.Application.Pilots.SponsorSafeProofStatusMarkdownFormatter` | `ArchLucid.Application\Pilots\SponsorSafeProofStatusMarkdownFormatter.cs` | 85.90 | 11 | No |
| 254 | `ArchLucid.Application.Pilots.SponsorOnePagerPdfBuilder` | `ArchLucid.Application\Pilots\SponsorOnePagerPdfBuilder.cs` | 85.92 | 20 | No |
| 255 | `ArchLucid.Application.Notifications.Email.CommitSponsorEmailNotifier` | `ArchLucid.Application\Notifications\Email\CommitSponsorEmailNotifier.cs` | 85.96 | 8 | No |
| 256 | `ArchLucid.Application.Integrations.Itsm.Outbound.ItsmOutboundIssueCreationService` | `ArchLucid.Application\Integrations\Itsm\Outbound\ItsmOutboundIssueCreationService.cs` | 86.07 | 45 | No |
| 257 | `ArchLucid.Application.Pilots.FirstValueReportBrandingSanitizer` | `ArchLucid.Application\Pilots\FirstValueReportBrandingSanitizer.cs` | 86.21 | 4 | No |
| 258 | `ArchLucid.Application.AzureExtractor.AzureExtractorEvidenceBundleMerger` | `ArchLucid.Application\AzureExtractor\AzureExtractorEvidenceBundleMerger.cs` | 86.36 | 3 | No |
| 259 | `ArchLucid.Application.Evolution.SimulationEvaluationService` | `ArchLucid.Application\Evolution\SimulationEvaluationService.cs` | 86.55 | 16 | No |
| 260 | `ArchLucid.Application.DataConsistency.DataConsistencyHealthCheck` | `ArchLucid.Application\DataConsistency\DataConsistencyHealthCheck.cs` | 86.67 | 2 | No |
| 261 | `ArchLucid.Application.Runs.ArchitectureRunAuthorityReader` | `ArchLucid.Application\Runs\ArchitectureRunAuthorityReader.cs` | 86.67 | 2 | No |
| 262 | `ArchLucid.Application.Ingestion.FastPathContextModelBuilder` | `ArchLucid.Application\Ingestion\FastPathContextModelBuilder.cs` | 86.76 | 9 | No |
| 263 | `ArchLucid.Application.Analysis.ArchitectureAnalysisReport` | `ArchLucid.Application\Analysis\ArchitectureAnalysisReport.cs` | 86.96 | 3 | No |
| 264 | `ArchLucid.Application.Runs.Mapping.RunRecordToArchitectureRunMapper` | `ArchLucid.Application\Runs\Mapping\RunRecordToArchitectureRunMapper.cs` | 87.10 | 4 | No |
| 265 | `ArchLucid.Application.Tenancy.TenantProvisioningService` | `ArchLucid.Application\Tenancy\TenantProvisioningService.cs` | 87.10 | 8 | No |
| 266 | `ArchLucid.Application.Governance.PolicyPackGovernanceDryRunService` | `ArchLucid.Application\Governance\PolicyPackGovernanceDryRunService.cs` | 87.40 | 16 | No |
| 267 | `ArchLucid.Application.Pilots.FirstValueReportBuilder` | `ArchLucid.Application\Pilots\FirstValueReportBuilder.cs` | 87.46 | 38 | No |
| 268 | `ArchLucid.Application.Notifications.Email.EmailBrandingUrls` | `ArchLucid.Application\Notifications\Email\EmailBrandingUrls.cs` | 87.50 | 1 | No |
| 269 | `ArchLucid.Application.Pilots.PilotRoiEvidenceConfidenceResolver` | `ArchLucid.Application\Pilots\PilotRoiEvidenceConfidenceResolver.cs` | 87.50 | 2 | No |
| 270 | `ArchLucid.Application.Analysis.ComparisonReplayCostEstimator` | `ArchLucid.Application\Analysis\ComparisonReplayCostEstimator.cs` | 87.95 | 10 | No |
| 271 | `ArchLucid.Application.Pilots.PilotScorecardBuilder` | `ArchLucid.Application\Pilots\PilotScorecardBuilder.cs` | 88.00 | 3 | No |
| 272 | `ArchLucid.Application.Scim.Filtering.ScimFilterParser` | `ArchLucid.Application\Scim\Filtering\ScimFilterParser.cs` | 88.73 | 16 | No |
| 273 | `ArchLucid.Application.AzureExtractor.AzureExtractorManifestReader` | `ArchLucid.Application\AzureExtractor\AzureExtractorManifestReader.cs` | 88.89 | 8 | No |
| 274 | `ArchLucid.Application.Explanation.FindingLlmAuditService` | `ArchLucid.Application\Explanation\FindingLlmAuditService.cs` | 89.06 | 7 | No |
| 275 | `ArchLucid.Application.Marketing.EmbeddedResourceEvidencePackSourceProvider` | `ArchLucid.Application\Marketing\EmbeddedResourceEvidencePackSourceProvider.cs` | 89.29 | 3 | No |
| 276 | `ArchLucid.Application.Notifications.Email.TrialEmailIdempotencyKeys` | `ArchLucid.Application\Notifications\Email\TrialEmailIdempotencyKeys.cs` | 89.47 | 2 | No |
| 277 | `ArchLucid.Application.Findings.FindingMuteFlagApplier` | `ArchLucid.Application\Findings\FindingMuteFlagApplier.cs` | 90.00 | 1 | No |
| 278 | `ArchLucid.Application.Runs.Finalization.ManifestFinalizationRequest` | `ArchLucid.Application\Runs\Finalization\ManifestFinalizationRequest.cs` | 90.00 | 2 | No |
| 279 | `ArchLucid.Application.Pilots.WhyArchLucidSnapshotService` | `ArchLucid.Application\Pilots\WhyArchLucidSnapshotService.cs` | 90.24 | 4 | No |
| 280 | `ArchLucid.Application.Marketing.EvidencePackEtag` | `ArchLucid.Application\Marketing\EvidencePackEtag.cs` | 90.48 | 2 | No |
| 281 | `ArchLucid.Application.Diffs.RelationshipDiffItem` | `ArchLucid.Application\Diffs\RelationshipDiffItem.cs` | 90.91 | 1 | No |
| 282 | `ArchLucid.Application.Pilots.FirstValueReportPdfBuilder` | `ArchLucid.Application\Pilots\FirstValueReportPdfBuilder.cs` | 90.91 | 7 | No |
| 283 | `ArchLucid.Application.Integrations.Confluence.ConfluenceFirstValueReportPublisher` | `ArchLucid.Application\Integrations\Confluence\ConfluenceFirstValueReportPublisher.cs` | 91.11 | 4 | No |
| 284 | `ArchLucid.Application.Runs.Orchestration.PromptInjectionPatternSignals` | `ArchLucid.Application\Runs\Orchestration\PromptInjectionPatternSignals.cs` | 91.30 | 10 | No |
| 285 | `ArchLucid.Application.Pilots.PilotValueReportMarkdownFormatter` | `ArchLucid.Application\Pilots\PilotValueReportMarkdownFormatter.cs` | 91.55 | 6 | No |
| 286 | `ArchLucid.Application.Integrations.Itsm.Outbound.JiraOutboundIssueClient` | `ArchLucid.Application\Integrations\Itsm\Outbound\JiraOutboundIssueClient.cs` | 91.80 | 5 | No |
| 287 | `ArchLucid.Application.Governance.PolicyPackDryRunService` | `ArchLucid.Application\Governance\PolicyPackDryRunService.cs` | 91.87 | 10 | No |
| 288 | `ArchLucid.Application.Marketing.EvidencePackBuilder` | `ArchLucid.Application\Marketing\EvidencePackBuilder.cs` | 91.89 | 6 | No |
| 289 | `ArchLucid.Application.Governance.FindingReview.FindingReviewTrailAppendService` | `ArchLucid.Application\Governance\FindingReview\FindingReviewTrailAppendService.cs` | 92.11 | 3 | No |
| 290 | `ArchLucid.Application.Pilots.SponsorProofReadinessClassifier` | `ArchLucid.Application\Pilots\SponsorProofReadinessClassifier.cs` | 92.31 | 2 | No |
| 291 | `ArchLucid.Application.Explanation.FindingEvidenceChainService` | `ArchLucid.Application\Explanation\FindingEvidenceChainService.cs` | 93.02 | 3 | No |
| 292 | `ArchLucid.Application.Governance.GovernanceRationaleService` | `ArchLucid.Application\Governance\GovernanceRationaleService.cs` | 93.10 | 2 | No |
| 293 | `ArchLucid.Application.Notifications.Email.TrialLocalIdentityAccountExistsEmailNotifier` | `ArchLucid.Application\Notifications\Email\TrialLocalIdentityAccountExistsEmailNotifier.cs` | 93.18 | 3 | No |
| 294 | `ArchLucid.Application.Analysis.ComparisonReplayRequestParsing` | `ArchLucid.Application\Analysis\ComparisonReplayRequestParsing.cs` | 93.75 | 1 | No |
| 295 | `ArchLucid.Application.AzureExtractor.AzureExtractorCitationFormatter` | `ArchLucid.Application\AzureExtractor\AzureExtractorCitationFormatter.cs` | 93.75 | 1 | No |
| 296 | `ArchLucid.Application.Diffs.ManifestDiffResult` | `ArchLucid.Application\Diffs\ManifestDiffResult.cs` | 93.94 | 2 | No |
| 297 | `ArchLucid.Application.Traceability.TraceabilityBundleBuilder` | `ArchLucid.Application\Traceability\TraceabilityBundleBuilder.cs` | 94.00 | 3 | No |
| 298 | `ArchLucid.Application.Pilots.PilotValueReportService` | `ArchLucid.Application\Pilots\PilotValueReportService.cs` | 94.08 | 9 | No |
| 299 | `ArchLucid.Application.Budgeting.LlmMonthlyTenantDollarBudgetStatusResult` | `ArchLucid.Application\Budgeting\LlmMonthlyTenantDollarBudgetStatusResult.cs` | 94.12 | 1 | No |
| 300 | `ArchLucid.Application.Governance.ComplianceDriftTrendService` | `ArchLucid.Application\Governance\ComplianceDriftTrendService.cs` | 94.29 | 2 | No |
| 301 | `ArchLucid.Application.Jobs.BackgroundJobWorkUnitExecutor` | `ArchLucid.Application\Jobs\BackgroundJobWorkUnitExecutor.cs` | 94.59 | 4 | No |

### ArchLucid.ArtifactSynthesis (62.22% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ArtifactSynthesis.Generators.ArchitectureNarrativeArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ArchitectureNarrativeArtifactGenerator.cs` | 0.00 | 98 | No |
| 2 | `ArchLucid.ArtifactSynthesis.Generators.ComplianceMatrixArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ComplianceMatrixArtifactGenerator.cs` | 0.00 | 27 | No |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.CostSummaryArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\CostSummaryArtifactGenerator.cs` | 0.00 | 20 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ArtifactSynthesis.Generators.ArchitectureNarrativeArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ArchitectureNarrativeArtifactGenerator.cs` | 0.00 | 98 | No |
| 2 | `ArchLucid.ArtifactSynthesis.Generators.ComplianceMatrixArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ComplianceMatrixArtifactGenerator.cs` | 0.00 | 27 | No |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.CostSummaryArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\CostSummaryArtifactGenerator.cs` | 0.00 | 20 | No |
| 4 | `ArchLucid.ArtifactSynthesis.Generators.DiagramAstGenerator` | `ArchLucid.ArtifactSynthesis\Generators\DiagramAstGenerator.cs` | 0.00 | 25 | No |
| 5 | `ArchLucid.ArtifactSynthesis.Generators.ReferenceArchitectureMarkdownGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ReferenceArchitectureMarkdownGenerator.cs` | 0.00 | 101 | No |
| 6 | `ArchLucid.ArtifactSynthesis.Generators.UnresolvedIssuesArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\UnresolvedIssuesArtifactGenerator.cs` | 0.00 | 21 | No |
| 7 | `ArchLucid.ArtifactSynthesis.Models.ArtifactBundleArtifactMetadataPage` | `ArchLucid.ArtifactSynthesis\Models\ArtifactMetadataModels.cs` | 0.00 | 1 | No |
| 8 | `ArchLucid.ArtifactSynthesis.Models.ArtifactMetadataRow` | `ArchLucid.ArtifactSynthesis\Models\ArtifactMetadataModels.cs` | 0.00 | 11 | No |
| 9 | `ArchLucid.ArtifactSynthesis.Models.ComplianceMatrixArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\ComplianceMatrixArtifactModel.cs` | 0.00 | 3 | No |
| 10 | `ArchLucid.ArtifactSynthesis.Models.CostSummaryArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\CostSummaryArtifactModel.cs` | 0.00 | 8 | No |
| 11 | `ArchLucid.ArtifactSynthesis.Models.UnresolvedIssueArtifactItem` | `ArchLucid.ArtifactSynthesis\Models\UnresolvedIssueArtifactItem.cs` | 0.00 | 8 | No |
| 12 | `ArchLucid.ArtifactSynthesis.Models.UnresolvedIssuesArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\UnresolvedIssuesArtifactModel.cs` | 0.00 | 3 | No |
| 13 | `ArchLucid.ArtifactSynthesis.Renderers.MermaidDiagramRenderer` | `ArchLucid.ArtifactSynthesis\Renderers\MermaidDiagramRenderer.cs` | 0.00 | 10 | No |
| 14 | `ArchLucid.ArtifactSynthesis.Repositories.InMemoryArtifactBundleRepository` | `ArchLucid.ArtifactSynthesis\Repositories\InMemoryArtifactBundleRepository.cs` | 0.00 | 47 | No |
| 15 | `ArchLucid.ArtifactSynthesis.Models.DiagramEdge` | `ArchLucid.ArtifactSynthesis\Models\DiagramEdge.cs` | 50.00 | 3 | No |
| 16 | `ArchLucid.ArtifactSynthesis.Models.DiagramNode` | `ArchLucid.ArtifactSynthesis\Models\DiagramNode.cs` | 50.00 | 3 | No |
| 17 | `ArchLucid.ArtifactSynthesis.Docx.DocxExportService` | `ArchLucid.ArtifactSynthesis\Docx\DocxExportService.cs` | 51.71 | 155 | No |
| 18 | `ArchLucid.ArtifactSynthesis.Services.TerraformAdvisoryDecommissionSnippetBuilder` | `ArchLucid.ArtifactSynthesis\Services\TerraformAdvisoryDecommissionSnippetBuilder.cs` | 57.89 | 8 | No |
| 19 | `ArchLucid.ArtifactSynthesis.Sanitization.LlmArtifactFreeTextSanitizer` | `ArchLucid.ArtifactSynthesis\Sanitization\LlmArtifactFreeTextSanitizer.cs` | 58.33 | 5 | No |
| 20 | `ArchLucid.ArtifactSynthesis.Docx.Models.DocxExportRequest` | `ArchLucid.ArtifactSynthesis\Docx\Models\DocxExportRequest.cs` | 61.36 | 17 | No |
| 21 | `ArchLucid.ArtifactSynthesis.Docx.Builders.WordDocumentBuilder` | `ArchLucid.ArtifactSynthesis\Docx\Builders\WordDocumentBuilder.cs` | 64.39 | 47 | No |
| 22 | `ArchLucid.ArtifactSynthesis.Models.InventoryArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\InventoryArtifactModel.cs` | 66.67 | 1 | No |
| 23 | `ArchLucid.ArtifactSynthesis.Services.ArtifactSynthesisService` | `ArchLucid.ArtifactSynthesis\Services\ArtifactSynthesisService.cs` | 70.18 | 17 | No |
| 24 | `ArchLucid.ArtifactSynthesis.Docx.Models.DocxExportResult` | `ArchLucid.ArtifactSynthesis\Docx\Models\DocxExportResult.cs` | 75.00 | 2 | No |
| 25 | `ArchLucid.ArtifactSynthesis.Models.DiagramAst` | `ArchLucid.ArtifactSynthesis\Models\DiagramAst.cs` | 75.00 | 2 | No |
| 26 | `ArchLucid.ArtifactSynthesis.Packaging.ArtifactPackage` | `ArchLucid.ArtifactSynthesis\Packaging\ArtifactPackage.cs` | 75.00 | 2 | No |
| 27 | `ArchLucid.ArtifactSynthesis.Packaging.TerraformHclFormatHelper` | `ArchLucid.ArtifactSynthesis\Packaging\TerraformHclFormatHelper.cs` | 75.51 | 12 | No |
| 28 | `ArchLucid.ArtifactSynthesis.Docx.Helpers.ImageHelper` | `ArchLucid.ArtifactSynthesis\Docx\Helpers\ImageHelper.cs` | 80.43 | 9 | No |
| 29 | `ArchLucid.ArtifactSynthesis.Services.ArtifactBundleValidator` | `ArchLucid.ArtifactSynthesis\Services\ArtifactBundleValidator.cs` | 86.21 | 4 | No |
| 30 | `ArchLucid.ArtifactSynthesis.Docx.TemplateLoader` | `ArchLucid.ArtifactSynthesis\Docx\TemplateLoader.cs` | 94.44 | 1 | No |

### ArchLucid.Retrieval (62.54% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Retrieval.Embedding.FakeEmbeddingService` | `ArchLucid.Retrieval\Embedding\FakeEmbeddingService.cs` | 0.00 | 8 | No |
| 2 | `ArchLucid.Retrieval.Indexing.RetrievalDocumentBuilder` | `ArchLucid.Retrieval\Indexing\RetrievalDocumentBuilder.cs` | 0.00 | 69 | No |
| 3 | `ArchLucid.Retrieval.Indexing.RetrievalRunCompletionIndexer` | `ArchLucid.Retrieval\Indexing\RetrievalRunCompletionIndexer.cs` | 0.00 | 24 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Retrieval.Embedding.FakeEmbeddingService` | `ArchLucid.Retrieval\Embedding\FakeEmbeddingService.cs` | 0.00 | 8 | No |
| 2 | `ArchLucid.Retrieval.Indexing.RetrievalDocumentBuilder` | `ArchLucid.Retrieval\Indexing\RetrievalDocumentBuilder.cs` | 0.00 | 69 | No |
| 3 | `ArchLucid.Retrieval.Indexing.RetrievalRunCompletionIndexer` | `ArchLucid.Retrieval\Indexing\RetrievalRunCompletionIndexer.cs` | 0.00 | 24 | No |
| 4 | `ArchLucid.Retrieval.Models.RetrievalHit` | `ArchLucid.Retrieval\Models\RetrievalHit.cs` | 71.43 | 4 | No |
| 5 | `ArchLucid.Retrieval.Models.RetrievalDocument` | `ArchLucid.Retrieval\Models\RetrievalDocument.cs` | 72.00 | 7 | No |
| 6 | `ArchLucid.Retrieval.Embedding.CircuitBreakingOpenAiEmbeddingClient` | `ArchLucid.Retrieval\Embedding\CircuitBreakingOpenAiEmbeddingClient.cs` | 76.09 | 11 | No |
| 7 | `ArchLucid.Retrieval.Chunking.SimpleTextChunker` | `ArchLucid.Retrieval\Chunking\SimpleTextChunker.cs` | 83.33 | 2 | No |
| 8 | `ArchLucid.Retrieval.Models.RetrievalChunk` | `ArchLucid.Retrieval\Models\RetrievalChunk.cs` | 90.00 | 3 | No |
| 9 | `ArchLucid.Retrieval.Models.RetrievalQuery` | `ArchLucid.Retrieval\Models\RetrievalQuery.cs` | 93.33 | 1 | No |

### ArchLucid.Persistence (65.35% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.AdminNotifications.DapperAdminNotificationsRepository` | `ArchLucid.Persistence\AdminNotifications\DapperAdminNotificationsRepository.cs` | 0.00 | 12 | No |
| 2 | `ArchLucid.Persistence.AdminNotifications.NoOpAdminNotificationsRepository` | `ArchLucid.Persistence\AdminNotifications\NoOpAdminNotificationsRepository.cs` | 0.00 | 1 | No |
| 3 | `ArchLucid.Persistence.Advisory.DigestDeliveryDispatcher` | `ArchLucid.Persistence\Advisory\DigestDeliveryDispatcher.cs` | 0.00 | 88 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.AdminNotifications.DapperAdminNotificationsRepository` | `ArchLucid.Persistence\AdminNotifications\DapperAdminNotificationsRepository.cs` | 0.00 | 12 | No |
| 2 | `ArchLucid.Persistence.AdminNotifications.NoOpAdminNotificationsRepository` | `ArchLucid.Persistence\AdminNotifications\NoOpAdminNotificationsRepository.cs` | 0.00 | 1 | No |
| 3 | `ArchLucid.Persistence.Advisory.DigestDeliveryDispatcher` | `ArchLucid.Persistence\Advisory\DigestDeliveryDispatcher.cs` | 0.00 | 88 | No |
| 4 | `ArchLucid.Persistence.Advisory.InMemoryAdvisoryScanExecutionRepository` | `ArchLucid.Persistence\Advisory\InMemoryAdvisoryScanExecutionRepository.cs` | 0.00 | 19 | No |
| 5 | `ArchLucid.Persistence.Advisory.InMemoryDigestDeliveryAttemptRepository` | `ArchLucid.Persistence\Advisory\InMemoryDigestDeliveryAttemptRepository.cs` | 0.00 | 29 | No |
| 6 | `ArchLucid.Persistence.Advisory.RecommendationFeedbackAnalyzer` | `ArchLucid.Persistence\Advisory\RecommendationFeedbackAnalyzer.cs` | 0.00 | 10 | No |
| 7 | `ArchLucid.Persistence.Advisory.RecommendationWorkflowService` | `ArchLucid.Persistence\Advisory\RecommendationWorkflowService.cs` | 0.00 | 60 | No |
| 8 | `ArchLucid.Persistence.Alerts.AlertDeliveryDispatcher` | `ArchLucid.Persistence\Alerts\AlertDeliveryDispatcher.cs` | 0.00 | 85 | No |
| 9 | `ArchLucid.Persistence.Alerts.AlertIntegrationEventPublishing` | `ArchLucid.Persistence\Alerts\AlertIntegrationEventPublishing.cs` | 0.00 | 69 | No |
| 10 | `ArchLucid.Persistence.Alerts.AlertService` | `ArchLucid.Persistence\Alerts\AlertService.cs` | 0.00 | 125 | No |
| 11 | `ArchLucid.Persistence.Alerts.AlertSuppressionPolicy` | `ArchLucid.Persistence\Alerts\AlertSuppressionPolicy.cs` | 0.00 | 51 | No |
| 12 | `ArchLucid.Persistence.Alerts.CompositeAlertService` | `ArchLucid.Persistence\Alerts\CompositeAlertService.cs` | 0.00 | 108 | No |
| 13 | `ArchLucid.Persistence.Alerts.Helpers.AlertGovernanceResolver` | `ArchLucid.Persistence\Alerts\Helpers\AlertGovernanceResolver.cs` | 0.00 | 6 | No |
| 14 | `ArchLucid.Persistence.Alerts.Simulation.RuleSimulationService` | `ArchLucid.Persistence\Alerts\Simulation\RuleSimulationService.cs` | 0.00 | 232 | No |
| 15 | `ArchLucid.Persistence.Audit.NoOpAuditEventChangeFeedHandler` | `ArchLucid.Persistence\Audit\NoOpAuditEventChangeFeedHandler.cs` | 0.00 | 1 | No |
| 16 | `ArchLucid.Persistence.AzureExtractorChunkUpload.AzureBlobAzureExtractorChunkSessionStore` | `ArchLucid.Persistence\AzureExtractorChunkUpload\AzureBlobAzureExtractorChunkSessionStore.cs` | 0.00 | 104 | No |
| 17 | `ArchLucid.Persistence.AzureExtractorChunkUpload.AzureExtractorChunkSessionDescriptor` | `ArchLucid.Persistence\AzureExtractorChunkUpload\AzureExtractorChunkSessionDescriptor.cs` | 0.00 | 18 | No |
| 18 | `ArchLucid.Persistence.AzureExtractorChunkUpload.AzureExtractorChunkSessionMetadata` | `ArchLucid.Persistence\AzureExtractorChunkUpload\AzureExtractorChunkSessionMetadata.cs` | 0.00 | 30 | No |
| 19 | `ArchLucid.Persistence.AzureExtractorChunkUpload.LocalAzureExtractorChunkSessionStore` | `ArchLucid.Persistence\AzureExtractorChunkUpload\LocalAzureExtractorChunkSessionStore.cs` | 0.00 | 99 | No |
| 20 | `ArchLucid.Persistence.AzureExtractorChunkUpload.NullAzureExtractorChunkSessionStore` | `ArchLucid.Persistence\AzureExtractorChunkUpload\NullAzureExtractorChunkSessionStore.cs` | 0.00 | 11 | No |
| 21 | `ArchLucid.Persistence.Billing.BillingProviderRegistry` | `ArchLucid.Persistence\Billing\BillingProviderRegistry.cs` | 0.00 | 16 | No |
| 22 | `ArchLucid.Persistence.Billing.SqlBillingLedger` | `ArchLucid.Persistence\Billing\SqlBillingLedger.cs` | 0.00 | 129 | No |
| 23 | `ArchLucid.Persistence.BlobStore.AzureBlobArtifactBlobStore` | `ArchLucid.Persistence\BlobStore\AzureBlobArtifactBlobStore.cs` | 0.00 | 40 | No |
| 24 | `ArchLucid.Persistence.BlobStore.NullArtifactBlobStore` | `ArchLucid.Persistence\BlobStore\NullArtifactBlobStore.cs` | 0.00 | 4 | No |
| 25 | `ArchLucid.Persistence.Concurrency.SqlSessionDistributedCreateRunIdempotencyLock` | `ArchLucid.Persistence\Concurrency\SqlSessionDistributedCreateRunIdempotencyLock.cs` | 0.00 | 58 | No |
| 26 | `ArchLucid.Persistence.Connections.DelegatingTenantSqlConnectionFactory` | `ArchLucid.Persistence\Connections\DelegatingTenantSqlConnectionFactory.cs` | 0.00 | 3 | No |
| 27 | `ArchLucid.Persistence.Connections.SqlConnectionOpenAttemptTiming` | `ArchLucid.Persistence\Connections\SqlConnectionOpenAttemptTiming.cs` | 0.00 | 6 | No |
| 28 | `ArchLucid.Persistence.Connections.UnusedSystemSqlConnectionFactory` | `ArchLucid.Persistence\Connections\UnusedSystemSqlConnectionFactory.cs` | 0.00 | 2 | No |
| 29 | `ArchLucid.Persistence.Connections.UnusedTenantSqlConnectionFactory` | `ArchLucid.Persistence\Connections\UnusedTenantSqlConnectionFactory.cs` | 0.00 | 2 | No |
| 30 | `ArchLucid.Persistence.Coordination.Compliance.PolicyFilteredComplianceRulePackProvider` | `ArchLucid.Persistence\Coordination\Compliance\PolicyFilteredComplianceRulePackProvider.cs` | 0.00 | 11 | No |
| 31 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionCandidateChangeSetRepository` | `ArchLucid.Persistence\Coordination\Evolution\InMemoryEvolutionCandidateChangeSetRepository.cs` | 0.00 | 48 | No |
| 32 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionSimulationRunRepository` | `ArchLucid.Persistence\Coordination\Evolution\InMemoryEvolutionSimulationRunRepository.cs` | 0.00 | 18 | No |
| 33 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementPlanSignalLinkSqlRow` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 6 | No |
| 34 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementThemeSqlRow` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 43 | No |
| 35 | `ArchLucid.Persistence.Coordination.Replay.AuthorityReplayService` | `ArchLucid.Persistence\Coordination\Replay\AuthorityReplayService.cs` | 0.00 | 101 | No |
| 36 | `ArchLucid.Persistence.Coordination.Replay.ReplayRequest` | `ArchLucid.Persistence\Coordination\Replay\ReplayRequest.cs` | 0.00 | 5 | No |
| 37 | `ArchLucid.Persistence.Coordination.Replay.ReplayResult` | `ArchLucid.Persistence\Coordination\Replay\ReplayResult.cs` | 0.00 | 15 | No |
| 38 | `ArchLucid.Persistence.Coordination.Replay.ReplayValidationResult` | `ArchLucid.Persistence\Coordination\Replay\ReplayValidationResult.cs` | 0.00 | 19 | No |
| 39 | `ArchLucid.Persistence.Coordination.Retrieval.InMemoryRetrievalIndexingOutboxRepository` | `ArchLucid.Persistence\Coordination\Retrieval\InMemoryRetrievalIndexingOutboxRepository.cs` | 0.00 | 30 | No |
| 40 | `ArchLucid.Persistence.Cosmos.AgentTraceDocument` | `ArchLucid.Persistence\Cosmos\AgentTraceDocument.cs` | 0.00 | 17 | No |
| 41 | `ArchLucid.Persistence.Cosmos.AuditEventDocument` | `ArchLucid.Persistence\Cosmos\AuditEventDocument.cs` | 0.00 | 37 | No |
| 42 | `ArchLucid.Persistence.Cosmos.CosmosEmulatorHttpClientFactory` | `ArchLucid.Persistence\Cosmos\CosmosEmulatorHttpClientFactory.cs` | 0.00 | 2 | No |
| 43 | `ArchLucid.Persistence.Cosmos.GraphSnapshotDocument` | `ArchLucid.Persistence\Cosmos\GraphSnapshotDocument.cs` | 0.00 | 26 | No |
| 44 | `ArchLucid.Persistence.CustomerSuccess.InMemoryCorePilotTeamChecklistRepository` | `ArchLucid.Persistence\CustomerSuccess\InMemoryCorePilotTeamChecklistRepository.cs` | 0.00 | 19 | No |
| 45 | `ArchLucid.Persistence.CustomerSuccess.InMemoryOperatorStickinessSnapshotReader` | `ArchLucid.Persistence\CustomerSuccess\InMemoryOperatorStickinessSnapshotReader.cs` | 0.00 | 4 | No |
| 46 | `ArchLucid.Persistence.Data.Repositories.ArchitectureRunListItem` | `ArchLucid.Persistence\Data\Repositories\ArchitectureRunListItem.cs` | 0.00 | 18 | No |
| 47 | `ArchLucid.Persistence.Data.Repositories.BackgroundJobRow` | `ArchLucid.Persistence\Data\Repositories\BackgroundJobRow.cs` | 0.00 | 27 | No |
| 48 | `ArchLucid.Persistence.Data.Repositories.CommitRunIdempotencyLookup` | `ArchLucid.Persistence\Data\Repositories\CommitRunIdempotencyLookup.cs` | 0.00 | 3 | No |
| 49 | `ArchLucid.Persistence.Data.Repositories.ExecDigestPreferencesMapper` | `ArchLucid.Persistence\Data\Repositories\ExecDigestPreferencesMapper.cs` | 0.00 | 26 | No |
| 50 | `ArchLucid.Persistence.Data.Repositories.HostLeaderLeaseSnapshot` | `ArchLucid.Persistence\Data\Repositories\HostLeaderLeaseSnapshot.cs` | 0.00 | 8 | No |
| 51 | `ArchLucid.Persistence.Data.Repositories.InMemoryCommitRunIdempotencyRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryCommitRunIdempotencyRepository.cs` | 0.00 | 13 | No |
| 52 | `ArchLucid.Persistence.Data.Repositories.InMemoryProjectRoleAssignmentRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryProjectRoleAssignmentRepository.cs` | 0.00 | 1 | No |
| 53 | `ArchLucid.Persistence.Data.Repositories.InMemoryTenantNotificationChannelPreferencesRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryTenantNotificationChannelPreferencesRepository.cs` | 0.00 | 16 | No |
| 54 | `ArchLucid.Persistence.Data.Repositories.InMemoryTenantTeamsIncomingWebhookConnectionRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryTenantTeamsIncomingWebhookConnectionRepository.cs` | 0.00 | 23 | No |
| 55 | `ArchLucid.Persistence.Data.Repositories.NoOpAgentOutputEvaluationResultRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpAgentOutputEvaluationResultRepository.cs` | 0.00 | 3 | No |
| 56 | `ArchLucid.Persistence.Data.Repositories.NoOpFindingReviewTrailRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpFindingReviewTrailRepository.cs` | 0.00 | 2 | No |
| 57 | `ArchLucid.Persistence.Data.Repositories.NoOpHostLeaderLeaseRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpHostLeaderLeaseRepository.cs` | 0.00 | 3 | No |
| 58 | `ArchLucid.Persistence.Data.Repositories.NoOpImportedArchitectureRequestRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpImportedArchitectureRequestRepository.cs` | 0.00 | 1 | No |
| 59 | `ArchLucid.Persistence.Data.Repositories.SqlAzureExtractorPackageRepository` | `ArchLucid.Persistence\Data\Repositories\SqlAzureExtractorPackageRepository.cs` | 0.00 | 62 | No |
| 60 | `ArchLucid.Persistence.Data.Repositories.SqlFindingReviewTrailRepository` | `ArchLucid.Persistence\Data\Repositories\SqlFindingReviewTrailRepository.cs` | 0.00 | 28 | No |
| 61 | `ArchLucid.Persistence.Data.Repositories.SqlImportedArchitectureRequestRepository` | `ArchLucid.Persistence\Data\Repositories\SqlImportedArchitectureRequestRepository.cs` | 0.00 | 20 | No |
| 62 | `ArchLucid.Persistence.Feedback.InMemoryFindingFeedbackRepository` | `ArchLucid.Persistence\Feedback\InMemoryFindingFeedbackRepository.cs` | 0.00 | 2 | No |
| 63 | `ArchLucid.Persistence.Findings.FindingInspectReadModelMapper` | `ArchLucid.Persistence\Findings\FindingInspectReadModelMapper.cs` | 0.00 | 9 | No |
| 64 | `ArchLucid.Persistence.Findings.InMemoryFindingRecordMuteRepository` | `ArchLucid.Persistence\Findings\InMemoryFindingRecordMuteRepository.cs` | 0.00 | 7 | No |
| 65 | `ArchLucid.Persistence.GoToMarket.SqlRoiBulletinAggregateReader` | `ArchLucid.Persistence\GoToMarket\SqlRoiBulletinAggregateReader.cs` | 0.00 | 49 | No |
| 66 | `ArchLucid.Persistence.Governance.CachingPolicyPackRepository` | `ArchLucid.Persistence\Governance\CachingPolicyPackRepository.cs` | 0.00 | 15 | No |
| 67 | `ArchLucid.Persistence.Identity.InMemoryNoTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\InMemoryNoTrialIdentityUserRepository.cs` | 0.00 | 9 | No |
| 68 | `ArchLucid.Persistence.Integrations.InMemoryItsmFindingCorrelationRepository` | `ArchLucid.Persistence\Integrations\InMemoryItsmFindingCorrelationRepository.cs` | 0.00 | 39 | No |
| 69 | `ArchLucid.Persistence.Integrations.InMemoryTenantItsmOutboundSettingsRepository` | `ArchLucid.Persistence\Integrations\InMemoryTenantItsmOutboundSettingsRepository.cs` | 0.00 | 9 | No |
| 70 | `ArchLucid.Persistence.Models.LlmCostEstimationUsdRateOverrideRow` | `ArchLucid.Persistence\Models\LlmCostEstimationUsdRateOverrideRow.cs` | 0.00 | 8 | No |
| 71 | `ArchLucid.Persistence.Models.ReferenceEvidenceRunCandidate` | `ArchLucid.Persistence\Models\ReferenceEvidenceRunCandidate.cs` | 0.00 | 8 | No |
| 72 | `ArchLucid.Persistence.Models.RunStaleUncommittedPurgeBatchResult` | `ArchLucid.Persistence\Models\RunStaleUncommittedPurgeBatchResult.cs` | 0.00 | 4 | No |
| 73 | `ArchLucid.Persistence.Models.TenantExecDigestPreferencesRow` | `ArchLucid.Persistence\Models\TenantExecDigestPreferencesRow.cs` | 0.00 | 17 | No |
| 74 | `ArchLucid.Persistence.Notifications.DapperSentEmailLedger` | `ArchLucid.Persistence\Notifications\DapperSentEmailLedger.cs` | 0.00 | 18 | No |
| 75 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationEmailApi` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationEmailApi.cs` | 0.00 | 35 | No |
| 76 | `ArchLucid.Persistence.Notifications.Email.NoopEmailProvider` | `ArchLucid.Persistence\Notifications\Email\NoopEmailProvider.cs` | 0.00 | 2 | No |
| 77 | `ArchLucid.Persistence.Notifications.Email.SmtpEmailProvider` | `ArchLucid.Persistence\Notifications\Email\SmtpEmailProvider.cs` | 0.00 | 26 | No |
| 78 | `ArchLucid.Persistence.Pilots.DapperPilotBaselineRepository` | `ArchLucid.Persistence\Pilots\DapperPilotBaselineRepository.cs` | 0.00 | 35 | No |
| 79 | `ArchLucid.Persistence.Pilots.DapperPilotCloseoutRepository` | `ArchLucid.Persistence\Pilots\DapperPilotCloseoutRepository.cs` | 0.00 | 23 | No |
| 80 | `ArchLucid.Persistence.Pilots.DapperPilotScorecardMetricsReader` | `ArchLucid.Persistence\Pilots\DapperPilotScorecardMetricsReader.cs` | 0.00 | 44 | No |
| 81 | `ArchLucid.Persistence.Pilots.InMemoryPilotBaselineRepository` | `ArchLucid.Persistence\Pilots\InMemoryPilotBaselineRepository.cs` | 0.00 | 13 | No |
| 82 | `ArchLucid.Persistence.Pilots.InMemoryPilotCloseoutRepository` | `ArchLucid.Persistence\Pilots\InMemoryPilotCloseoutRepository.cs` | 0.00 | 2 | No |
| 83 | `ArchLucid.Persistence.Pilots.NullPilotReportCardMetricsReader` | `ArchLucid.Persistence\Pilots\NullPilotReportCardMetricsReader.cs` | 0.00 | 6 | No |
| 84 | `ArchLucid.Persistence.Pilots.PilotBaselineRecord` | `ArchLucid.Persistence\Pilots\PilotBaselineRecord.cs` | 0.00 | 10 | No |
| 85 | `ArchLucid.Persistence.Provenance.ProvenanceQueryService` | `ArchLucid.Persistence\Provenance\ProvenanceQueryService.cs` | 0.00 | 38 | No |
| 86 | `ArchLucid.Persistence.Queries.DapperArtifactQueryService` | `ArchLucid.Persistence\Queries\DapperArtifactQueryService.cs` | 0.00 | 16 | No |
| 87 | `ArchLucid.Persistence.Queries.InMemoryArtifactQueryService` | `ArchLucid.Persistence\Queries\InMemoryArtifactQueryService.cs` | 0.00 | 16 | No |
| 88 | `ArchLucid.Persistence.Repositories.CachingGoldenManifestRepository` | `ArchLucid.Persistence\Repositories\CachingGoldenManifestRepository.cs` | 0.00 | 30 | No |
| 89 | `ArchLucid.Persistence.Repositories.InMemoryReferenceEvidenceRunLookup` | `ArchLucid.Persistence\Repositories\InMemoryReferenceEvidenceRunLookup.cs` | 0.00 | 1 | No |
| 90 | `ArchLucid.Persistence.Repositories.LlmCostEstimationUsdRateOverrideCache` | `ArchLucid.Persistence\Repositories\LlmCostEstimationUsdRateOverrideCache.cs` | 0.00 | 14 | No |
| 91 | `ArchLucid.Persistence.Repositories.SqlLlmCostEstimationUsdRateOverrideRepository` | `ArchLucid.Persistence\Repositories\SqlLlmCostEstimationUsdRateOverrideRepository.cs` | 0.00 | 20 | No |
| 92 | `ArchLucid.Persistence.Scim.DapperScimGroupRepository` | `ArchLucid.Persistence\Scim\DapperScimGroupRepository.cs` | 0.00 | 73 | No |
| 93 | `ArchLucid.Persistence.Scim.DapperScimTenantTokenRepository` | `ArchLucid.Persistence\Scim\DapperScimTenantTokenRepository.cs` | 0.00 | 58 | No |
| 94 | `ArchLucid.Persistence.Scim.DapperScimUserRepository` | `ArchLucid.Persistence\Scim\DapperScimUserRepository.cs` | 0.00 | 149 | No |
| 95 | `ArchLucid.Persistence.Scim.SqlScimUserFilterTranslator` | `ArchLucid.Persistence\Scim\SqlScimUserFilterTranslator.cs` | 0.00 | 62 | No |
| 96 | `ArchLucid.Persistence.Telemetry.FirstTenantFunnelArchiveRow` | `ArchLucid.Persistence\Telemetry\FirstTenantFunnelArchiveRow.cs` | 0.00 | 8 | No |
| 97 | `ArchLucid.Persistence.Telemetry.NoOpFirstTenantFunnelArchivalBatchStore` | `ArchLucid.Persistence\Telemetry\NoOpFirstTenantFunnelArchivalBatchStore.cs` | 0.00 | 2 | No |
| 98 | `ArchLucid.Persistence.Telemetry.NoopFirstTenantFunnelEventStore` | `ArchLucid.Persistence\Telemetry\NoopFirstTenantFunnelEventStore.cs` | 0.00 | 1 | No |
| 99 | `ArchLucid.Persistence.Tenancy.DapperTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\DapperTenantTrialEmailContactLookup.cs` | 0.00 | 11 | No |
| 100 | `ArchLucid.Persistence.Tenancy.DapperUsageEventRepository` | `ArchLucid.Persistence\Tenancy\DapperUsageEventRepository.cs` | 0.00 | 122 | No |
| 101 | `ArchLucid.Persistence.Tenancy.Diagnostics.DapperTrialFunnelOperationalMetricsReader` | `ArchLucid.Persistence\Tenancy\Diagnostics\DapperTrialFunnelOperationalMetricsReader.cs` | 0.00 | 11 | No |
| 102 | `ArchLucid.Persistence.Tenancy.Diagnostics.InMemoryTrialFunnelOperationalMetricsReader` | `ArchLucid.Persistence\Tenancy\Diagnostics\InMemoryTrialFunnelOperationalMetricsReader.cs` | 0.00 | 1 | No |
| 103 | `ArchLucid.Persistence.Tenancy.InMemoryTenantFirstValueReportBrandingRepository` | `ArchLucid.Persistence\Tenancy\InMemoryTenantFirstValueReportBrandingRepository.cs` | 0.00 | 2 | No |
| 104 | `ArchLucid.Persistence.Tenancy.NoOpArchitectureProjectRetentionPurgeService` | `ArchLucid.Persistence\Tenancy\NoOpArchitectureProjectRetentionPurgeService.cs` | 0.00 | 1 | No |
| 105 | `ArchLucid.Persistence.Tenancy.NoOpTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\NoOpTenantHardPurgeService.cs` | 0.00 | 1 | No |
| 106 | `ArchLucid.Persistence.Tenancy.NullTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\NullTenantTrialEmailContactLookup.cs` | 0.00 | 1 | No |
| 107 | `ArchLucid.Persistence.Tenancy.SqlArchitectureProjectRetentionPurgeRow` | `ArchLucid.Persistence\Tenancy\SqlArchitectureProjectRetentionPurgeRow.cs` | 0.00 | 6 | No |
| 108 | `ArchLucid.Persistence.Tenancy.SqlArchitectureProjectRetentionPurgeService` | `ArchLucid.Persistence\Tenancy\SqlArchitectureProjectRetentionPurgeService.cs` | 0.00 | 50 | No |
| 109 | `ArchLucid.Persistence.Tenancy.SqlFirstSessionLifecycleHook` | `ArchLucid.Persistence\Tenancy\SqlFirstSessionLifecycleHook.cs` | 0.00 | 11 | No |
| 110 | `ArchLucid.Persistence.Tenancy.SqlTenantOnboardingStateRepository` | `ArchLucid.Persistence\Tenancy\SqlTenantOnboardingStateRepository.cs` | 0.00 | 8 | No |
| 111 | `ArchLucid.Persistence.Tenancy.SqlTenantSqlCatalogProvisioner` | `ArchLucid.Persistence\Tenancy\SqlTenantSqlCatalogProvisioner.cs` | 0.00 | 112 | No |
| 112 | `ArchLucid.Persistence.Tenancy.TenantFirstValueReportBrandingRow` | `ArchLucid.Persistence\Tenancy\ITenantFirstValueReportBrandingRepository.cs` | 0.00 | 1 | No |
| 113 | `ArchLucid.Persistence.Tenancy.UsageMeterKindSql` | `ArchLucid.Persistence\Tenancy\UsageMeterKindSql.cs` | 0.00 | 20 | No |
| 114 | `ArchLucid.Persistence.Transactions.InMemoryArchLucidUnitOfWork` | `ArchLucid.Persistence\Transactions\InMemoryArchLucidUnitOfWork.cs` | 0.00 | 6 | No |
| 115 | `ArchLucid.Persistence.Transactions.InMemoryArchLucidUnitOfWorkFactory` | `ArchLucid.Persistence\Transactions\InMemoryArchLucidUnitOfWorkFactory.cs` | 0.00 | 1 | No |
| 116 | `ArchLucid.Persistence.Value.DapperValueReportMetricsReader` | `ArchLucid.Persistence\Value\DapperValueReportMetricsReader.cs` | 0.00 | 81 | No |
| 117 | `ArchLucid.Persistence.WeeklyDigest.DapperWeeklyArchitectureCriticalFindingSummaryRepository` | `ArchLucid.Persistence\WeeklyDigest\DapperWeeklyArchitectureCriticalFindingSummaryRepository.cs` | 0.00 | 52 | No |
| 118 | `ArchLucid.Persistence.Tenancy.InMemoryUsageEventRepository` | `ArchLucid.Persistence\Tenancy\InMemoryUsageEventRepository.cs` | 3.57 | 27 | No |
| 119 | `ArchLucid.Persistence.Coordination.Compare.AuthorityCompareService` | `ArchLucid.Persistence\Coordination\Compare\AuthorityCompareService.cs` | 15.74 | 166 | No |
| 120 | `ArchLucid.Persistence.Billing.AzureMarketplace.MicrosoftMarketplaceJwtVerifier` | `ArchLucid.Persistence\Billing\AzureMarketplace\MicrosoftMarketplaceJwtVerifier.cs` | 25.71 | 26 | No |
| 121 | `ArchLucid.Persistence.Coordination.Diagnostics.OutboxOperationalMetricsSnapshot` | `ArchLucid.Persistence\Coordination\Diagnostics\OutboxOperationalMetricsSnapshot.cs` | 31.25 | 11 | No |
| 122 | `ArchLucid.Persistence.Data.Repositories.ComparisonRecordSearchPredicateBuilder` | `ArchLucid.Persistence\Data\Repositories\ComparisonRecordSearchPredicateBuilder.cs` | 31.58 | 26 | No |
| 123 | `ArchLucid.Persistence.AzureExtractorChunkUpload.AzureExtractorChunkUploadOptions` | `ArchLucid.Persistence\AzureExtractorChunkUpload\AzureExtractorChunkUploadOptions.cs` | 33.33 | 10 | No |
| 124 | `ArchLucid.Persistence.Metering.UsageMeteringService` | `ArchLucid.Persistence\Metering\UsageMeteringService.cs` | 33.33 | 14 | No |
| 125 | `ArchLucid.Persistence.Alerts.Simulation.AlertSimulationContextProvider` | `ArchLucid.Persistence\Alerts\Simulation\AlertSimulationContextProvider.cs` | 33.75 | 53 | No |
| 126 | `ArchLucid.Persistence.Repositories.GraphSnapshotStorageMapper` | `ArchLucid.Persistence\Repositories\GraphSnapshotStorageMapper.cs` | 39.29 | 17 | No |
| 127 | `ArchLucid.Persistence.Coordination.Compare.ManifestComparisonResult` | `ArchLucid.Persistence\Coordination\Compare\ManifestComparisonResult.cs` | 42.86 | 8 | No |
| 128 | `ArchLucid.Persistence.BlobStore.InMemoryArtifactBlobStore` | `ArchLucid.Persistence\BlobStore\InMemoryArtifactBlobStore.cs` | 44.44 | 5 | No |
| 129 | `ArchLucid.Persistence.Tenancy.InMemoryArchitectureProjectRepository` | `ArchLucid.Persistence\Tenancy\InMemoryArchitectureProjectRepository.cs` | 44.90 | 27 | No |
| 130 | `ArchLucid.Persistence.Data.Infrastructure.StructuralExecutionModeTypeHandler` | `ArchLucid.Persistence\Data\Infrastructure\StructuralExecutionModeTypeHandler.cs` | 45.45 | 6 | No |
| 131 | `ArchLucid.Persistence.Repositories.CachingRunRepository` | `ArchLucid.Persistence\Repositories\CachingRunRepository.cs` | 46.43 | 45 | No |
| 132 | `ArchLucid.Persistence.Queries.RunExecutionDegradation` | `ArchLucid.Persistence\Queries\RunExecutionDegradation.cs` | 48.57 | 18 | No |
| 133 | `ArchLucid.Persistence.Billing.AzureMarketplace.AzureMarketplaceBillingProvider` | `ArchLucid.Persistence\Billing\AzureMarketplace\AzureMarketplaceBillingProvider.cs` | 49.74 | 95 | No |
| 134 | `ArchLucid.Persistence.BlobStore.ArtifactBundlePersistContext` | `ArchLucid.Persistence\BlobStore\ArtifactBundlePersistContext.cs` | 50.00 | 1 | No |
| 135 | `ArchLucid.Persistence.Data.Repositories.NoOpAzureExtractorPackageRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpAzureExtractorPackageRepository.cs` | 50.00 | 1 | No |
| 136 | `ArchLucid.Persistence.Models.AzureExtractorPackageProvenance` | `ArchLucid.Persistence\Models\AzureExtractorPackageProvenance.cs` | 52.00 | 12 | No |
| 137 | `ArchLucid.Persistence.Billing.Stripe.StripeBillingProvider` | `ArchLucid.Persistence\Billing\Stripe\StripeBillingProvider.cs` | 53.75 | 74 | No |
| 138 | `ArchLucid.Persistence.Repositories.InMemoryRunRepository` | `ArchLucid.Persistence\Repositories\InMemoryRunRepository.cs` | 62.18 | 73 | No |
| 139 | `ArchLucid.Persistence.Models.AzureExtractorPackageRecord` | `ArchLucid.Persistence\Models\AzureExtractorPackageRecord.cs` | 65.52 | 10 | No |
| 140 | `ArchLucid.Persistence.Queries.DapperAuthorityQueryService` | `ArchLucid.Persistence\Queries\DapperAuthorityQueryService.cs` | 65.56 | 31 | No |
| 141 | `ArchLucid.Persistence.Orchestration.AuthorityPipelineWorkOutboxEntry` | `ArchLucid.Persistence\Orchestration\AuthorityPipelineWorkOutboxEntry.cs` | 68.00 | 8 | No |
| 142 | `ArchLucid.Persistence.BlobStore.ArtifactBlobTenantPaths` | `ArchLucid.Persistence\BlobStore\ArtifactBlobTenantPaths.cs` | 68.09 | 15 | No |
| 143 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningOpportunityScoring` | `ArchLucid.Persistence\Coordination\ProductLearning\ProductLearningOpportunityScoring.cs` | 68.18 | 21 | No |
| 144 | `ArchLucid.Persistence.Connections.SqlOpenResilienceDefaults` | `ArchLucid.Persistence\Connections\SqlOpenResilienceDefaults.cs` | 68.75 | 10 | No |
| 145 | `ArchLucid.Persistence.Governance.SqlExternalConnection` | `ArchLucid.Persistence\Governance\SqlExternalConnection.cs` | 69.23 | 4 | No |
| 146 | `ArchLucid.Persistence.Queries.InMemoryAuthorityQueryService` | `ArchLucid.Persistence\Queries\InMemoryAuthorityQueryService.cs` | 69.41 | 26 | No |
| 147 | `ArchLucid.Persistence.BlobStore.LocalFileArtifactBlobStore` | `ArchLucid.Persistence\BlobStore\LocalFileArtifactBlobStore.cs` | 69.70 | 20 | No |
| 148 | `ArchLucid.Persistence.Reads.UnifiedGoldenManifestReader` | `ArchLucid.Persistence\Reads\UnifiedGoldenManifestReader.cs` | 72.86 | 19 | No |
| 149 | `ArchLucid.Persistence.Connections.ResilientSqlConnectionFactory` | `ArchLucid.Persistence\Connections\ResilientSqlConnectionFactory.cs` | 73.68 | 5 | No |
| 150 | `ArchLucid.Persistence.Models.ImportedArchitectureRequestRecord` | `ArchLucid.Persistence\Models\ImportedArchitectureRequestRecord.cs` | 73.68 | 5 | No |
| 151 | `ArchLucid.Persistence.Integrations.TenantItsmOutboundSettings` | `ArchLucid.Persistence\Integrations\TenantItsmOutboundSettings.cs` | 75.00 | 2 | No |
| 152 | `ArchLucid.Persistence.Archival.DataArchivalOptions` | `ArchLucid.Persistence\Archival\DataArchivalOptions.cs` | 76.19 | 5 | No |
| 153 | `ArchLucid.Persistence.Queries.RunDetailDto` | `ArchLucid.Persistence\Queries\RunDetailDto.cs` | 76.19 | 5 | No |
| 154 | `ArchLucid.Persistence.BlobStore.ArtifactLargePayloadOptions` | `ArchLucid.Persistence\BlobStore\ArtifactLargePayloadOptions.cs` | 76.47 | 4 | No |
| 155 | `ArchLucid.Persistence.Tenancy.DapperTenantDatabaseBindingRepository` | `ArchLucid.Persistence\Tenancy\DapperTenantDatabaseBindingRepository.cs` | 78.65 | 19 | No |
| 156 | `ArchLucid.Persistence.Identity.SqlTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\SqlTrialIdentityUserRepository.cs` | 78.67 | 16 | No |
| 157 | `ArchLucid.Persistence.Queries.RunSummaryDto` | `ArchLucid.Persistence\Queries\RunSummaryDto.cs` | 78.79 | 7 | No |
| 158 | `ArchLucid.Persistence.Findings.FindingPayloadJsonCodec` | `ArchLucid.Persistence\Findings\FindingPayloadJsonCodec.cs` | 78.95 | 4 | No |
| 159 | `ArchLucid.Persistence.Caching.HybridHotPathReadCache` | `ArchLucid.Persistence\Caching\HybridHotPathReadCache.cs` | 79.31 | 12 | No |
| 160 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentEvaluationRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentEvaluationRepository.cs` | 80.77 | 5 | No |
| 161 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningTriageReportBuilder` | `ArchLucid.Persistence\Coordination\ProductLearning\ProductLearningTriageReportBuilder.cs` | 81.31 | 20 | No |
| 162 | `ArchLucid.Persistence.Data.Infrastructure.GreenfieldBaselineMigrationRunner` | `ArchLucid.Persistence\Data\Infrastructure\GreenfieldBaselineMigrationRunner.cs` | 81.73 | 38 | No |
| 163 | `ArchLucid.Persistence.Tenancy.TenantDatabaseResolver` | `ArchLucid.Persistence\Tenancy\TenantDatabaseResolver.cs` | 81.82 | 6 | No |
| 164 | `ArchLucid.Persistence.Orchestration.AuthorityRunOrchestrator` | `ArchLucid.Persistence\Orchestration\AuthorityRunOrchestrator.cs` | 82.05 | 63 | No |
| 165 | `ArchLucid.Persistence.Archival.DataArchivalCoordinator` | `ArchLucid.Persistence\Archival\DataArchivalCoordinator.cs` | 82.42 | 16 | No |
| 166 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningPlanningRepositoryValidation` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\ProductLearningPlanningRepositoryValidation.cs` | 84.68 | 19 | No |
| 167 | `ArchLucid.Persistence.Data.Repositories.InMemoryLlmTenantBudgetRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryLlmTenantBudgetRepository.cs` | 84.96 | 20 | No |
| 168 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationServicesEmailProvider` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationServicesEmailProvider.cs` | 85.19 | 4 | No |
| 169 | `ArchLucid.Persistence.Tenancy.InMemoryTenantRepository` | `ArchLucid.Persistence\Tenancy\InMemoryTenantRepository.cs` | 85.49 | 84 | No |
| 170 | `ArchLucid.Persistence.Tenancy.TenantTierSql` | `ArchLucid.Persistence\Tenancy\TenantTierSql.cs` | 85.71 | 2 | No |
| 171 | `ArchLucid.Persistence.Orchestration.InMemoryAuthorityPipelineWorkRepository` | `ArchLucid.Persistence\Orchestration\InMemoryAuthorityPipelineWorkRepository.cs` | 86.11 | 15 | No |
| 172 | `ArchLucid.Persistence.Data.Repositories.InMemoryComparisonRecordRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryComparisonRecordRepository.cs` | 86.36 | 24 | No |
| 173 | `ArchLucid.Persistence.Findings.FindingsSnapshotRelationalRead` | `ArchLucid.Persistence\Findings\FindingsSnapshotRelationalRead.cs` | 86.67 | 32 | No |
| 174 | `ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineStagesExecutor` | `ArchLucid.Persistence\Orchestration\Pipeline\AuthorityPipelineStagesExecutor.cs` | 87.04 | 46 | No |
| 175 | `ArchLucid.Persistence.Connections.ReadReplicaRoutedConnectionFactory` | `ArchLucid.Persistence\Connections\ReadReplicaRoutedConnectionFactory.cs` | 87.50 | 2 | No |
| 176 | `ArchLucid.Persistence.Connections.SqlReadReplicaConnectionStringResolver` | `ArchLucid.Persistence\Connections\SqlReadReplicaConnectionStringResolver.cs` | 87.50 | 2 | No |
| 177 | `ArchLucid.Persistence.Scim.InMemoryScimTenantTokenRepository` | `ArchLucid.Persistence\Scim\InMemoryScimTenantTokenRepository.cs` | 87.80 | 5 | No |
| 178 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentResultRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentResultRepository.cs` | 88.57 | 4 | No |
| 179 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.InMemoryProductLearningPlanningRepository` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\InMemoryProductLearningPlanningRepository.cs` | 89.55 | 23 | No |
| 180 | `ArchLucid.Persistence.Audit.InMemoryAuditRepository` | `ArchLucid.Persistence\Audit\InMemoryAuditRepository.cs` | 89.55 | 7 | No |
| 181 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.LearningPlanningReportMarkdownFormatter` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\LearningPlanningReportMarkdownFormatter.cs` | 89.66 | 9 | No |
| 182 | `ArchLucid.Persistence.Connections.ScopedRoutingSqlConnectionFactory` | `ArchLucid.Persistence\Connections\ScopedRoutingSqlConnectionFactory.cs` | 90.00 | 3 | No |
| 183 | `ArchLucid.Persistence.Models.FindingReviewEventRecord` | `ArchLucid.Persistence\Models\FindingReviewEventRecord.cs` | 90.00 | 2 | No |
| 184 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentExecutionTraceRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentExecutionTraceRepository.cs` | 90.41 | 14 | No |
| 185 | `ArchLucid.Persistence.Data.Infrastructure.MigrationCatalogMutexScope` | `ArchLucid.Persistence\Data\Infrastructure\MigrationCatalogMutexScope.cs` | 90.91 | 3 | No |
| 186 | `ArchLucid.Persistence.Repositories.RunRepositoryCommittedArchitectureReviewFlagReader` | `ArchLucid.Persistence\Repositories\RunRepositoryCommittedArchitectureReviewFlagReader.cs` | 90.91 | 1 | No |
| 187 | `ArchLucid.Persistence.BlobStore.LargePayloadOffloadEvaluator` | `ArchLucid.Persistence\BlobStore\LargePayloadOffloadEvaluator.cs` | 91.67 | 1 | No |
| 188 | `ArchLucid.Persistence.Coordination.Retrieval.RetrievalIndexingOutboxEntry` | `ArchLucid.Persistence\Coordination\Retrieval\RetrievalIndexingOutboxEntry.cs` | 91.67 | 1 | No |
| 189 | `ArchLucid.Persistence.Data.Repositories.InMemoryDecisionNodeRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryDecisionNodeRepository.cs` | 91.67 | 2 | No |
| 190 | `ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineContext` | `ArchLucid.Persistence\Orchestration\Pipeline\AuthorityPipelineContext.cs` | 92.31 | 2 | No |
| 191 | `ArchLucid.Persistence.Data.Repositories.InMemoryArchitectureRequestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryArchitectureRequestRepository.cs` | 92.86 | 1 | No |
| 192 | `ArchLucid.Persistence.Governance.InMemoryPolicyPackChangeLogRepository` | `ArchLucid.Persistence\Governance\InMemoryPolicyPackChangeLogRepository.cs` | 92.86 | 4 | No |
| 193 | `ArchLucid.Persistence.Data.Infrastructure.DatabaseMigrator` | `ArchLucid.Persistence\Data\Infrastructure\DatabaseMigrator.cs` | 93.10 | 6 | No |
| 194 | `ArchLucid.Persistence.Serialization.GraphEdgeJsonConverter` | `ArchLucid.Persistence\Serialization\GraphEdgeJsonConverter.cs` | 93.10 | 4 | No |
| 195 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningTriageReportLimits` | `ArchLucid.Persistence\Coordination\ProductLearning\ProductLearningTriageReportLimits.cs` | 93.33 | 1 | No |
| 196 | `ArchLucid.Persistence.Data.Repositories.ComparisonRecordRunIdSql` | `ArchLucid.Persistence\Data\Repositories\ComparisonRecordRunIdSql.cs` | 93.33 | 1 | No |
| 197 | `ArchLucid.Persistence.Data.Repositories.InMemoryRunExportRecordRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryRunExportRecordRepository.cs` | 93.55 | 2 | No |
| 198 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.LearningPlanningReportBuilder` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\LearningPlanningReportBuilder.cs` | 93.64 | 7 | No |
| 199 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningPlanningJsonSerializer` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\ProductLearningPlanningJsonSerializer.cs` | 93.75 | 1 | No |
| 200 | `ArchLucid.Persistence.Data.Infrastructure.RepositoryRunIdPredicate` | `ArchLucid.Persistence\Data\Infrastructure\RepositoryRunIdPredicate.cs` | 93.75 | 1 | No |
| 201 | `ArchLucid.Persistence.Alerts.InMemoryAlertRuleRepository` | `ArchLucid.Persistence\Alerts\InMemoryAlertRuleRepository.cs` | 93.94 | 2 | No |
| 202 | `ArchLucid.Persistence.Conversation.InMemoryConversationMessageRepository` | `ArchLucid.Persistence\Conversation\InMemoryConversationMessageRepository.cs` | 94.74 | 1 | No |
| 203 | `ArchLucid.Persistence.Tenancy.SqlTrialFunnelCommitHook` | `ArchLucid.Persistence\Tenancy\SqlTrialFunnelCommitHook.cs` | 94.74 | 2 | No |
| 204 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningPlanningDerivationService` | `ArchLucid.Persistence\Coordination\ProductLearning\Planning\ProductLearningPlanningDerivationService.cs` | 94.83 | 12 | No |

### ArchLucid.Cli (69.49% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Cli.Commands.DataConsistencyCommand` | `ArchLucid.Cli\Commands\DataConsistencyCommand.cs` | 0.00 | 76 | No |
| 2 | `ArchLucid.Cli.Commands.DeploymentEvidenceGitReader` | `ArchLucid.Cli\Commands\DeploymentEvidenceGitReader.cs` | 0.00 | 26 | No |
| 3 | `ArchLucid.Cli.Commands.DeploymentEvidenceRepositoryRootResolver` | `ArchLucid.Cli\Commands\DeploymentEvidenceRepositoryRootResolver.cs` | 0.00 | 16 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Cli.Commands.DataConsistencyCommand` | `ArchLucid.Cli\Commands\DataConsistencyCommand.cs` | 0.00 | 76 | No |
| 2 | `ArchLucid.Cli.Commands.DeploymentEvidenceGitReader` | `ArchLucid.Cli\Commands\DeploymentEvidenceGitReader.cs` | 0.00 | 26 | No |
| 3 | `ArchLucid.Cli.Commands.DeploymentEvidenceRepositoryRootResolver` | `ArchLucid.Cli\Commands\DeploymentEvidenceRepositoryRootResolver.cs` | 0.00 | 16 | No |
| 4 | `ArchLucid.Cli.Commands.DeploymentEvidenceTriageCatalog` | `ArchLucid.Cli\Commands\DeploymentEvidenceTriageCatalog.cs` | 0.00 | 34 | No |
| 5 | `ArchLucid.Cli.Commands.FirstValueReportCommand` | `ArchLucid.Cli\Commands\FirstValueReportCommand.cs` | 0.00 | 36 | No |
| 6 | `ArchLucid.Cli.Commands.GraphEdgeWire` | `ArchLucid.Cli\Commands\GraphEdgeWire.cs` | 0.00 | 9 | No |
| 7 | `ArchLucid.Cli.Commands.GraphNodeWire` | `ArchLucid.Cli\Commands\GraphNodeWire.cs` | 0.00 | 9 | No |
| 8 | `ArchLucid.Cli.Commands.GraphWireMermaidFormatter` | `ArchLucid.Cli\Commands\GraphWireMermaidFormatter.cs` | 0.00 | 47 | No |
| 9 | `ArchLucid.Cli.Commands.GraphWireModel` | `ArchLucid.Cli\Commands\GraphWireModel.cs` | 0.00 | 6 | No |
| 10 | `ArchLucid.Cli.Commands.SecondRunCommand` | `ArchLucid.Cli\Commands\SecondRunCommand.cs` | 0.00 | 132 | No |
| 11 | `ArchLucid.Cli.Commands.SecondRunCommandOptions` | `ArchLucid.Cli\Commands\SecondRunCommandOptions.cs` | 0.00 | 82 | No |
| 12 | `ArchLucid.Cli.Commands.SecondRunDiagnostics` | `ArchLucid.Cli\Commands\SecondRunDiagnostics.cs` | 0.00 | 30 | No |
| 13 | `ArchLucid.Cli.Commands.SponsorOnePagerCommand` | `ArchLucid.Cli\Commands\SponsorOnePagerCommand.cs` | 0.00 | 41 | No |
| 14 | `ArchLucid.Cli.Diagnostics.DoctorLocalConfiguration` | `ArchLucid.Cli\Diagnostics\DoctorLocalConfiguration.cs` | 0.00 | 10 | No |
| 15 | `ArchLucid.Cli.Diagnostics.SqlConnectionStringSecurity` | `ArchLucid.Cli\Diagnostics\SqlConnectionStringSecurity.cs` | 0.00 | 7 | No |
| 16 | `ArchLucid.Cli.Commands.ReferenceEvidenceCommand` | `ArchLucid.Cli\Commands\ReferenceEvidenceCommand.cs` | 23.20 | 96 | No |
| 17 | `ArchLucid.Cli.Commands.AzureTerraformExportCommand` | `ArchLucid.Cli\Commands\AzureTerraformExportCommand.cs` | 33.33 | 66 | No |
| 18 | `ArchLucid.Cli.JsonPointerLineLocator` | `ArchLucid.Cli\JsonPointerLineLocator.cs` | 40.74 | 16 | No |
| 19 | `ArchLucid.Cli.Diagnostics.DoctorQuickStartReadiness` | `ArchLucid.Cli\Diagnostics\DoctorQuickStartReadiness.cs` | 40.81 | 161 | No |
| 20 | `ArchLucid.Cli.Commands.TraceCommand` | `ArchLucid.Cli\Commands\TraceCommand.cs` | 46.55 | 31 | No |
| 21 | `ArchLucid.Cli.Diagnostics.DoctorKeyVaultProbe` | `ArchLucid.Cli\Diagnostics\DoctorKeyVaultProbe.cs` | 48.04 | 53 | No |
| 22 | `ArchLucid.Cli.Commands.DeploymentEvidenceProbeRunner` | `ArchLucid.Cli\Commands\DeploymentEvidenceProbeRunner.cs` | 48.06 | 107 | No |
| 23 | `ArchLucid.Cli.Commands.ValidateConfigEvaluator` | `ArchLucid.Cli\Commands\ValidateConfigEvaluator.cs` | 48.25 | 163 | No |
| 24 | `ArchLucid.Cli.Commands.TryCommand` | `ArchLucid.Cli\Commands\TryCommand.cs` | 55.17 | 104 | No |
| 25 | `ArchLucid.Cli.Commands.RoiBulletinPreviewPayload` | `ArchLucid.Cli\Commands\RoiBulletinPreviewPayload.cs` | 55.56 | 8 | No |
| 26 | `ArchLucid.Cli.Commands.ComplianceReportAuditLiveSampleFetcher` | `ArchLucid.Cli\Commands\ComplianceReportAuditLiveSampleFetcher.cs` | 58.06 | 26 | No |
| 27 | `ArchLucid.Cli.AzureAccessTokenJwtClaimsReader` | `ArchLucid.Cli\AzureAccessTokenJwtClaimsReader.cs` | 61.29 | 12 | No |
| 28 | `ArchLucid.Cli.Commands.SecurityTrustPublishCommandOptions` | `ArchLucid.Cli\Commands\SecurityTrustPublishCommandOptions.cs` | 64.63 | 29 | No |
| 29 | `ArchLucid.Cli.GoldenManifestOfflineSchemaValidator` | `ArchLucid.Cli\GoldenManifestOfflineSchemaValidator.cs` | 64.77 | 31 | No |
| 30 | `ArchLucid.Cli.Commands.ManifestValidateCommand` | `ArchLucid.Cli\Commands\ManifestValidateCommand.cs` | 65.62 | 33 | No |
| 31 | `ArchLucid.Cli.Commands.MockAzureMonthlyCostEstimator` | `ArchLucid.Cli\Commands\MockAzureMonthlyCostEstimator.cs` | 65.62 | 11 | No |
| 32 | `ArchLucid.Cli.Commands.RealLlmEvidenceSummarizeCommand` | `ArchLucid.Cli\Commands\RealLlmEvidenceSummarizeCommand.cs` | 66.29 | 30 | No |
| 33 | `ArchLucid.Cli.Commands.DeploymentEvidenceOptions` | `ArchLucid.Cli\Commands\DeploymentEvidenceOptions.cs` | 69.23 | 28 | No |
| 34 | `ArchLucid.Cli.Commands.AzureTokenTestCommand` | `ArchLucid.Cli\Commands\AzureTokenTestCommand.cs` | 69.86 | 22 | No |
| 35 | `ArchLucid.Cli.Commands.TrialSmokeRunner` | `ArchLucid.Cli\Commands\TrialSmokeRunner.cs` | 74.07 | 42 | No |
| 36 | `ArchLucid.Cli.CliJson` | `ArchLucid.Cli\CliJson.cs` | 75.00 | 2 | No |
| 37 | `ArchLucid.Cli.Commands.TrialSmokeTrialStatusResponse` | `ArchLucid.Cli\Commands\TrialSmokeTrialStatusResponse.cs` | 77.78 | 2 | No |
| 38 | `ArchLucid.Cli.Commands.ComplianceReportMarkdownComposer` | `ArchLucid.Cli\Commands\ComplianceReportMarkdownComposer.cs` | 78.57 | 15 | No |
| 39 | `ArchLucid.Cli.Commands.AzRolesCommand` | `ArchLucid.Cli\Commands\AzRolesCommand.cs` | 80.43 | 36 | No |
| 40 | `ArchLucid.Cli.Commands.ConfigBootstrapDocumentMerger` | `ArchLucid.Cli\Commands\ConfigBootstrapDocumentMerger.cs` | 81.48 | 5 | No |
| 41 | `ArchLucid.Cli.Commands.DemoCommand` | `ArchLucid.Cli\Commands\DemoCommand.cs` | 81.82 | 6 | No |
| 42 | `ArchLucid.Cli.Commands.CostEstimateCommand` | `ArchLucid.Cli\Commands\CostEstimateCommand.cs` | 81.88 | 25 | No |
| 43 | `ArchLucid.Cli.Commands.ComplianceReportRepositoryRootResolver` | `ArchLucid.Cli\Commands\ComplianceReportRepositoryRootResolver.cs` | 83.33 | 3 | No |
| 44 | `ArchLucid.Cli.SecondRun.SecondRunInputParser` | `ArchLucid.Cli\SecondRun\SecondRunInputParser.cs` | 83.57 | 23 | No |
| 45 | `ArchLucid.Cli.Commands.AzureOpenAiBootstrapConnectivityProbe` | `ArchLucid.Cli\Commands\AzureOpenAiBootstrapConnectivityProbe.cs` | 85.19 | 4 | No |
| 46 | `ArchLucid.Cli.Support.SupportBundleLogsSection` | `ArchLucid.Cli\Support\SupportBundleLogsSection.cs` | 85.71 | 1 | No |
| 47 | `ArchLucid.Cli.ArchLucidProjectScaffolder` | `ArchLucid.Cli\ArchLucidProjectScaffolder.cs` | 88.85 | 35 | No |
| 48 | `ArchLucid.Cli.Diagnostics.DoctorKeyVaultProbePlan` | `ArchLucid.Cli\Diagnostics\DoctorKeyVaultProbePlan.cs` | 88.89 | 1 | No |
| 49 | `ArchLucid.Cli.Support.SupportBundleCollector` | `ArchLucid.Cli\Support\SupportBundleCollector.cs` | 88.94 | 23 | No |
| 50 | `ArchLucid.Cli.Commands.ComplianceReportOptions` | `ArchLucid.Cli\Commands\ComplianceReportOptions.cs` | 89.47 | 4 | No |
| 51 | `ArchLucid.Cli.Commands.CliCommandShared` | `ArchLucid.Cli\Commands\CliCommandShared.cs` | 90.54 | 7 | No |
| 52 | `ArchLucid.Cli.Commands.TerraformExportZipWriter` | `ArchLucid.Cli\Commands\TerraformExportZipWriter.cs` | 91.67 | 2 | No |
| 53 | `ArchLucid.Cli.Commands.DeploymentEvidenceReportMarkdown` | `ArchLucid.Cli\Commands\DeploymentEvidenceReportMarkdown.cs` | 92.11 | 9 | No |
| 54 | `ArchLucid.Cli.Commands.TrialSmokeCommandOptions` | `ArchLucid.Cli\Commands\TrialSmokeCommandOptions.cs` | 94.34 | 6 | No |
| 55 | `ArchLucid.Cli.Commands.RoiBulletinCommandOptions` | `ArchLucid.Cli\Commands\RoiBulletinCommandOptions.cs` | 94.83 | 3 | No |

### ArchLucid.Host.Composition (72.64% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Composition.GoToMarket.InMemoryRoiBulletinAggregateReader` | `ArchLucid.Host.Composition\GoToMarket\InMemoryRoiBulletinAggregateReader.cs` | 0.00 | 8 | No |
| 2 | `ArchLucid.Host.Composition.ValueReports.InMemoryValueReportJobQueue` | `ArchLucid.Host.Composition\ValueReports\InMemoryValueReportJobQueue.cs` | 0.00 | 75 | No |
| 3 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CosmosPolyglotPersistence.cs` | 17.86 | 23 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Composition.GoToMarket.InMemoryRoiBulletinAggregateReader` | `ArchLucid.Host.Composition\GoToMarket\InMemoryRoiBulletinAggregateReader.cs` | 0.00 | 8 | No |
| 2 | `ArchLucid.Host.Composition.ValueReports.InMemoryValueReportJobQueue` | `ArchLucid.Host.Composition\ValueReports\InMemoryValueReportJobQueue.cs` | 0.00 | 75 | No |
| 3 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CosmosPolyglotPersistence.cs` | 17.86 | 23 | No |
| 4 | `ArchLucid.Host.Composition.Configuration.ArchLucidStorageServiceCollectionExtensions` | `ArchLucid.Host.Composition\Configuration\ArchLucidStorageServiceCollectionExtensions.cs` | 54.21 | 98 | No |
| 5 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.SchemaValidation.cs` | 57.14 | 3 | No |
| 6 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` | 59.73 | 331 | No |
| 7 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.DataHealthAndJobs.cs` | 68.81 | 34 | No |
| 8 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.AzureArmHttpClients.cs` | 74.19 | 8 | No |
| 9 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.TenancyMeteringSecrets.cs` | 77.50 | 9 | No |
| 10 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.SchedulingAndAlerts.cs` | 85.92 | 20 | No |
| 11 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CoordinatorAndArtifacts.cs` | 93.07 | 7 | No |
| 12 | `ArchLucid.Host.Composition.Configuration.SqlStorageProviderRegistrar` | `ArchLucid.Host.Composition\Configuration\SqlStorageProviderRegistrar.cs` | 94.42 | 11 | No |

### ArchLucid.AgentRuntime (72.96% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentRuntime.AgentModelTierResolver` | `ArchLucid.AgentRuntime\AgentModelTierResolver.cs` | 0.00 | 28 | No |
| 2 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationAudit` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationAudit.cs` | 0.00 | 38 | No |
| 3 | `ArchLucid.AgentRuntime.AzureOpenAiCompletionClientCache` | `ArchLucid.AgentRuntime\AzureOpenAiCompletionClientCache.cs` | 0.00 | 17 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentRuntime.AgentModelTierResolver` | `ArchLucid.AgentRuntime\AgentModelTierResolver.cs` | 0.00 | 28 | No |
| 2 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationAudit` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationAudit.cs` | 0.00 | 38 | No |
| 3 | `ArchLucid.AgentRuntime.AzureOpenAiCompletionClientCache` | `ArchLucid.AgentRuntime\AzureOpenAiCompletionClientCache.cs` | 0.00 | 17 | No |
| 4 | `ArchLucid.AgentRuntime.DistributedLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\DistributedLlmCompletionResponseStore.cs` | 0.00 | 18 | No |
| 5 | `ArchLucid.AgentRuntime.Evaluation.AgentArchitectureFindingConfidenceEnricher` | `ArchLucid.AgentRuntime\Evaluation\AgentArchitectureFindingConfidenceEnricher.cs` | 0.00 | 77 | No |
| 6 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputTraceEvaluationHook` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputTraceEvaluationHook.cs` | 0.00 | 5 | No |
| 7 | `ArchLucid.AgentRuntime.Evaluation.CompositeAgentOutputSemanticEvaluator` | `ArchLucid.AgentRuntime\Evaluation\CompositeAgentOutputSemanticEvaluator.cs` | 0.00 | 47 | No |
| 8 | `ArchLucid.AgentRuntime.Evaluation.FindingConfidenceHarnessExtensions` | `ArchLucid.AgentRuntime\Evaluation\FindingConfidenceHarnessExtensions.cs` | 0.00 | 2 | No |
| 9 | `ArchLucid.AgentRuntime.Evaluation.FindingsSnapshotEvaluationConfidenceEnricher` | `ArchLucid.AgentRuntime\Evaluation\FindingsSnapshotEvaluationConfidenceEnricher.cs` | 0.00 | 80 | No |
| 10 | `ArchLucid.AgentRuntime.Evaluation.RunAgentOutputPilotEvidenceAggregator` | `ArchLucid.AgentRuntime\Evaluation\RunAgentOutputPilotEvidenceAggregator.cs` | 0.00 | 47 | No |
| 11 | `ArchLucid.AgentRuntime.PassThroughAgentTierCompletionRouter` | `ArchLucid.AgentRuntime\PassThroughAgentTierCompletionRouter.cs` | 0.00 | 10 | No |
| 12 | `ArchLucid.AgentRuntime.QuickScan.FakeQuickScanCompletionJson` | `ArchLucid.AgentRuntime\QuickScan\FakeQuickScanCompletionJson.cs` | 0.00 | 69 | No |
| 13 | `ArchLucid.AgentRuntime.QuickScan.QuickScanService` | `ArchLucid.AgentRuntime\QuickScan\QuickScanService.cs` | 0.00 | 65 | No |
| 14 | `ArchLucid.AgentRuntime.Safety.CircuitBreakingContentSafetyGuard` | `ArchLucid.AgentRuntime\Safety\CircuitBreakingContentSafetyGuard.cs` | 20.73 | 65 | No |
| 15 | `ArchLucid.AgentRuntime.CostGuardrailInterceptor` | `ArchLucid.AgentRuntime\CostGuardrailInterceptor.cs` | 25.93 | 20 | No |
| 16 | `ArchLucid.AgentRuntime.Safety.ContentSafetyEnforcingAgentCompletionClient` | `ArchLucid.AgentRuntime\Safety\ContentSafetyEnforcingAgentCompletionClient.cs` | 28.57 | 30 | No |
| 17 | `ArchLucid.AgentRuntime.AgentCompletionTokenUsage` | `ArchLucid.AgentRuntime\AgentCompletionTokenUsage.cs` | 30.00 | 14 | No |
| 18 | `ArchLucid.AgentRuntime.AgentPromptActivityTags` | `ArchLucid.AgentRuntime\AgentPromptActivityTags.cs` | 40.00 | 6 | No |
| 19 | `ArchLucid.AgentRuntime.Safety.ContentSafetyEnabledButUnconfiguredGuard` | `ArchLucid.AgentRuntime\Safety\ContentSafetyEnabledButUnconfiguredGuard.cs` | 50.00 | 1 | No |
| 20 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputLlmSemanticJudge` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputLlmSemanticJudge.cs` | 58.97 | 64 | No |
| 21 | `ArchLucid.AgentRuntime.Safety.AzureContentSafetyGuard` | `ArchLucid.AgentRuntime\Safety\AzureContentSafetyGuard.cs` | 60.42 | 19 | No |
| 22 | `ArchLucid.AgentRuntime.Prompts.AgentUserPromptBuilder` | `ArchLucid.AgentRuntime\Prompts\AgentUserPromptBuilder.cs` | 61.43 | 27 | No |
| 23 | `ArchLucid.AgentRuntime.Evaluation.ReferenceCases.AgentOutputReferenceCaseRunEvaluator` | `ArchLucid.AgentRuntime\Evaluation\ReferenceCases\AgentOutputReferenceCaseRunEvaluator.cs` | 61.76 | 52 | No |
| 24 | `ArchLucid.AgentRuntime.CriticAgentHandler` | `ArchLucid.AgentRuntime\CriticAgentHandler.cs` | 62.28 | 43 | No |
| 25 | `ArchLucid.AgentRuntime.LlmAgentSchemaCompletion` | `ArchLucid.AgentRuntime\LlmAgentSchemaCompletion.cs` | 65.22 | 24 | No |
| 26 | `ArchLucid.AgentRuntime.Evaluation.ReferenceCases.AgentOutputReferenceCaseCatalog` | `ArchLucid.AgentRuntime\Evaluation\ReferenceCases\AgentOutputReferenceCaseCatalog.cs` | 66.13 | 21 | No |
| 27 | `ArchLucid.AgentRuntime.AgentExecutionTraceStorageOptions` | `ArchLucid.AgentRuntime\AgentExecutionTraceStorageOptions.cs` | 66.67 | 1 | No |
| 28 | `ArchLucid.AgentRuntime.StagedPriorAgentsSummaryBuilder` | `ArchLucid.AgentRuntime\StagedPriorAgentsSummaryBuilder.cs` | 67.82 | 28 | No |
| 29 | `ArchLucid.AgentRuntime.LlmDailyTenantBudgetTracker` | `ArchLucid.AgentRuntime\LlmDailyTenantBudgetTracker.cs` | 68.05 | 54 | No |
| 30 | `ArchLucid.AgentRuntime.TopologyAgentHandler` | `ArchLucid.AgentRuntime\TopologyAgentHandler.cs` | 68.32 | 32 | No |
| 31 | `ArchLucid.AgentRuntime.ComplianceAgentHandler` | `ArchLucid.AgentRuntime\ComplianceAgentHandler.cs` | 69.23 | 32 | No |
| 32 | `ArchLucid.AgentRuntime.LlmMonthlyTenantDollarBudgetTracker` | `ArchLucid.AgentRuntime\LlmMonthlyTenantDollarBudgetTracker.cs` | 69.84 | 57 | No |
| 33 | `ArchLucid.AgentRuntime.Evaluation.HeuristicAgentOutputSemanticEvaluator` | `ArchLucid.AgentRuntime\Evaluation\HeuristicAgentOutputSemanticEvaluator.cs` | 70.00 | 54 | No |
| 34 | `ArchLucid.AgentRuntime.AzureOpenAiTooManyRequestsRetry` | `ArchLucid.AgentRuntime\AzureOpenAiTooManyRequestsRetry.cs` | 70.45 | 13 | No |
| 35 | `ArchLucid.AgentRuntime.Evaluation.AgentResultEmbeddingFaithfulnessScorer` | `ArchLucid.AgentRuntime\Evaluation\AgentResultEmbeddingFaithfulnessScorer.cs` | 71.28 | 27 | No |
| 36 | `ArchLucid.AgentRuntime.AgentHandlerExecutionFailureReason` | `ArchLucid.AgentRuntime\AgentHandlerExecutionFailureReason.cs` | 71.43 | 2 | No |
| 37 | `ArchLucid.AgentRuntime.AgentSchemaRemediationOptions` | `ArchLucid.AgentRuntime\AgentSchemaRemediationOptions.cs` | 75.00 | 2 | No |
| 38 | `ArchLucid.AgentRuntime.FallbackAgentCompletionClient` | `ArchLucid.AgentRuntime\FallbackAgentCompletionClient.cs` | 75.61 | 20 | No |
| 39 | `ArchLucid.AgentRuntime.Evaluation.AgentEvidenceGroundingIndex` | `ArchLucid.AgentRuntime\Evaluation\AgentEvidenceGroundingIndex.cs` | 79.37 | 13 | No |
| 40 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationException` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationException.cs` | 80.00 | 2 | No |
| 41 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputLlmJudgeParsedResult` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputLlmJudgeParsedResult.cs` | 80.00 | 1 | No |
| 42 | `ArchLucid.AgentRuntime.LlmProviderDescriptor` | `ArchLucid.AgentRuntime\LlmProviderDescriptor.cs` | 80.56 | 7 | No |
| 43 | `ArchLucid.AgentRuntime.Explanation.ExplanationService` | `ArchLucid.AgentRuntime\Explanation\ExplanationService.cs` | 80.92 | 29 | No |
| 44 | `ArchLucid.AgentRuntime.Evaluation.EmbeddingFaithfulnessVectorMath` | `ArchLucid.AgentRuntime\Evaluation\EmbeddingFaithfulnessVectorMath.cs` | 81.25 | 3 | No |
| 45 | `ArchLucid.AgentRuntime.AgentExecutionTraceRecorder` | `ArchLucid.AgentRuntime\AgentExecutionTraceRecorder.cs` | 81.56 | 71 | No |
| 46 | `ArchLucid.AgentRuntime.AgentResultParser` | `ArchLucid.AgentRuntime\AgentResultParser.cs` | 83.08 | 11 | No |
| 47 | `ArchLucid.AgentRuntime.Caching.CachingLlmCompletionClient` | `ArchLucid.AgentRuntime\Caching\CachingLlmCompletionClient.cs` | 84.13 | 10 | No |
| 48 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputHarnessResult` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputHarnessResult.cs` | 84.62 | 2 | No |
| 49 | `ArchLucid.AgentRuntime.LlmTokenQuotaWindowTracker` | `ArchLucid.AgentRuntime\LlmTokenQuotaWindowTracker.cs` | 84.75 | 9 | No |
| 50 | `ArchLucid.AgentRuntime.AgentHandlerLlmReasoningTrace` | `ArchLucid.AgentRuntime\AgentHandlerLlmReasoningTrace.cs` | 85.00 | 3 | No |
| 51 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputEvaluationRecorder` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputEvaluationRecorder.cs` | 85.12 | 18 | No |
| 52 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputEvaluationHarness` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputEvaluationHarness.cs` | 85.25 | 9 | No |
| 53 | `ArchLucid.AgentRuntime.Explanation.RunExplanationCitationBuilder` | `ArchLucid.AgentRuntime\Explanation\RunExplanationCitationBuilder.cs` | 85.71 | 3 | No |
| 54 | `ArchLucid.AgentRuntime.Evaluation.AgentResultEvidenceFaithfulnessChecker` | `ArchLucid.AgentRuntime\Evaluation\AgentResultEvidenceFaithfulnessChecker.cs` | 86.27 | 14 | No |
| 55 | `ArchLucid.AgentRuntime.Explanation.DeterministicExplanationService` | `ArchLucid.AgentRuntime\Explanation\DeterministicExplanationService.cs` | 86.36 | 27 | No |
| 56 | `ArchLucid.AgentRuntime.Explanation.CachingRunExplanationSummaryService` | `ArchLucid.AgentRuntime\Explanation\CachingRunExplanationSummaryService.cs` | 86.49 | 5 | No |
| 57 | `ArchLucid.AgentRuntime.Caching.LlmCompletionResponseCache` | `ArchLucid.AgentRuntime\Caching\LlmCompletionResponseCache.cs` | 88.57 | 4 | No |
| 58 | `ArchLucid.AgentRuntime.MemoryLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\MemoryLlmCompletionResponseStore.cs` | 88.89 | 2 | No |
| 59 | `ArchLucid.AgentRuntime.LlmCompletionAccountingClient` | `ArchLucid.AgentRuntime\LlmCompletionAccountingClient.cs` | 90.24 | 16 | No |
| 60 | `ArchLucid.AgentRuntime.RealAgentExecutor` | `ArchLucid.AgentRuntime\RealAgentExecutor.cs` | 91.24 | 22 | No |
| 61 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputExpectation` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputExpectation.cs` | 91.67 | 1 | No |
| 62 | `ArchLucid.AgentRuntime.Evaluation.AgentResultJsonEvidenceGrounding` | `ArchLucid.AgentRuntime\Evaluation\AgentResultJsonEvidenceGrounding.cs` | 91.67 | 3 | No |
| 63 | `ArchLucid.AgentRuntime.Explanation.RunExplanationSummaryService` | `ArchLucid.AgentRuntime\Explanation\RunExplanationSummaryService.cs` | 92.20 | 11 | No |
| 64 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputQualityGate` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputQualityGate.cs` | 93.33 | 2 | No |
| 65 | `ArchLucid.AgentRuntime.LlmCallResilienceDefaults` | `ArchLucid.AgentRuntime\LlmCallResilienceDefaults.cs` | 93.33 | 4 | No |
| 66 | `ArchLucid.AgentRuntime.LlmCostEstimator` | `ArchLucid.AgentRuntime\LlmCostEstimator.cs` | 93.55 | 2 | No |
| 67 | `ArchLucid.AgentRuntime.CircuitBreakingAgentCompletionClient` | `ArchLucid.AgentRuntime\CircuitBreakingAgentCompletionClient.cs` | 94.23 | 3 | No |

### ArchLucid.Core (75.63% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Core.AgentRunPartialBudgetException` | `ArchLucid.Core\AgentRunPartialBudgetException.cs` | 0.00 | 7 | No |
| 2 | `ArchLucid.Core.Ask.AskRequest` | `ArchLucid.Core\Ask\AskRequest.cs` | 0.00 | 11 | No |
| 3 | `ArchLucid.Core.Ask.AskResponse` | `ArchLucid.Core\Ask\AskResponse.cs` | 0.00 | 14 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Core.AgentRunPartialBudgetException` | `ArchLucid.Core\AgentRunPartialBudgetException.cs` | 0.00 | 7 | No |
| 2 | `ArchLucid.Core.Ask.AskRequest` | `ArchLucid.Core\Ask\AskRequest.cs` | 0.00 | 11 | No |
| 3 | `ArchLucid.Core.Ask.AskResponse` | `ArchLucid.Core\Ask\AskResponse.cs` | 0.00 | 14 | No |
| 4 | `ArchLucid.Core.Audit.AuditEventListPage` | `ArchLucid.Core\Audit\AuditEventListPage.cs` | 0.00 | 1 | No |
| 5 | `ArchLucid.Core.Audit.MutatingAuditExcludedAttribute` | `ArchLucid.Core\Audit\MutatingAuditExcludedAttribute.cs` | 0.00 | 3 | No |
| 6 | `ArchLucid.Core.Authority.DisabledAsyncAuthorityPipelineModeResolver` | `ArchLucid.Core\Authority\DisabledAsyncAuthorityPipelineModeResolver.cs` | 0.00 | 1 | No |
| 7 | `ArchLucid.Core.Authorization.ProjectRoleAssignmentRole` | `ArchLucid.Core\Authorization\ProjectRoleAssignmentRole.cs` | 0.00 | 9 | No |
| 8 | `ArchLucid.Core.Comparison.SecurityDelta` | `ArchLucid.Core\Comparison\ComparisonResult.cs` | 0.00 | 6 | No |
| 9 | `ArchLucid.Core.Configuration.ArchitectureProjectRetentionPurgeOptions` | `ArchLucid.Core\Configuration\ArchitectureProjectRetentionPurgeOptions.cs` | 0.00 | 8 | No |
| 10 | `ArchLucid.Core.Configuration.ArchitectureRunCreationPayloadLimitsOptions` | `ArchLucid.Core\Configuration\ArchitectureRunCreationPayloadLimitsOptions.cs` | 0.00 | 3 | No |
| 11 | `ArchLucid.Core.Configuration.ArchLucidRetentionOptions` | `ArchLucid.Core\Configuration\ArchLucidRetentionOptions.cs` | 0.00 | 5 | No |
| 12 | `ArchLucid.Core.Configuration.AzureExtractorAutoPullOptions` | `ArchLucid.Core\Configuration\AzureExtractorAutoPullOptions.cs` | 0.00 | 5 | No |
| 13 | `ArchLucid.Core.Configuration.ConfigCheckSummary` | `ArchLucid.Core\Configuration\ConfigCheckModels.cs` | 0.00 | 8 | No |
| 14 | `ArchLucid.Core.Configuration.ContentSafetyEndpointOptions` | `ArchLucid.Core\Configuration\ContentSafetyEndpointOptions.cs` | 0.00 | 4 | No |
| 15 | `ArchLucid.Core.Configuration.DemoAnonymousViewerOptions` | `ArchLucid.Core\Configuration\DemoAnonymousViewerOptions.cs` | 0.00 | 2 | No |
| 16 | `ArchLucid.Core.Configuration.DemoOptions` | `ArchLucid.Core\Configuration\DemoOptions.cs` | 0.00 | 13 | No |
| 17 | `ArchLucid.Core.Configuration.MeteringOptions` | `ArchLucid.Core\Configuration\MeteringOptions.cs` | 0.00 | 2 | No |
| 18 | `ArchLucid.Core.Configuration.RateLimitingRoleMultiplierOptions` | `ArchLucid.Core\Configuration\RateLimitingRoleMultiplierOptions.cs` | 0.00 | 12 | No |
| 19 | `ArchLucid.Core.Configuration.StagedCriticAgentOptionsNormalizePostConfigure` | `ArchLucid.Core\Configuration\StagedCriticAgentOptionsNormalizePostConfigure.cs` | 0.00 | 3 | No |
| 20 | `ArchLucid.Core.Configuration.Summary.AdminConfigLintFinding` | `ArchLucid.Core\Configuration\Summary\ConfigSummaryDtos.cs` | 0.00 | 4 | No |
| 21 | `ArchLucid.Core.Configuration.Summary.AdminConfigLintResponse` | `ArchLucid.Core\Configuration\Summary\ConfigSummaryDtos.cs` | 0.00 | 8 | No |
| 22 | `ArchLucid.Core.Configuration.Summary.AdminConfigSummaryResponse` | `ArchLucid.Core\Configuration\Summary\ConfigSummaryDtos.cs` | 0.00 | 2 | No |
| 23 | `ArchLucid.Core.Configuration.Summary.ConfigSummaryKeyRow` | `ArchLucid.Core\Configuration\Summary\ConfigSummaryDtos.cs` | 0.00 | 14 | No |
| 24 | `ArchLucid.Core.CustomerSuccess.CorePilotChecklistStepRow` | `ArchLucid.Core\CustomerSuccess\ICorePilotTeamChecklistRepository.cs` | 0.00 | 5 | No |
| 25 | `ArchLucid.Core.CustomerSuccess.OperatorStickinessSignals` | `ArchLucid.Core\CustomerSuccess\OperatorStickinessModels.cs` | 0.00 | 6 | No |
| 26 | `ArchLucid.Core.CustomerSuccess.PilotFunnelSnapshot` | `ArchLucid.Core\CustomerSuccess\OperatorStickinessModels.cs` | 0.00 | 9 | No |
| 27 | `ArchLucid.Core.CustomerSuccess.TenantHealthScoreRecord` | `ArchLucid.Core\CustomerSuccess\TenantHealthScoreRecord.cs` | 0.00 | 9 | No |
| 28 | `ArchLucid.Core.Diagnostics.OutboxDepthGaugeValues` | `ArchLucid.Core\Diagnostics\OutboxDepthGaugeValues.cs` | 0.00 | 8 | No |
| 29 | `ArchLucid.Core.Explanation.DecisionTraceEntry` | `ArchLucid.Core\Explanation\DecisionTraceEntry.cs` | 0.00 | 14 | No |
| 30 | `ArchLucid.Core.Explanation.FindingRationale` | `ArchLucid.Core\Explanation\FindingRationale.cs` | 0.00 | 26 | No |
| 31 | `ArchLucid.Core.Explanation.FindingTraceCompletenessScore` | `ArchLucid.Core\Explanation\FindingTraceCompletenessScore.cs` | 0.00 | 23 | No |
| 32 | `ArchLucid.Core.Explanation.RunRationale` | `ArchLucid.Core\Explanation\RunRationale.cs` | 0.00 | 18 | No |
| 33 | `ArchLucid.Core.Feedback.FindingFeedbackSubmission` | `ArchLucid.Core\Feedback\FindingFeedbackSubmission.cs` | 0.00 | 13 | No |
| 34 | `ArchLucid.Core.GoldenCorpus.GoldenCohortFindingCategoryAggregator` | `ArchLucid.Core\GoldenCorpus\GoldenCohortFindingCategoryAggregator.cs` | 0.00 | 7 | No |
| 35 | `ArchLucid.Core.GraphResolutionException` | `ArchLucid.Core\GraphResolutionException.cs` | 0.00 | 1 | No |
| 36 | `ArchLucid.Core.Hosting.AzureOpenAiEndpointConnectivitySocketProbe` | `ArchLucid.Core\Hosting\AzureOpenAiEndpointConnectivitySocketProbe.cs` | 0.00 | 11 | No |
| 37 | `ArchLucid.Core.Hosting.ProductionProfileFailFastMonitoredConfigurationPaths` | `ArchLucid.Core\Hosting\ProductionProfileFailFastMonitoredConfigurationPaths.cs` | 0.00 | 19 | No |
| 38 | `ArchLucid.Core.Metering.MeteringOptions` | `ArchLucid.Core\Metering\MeteringOptions.cs` | 0.00 | 2 | No |
| 39 | `ArchLucid.Core.Metering.NullUsageMeteringService` | `ArchLucid.Core\Metering\NullUsageMeteringService.cs` | 0.00 | 3 | No |
| 40 | `ArchLucid.Core.Metering.TenantUsageSummary` | `ArchLucid.Core\Metering\TenantUsageSummary.cs` | 0.00 | 10 | No |
| 41 | `ArchLucid.Core.Pagination.ArtifactCursorCodec` | `ArchLucid.Core\Pagination\ArtifactCursorCodec.cs` | 0.00 | 27 | No |
| 42 | `ArchLucid.Core.Pagination.ArtifactListingPagination` | `ArchLucid.Core\Pagination\ArtifactListingPagination.cs` | 0.00 | 1 | No |
| 43 | `ArchLucid.Core.Pagination.AuditEventCursorCodec` | `ArchLucid.Core\Pagination\AuditEventCursorCodec.cs` | 0.00 | 32 | No |
| 44 | <code>ArchLucid.Core.Pagination.CursorPagedResponse`1</code> | `ArchLucid.Core\Pagination\CursorPagedResponse.cs` | 0.00 | 9 | No |
| 45 | `ArchLucid.Core.Pagination.FindingCursorCodec` | `ArchLucid.Core\Pagination\FindingCursorCodec.cs` | 0.00 | 27 | No |
| 46 | `ArchLucid.Core.Pagination.FindingPagination` | `ArchLucid.Core\Pagination\FindingPagination.cs` | 0.00 | 1 | No |
| 47 | `ArchLucid.Core.Pagination.RunCursorCodec` | `ArchLucid.Core\Pagination\RunCursorCodec.cs` | 0.00 | 33 | No |
| 48 | `ArchLucid.Core.Pilots.PilotCloseoutRecord` | `ArchLucid.Core\Pilots\PilotCloseoutRecord.cs` | 0.00 | 22 | No |
| 49 | `ArchLucid.Core.RunCostBudgetExceededPartialPersistRecordedException` | `ArchLucid.Core\RunCostBudgetExceededPartialPersistRecordedException.cs` | 0.00 | 9 | No |
| 50 | `ArchLucid.Core.Scim.Filtering.ScimFilterSqlException` | `ArchLucid.Core\Scim\Filtering\ScimFilterSqlException.cs` | 0.00 | 1 | No |
| 51 | `ArchLucid.Core.Scim.Filtering.ScimKnownUserFilterPaths` | `ArchLucid.Core\Scim\Filtering\ScimKnownUserFilterPaths.cs` | 0.00 | 1 | No |
| 52 | `ArchLucid.Core.Scim.Models.ScimTokenRotationCandidate` | `ArchLucid.Core\Scim\Models\ScimTokenRotationCandidate.cs` | 0.00 | 1 | No |
| 53 | `ArchLucid.Core.Secrets.ArchLucidSecretOptions` | `ArchLucid.Core\Secrets\ArchLucidSecretOptions.cs` | 0.00 | 7 | No |
| 54 | `ArchLucid.Core.Security.AllowedDocumentUrlPolicy` | `ArchLucid.Core\Security\AllowedDocumentUrlPolicy.cs` | 0.00 | 28 | No |
| 55 | `ArchLucid.Core.Tenancy.ArchitectureProjectPurgeDeletion` | `ArchLucid.Core\Tenancy\ArchitectureProjectPurgeDeletion.cs` | 0.00 | 1 | No |
| 56 | `ArchLucid.Core.Tenancy.NoOpTrialFunnelCommitHook` | `ArchLucid.Core\Tenancy\NoOpTrialFunnelCommitHook.cs` | 0.00 | 4 | No |
| 57 | `ArchLucid.Core.Configuration.ArchLucidPersistenceOptions` | `ArchLucid.Core\Configuration\ArchLucidPersistenceOptions.cs` | 20.00 | 4 | No |
| 58 | `ArchLucid.Core.Audit.InMemoryAuditRetryQueue` | `ArchLucid.Core\Audit\InMemoryAuditRetryQueue.cs` | 23.40 | 36 | No |
| 59 | `ArchLucid.Core.Diagnostics.AgentExecutionLlmCallAccumulator` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 25.00 | 3 | No |
| 60 | `ArchLucid.Core.CustomerSuccess.ProductFeedbackSubmission` | `ArchLucid.Core\CustomerSuccess\ProductFeedbackSubmission.cs` | 28.57 | 10 | No |
| 61 | `ArchLucid.Core.Resilience.CircuitBreakerAuditEntry` | `ArchLucid.Core\Resilience\CircuitBreakerAuditEntry.cs` | 28.57 | 5 | No |
| 62 | `ArchLucid.Core.Scim.Filtering.ScimFilterInMemoryEvaluator` | `ArchLucid.Core\Scim\Filtering\ScimFilterInMemoryEvaluator.cs` | 28.57 | 30 | No |
| 63 | `ArchLucid.Core.Configuration.FirstTenantFunnelOptions` | `ArchLucid.Core\Configuration\FirstTenantFunnelOptions.cs` | 42.86 | 8 | No |
| 64 | `ArchLucid.Core.Configuration.TrialArchitecturePreseedOptions` | `ArchLucid.Core\Configuration\TrialArchitecturePreseedOptions.cs` | 44.44 | 5 | No |
| 65 | `ArchLucid.Core.Diagnostics.SanitizedLoggerDebugExtensions` | `ArchLucid.Core\Diagnostics\SanitizedLoggerDebugExtensions.cs` | 47.83 | 12 | No |
| 66 | `ArchLucid.Core.Comparison.CostDelta` | `ArchLucid.Core\Comparison\ComparisonResult.cs` | 50.00 | 2 | No |
| 67 | `ArchLucid.Core.Comparison.RequirementDelta` | `ArchLucid.Core\Comparison\ComparisonResult.cs` | 50.00 | 2 | No |
| 68 | `ArchLucid.Core.Comparison.TopologyDelta` | `ArchLucid.Core\Comparison\ComparisonResult.cs` | 50.00 | 2 | No |
| 69 | `ArchLucid.Core.Configuration.IntegrationsItsmInboundOptions` | `ArchLucid.Core\Configuration\IntegrationsItsmInboundOptions.cs` | 50.00 | 5 | No |
| 70 | `ArchLucid.Core.Configuration.LlmTelemetryOptions` | `ArchLucid.Core\Configuration\LlmTelemetryOptions.cs` | 50.00 | 1 | No |
| 71 | `ArchLucid.Core.Diagnostics.ActivityCorrelation` | `ArchLucid.Core\Diagnostics\ActivityCorrelation.cs` | 50.00 | 3 | No |
| 72 | `ArchLucid.Core.Notifications.SentEmailLedgerEntry` | `ArchLucid.Core\Notifications\SentEmailLedgerEntry.cs` | 50.00 | 3 | No |
| 73 | `ArchLucid.Core.Manifest.SaveContractsManifestOptions` | `ArchLucid.Core\Manifest\SaveContractsManifestOptions.cs` | 52.38 | 10 | No |
| 74 | `ArchLucid.Core.Configuration.TrialLifecycleSchedulerOptions` | `ArchLucid.Core\Configuration\TrialLifecycleSchedulerOptions.cs` | 53.33 | 7 | No |
| 75 | `ArchLucid.Core.Identity.TrialIdentityUserRecord` | `ArchLucid.Core\Identity\TrialIdentityUserRecord.cs` | 54.29 | 16 | No |
| 76 | `ArchLucid.Core.Billing.MarketplaceWebhookValidatedToken` | `ArchLucid.Core\Billing\MarketplaceWebhookValidatedToken.cs` | 55.56 | 4 | No |
| 77 | `ArchLucid.Core.Configuration.ConfigurationKeyEntry` | `ArchLucid.Core\Configuration\ConfigurationKeyEntry.cs` | 55.56 | 4 | No |
| 78 | `ArchLucid.Core.Notifications.Email.EmailMessageTags` | `ArchLucid.Core\Notifications\Email\EmailMessage.cs` | 60.00 | 2 | No |
| 79 | `ArchLucid.Core.Support.SupportBundleNextStepsBuilder` | `ArchLucid.Core\Support\SupportBundleNextStepsBuilder.cs` | 60.31 | 52 | No |
| 80 | `ArchLucid.Core.GoldenCorpus.GoldenCohortDocument` | `ArchLucid.Core\GoldenCorpus\GoldenCohortDocument.cs` | 60.71 | 11 | No |
| 81 | `ArchLucid.Core.Audit.DurableAuditLogRetry` | `ArchLucid.Core\Audit\DurableAuditLogRetry.cs` | 61.29 | 12 | No |
| 82 | `ArchLucid.Core.Billing.BillingSubscriptionStateHistoryEntry` | `ArchLucid.Core\Billing\BillingSubscriptionStateHistoryEntry.cs` | 62.16 | 14 | No |
| 83 | `ArchLucid.Core.Diagnostics.CircuitBreakerGateMetricsRegistry` | `ArchLucid.Core\Diagnostics\CircuitBreakerGateMetricsRegistry.cs` | 62.50 | 3 | No |
| 84 | `ArchLucid.Core.Llm.Redaction.PromptRedactor` | `ArchLucid.Core\Llm\Redaction\PromptRedactor.cs` | 63.16 | 28 | No |
| 85 | `ArchLucid.Core.Connectors.Publishing.PublishRequest` | `ArchLucid.Core\Connectors\Publishing\PublishRequest.cs` | 63.64 | 4 | No |
| 86 | `ArchLucid.Core.Tenancy.TenantWorkspaceListItem` | `ArchLucid.Core\Tenancy\TenantWorkspaceListItem.cs` | 63.64 | 4 | No |
| 87 | `ArchLucid.Core.Billing.BillingTierCode` | `ArchLucid.Core\Billing\BillingTierCode.cs` | 64.29 | 5 | No |
| 88 | `ArchLucid.Core.Metering.UsageEvent` | `ArchLucid.Core\Metering\UsageEvent.cs` | 64.71 | 6 | No |
| 89 | `ArchLucid.Core.Concurrency.InProcessCreateRunIdempotencyLock` | `ArchLucid.Core\Concurrency\InProcessCreateRunIdempotencyLock.cs` | 66.67 | 17 | No |
| 90 | `ArchLucid.Core.Configuration.AgentPromptCatalogOptions` | `ArchLucid.Core\Configuration\AgentPromptCatalogOptions.cs` | 66.67 | 1 | No |
| 91 | `ArchLucid.Core.Configuration.ScimOptions` | `ArchLucid.Core\Configuration\ScimOptions.cs` | 66.67 | 2 | No |
| 92 | `ArchLucid.Core.Configuration.StripeBillingOptions` | `ArchLucid.Core\Configuration\BillingOptions.cs` | 66.67 | 4 | No |
| 93 | `ArchLucid.Core.Configuration.TrialAuthModeConstants` | `ArchLucid.Core\Configuration\TrialAuthModeConstants.cs` | 66.67 | 1 | No |
| 94 | `ArchLucid.Core.Explanation.FindingTraceConfidenceDto` | `ArchLucid.Core\Explanation\FindingTraceConfidenceDto.cs` | 66.67 | 7 | No |
| 95 | `ArchLucid.Core.Scim.Models.ScimTokenSummaryRow` | `ArchLucid.Core\Scim\Models\ScimTokenSummaryRow.cs` | 66.67 | 3 | No |
| 96 | `ArchLucid.Core.GoToMarket.SyntheticAggregateRoiBulletinSample` | `ArchLucid.Core\GoToMarket\SyntheticAggregateRoiBulletinSample.cs` | 70.00 | 3 | No |
| 97 | `ArchLucid.Core.Configuration.ConfigurationKeyRequirement` | `ArchLucid.Core\Configuration\ConfigurationKeyRequirement.cs` | 70.31 | 19 | No |
| 98 | `ArchLucid.Core.Identity.RunId` | `ArchLucid.Core\Identity\RunId.cs` | 71.43 | 2 | No |
| 99 | `ArchLucid.Core.Manifest.Sections.ManifestIssue` | `ArchLucid.Core\Manifest\Sections\ManifestIssue.cs` | 72.73 | 3 | No |
| 100 | `ArchLucid.Core.Tenancy.ArchitectureProjectRecord` | `ArchLucid.Core\Tenancy\ArchitectureProjectRecord.cs` | 72.73 | 3 | No |
| 101 | `ArchLucid.Core.Diagnostics.SanitizedLoggerInformationExtensions` | `ArchLucid.Core\Diagnostics\SanitizedLoggerInformationExtensions.cs` | 74.47 | 24 | No |
| 102 | `ArchLucid.Core.Configuration.AgentFaithfulnessOptions` | `ArchLucid.Core\Configuration\AgentFaithfulnessOptions.cs` | 75.00 | 2 | No |
| 103 | `ArchLucid.Core.Configuration.SqlTopologyOptions` | `ArchLucid.Core\Configuration\SqlTopologyOptions.cs` | 75.00 | 1 | No |
| 104 | `ArchLucid.Core.Identity.RunIdJsonConverter` | `ArchLucid.Core\Identity\RunIdJsonConverter.cs` | 75.00 | 2 | No |
| 105 | `ArchLucid.Core.Manifest.Sections.CompliancePostureItem` | `ArchLucid.Core\Manifest\Sections\CompliancePostureItem.cs` | 75.00 | 2 | No |
| 106 | `ArchLucid.Core.Manifest.Sections.SecurityPostureItem` | `ArchLucid.Core\Manifest\Sections\SecurityPostureItem.cs` | 75.00 | 2 | No |
| 107 | `ArchLucid.Core.Tenancy.NoOpFirstSessionLifecycleHook` | `ArchLucid.Core\Tenancy\NoOpFirstSessionLifecycleHook.cs` | 75.00 | 1 | No |
| 108 | `ArchLucid.Core.Billing.AzureMarketplace.MarketplaceWebhookPayloadParser` | `ArchLucid.Core\Billing\AzureMarketplace\MarketplaceWebhookPayloadParser.cs` | 77.27 | 5 | No |
| 109 | `ArchLucid.Core.Billing.BillingCheckoutRequest` | `ArchLucid.Core\Billing\BillingCheckoutRequest.cs` | 77.78 | 4 | No |
| 110 | `ArchLucid.Core.CustomerSuccess.TenantHealthScoringCalculator` | `ArchLucid.Core\CustomerSuccess\TenantHealthScoringCalculator.cs` | 77.78 | 12 | No |
| 111 | `ArchLucid.Core.Security.WebhookSecrets` | `ArchLucid.Core\Security\WebhookSecrets.cs` | 77.78 | 8 | No |
| 112 | `ArchLucid.Core.Hosting.AzureOpenAiEndpointConnectivityLintAdvisor` | `ArchLucid.Core\Hosting\AzureOpenAiEndpointConnectivityLintAdvisor.cs` | 78.72 | 10 | No |
| 113 | `ArchLucid.Core.Resilience.CircuitBreakerGate` | `ArchLucid.Core\Resilience\CircuitBreakerGate.cs` | 79.08 | 32 | No |
| 114 | `ArchLucid.Core.Integration.IntegrationEventServiceBusApplicationProperties` | `ArchLucid.Core\Integration\IntegrationEventServiceBusApplicationProperties.cs` | 79.25 | 11 | No |
| 115 | `ArchLucid.Core.Diagnostics.SanitizedLoggerWarningExtensions` | `ArchLucid.Core\Diagnostics\SanitizedLoggerWarningExtensions.cs` | 79.26 | 28 | No |
| 116 | `ArchLucid.Core.Connectors.Publishing.PublishOutcome` | `ArchLucid.Core\Connectors\Publishing\PublishOutcome.cs` | 80.00 | 1 | No |
| 117 | `ArchLucid.Core.Hosting.OperatorConfigurationLintSnapshot` | `ArchLucid.Core\Hosting\OperatorConfigurationLintSnapshot.cs` | 80.00 | 1 | No |
| 118 | `ArchLucid.Core.Safety.ContentSafetyResult` | `ArchLucid.Core\Safety\ContentSafetyResult.cs` | 80.00 | 1 | No |
| 119 | `ArchLucid.Core.GoldenCorpus.RealLlmOutputStructuralValidator` | `ArchLucid.Core\GoldenCorpus\RealLlmOutputStructuralValidator.cs` | 80.26 | 30 | No |
| 120 | `ArchLucid.Core.Diagnostics.ArchLucidInstrumentation` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 81.17 | 129 | No |
| 121 | `ArchLucid.Core.Manifest.Sections.RequirementCoverageItem` | `ArchLucid.Core\Manifest\Sections\RequirementCoverageItem.cs` | 81.82 | 2 | No |
| 122 | `ArchLucid.Core.Resilience.CircuitBreakerOptions` | `ArchLucid.Core\Resilience\CircuitBreakerOptions.cs` | 81.82 | 2 | No |
| 123 | `ArchLucid.Core.AgentOutputQualityGateRejectedException` | `ArchLucid.Core\AgentOutputQualityGateRejectedException.cs` | 83.33 | 1 | No |
| 124 | `ArchLucid.Core.Billing.BillingCheckoutResult` | `ArchLucid.Core\Billing\BillingCheckoutResult.cs` | 83.33 | 1 | No |
| 125 | `ArchLucid.Core.Budgeting.LlmTenantBudgetReserveResult` | `ArchLucid.Core\Budgeting\LlmTenantBudgetReserveResult.cs` | 83.33 | 1 | No |
| 126 | `ArchLucid.Core.GoldenCorpus.GoldenCohortArchitectureRequestFactory` | `ArchLucid.Core\GoldenCorpus\GoldenCohortArchitectureRequestFactory.cs` | 83.33 | 3 | No |
| 127 | `ArchLucid.Core.Manifest.Sections.PolicyControlItem` | `ArchLucid.Core\Manifest\Sections\PolicyControlItem.cs` | 83.33 | 2 | No |
| 128 | `ArchLucid.Core.Configuration.ConfigurationKeyPresence` | `ArchLucid.Core\Configuration\ConfigurationKeyPresence.cs` | 85.71 | 1 | No |
| 129 | `ArchLucid.Core.Hosting.HostingEnvironmentNamePatterns` | `ArchLucid.Core\Hosting\HostingEnvironmentNamePatterns.cs` | 85.71 | 1 | No |
| 130 | `ArchLucid.Core.Integration.IntegrationEventOutboxPriority` | `ArchLucid.Core\Integration\IntegrationEventOutboxPriority.cs` | 85.71 | 2 | No |
| 131 | `ArchLucid.Core.Configuration.LlmTokenQuotaOptions` | `ArchLucid.Core\Configuration\LlmTokenQuotaOptions.cs` | 86.67 | 2 | No |
| 132 | `ArchLucid.Core.Configuration.ValueReportComputationOptions` | `ArchLucid.Core\Configuration\ValueReportComputationOptions.cs` | 86.67 | 4 | No |
| 133 | `ArchLucid.Core.Hosting.ProductionLikeHostingMisconfigurationAdvisor` | `ArchLucid.Core\Hosting\ProductionLikeHostingMisconfigurationAdvisor.cs` | 87.23 | 12 | No |
| 134 | `ArchLucid.Core.Tenancy.TrialLimitExceededException` | `ArchLucid.Core\Tenancy\TrialLimitExceededException.cs` | 87.50 | 2 | No |
| 135 | `ArchLucid.Core.Hosting.ProductionDangerousMisconfigurationLint` | `ArchLucid.Core\Hosting\ProductionDangerousMisconfigurationLint.cs` | 88.03 | 17 | No |
| 136 | `ArchLucid.Core.Conversation.ConversationThread` | `ArchLucid.Core\Conversation\ConversationThread.cs` | 88.46 | 3 | No |
| 137 | `ArchLucid.Core.Support.SupportBundleNextStepsDocument` | `ArchLucid.Core\Support\SupportBundleNextStepsDocument.cs` | 88.89 | 2 | No |
| 138 | `ArchLucid.Core.Tenancy.TenantDatabaseBindingRecord` | `ArchLucid.Core\Tenancy\TenantDatabaseBindingRecord.cs` | 88.89 | 1 | No |
| 139 | `ArchLucid.Core.Diagnostics.MeterListenerCounterSnapshotProvider` | `ArchLucid.Core\Diagnostics\MeterListenerCounterSnapshotProvider.cs` | 89.83 | 6 | No |
| 140 | `ArchLucid.Core.Integration.IntegrationEventTypes` | `ArchLucid.Core\Integration\IntegrationEventTypes.cs` | 90.62 | 3 | No |
| 141 | `ArchLucid.Core.Configuration.RunRoiEstimatorOptions` | `ArchLucid.Core\Configuration\RunRoiEstimatorOptions.cs` | 91.67 | 2 | No |
| 142 | `ArchLucid.Core.GoldenCorpus.GoldenCohortDriftMarkdown` | `ArchLucid.Core\GoldenCorpus\GoldenCohortDriftMarkdown.cs` | 91.67 | 2 | No |
| 143 | <code>ArchLucid.Core.Pagination.PagedResponse`1</code> | `ArchLucid.Core\Pagination\PagedResponse.cs` | 91.67 | 1 | No |
| 144 | `ArchLucid.Core.Notifications.Email.EmailMessage` | `ArchLucid.Core\Notifications\Email\EmailMessage.cs` | 92.31 | 1 | No |
| 145 | `ArchLucid.Core.Explanation.RunExplanationSummary` | `ArchLucid.Core\Explanation\RunExplanationSummary.cs` | 92.59 | 2 | No |
| 146 | `ArchLucid.Core.Scim.Models.ScimGroupRecord` | `ArchLucid.Core\Scim\Models\ScimGroupRecord.cs` | 92.86 | 1 | No |
| 147 | `ArchLucid.Core.Explanation.ExplanationResult` | `ArchLucid.Core\Explanation\ExplanationResult.cs` | 93.10 | 2 | No |
| 148 | `ArchLucid.Core.Configuration.AzureMarketplaceBillingOptions` | `ArchLucid.Core\Configuration\BillingOptions.cs` | 93.33 | 1 | No |
| 149 | `ArchLucid.Core.Audit.AuditEvent` | `ArchLucid.Core\Audit\AuditEvent.cs` | 93.55 | 2 | No |
| 150 | `ArchLucid.Core.Configuration.Summary.ConfigurationEffectiveValueResolver` | `ArchLucid.Core\Configuration\Summary\ConfigurationEffectiveValueResolver.cs` | 93.75 | 1 | No |
| 151 | `ArchLucid.Core.Budgeting.LlmTenantBudgetStateReadModel` | `ArchLucid.Core\Budgeting\LlmTenantBudgetStateReadModel.cs` | 94.12 | 1 | No |
| 152 | `ArchLucid.Core.Manifest.ManifestDocument` | `ArchLucid.Core\Manifest\ManifestDocument.cs` | 94.29 | 4 | No |
| 153 | `ArchLucid.Core.Billing.BillingWebhookHandleResult` | `ArchLucid.Core\Billing\BillingWebhookHandleResult.cs` | 94.74 | 1 | No |

### ArchLucid.ContextIngestion (76.93% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ContextIngestion.Connectors.InlineRequirementsConnector` | `ArchLucid.ContextIngestion\Connectors\InlineRequirementsConnector.cs` | 0.00 | 16 | No |
| 2 | `ArchLucid.ContextIngestion.Connectors.SecurityBaselineHintsConnector` | `ArchLucid.ContextIngestion\Connectors\SecurityBaselineHintsConnector.cs` | 0.00 | 16 | No |
| 3 | `ArchLucid.ContextIngestion.ConnectorStages.InfrastructureDeclarationsPayloadExtractor` | `ArchLucid.ContextIngestion\ConnectorStages\InfrastructureDeclarationsPayloadExtractor.cs` | 0.00 | 5 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ContextIngestion.Connectors.InlineRequirementsConnector` | `ArchLucid.ContextIngestion\Connectors\InlineRequirementsConnector.cs` | 0.00 | 16 | No |
| 2 | `ArchLucid.ContextIngestion.Connectors.SecurityBaselineHintsConnector` | `ArchLucid.ContextIngestion\Connectors\SecurityBaselineHintsConnector.cs` | 0.00 | 16 | No |
| 3 | `ArchLucid.ContextIngestion.ConnectorStages.InfrastructureDeclarationsPayloadExtractor` | `ArchLucid.ContextIngestion\ConnectorStages\InfrastructureDeclarationsPayloadExtractor.cs` | 0.00 | 5 | No |
| 4 | `ArchLucid.ContextIngestion.ConnectorStages.InlineRequirementsPayloadNormalizer` | `ArchLucid.ContextIngestion\ConnectorStages\InlineRequirementsPayloadNormalizer.cs` | 0.00 | 12 | No |
| 5 | `ArchLucid.ContextIngestion.ConnectorStages.InlineRequirementsRawPayloadMapper` | `ArchLucid.ContextIngestion\ConnectorStages\InlineRequirementsRawPayloadMapper.cs` | 0.00 | 4 | No |
| 6 | `ArchLucid.ContextIngestion.ConnectorStages.SecurityBaselineHintsPayloadExtractor` | `ArchLucid.ContextIngestion\ConnectorStages\SecurityBaselineHintsPayloadExtractor.cs` | 0.00 | 2 | No |
| 7 | `ArchLucid.ContextIngestion.ConnectorStages.SecurityBaselineHintsPayloadNormalizer` | `ArchLucid.ContextIngestion\ConnectorStages\SecurityBaselineHintsPayloadNormalizer.cs` | 0.00 | 12 | No |
| 8 | `ArchLucid.ContextIngestion.ConnectorStages.SecurityBaselineHintsRawPayloadMapper` | `ArchLucid.ContextIngestion\ConnectorStages\SecurityBaselineHintsRawPayloadMapper.cs` | 0.00 | 4 | No |
| 9 | `ArchLucid.ContextIngestion.ConnectorStages.TopologyHintsPayloadExtractor` | `ArchLucid.ContextIngestion\ConnectorStages\TopologyHintsPayloadExtractor.cs` | 0.00 | 2 | No |
| 10 | `ArchLucid.ContextIngestion.Infrastructure.ContextConnectorPipeline` | `ArchLucid.ContextIngestion\Infrastructure\ContextConnectorPipeline.cs` | 0.00 | 19 | No |
| 11 | `ArchLucid.ContextIngestion.Infrastructure.ContextDocumentParserPipeline` | `ArchLucid.ContextIngestion\Infrastructure\ContextDocumentParserPipeline.cs` | 0.00 | 6 | No |
| 12 | `ArchLucid.ContextIngestion.Models.ConnectorPayloads.SecurityBaselineHintsPayload` | `ArchLucid.ContextIngestion\Models\ConnectorPayloads\SecurityBaselineHintsPayload.cs` | 0.00 | 3 | No |
| 13 | `ArchLucid.ContextIngestion.Connectors.InfrastructureDeclarationConnector` | `ArchLucid.ContextIngestion\Connectors\InfrastructureDeclarationConnector.cs` | 26.09 | 17 | No |
| 14 | `ArchLucid.ContextIngestion.Repositories.InMemoryContextSnapshotRepository` | `ArchLucid.ContextIngestion\Repositories\InMemoryContextSnapshotRepository.cs` | 26.92 | 19 | No |
| 15 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalInfrastructureEnricher` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalInfrastructureEnricher.cs` | 50.00 | 20 | No |
| 16 | `ArchLucid.ContextIngestion.ConnectorStages.PolicyReferenceRawPayloadMapper` | `ArchLucid.ContextIngestion\ConnectorStages\PolicyReferenceRawPayloadMapper.cs` | 50.00 | 5 | No |
| 17 | `ArchLucid.ContextIngestion.ConnectorStages.TopologyHintsRawPayloadMapper` | `ArchLucid.ContextIngestion\ConnectorStages\TopologyHintsRawPayloadMapper.cs` | 50.00 | 2 | No |
| 18 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalDeduplicator` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalDeduplicator.cs` | 58.82 | 7 | No |
| 19 | `ArchLucid.ContextIngestion.Infrastructure.JsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\JsonInfrastructureDeclarationParser.cs` | 63.46 | 19 | No |
| 20 | `ArchLucid.ContextIngestion.Connectors.StaticRequestContextConnector` | `ArchLucid.ContextIngestion\Connectors\StaticRequestContextConnector.cs` | 64.29 | 5 | No |
| 21 | `ArchLucid.ContextIngestion.ConnectorStages.InfrastructureDeclarationsRawPayloadMapper` | `ArchLucid.ContextIngestion\ConnectorStages\InfrastructureDeclarationsRawPayloadMapper.cs` | 71.43 | 2 | No |
| 22 | `ArchLucid.ContextIngestion.Connectors.PolicyReferenceConnector` | `ArchLucid.ContextIngestion\Connectors\PolicyReferenceConnector.cs` | 78.95 | 4 | No |
| 23 | `ArchLucid.ContextIngestion.Connectors.TopologyHintsConnector` | `ArchLucid.ContextIngestion\Connectors\TopologyHintsConnector.cs` | 78.95 | 4 | No |
| 24 | `ArchLucid.ContextIngestion.Models.RawContextPayload` | `ArchLucid.ContextIngestion\Models\RawContextPayload.cs` | 80.00 | 4 | No |
| 25 | `ArchLucid.ContextIngestion.Models.NormalizedContextBatch` | `ArchLucid.ContextIngestion\Models\NormalizedContextBatch.cs` | 83.33 | 1 | No |
| 26 | `ArchLucid.ContextIngestion.Infrastructure.TerraformShowJsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\TerraformShowJsonInfrastructureDeclarationParser.cs` | 89.17 | 13 | No |
| 27 | `ArchLucid.ContextIngestion.Infrastructure.ResourceDeclarationItem` | `ArchLucid.ContextIngestion\Infrastructure\ResourceDeclarationItem.cs` | 90.91 | 1 | No |

### ArchLucid.Contracts (81.63% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Contracts.Agents.Citation` | `ArchLucid.Contracts\Agents\Citation.cs` | 0.00 | 2 | No |
| 2 | `ArchLucid.Contracts.Architecture.ArchitectureQuickScanFindingItem` | `ArchLucid.Contracts\Architecture\ArchitectureQuickScanFindingItem.cs` | 0.00 | 5 | No |
| 3 | `ArchLucid.Contracts.Architecture.ArchitectureQuickScanRequest` | `ArchLucid.Contracts\Architecture\ArchitectureQuickScanRequest.cs` | 0.00 | 3 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Contracts.Agents.Citation` | `ArchLucid.Contracts\Agents\Citation.cs` | 0.00 | 2 | No |
| 2 | `ArchLucid.Contracts.Architecture.ArchitectureQuickScanFindingItem` | `ArchLucid.Contracts\Architecture\ArchitectureQuickScanFindingItem.cs` | 0.00 | 5 | No |
| 3 | `ArchLucid.Contracts.Architecture.ArchitectureQuickScanRequest` | `ArchLucid.Contracts\Architecture\ArchitectureQuickScanRequest.cs` | 0.00 | 3 | No |
| 4 | `ArchLucid.Contracts.Architecture.ArchitectureQuickScanResponse` | `ArchLucid.Contracts\Architecture\ArchitectureQuickScanResponse.cs` | 0.00 | 4 | No |
| 5 | `ArchLucid.Contracts.Architecture.ExecutiveSummaryResponse` | `ArchLucid.Contracts\Architecture\ExecutiveSummaryResponse.cs` | 0.00 | 6 | No |
| 6 | `ArchLucid.Contracts.Architecture.QuickScanResult` | `ArchLucid.Contracts\Architecture\QuickScanResult.cs` | 0.00 | 4 | No |
| 7 | `ArchLucid.Contracts.Evolution.ChangeSetAffectedComponent` | `ArchLucid.Contracts\Evolution\ChangeSetAffectedComponent.cs` | 0.00 | 9 | No |
| 8 | `ArchLucid.Contracts.Evolution.EvolutionCandidateChangeSetRecord` | `ArchLucid.Contracts\Evolution\EvolutionCandidateChangeSetRecord.cs` | 0.00 | 29 | No |
| 9 | `ArchLucid.Contracts.Evolution.EvolutionSimulationRunRecord` | `ArchLucid.Contracts\Evolution\EvolutionSimulationRunRecord.cs` | 0.00 | 20 | No |
| 10 | `ArchLucid.Contracts.Evolution.SimulationEvaluationOptions` | `ArchLucid.Contracts\Evolution\SimulationEvaluationOptions.cs` | 0.00 | 7 | No |
| 11 | `ArchLucid.Contracts.Findings.FindingMuteRequest` | `ArchLucid.Contracts\Findings\FindingMuteRequest.cs` | 0.00 | 5 | No |
| 12 | `ArchLucid.Contracts.Findings.FindingReviewEventRecord` | `ArchLucid.Contracts\Findings\FindingReviewEventRecord.cs` | 0.00 | 22 | No |
| 13 | `ArchLucid.Contracts.Governance.Preview.GovernanceDiffItem` | `ArchLucid.Contracts\Governance\Preview\GovernanceDiffItem.cs` | 0.00 | 10 | No |
| 14 | `ArchLucid.Contracts.Governance.Preview.GovernanceEnvironmentComparisonRequest` | `ArchLucid.Contracts\Governance\Preview\GovernanceEnvironmentComparisonRequest.cs` | 0.00 | 6 | No |
| 15 | `ArchLucid.Contracts.Governance.Preview.GovernanceEnvironmentComparisonResult` | `ArchLucid.Contracts\Governance\Preview\GovernanceEnvironmentComparisonResult.cs` | 0.00 | 12 | No |
| 16 | `ArchLucid.Contracts.Governance.Preview.GovernancePreviewRequest` | `ArchLucid.Contracts\Governance\Preview\GovernancePreviewRequest.cs` | 0.00 | 9 | No |
| 17 | `ArchLucid.Contracts.Governance.Preview.GovernancePreviewResult` | `ArchLucid.Contracts\Governance\Preview\GovernancePreviewResult.cs` | 0.00 | 19 | No |
| 18 | `ArchLucid.Contracts.Ingestion.FastPathContextPreviewRequest` | `ArchLucid.Contracts\Ingestion\FastPathContextPreviewDtos.cs` | 0.00 | 3 | No |
| 19 | `ArchLucid.Contracts.Integrations.TeamsIncomingWebhookConnectionResponse` | `ArchLucid.Contracts\Integrations\TeamsIncomingWebhookConnectionResponse.cs` | 0.00 | 13 | No |
| 20 | `ArchLucid.Contracts.Integrations.TeamsIncomingWebhookConnectionUpsertRequest` | `ArchLucid.Contracts\Integrations\TeamsIncomingWebhookConnectionUpsertRequest.cs` | 0.00 | 6 | No |
| 21 | `ArchLucid.Contracts.Notifications.ExecDigestPreferencesUpsertRequest` | `ArchLucid.Contracts\Notifications\ExecDigestPreferencesUpsertRequest.cs` | 0.00 | 10 | No |
| 22 | `ArchLucid.Contracts.Notifications.TenantNotificationChannelPreferencesResponse` | `ArchLucid.Contracts\Notifications\TenantNotificationChannelPreferencesResponse.cs` | 0.00 | 25 | No |
| 23 | `ArchLucid.Contracts.Notifications.TenantNotificationChannelPreferencesUpsertRequest` | `ArchLucid.Contracts\Notifications\TenantNotificationChannelPreferencesUpsertRequest.cs` | 0.00 | 6 | No |
| 24 | `ArchLucid.Contracts.Pilots.PilotRunDeltaSeverityCountResponse` | `ArchLucid.Contracts\Pilots\PilotRunDeltasResponse.cs` | 0.00 | 5 | No |
| 25 | `ArchLucid.Contracts.ProductLearning.LearningPlanningReportExportResponse` | `ArchLucid.Contracts\ProductLearning\LearningPlanningReportExportResponse.cs` | 0.00 | 9 | No |
| 26 | `ArchLucid.Contracts.ProductLearning.Planning.LearningPlanningReportArtifactRef` | `ArchLucid.Contracts\ProductLearning\Planning\LearningPlanningReportArtifactRef.cs` | 0.00 | 8 | No |
| 27 | `ArchLucid.Contracts.ProductLearning.ProductLearningArtifactOutcomeTrendsResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningArtifactOutcomeTrendsResponse.cs` | 0.00 | 5 | No |
| 28 | `ArchLucid.Contracts.ProductLearning.ProductLearningDashboardSummaryResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningDashboardSummaryResponse.cs` | 0.00 | 23 | No |
| 29 | `ArchLucid.Contracts.ProductLearning.ProductLearningImprovementOpportunitiesResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningImprovementOpportunitiesResponse.cs` | 0.00 | 5 | No |
| 30 | `ArchLucid.Contracts.ProductLearning.ProductLearningReportExportResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningReportExportResponse.cs` | 0.00 | 9 | No |
| 31 | `ArchLucid.Contracts.ProductLearning.ProductLearningTriageQueueResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningTriageQueueResponse.cs` | 0.00 | 5 | No |
| 32 | `ArchLucid.Contracts.Requests.CommitRunRequest` | `ArchLucid.Contracts\Requests\CommitRunRequest.cs` | 0.00 | 4 | No |
| 33 | `ArchLucid.Contracts.Requests.LlmCostTuningRequest` | `ArchLucid.Contracts\Requests\LlmCostTuningRequest.cs` | 0.00 | 4 | No |
| 34 | `ArchLucid.Contracts.Findings.FindingInspectEvidenceItem` | `ArchLucid.Contracts\Findings\FindingInspectEvidenceItem.cs` | 33.33 | 4 | No |
| 35 | `ArchLucid.Contracts.Audit.AuditEventPresentation` | `ArchLucid.Contracts\Audit\AuditEventPresentation.cs` | 38.10 | 26 | No |
| 36 | `ArchLucid.Contracts.Agents.AgentResultEvidenceFaithfulnessReport` | `ArchLucid.Contracts\Agents\AgentResultEvidenceFaithfulnessReport.cs` | 42.86 | 4 | No |
| 37 | `ArchLucid.Contracts.Findings.FindingInspectResponse` | `ArchLucid.Contracts\Findings\FindingInspectResponse.cs` | 48.78 | 21 | No |
| 38 | `ArchLucid.Contracts.Evolution.CandidateChangeSet` | `ArchLucid.Contracts\Evolution\CandidateChangeSet.cs` | 50.00 | 13 | No |
| 39 | `ArchLucid.Contracts.Pilots.ExplainabilityTraceEngineCompletenessPack` | `ArchLucid.Contracts\Pilots\ExplainabilityTraceCompletenessPack.cs` | 52.94 | 8 | No |
| 40 | `ArchLucid.Contracts.Pilots.PilotRunDeltasResponse` | `ArchLucid.Contracts\Pilots\PilotRunDeltasResponse.cs` | 57.14 | 12 | No |
| 41 | `ArchLucid.Contracts.Governance.PolicyPackDryRunSeverityCount` | `ArchLucid.Contracts\Governance\PolicyPackDryRunSeverityCount.cs` | 60.00 | 2 | No |
| 42 | `ArchLucid.Contracts.Evolution.ShadowExecutionPipelineOptions` | `ArchLucid.Contracts\Evolution\ShadowExecutionPipelineOptions.cs` | 62.50 | 3 | No |
| 43 | `ArchLucid.Contracts.Notifications.ExecDigestPreferencesResponse` | `ArchLucid.Contracts\Notifications\ExecDigestPreferencesResponse.cs` | 64.71 | 12 | No |
| 44 | `ArchLucid.Contracts.Architecture.ArchitectureLinkageEdge` | `ArchLucid.Contracts\Architecture\ArchitectureRunProvenanceGraph.cs` | 66.67 | 5 | No |
| 45 | `ArchLucid.Contracts.DecisionTraces.DecisionTrace` | `ArchLucid.Contracts\DecisionTraces\DecisionTrace.cs` | 66.67 | 2 | No |
| 46 | `ArchLucid.Contracts.Governance.PolicyPackDryRunThresholdOutcome` | `ArchLucid.Contracts\Governance\PolicyPackDryRunThresholdOutcome.cs` | 66.67 | 3 | No |
| 47 | `ArchLucid.Contracts.Pilots.SponsorEvidenceGovernanceOutcomes` | `ArchLucid.Contracts\Pilots\SponsorEvidenceGovernanceOutcomes.cs` | 66.67 | 2 | No |
| 48 | `ArchLucid.Contracts.ProductLearning.ProductLearningPilotSignalRecord` | `ArchLucid.Contracts\ProductLearning\ProductLearningPilotSignalRecord.cs` | 70.27 | 11 | No |
| 49 | `ArchLucid.Contracts.Pilots.ExplainabilityTraceCompletenessPack` | `ArchLucid.Contracts\Pilots\ExplainabilityTraceCompletenessPack.cs` | 71.43 | 2 | No |
| 50 | `ArchLucid.Contracts.Explanation.FindingLlmAuditResult` | `ArchLucid.Contracts\Explanation\FindingLlmAuditResult.cs` | 72.73 | 6 | No |
| 51 | `ArchLucid.Contracts.Trust.RunTrustEvidenceTopFindingRow` | `ArchLucid.Contracts\Trust\RunTrustEvidenceTopFindingRow.cs` | 72.73 | 3 | No |
| 52 | `ArchLucid.Contracts.Governance.GovernanceLineageFindingSummary` | `ArchLucid.Contracts\Governance\GovernanceLineageDtos.cs` | 75.00 | 4 | No |
| 53 | `ArchLucid.Contracts.Governance.GovernanceLineageRunSummary` | `ArchLucid.Contracts\Governance\GovernanceLineageDtos.cs` | 75.00 | 3 | No |
| 54 | `ArchLucid.Contracts.ProductLearning.RepeatedCommentTheme` | `ArchLucid.Contracts\ProductLearning\RepeatedCommentTheme.cs` | 75.00 | 3 | No |
| 55 | `ArchLucid.Contracts.Trust.TrustEvidenceFieldSnapshot` | `ArchLucid.Contracts\Trust\TrustEvidenceFieldSnapshot.cs` | 75.00 | 2 | No |
| 56 | `ArchLucid.Contracts.Agents.AgentOutputEvaluationResultInsert` | `ArchLucid.Contracts\Agents\AgentOutputEvaluationResultInsert.cs` | 77.27 | 5 | No |
| 57 | `ArchLucid.Contracts.Pilots.RecentPilotRunDeltaSummaryResponse` | `ArchLucid.Contracts\Pilots\RecentPilotRunDeltaSummaryResponse.cs` | 77.27 | 5 | No |
| 58 | `ArchLucid.Contracts.Trust.RunTrustEvidenceRouteRef` | `ArchLucid.Contracts\Trust\RunTrustEvidenceRouteRef.cs` | 77.78 | 2 | No |
| 59 | `ArchLucid.Contracts.Trust.RunTrustEvidenceCard` | `ArchLucid.Contracts\Trust\RunTrustEvidenceCard.cs` | 79.31 | 6 | No |
| 60 | `ArchLucid.Contracts.Agents.PatternEvidence` | `ArchLucid.Contracts\Agents\PatternEvidence.cs` | 80.00 | 3 | No |
| 61 | `ArchLucid.Contracts.Architecture.ArchitectureLinkageNode` | `ArchLucid.Contracts\Architecture\ArchitectureRunProvenanceGraph.cs` | 80.00 | 3 | No |
| 62 | `ArchLucid.Contracts.Governance.PreCommitGovernanceGateOptions` | `ArchLucid.Contracts\Governance\PreCommitGovernanceGateOptions.cs` | 80.00 | 2 | No |
| 63 | `ArchLucid.Contracts.Governance.PolicyPackDryRunResponse` | `ArchLucid.Contracts\Governance\PolicyPackDryRunResponse.cs` | 80.95 | 4 | No |
| 64 | `ArchLucid.Contracts.Pilots.SponsorEvidencePackResponse` | `ArchLucid.Contracts\Pilots\SponsorEvidencePackResponse.cs` | 81.25 | 3 | No |
| 65 | `ArchLucid.Contracts.ProductLearning.ArtifactOutcomeTrend` | `ArchLucid.Contracts\ProductLearning\ArtifactOutcomeTrend.cs` | 82.14 | 5 | No |
| 66 | `ArchLucid.Contracts.Evolution.ShadowExecutionRequest` | `ArchLucid.Contracts\Evolution\ShadowExecutionRequest.cs` | 83.33 | 1 | No |
| 67 | `ArchLucid.Contracts.ProductLearning.ProductLearningTriageOptions` | `ArchLucid.Contracts\ProductLearning\ProductLearningTriageOptions.cs` | 83.78 | 6 | No |
| 68 | `ArchLucid.Contracts.DecisionTraces.DecisionTraceJsonConverter` | `ArchLucid.Contracts\DecisionTraces\DecisionTraceJsonConverter.cs` | 84.21 | 6 | No |
| 69 | `ArchLucid.Contracts.Architecture.ArchitectureTraceTimelineEntry` | `ArchLucid.Contracts\Architecture\ArchitectureRunProvenanceGraph.cs` | 84.62 | 2 | No |
| 70 | `ArchLucid.Contracts.ValueReports.ValueReportReviewCycleSectionFormatter` | `ArchLucid.Contracts\ValueReports\ValueReportReviewCycleSectionFormatter.cs` | 86.32 | 13 | No |
| 71 | `ArchLucid.Contracts.Governance.PolicyPackGovernanceDryRunResult` | `ArchLucid.Contracts\Governance\PolicyPackGovernanceDryRunResult.cs` | 86.67 | 2 | No |
| 72 | `ArchLucid.Contracts.Architecture.RunRoiScorecardDto` | `ArchLucid.Contracts\Architecture\RunRoiScorecardDto.cs` | 87.50 | 2 | No |
| 73 | `ArchLucid.Contracts.Requests.ContextDocumentRequest` | `ArchLucid.Contracts\Requests\ContextDocumentRequest.cs` | 88.89 | 1 | No |
| 74 | `ArchLucid.Contracts.Evolution.CandidateChangeSetStep` | `ArchLucid.Contracts\Evolution\CandidateChangeSetStep.cs` | 90.00 | 1 | No |
| 75 | `ArchLucid.Contracts.Governance.GovernanceRationaleResult` | `ArchLucid.Contracts\Governance\GovernanceRationaleResult.cs` | 91.67 | 1 | No |
| 76 | `ArchLucid.Contracts.Ingestion.FastPathContextElementDto` | `ArchLucid.Contracts\Ingestion\FastPathContextPreviewDtos.cs` | 91.67 | 1 | No |
| 77 | `ArchLucid.Contracts.Governance.PolicyPackDryRunRunItem` | `ArchLucid.Contracts\Governance\PolicyPackDryRunRunItem.cs` | 92.31 | 1 | No |
| 78 | `ArchLucid.Contracts.Agents.PolicyEvidence` | `ArchLucid.Contracts\Agents\PolicyEvidence.cs` | 93.33 | 1 | No |
| 79 | `ArchLucid.Contracts.Architecture.ArchitectureRunProvenanceGraph` | `ArchLucid.Contracts\Architecture\ArchitectureRunProvenanceGraph.cs` | 93.33 | 1 | No |
| 80 | `ArchLucid.Contracts.Governance.GovernancePromotionRecord` | `ArchLucid.Contracts\Governance\GovernancePromotionRecord.cs` | 93.55 | 2 | No |
| 81 | `ArchLucid.Contracts.ProductLearning.ProductLearningAggregationSnapshot` | `ArchLucid.Contracts\ProductLearning\ProductLearningAggregationSnapshot.cs` | 93.75 | 1 | No |
| 82 | `ArchLucid.Contracts.Agents.ServiceCatalogEvidence` | `ArchLucid.Contracts\Agents\ServiceCatalogEvidence.cs` | 94.44 | 1 | No |
| 83 | `ArchLucid.Contracts.Architecture.RunSummary` | `ArchLucid.Contracts\Architecture\RunSummary.cs` | 94.44 | 1 | No |

### ArchLucid.Analyzers (82.18% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Analyzers.MutableStaticAnalyzer` | `ArchLucid.Analyzers\MutableStaticAnalyzer.cs` | 53.33 | 21 | No |
| 2 | `ArchLucid.Analyzers.TenantIdentityBoundaryAnalyzer` | `ArchLucid.Analyzers\TenantIdentityBoundaryAnalyzer.cs` | 56.63 | 36 | No |
| 3 | `ArchLucid.Analyzers.ForeachToLinqAnalyzer` | `ArchLucid.Analyzers\ForeachToLinqAnalyzer.cs` | 77.84 | 41 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Analyzers.MutableStaticAnalyzer` | `ArchLucid.Analyzers\MutableStaticAnalyzer.cs` | 53.33 | 21 | No |
| 2 | `ArchLucid.Analyzers.TenantIdentityBoundaryAnalyzer` | `ArchLucid.Analyzers\TenantIdentityBoundaryAnalyzer.cs` | 56.63 | 36 | No |
| 3 | `ArchLucid.Analyzers.ForeachToLinqAnalyzer` | `ArchLucid.Analyzers\ForeachToLinqAnalyzer.cs` | 77.84 | 41 | No |
| 4 | `ArchLucid.Analyzers.DirectHttpClientConstructionAnalyzer` | `ArchLucid.Analyzers\DirectHttpClientConstructionAnalyzer.cs` | 78.57 | 9 | No |
| 5 | `ArchLucid.Analyzers.NakedDateTimeAnalyzer` | `ArchLucid.Analyzers\NakedDateTimeAnalyzer.cs` | 81.82 | 10 | No |
| 6 | `ArchLucid.Analyzers.MissingCancellationTokenAnalyzer` | `ArchLucid.Analyzers\MissingCancellationTokenAnalyzer.cs` | 82.69 | 9 | No |
| 7 | `ArchLucid.Analyzers.RequireAuthorizationAnalyzer` | `ArchLucid.Analyzers\RequireAuthorizationAnalyzer.cs` | 89.16 | 9 | No |
| 8 | `ArchLucid.Analyzers.MutatingControllerAuditAnalyzer` | `ArchLucid.Analyzers\MutatingControllerAuditAnalyzer.cs` | 89.80 | 15 | No |
| 9 | `ArchLucid.Analyzers.ForeachToLinqMatch` | `ArchLucid.Analyzers\ForeachToLinqMatch.cs` | 90.91 | 1 | No |
| 10 | `ArchLucid.Analyzers.ForeachToLinqCodeFixProvider` | `ArchLucid.Analyzers\ForeachToLinqCodeFixProvider.cs` | 92.50 | 6 | No |

### ArchLucid.KnowledgeGraph (88.02% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotExtensions` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotExtensions.cs` | 0.00 | 29 | No |
| 2 | `ArchLucid.KnowledgeGraph.Caching.NonCachingGraphSnapshotProjectionCache` | `ArchLucid.KnowledgeGraph\Caching\NonCachingGraphSnapshotProjectionCache.cs` | 42.86 | 4 | No |
| 3 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotIndexedEdge` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotIndexedEdge.cs` | 50.00 | 3 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotExtensions` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotExtensions.cs` | 0.00 | 29 | No |
| 2 | `ArchLucid.KnowledgeGraph.Caching.NonCachingGraphSnapshotProjectionCache` | `ArchLucid.KnowledgeGraph\Caching\NonCachingGraphSnapshotProjectionCache.cs` | 42.86 | 4 | No |
| 3 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotIndexedEdge` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotIndexedEdge.cs` | 50.00 | 3 | No |
| 4 | `ArchLucid.KnowledgeGraph.Configuration.KnowledgeGraphLimitsOptions` | `ArchLucid.KnowledgeGraph\Configuration\KnowledgeGraphLimitsOptions.cs` | 66.67 | 2 | No |
| 5 | `ArchLucid.KnowledgeGraph.Models.GraphBuildResult` | `ArchLucid.KnowledgeGraph\Models\GraphBuildResult.cs` | 66.67 | 3 | No |
| 6 | `ArchLucid.KnowledgeGraph.Repositories.InMemoryGraphSnapshotRepository` | `ArchLucid.KnowledgeGraph\Repositories\InMemoryGraphSnapshotRepository.cs` | 75.00 | 8 | No |
| 7 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotNodesPage` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotNodesPage.cs` | 85.71 | 2 | No |
| 8 | `ArchLucid.KnowledgeGraph.Inference.GraphEdgeInferenceReasoningSummaries` | `ArchLucid.KnowledgeGraph\Inference\GraphEdgeInferenceReasoningSummaries.cs` | 88.00 | 3 | No |
| 9 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshot` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshot.cs` | 90.00 | 2 | No |
| 10 | `ArchLucid.KnowledgeGraph.Caching.GraphSnapshotProjectionMemoryCache` | `ArchLucid.KnowledgeGraph\Caching\GraphSnapshotProjectionMemoryCache.cs` | 93.55 | 2 | No |
| 11 | `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer` | `ArchLucid.KnowledgeGraph\Inference\DefaultGraphEdgeInferer.cs` | 93.68 | 11 | No |

### ArchLucid.Integrations.AzureDevOps (90.15% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Integrations.AzureDevOps.AzureDevOpsPullRequestDecorator` | `ArchLucid.Integrations.AzureDevOps\AzureDevOpsPullRequestDecorator.cs` | 77.78 | 30 | No |
| 2 | `ArchLucid.Integrations.AzureDevOps.AuthorityRunCompletedAzureDevOpsIntegrationEventHandler` | `ArchLucid.Integrations.AzureDevOps\AuthorityRunCompletedAzureDevOpsIntegrationEventHandler.cs` | 96.49 | 2 | No |
| 3 | `ArchLucid.Integrations.AzureDevOps.AuthorityRunCompletedFindingJsonDto` | `ArchLucid.Integrations.AzureDevOps\AuthorityRunCompletedFindingJsonDto.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Integrations.AzureDevOps.AzureDevOpsPullRequestDecorator` | `ArchLucid.Integrations.AzureDevOps\AzureDevOpsPullRequestDecorator.cs` | 77.78 | 30 | No |

### ArchLucid.Provenance (92.27% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Provenance.GraphEdgeVm` | `ArchLucid.Provenance\GraphViewModels.cs` | 42.86 | 8 | No |
| 2 | `ArchLucid.Provenance.GraphNodesPageResponse` | `ArchLucid.Provenance\GraphViewModels.cs` | 57.14 | 6 | No |
| 3 | `ArchLucid.Provenance.GraphNodeVm` | `ArchLucid.Provenance\GraphViewModels.cs` | 80.00 | 2 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Provenance.GraphEdgeVm` | `ArchLucid.Provenance\GraphViewModels.cs` | 42.86 | 8 | No |
| 2 | `ArchLucid.Provenance.GraphNodesPageResponse` | `ArchLucid.Provenance\GraphViewModels.cs` | 57.14 | 6 | No |
| 3 | `ArchLucid.Provenance.GraphNodeVm` | `ArchLucid.Provenance\GraphViewModels.cs` | 80.00 | 2 | No |
| 4 | `ArchLucid.Provenance.Services.ProvenanceGraphAlgorithms` | `ArchLucid.Provenance\Services\ProvenanceGraphAlgorithms.cs` | 83.58 | 11 | No |
| 5 | `ArchLucid.Provenance.ProvenanceEdge` | `ArchLucid.Provenance\ProvenanceEdge.cs` | 87.50 | 1 | No |

### ArchLucid.AgentSimulator (97.59% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 0.00 | 7 | No |
| 2 | `ArchLucid.AgentSimulator.Services.DeterministicAgentSimulator` | `ArchLucid.AgentSimulator\Services\DeterministicAgentSimulator.cs` | 100.00 | 0 | No |
| 3 | `ArchLucid.AgentSimulator.Services.FakeScenarioFactory` | `ArchLucid.AgentSimulator\Services\FakeScenarioFactory.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 0.00 | 7 | No |

### ArchLucid.Decisioning (22.30% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Decisioning.Advisory.Analysis.ImprovementSignalAnalyzer` | `ArchLucid.Decisioning\Advisory\Analysis\ImprovementSignalAnalyzer.cs` | 0.00 | 126 | No |
| 2 | `ArchLucid.Decisioning.Advisory.Delivery.DigestDeliveryAttempt` | `ArchLucid.Decisioning\Advisory\Delivery\DigestDeliveryAttempt.cs` | 0.00 | 25 | No |
| 3 | `ArchLucid.Decisioning.Advisory.Delivery.DigestDeliveryPayload` | `ArchLucid.Decisioning\Advisory\Delivery\DigestDeliveryPayload.cs` | 0.00 | 4 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Decisioning.Advisory.Analysis.ImprovementSignalAnalyzer` | `ArchLucid.Decisioning\Advisory\Analysis\ImprovementSignalAnalyzer.cs` | 0.00 | 126 | No |
| 2 | `ArchLucid.Decisioning.Advisory.Delivery.DigestDeliveryAttempt` | `ArchLucid.Decisioning\Advisory\Delivery\DigestDeliveryAttempt.cs` | 0.00 | 25 | No |
| 3 | `ArchLucid.Decisioning.Advisory.Delivery.DigestDeliveryPayload` | `ArchLucid.Decisioning\Advisory\Delivery\DigestDeliveryPayload.cs` | 0.00 | 4 | No |
| 4 | `ArchLucid.Decisioning.Advisory.Delivery.DigestEmailDeliveryChannel` | `ArchLucid.Decisioning\Advisory\Delivery\DigestEmailDeliveryChannel.cs` | 0.00 | 11 | No |
| 5 | `ArchLucid.Decisioning.Advisory.Delivery.DigestSlackWebhookDeliveryChannel` | `ArchLucid.Decisioning\Advisory\Delivery\DigestSlackWebhookDeliveryChannel.cs` | 0.00 | 16 | No |
| 6 | `ArchLucid.Decisioning.Advisory.Delivery.DigestTeamsWebhookDeliveryChannel` | `ArchLucid.Decisioning\Advisory\Delivery\DigestTeamsWebhookDeliveryChannel.cs` | 0.00 | 16 | No |
| 7 | `ArchLucid.Decisioning.Advisory.Learning.AdaptiveRecommendationScorer` | `ArchLucid.Decisioning\Advisory\Learning\AdaptiveRecommendationScorer.cs` | 0.00 | 27 | No |
| 8 | `ArchLucid.Decisioning.Advisory.Learning.AdaptiveScoringInput` | `ArchLucid.Decisioning\Advisory\Learning\AdaptiveScoringInput.cs` | 0.00 | 8 | No |
| 9 | `ArchLucid.Decisioning.Advisory.Learning.AdaptiveScoringResult` | `ArchLucid.Decisioning\Advisory\Learning\AdaptiveScoringResult.cs` | 0.00 | 13 | No |
| 10 | `ArchLucid.Decisioning.Advisory.Learning.RecommendationLearningAnalyzer` | `ArchLucid.Decisioning\Advisory\Learning\RecommendationLearningAnalyzer.cs` | 0.00 | 52 | No |
| 11 | `ArchLucid.Decisioning.Advisory.Learning.RecommendationOutcomeStats` | `ArchLucid.Decisioning\Advisory\Learning\RecommendationOutcomeStats.cs` | 0.00 | 16 | No |
| 12 | `ArchLucid.Decisioning.Advisory.Models.ImprovementRecommendation` | `ArchLucid.Decisioning\Advisory\Models\ImprovementRecommendation.cs` | 0.00 | 27 | No |
| 13 | `ArchLucid.Decisioning.Advisory.Models.ImprovementSignal` | `ArchLucid.Decisioning\Advisory\Models\ImprovementSignal.cs` | 0.00 | 17 | No |
| 14 | `ArchLucid.Decisioning.Advisory.Scheduling.AdvisoryScanExecution` | `ArchLucid.Decisioning\Advisory\Scheduling\AdvisoryScanExecution.cs` | 0.00 | 24 | No |
| 15 | `ArchLucid.Decisioning.Advisory.Scheduling.ArchitectureDigestBuilder` | `ArchLucid.Decisioning\Advisory\Scheduling\ArchitectureDigestBuilder.cs` | 0.00 | 62 | No |
| 16 | `ArchLucid.Decisioning.Advisory.Scheduling.SimpleScanScheduleCalculator` | `ArchLucid.Decisioning\Advisory\Scheduling\SimpleScanScheduleCalculator.cs` | 0.00 | 11 | No |
| 17 | `ArchLucid.Decisioning.Advisory.Services.ImprovementAdvisorService` | `ArchLucid.Decisioning\Advisory\Services\ImprovementAdvisorService.cs` | 0.00 | 52 | No |
| 18 | `ArchLucid.Decisioning.Advisory.Services.RecommendationGenerator` | `ArchLucid.Decisioning\Advisory\Services\RecommendationGenerator.cs` | 0.00 | 99 | No |
| 19 | `ArchLucid.Decisioning.Advisory.Workflow.RecommendationActionRequest` | `ArchLucid.Decisioning\Advisory\Workflow\RecommendationActionRequest.cs` | 0.00 | 6 | No |
| 20 | `ArchLucid.Decisioning.Alerts.AlertActionRequest` | `ArchLucid.Decisioning\Alerts\AlertActionRequest.cs` | 0.00 | 4 | No |
| 21 | `ArchLucid.Decisioning.Alerts.AlertEvaluationContext` | `ArchLucid.Decisioning\Alerts\AlertEvaluationContext.cs` | 0.00 | 21 | No |
| 22 | `ArchLucid.Decisioning.Alerts.AlertEvaluationContextFactory` | `ArchLucid.Decisioning\Alerts\AlertEvaluationContextFactory.cs` | 0.00 | 13 | No |
| 23 | `ArchLucid.Decisioning.Alerts.AlertEvaluationOutcome` | `ArchLucid.Decisioning\Alerts\AlertEvaluationOutcome.cs` | 0.00 | 3 | No |
| 24 | `ArchLucid.Decisioning.Alerts.AlertEvaluator` | `ArchLucid.Decisioning\Alerts\AlertEvaluator.cs` | 0.00 | 128 | No |
| 25 | `ArchLucid.Decisioning.Alerts.Composite.AlertMetricSnapshot` | `ArchLucid.Decisioning\Alerts\Composite\AlertMetricSnapshot.cs` | 0.00 | 12 | No |
| 26 | `ArchLucid.Decisioning.Alerts.Composite.AlertMetricSnapshotBuilder` | `ArchLucid.Decisioning\Alerts\Composite\AlertMetricSnapshotBuilder.cs` | 0.00 | 32 | No |
| 27 | `ArchLucid.Decisioning.Alerts.Composite.AlertSuppressionDecision` | `ArchLucid.Decisioning\Alerts\Composite\AlertSuppressionDecision.cs` | 0.00 | 10 | No |
| 28 | `ArchLucid.Decisioning.Alerts.Composite.CompositeAlertDeduplicationKeyBuilder` | `ArchLucid.Decisioning\Alerts\Composite\CompositeAlertDeduplicationKeyBuilder.cs` | 0.00 | 12 | No |
| 29 | `ArchLucid.Decisioning.Alerts.Composite.CompositeAlertEvaluationResult` | `ArchLucid.Decisioning\Alerts\Composite\CompositeAlertEvaluationResult.cs` | 0.00 | 3 | No |
| 30 | `ArchLucid.Decisioning.Alerts.Composite.CompositeAlertRuleEvaluator` | `ArchLucid.Decisioning\Alerts\Composite\CompositeAlertRuleEvaluator.cs` | 0.00 | 32 | No |
| 31 | `ArchLucid.Decisioning.Alerts.Delivery.AlertDeliveryPayload` | `ArchLucid.Decisioning\Alerts\Delivery\AlertDeliveryPayload.cs` | 0.00 | 4 | No |
| 32 | `ArchLucid.Decisioning.Alerts.Delivery.AlertEmailDeliveryChannel` | `ArchLucid.Decisioning\Alerts\Delivery\AlertEmailDeliveryChannel.cs` | 0.00 | 13 | No |
| 33 | `ArchLucid.Decisioning.Alerts.Delivery.AlertOnCallWebhookDeliveryChannel` | `ArchLucid.Decisioning\Alerts\Delivery\AlertOnCallWebhookDeliveryChannel.cs` | 0.00 | 16 | No |
| 34 | `ArchLucid.Decisioning.Alerts.Delivery.AlertSeverityComparer` | `ArchLucid.Decisioning\Alerts\Delivery\AlertSeverityComparer.cs` | 0.00 | 9 | No |
| 35 | `ArchLucid.Decisioning.Alerts.Delivery.AlertSlackWebhookDeliveryChannel` | `ArchLucid.Decisioning\Alerts\Delivery\AlertSlackWebhookDeliveryChannel.cs` | 0.00 | 18 | No |
| 36 | `ArchLucid.Decisioning.Alerts.Delivery.AlertTeamsWebhookDeliveryChannel` | `ArchLucid.Decisioning\Alerts\Delivery\AlertTeamsWebhookDeliveryChannel.cs` | 0.00 | 18 | No |
| 37 | `ArchLucid.Decisioning.Alerts.Simulation.RuleSimulationRequest` | `ArchLucid.Decisioning\Alerts\Simulation\RuleSimulationRequest.cs` | 0.00 | 19 | No |
| 38 | `ArchLucid.Decisioning.Alerts.Simulation.RuleSimulationResult` | `ArchLucid.Decisioning\Alerts\Simulation\RuleSimulationResult.cs` | 0.00 | 19 | No |
| 39 | `ArchLucid.Decisioning.Alerts.Simulation.SimulatedAlertOutcome` | `ArchLucid.Decisioning\Alerts\Simulation\SimulatedAlertOutcome.cs` | 0.00 | 25 | No |
| 40 | `ArchLucid.Decisioning.Alerts.Tuning.AlertNoiseScorer` | `ArchLucid.Decisioning\Alerts\Tuning\AlertNoiseScorer.cs` | 0.00 | 34 | No |
| 41 | `ArchLucid.Decisioning.Alerts.Tuning.NoiseScoreBreakdown` | `ArchLucid.Decisioning\Alerts\Tuning\NoiseScoreBreakdown.cs` | 0.00 | 13 | No |
| 42 | `ArchLucid.Decisioning.Alerts.Tuning.ThresholdCandidate` | `ArchLucid.Decisioning\Alerts\Tuning\ThresholdCandidate.cs` | 0.00 | 4 | No |
| 43 | `ArchLucid.Decisioning.Alerts.Tuning.ThresholdCandidateEvaluation` | `ArchLucid.Decisioning\Alerts\Tuning\ThresholdCandidateEvaluation.cs` | 0.00 | 6 | No |
| 44 | `ArchLucid.Decisioning.Alerts.Tuning.ThresholdRecommendationRequest` | `ArchLucid.Decisioning\Alerts\Tuning\ThresholdRecommendationRequest.cs` | 0.00 | 23 | No |
| 45 | `ArchLucid.Decisioning.Alerts.Tuning.ThresholdRecommendationResult` | `ArchLucid.Decisioning\Alerts\Tuning\ThresholdRecommendationResult.cs` | 0.00 | 15 | No |
| 46 | `ArchLucid.Decisioning.Alerts.Tuning.ThresholdRecommendationService` | `ArchLucid.Decisioning\Alerts\Tuning\ThresholdRecommendationService.cs` | 0.00 | 124 | No |
| 47 | `ArchLucid.Decisioning.Analysis.GraphCoverageAnalyzer` | `ArchLucid.Decisioning\Analysis\GraphCoverageAnalyzer.cs` | 0.00 | 113 | No |
| 48 | `ArchLucid.Decisioning.Analysis.PolicyCoverageResult` | `ArchLucid.Decisioning\Analysis\PolicyCoverageResult.cs` | 0.00 | 10 | No |
| 49 | `ArchLucid.Decisioning.Analysis.RequirementCoverageResult` | `ArchLucid.Decisioning\Analysis\RequirementCoverageResult.cs` | 0.00 | 12 | No |
| 50 | `ArchLucid.Decisioning.Analysis.SecurityCoverageResult` | `ArchLucid.Decisioning\Analysis\SecurityCoverageResult.cs` | 0.00 | 12 | No |
| 51 | `ArchLucid.Decisioning.Analysis.TopologyCoverageResult` | `ArchLucid.Decisioning\Analysis\TopologyCoverageResult.cs` | 0.00 | 19 | No |
| 52 | `ArchLucid.Decisioning.Comparison.ComparisonService` | `ArchLucid.Decisioning\Comparison\ComparisonService.cs` | 0.00 | 111 | No |
| 53 | `ArchLucid.Decisioning.Compliance.Evaluators.GraphComplianceEvaluator` | `ArchLucid.Decisioning\Compliance\Evaluators\GraphComplianceEvaluator.cs` | 0.00 | 46 | No |
| 54 | `ArchLucid.Decisioning.Compliance.Loaders.ComplianceRulePackValidator` | `ArchLucid.Decisioning\Compliance\Loaders\ComplianceRulePackValidator.cs` | 0.00 | 17 | No |
| 55 | `ArchLucid.Decisioning.Compliance.Loaders.FileComplianceRulePackLoader` | `ArchLucid.Decisioning\Compliance\Loaders\FileComplianceRulePackLoader.cs` | 0.00 | 34 | No |
| 56 | `ArchLucid.Decisioning.Compliance.Loaders.FileComplianceRulePackProvider` | `ArchLucid.Decisioning\Compliance\Loaders\FileComplianceRulePackProvider.cs` | 0.00 | 2 | No |
| 57 | `ArchLucid.Decisioning.Compliance.Models.ComplianceEvaluationResult` | `ArchLucid.Decisioning\Compliance\Models\ComplianceEvaluationResult.cs` | 0.00 | 3 | No |
| 58 | `ArchLucid.Decisioning.Compliance.Models.ComplianceRule` | `ArchLucid.Decisioning\Compliance\Models\ComplianceRule.cs` | 0.00 | 17 | No |
| 59 | `ArchLucid.Decisioning.Compliance.Models.ComplianceRuleDocument` | `ArchLucid.Decisioning\Compliance\Models\ComplianceRuleDocument.cs` | 0.00 | 17 | No |
| 60 | `ArchLucid.Decisioning.Compliance.Models.ComplianceRulePack` | `ArchLucid.Decisioning\Compliance\Models\ComplianceRulePack.cs` | 0.00 | 13 | No |
| 61 | `ArchLucid.Decisioning.Compliance.Models.ComplianceRulePackDocument` | `ArchLucid.Decisioning\Compliance\Models\ComplianceRulePackDocument.cs` | 0.00 | 9 | No |
| 62 | `ArchLucid.Decisioning.Compliance.Models.ComplianceViolation` | `ArchLucid.Decisioning\Compliance\Models\ComplianceViolation.cs` | 0.00 | 18 | No |
| 63 | `ArchLucid.Decisioning.Configuration.HumanReviewFindingOptions` | `ArchLucid.Decisioning\Configuration\HumanReviewFindingOptions.cs` | 0.00 | 6 | No |
| 64 | `ArchLucid.Decisioning.Findings.ExplanationFaithfulnessChecker` | `ArchLucid.Decisioning\Findings\ExplanationFaithfulnessChecker.cs` | 0.00 | 188 | No |
| 65 | `ArchLucid.Decisioning.Findings.Factories.FindingFactory` | `ArchLucid.Decisioning\Findings\Factories\FindingFactory.cs` | 0.00 | 122 | No |
| 66 | `ArchLucid.Decisioning.Findings.Factories.FindingPayloadConverter` | `ArchLucid.Decisioning\Findings\Factories\FindingPayloadConverter.cs` | 0.00 | 29 | No |
| 67 | `ArchLucid.Decisioning.Findings.FindingConfidenceCalculationResult` | `ArchLucid.Decisioning\Findings\FindingConfidenceCalculationResult.cs` | 0.00 | 1 | No |
| 68 | `ArchLucid.Decisioning.Findings.FindingConfidenceCalculator` | `ArchLucid.Decisioning\Findings\FindingConfidenceCalculator.cs` | 0.00 | 20 | No |
| 69 | `ArchLucid.Decisioning.Findings.FindingHumanReviewInitializer` | `ArchLucid.Decisioning\Findings\FindingHumanReviewInitializer.cs` | 0.00 | 17 | No |
| 70 | `ArchLucid.Decisioning.Findings.NullFindingsSnapshotEvaluationConfidenceEnricher` | `ArchLucid.Decisioning\Findings\NullFindingsSnapshotEvaluationConfidenceEnricher.cs` | 0.00 | 3 | No |
| 71 | `ArchLucid.Decisioning.Findings.Payloads.PolicyApplicabilityFindingPayload` | `ArchLucid.Decisioning\Findings\Payloads\PolicyApplicabilityFindingPayload.cs` | 0.00 | 10 | No |
| 72 | `ArchLucid.Decisioning.Findings.Payloads.PolicyCoverageFindingPayload` | `ArchLucid.Decisioning\Findings\Payloads\PolicyCoverageFindingPayload.cs` | 0.00 | 7 | No |
| 73 | `ArchLucid.Decisioning.Findings.Payloads.RequirementCoverageFindingPayload` | `ArchLucid.Decisioning\Findings\Payloads\RequirementCoverageFindingPayload.cs` | 0.00 | 9 | No |
| 74 | `ArchLucid.Decisioning.Findings.Payloads.SecurityControlFindingPayload` | `ArchLucid.Decisioning\Findings\Payloads\SecurityControlFindingPayload.cs` | 0.00 | 8 | No |
| 75 | `ArchLucid.Decisioning.Findings.Payloads.SecurityCoverageFindingPayload` | `ArchLucid.Decisioning\Findings\Payloads\SecurityCoverageFindingPayload.cs` | 0.00 | 9 | No |
| 76 | `ArchLucid.Decisioning.Findings.Payloads.TopologyCoverageFindingPayload` | `ArchLucid.Decisioning\Findings\Payloads\TopologyCoverageFindingPayload.cs` | 0.00 | 8 | No |
| 77 | `ArchLucid.Decisioning.Findings.Payloads.TopologyGapFindingPayload` | `ArchLucid.Decisioning\Findings\Payloads\TopologyGapFindingPayload.cs` | 0.00 | 6 | No |
| 78 | `ArchLucid.Decisioning.Governance.PolicyPacks.ComplianceRulePackGovernanceFilter` | `ArchLucid.Decisioning\Governance\PolicyPacks\ComplianceRulePackGovernanceFilter.cs` | 0.00 | 17 | No |
| 79 | `ArchLucid.Decisioning.Governance.PolicyPacks.EffectiveGovernanceLoader` | `ArchLucid.Decisioning\Governance\PolicyPacks\EffectiveGovernanceLoader.cs` | 0.00 | 6 | No |
| 80 | `ArchLucid.Decisioning.Governance.PolicyPacks.EffectivePolicyPackSet` | `ArchLucid.Decisioning\Governance\PolicyPacks\EffectivePolicyPackSet.cs` | 0.00 | 9 | No |
| 81 | `ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackGovernanceFilter` | `ArchLucid.Decisioning\Governance\PolicyPacks\PolicyPackGovernanceFilter.cs` | 0.00 | 8 | No |
| 82 | `ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackManagementService` | `ArchLucid.Decisioning\Governance\PolicyPacks\PolicyPackManagementService.cs` | 0.00 | 181 | No |
| 83 | `ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackResolver` | `ArchLucid.Decisioning\Governance\PolicyPacks\PolicyPackResolver.cs` | 0.00 | 27 | No |
| 84 | `ArchLucid.Decisioning.Governance.PolicyPacks.RequestScopedCachingEffectiveGovernanceLoader` | `ArchLucid.Decisioning\Governance\PolicyPacks\RequestScopedCachingEffectiveGovernanceLoader.cs` | 0.00 | 17 | No |
| 85 | `ArchLucid.Decisioning.Governance.PolicyPacks.ResolvedPolicyPack` | `ArchLucid.Decisioning\Governance\PolicyPacks\ResolvedPolicyPack.cs` | 0.00 | 10 | No |
| 86 | `ArchLucid.Decisioning.Governance.Resolution.EffectiveGovernanceResolutionResult` | `ArchLucid.Decisioning\Governance\Resolution\EffectiveGovernanceResolutionResult.cs` | 0.00 | 18 | No |
| 87 | `ArchLucid.Decisioning.Governance.Resolution.EffectiveGovernanceResolver` | `ArchLucid.Decisioning\Governance\Resolution\EffectiveGovernanceResolver.cs` | 0.00 | 281 | No |
| 88 | `ArchLucid.Decisioning.Governance.Resolution.GovernanceConflictRecord` | `ArchLucid.Decisioning\Governance\Resolution\GovernanceConflictRecord.cs` | 0.00 | 11 | No |
| 89 | `ArchLucid.Decisioning.Governance.Resolution.GovernanceResolutionCandidate` | `ArchLucid.Decisioning\Governance\Resolution\GovernanceResolutionCandidate.cs` | 0.00 | 18 | No |
| 90 | `ArchLucid.Decisioning.Governance.Resolution.GovernanceResolutionDecision` | `ArchLucid.Decisioning\Governance\Resolution\GovernanceResolutionDecision.cs` | 0.00 | 17 | No |
| 91 | `ArchLucid.Decisioning.Governance.Resolution.GovernanceScopeLevel` | `ArchLucid.Decisioning\Governance\Resolution\GovernanceScopeLevel.cs` | 0.00 | 4 | No |
| 92 | `ArchLucid.Decisioning.Governance.Resolution.PolicyAssignmentPrecedence` | `ArchLucid.Decisioning\Governance\Resolution\PolicyAssignmentPrecedence.cs` | 0.00 | 10 | No |
| 93 | `ArchLucid.Decisioning.Manifest.AuthorityCommitProjectionBuilder` | `ArchLucid.Decisioning\Manifest\AuthorityCommitProjectionBuilder.cs` | 0.00 | 61 | No |
| 94 | `ArchLucid.Decisioning.Manifest.Builders.DefaultGoldenManifestBuilder` | `ArchLucid.Decisioning\Manifest\Builders\DefaultGoldenManifestBuilder.cs` | 0.00 | 382 | No |
| 95 | `ArchLucid.Decisioning.Manifest.Mapping.ContractGoldenManifestMapper` | `ArchLucid.Decisioning\Manifest\Mapping\ContractGoldenManifestMapper.cs` | 0.00 | 57 | No |
| 96 | `ArchLucid.Decisioning.Manifest.Mapping.ContractGoldenManifestPersistence` | `ArchLucid.Decisioning\Manifest\Mapping\ContractGoldenManifestPersistence.cs` | 0.00 | 24 | No |
| 97 | `ArchLucid.Decisioning.Merge.ComplexityDecisionStrategy` | `ArchLucid.Decisioning\Merge\ComplexityDecisionStrategy.cs` | 0.00 | 53 | No |
| 98 | `ArchLucid.Decisioning.Merge.DecisionStrategyParameters` | `ArchLucid.Decisioning\Merge\DecisionStrategyParameters.cs` | 0.00 | 23 | No |
| 99 | `ArchLucid.Decisioning.Merge.SecurityControlsDecisionStrategy` | `ArchLucid.Decisioning\Merge\SecurityControlsDecisionStrategy.cs` | 0.00 | 49 | No |
| 100 | `ArchLucid.Decisioning.Merge.TopologyAcceptanceDecisionStrategy` | `ArchLucid.Decisioning\Merge\TopologyAcceptanceDecisionStrategy.cs` | 0.00 | 53 | No |
| 101 | `ArchLucid.Decisioning.Models.DecisionRule` | `ArchLucid.Decisioning\Models\DecisionRule.cs` | 0.00 | 16 | No |
| 102 | `ArchLucid.Decisioning.Models.DecisionRuleSet` | `ArchLucid.Decisioning\Models\DecisionRuleSet.cs` | 0.00 | 35 | No |
| 103 | `ArchLucid.Decisioning.Models.FindingRecordMetadataPage` | `ArchLucid.Decisioning\Models\FindingRecordMetadataRows.cs` | 0.00 | 1 | No |
| 104 | `ArchLucid.Decisioning.Models.FindingRecordMetadataRow` | `ArchLucid.Decisioning\Models\FindingRecordMetadataRows.cs` | 0.00 | 9 | No |
| 105 | `ArchLucid.Decisioning.Rules.InMemoryDecisionRuleProvider` | `ArchLucid.Decisioning\Rules\InMemoryDecisionRuleProvider.cs` | 0.00 | 100 | No |
| 106 | `ArchLucid.Decisioning.Services.ComplianceFindingEngine` | `ArchLucid.Decisioning\Services\ComplianceFindingEngine.cs` | 0.00 | 57 | No |
| 107 | `ArchLucid.Decisioning.Services.FindingPayloadValidator` | `ArchLucid.Decisioning\Services\FindingPayloadValidator.cs` | 0.00 | 45 | No |
| 108 | `ArchLucid.Decisioning.Services.FindingsOrchestrator` | `ArchLucid.Decisioning\Services\FindingsOrchestrator.cs` | 0.00 | 98 | No |
| 109 | `ArchLucid.Decisioning.Services.GoldenManifestValidator` | `ArchLucid.Decisioning\Services\GoldenManifestValidator.cs` | 0.00 | 27 | No |
| 110 | `ArchLucid.Decisioning.Services.ManifestHashService` | `ArchLucid.Decisioning\Services\ManifestHashService.cs` | 0.00 | 47 | No |
| 111 | `ArchLucid.Decisioning.Services.PolicyApplicabilityFindingEngine` | `ArchLucid.Decisioning\Services\PolicyApplicabilityFindingEngine.cs` | 0.00 | 34 | No |
| 112 | `ArchLucid.Decisioning.Services.PolicyCoverageFindingEngine` | `ArchLucid.Decisioning\Services\PolicyCoverageFindingEngine.cs` | 0.00 | 77 | No |
| 113 | `ArchLucid.Decisioning.Services.RequirementCoverageFindingEngine` | `ArchLucid.Decisioning\Services\RequirementCoverageFindingEngine.cs` | 0.00 | 45 | No |
| 114 | `ArchLucid.Decisioning.Services.RequirementFindingEngine` | `ArchLucid.Decisioning\Services\RequirementFindingEngine.cs` | 0.00 | 58 | No |
| 115 | `ArchLucid.Decisioning.Services.SecurityBaselineFindingEngine` | `ArchLucid.Decisioning\Services\SecurityBaselineFindingEngine.cs` | 0.00 | 68 | No |
| 116 | `ArchLucid.Decisioning.Services.SecurityCoverageFindingEngine` | `ArchLucid.Decisioning\Services\SecurityCoverageFindingEngine.cs` | 0.00 | 49 | No |
| 117 | `ArchLucid.Decisioning.Services.TopologyCoverageFindingEngine` | `ArchLucid.Decisioning\Services\TopologyCoverageFindingEngine.cs` | 0.00 | 86 | No |
| 118 | `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery` | `ArchLucid.Decisioning\Plugins\FindingEnginePluginDiscovery.cs` | 3.66 | 79 | No |
| 119 | `ArchLucid.Decisioning.Services.RuleBasedDecisionEngine` | `ArchLucid.Decisioning\Services\RuleBasedDecisionEngine.cs` | 10.20 | 44 | No |
| 120 | `ArchLucid.Decisioning.Repositories.InMemoryFindingsSnapshotRepository` | `ArchLucid.Decisioning\Repositories\InMemoryFindingsSnapshotRepository.cs` | 16.47 | 71 | No |
| 121 | `ArchLucid.Decisioning.Merge.DecisionEngineV2` | `ArchLucid.Decisioning\Merge\DecisionEngineV2.cs` | 17.14 | 29 | No |
| 122 | `ArchLucid.Decisioning.Merge.DecisionNodeManifestMerger` | `ArchLucid.Decisioning\Merge\DecisionNodeManifestMerger.cs` | 18.99 | 64 | No |
| 123 | `ArchLucid.Decisioning.Findings.FindingExplainabilityNarrativeBuilder` | `ArchLucid.Decisioning\Findings\FindingExplainabilityNarrativeBuilder.cs` | 21.15 | 82 | No |
| 124 | `ArchLucid.Decisioning.Findings.Serialization.FindingsSnapshotMigrator` | `ArchLucid.Decisioning\Findings\Serialization\FindingsSnapshotMigrator.cs` | 24.24 | 25 | No |
| 125 | `ArchLucid.Decisioning.Advisory.Models.ImprovementPlan` | `ArchLucid.Decisioning\Advisory\Models\ImprovementPlan.cs` | 50.00 | 8 | No |
| 126 | `ArchLucid.Decisioning.Models.FindingEngineFailure` | `ArchLucid.Decisioning\Models\FindingEngineFailure.cs` | 50.00 | 6 | No |
| 127 | `ArchLucid.Decisioning.Validation.PassthroughSchemaValidationService` | `ArchLucid.Decisioning\Validation\PassthroughSchemaValidationService.cs` | 50.00 | 3 | No |
| 128 | `ArchLucid.Decisioning.Advisory.Learning.RecommendationLearningProfile` | `ArchLucid.Decisioning\Advisory\Learning\RecommendationLearningProfile.cs` | 53.33 | 14 | No |
| 129 | `ArchLucid.Decisioning.Repositories.InMemoryGoldenManifestRepository` | `ArchLucid.Decisioning\Repositories\InMemoryGoldenManifestRepository.cs` | 57.69 | 22 | No |
| 130 | `ArchLucid.Decisioning.Validation.SchemaValidationService` | `ArchLucid.Decisioning\Validation\SchemaValidationService.cs` | 58.54 | 51 | No |
| 131 | `ArchLucid.Decisioning.Advisory.Workflow.RecommendationRecord` | `ArchLucid.Decisioning\Advisory\Workflow\RecommendationRecord.cs` | 59.62 | 21 | No |
| 132 | `ArchLucid.Decisioning.Merge.DecisionMergeInputGate` | `ArchLucid.Decisioning\Merge\DecisionMergeInputGate.cs` | 65.96 | 16 | No |
| 133 | `ArchLucid.Decisioning.Findings.ExplanationFaithfulnessReport` | `ArchLucid.Decisioning\Findings\ExplanationFaithfulnessReport.cs` | 66.67 | 2 | No |
| 134 | `ArchLucid.Decisioning.Findings.TraceConfidenceLabels` | `ArchLucid.Decisioning\Findings\TraceConfidenceLabels.cs` | 66.67 | 1 | No |
| 135 | `ArchLucid.Decisioning.Alerts.Delivery.AlertRoutingSubscription` | `ArchLucid.Decisioning\Alerts\Delivery\AlertRoutingSubscription.cs` | 70.00 | 9 | No |
| 136 | `ArchLucid.Decisioning.Merge.ManifestGovernanceMerger` | `ArchLucid.Decisioning\Merge\ManifestGovernanceMerger.cs` | 70.83 | 21 | No |
| 137 | `ArchLucid.Decisioning.Alerts.AlertRecord` | `ArchLucid.Decisioning\Alerts\AlertRecord.cs` | 72.09 | 12 | No |
| 138 | `ArchLucid.Decisioning.Validation.SchemaValidationError` | `ArchLucid.Decisioning\Validation\SchemaValidationResult.cs` | 75.00 | 2 | No |
| 139 | `ArchLucid.Decisioning.Findings.Serialization.FindingJsonConverter` | `ArchLucid.Decisioning\Findings\Serialization\FindingJsonConverter.cs` | 77.86 | 31 | No |
| 140 | `ArchLucid.Decisioning.Models.FindingsSnapshot` | `ArchLucid.Decisioning\Models\FindingsSnapshot.cs` | 78.57 | 6 | No |
| 141 | `ArchLucid.Decisioning.Merge.AgentProposalManifestMerger` | `ArchLucid.Decisioning\Merge\AgentProposalManifestMerger.cs` | 80.20 | 40 | No |
| 142 | `ArchLucid.Decisioning.Merge.DecisionMergeResult` | `ArchLucid.Decisioning\Merge\DecisionMergeResult.cs` | 81.25 | 3 | No |
| 143 | `ArchLucid.Decisioning.Advisory.Delivery.DigestSubscription` | `ArchLucid.Decisioning\Advisory\Delivery\DigestSubscription.cs` | 81.48 | 5 | No |
| 144 | `ArchLucid.Decisioning.Manifest.AuthorityManifestRiskPosture` | `ArchLucid.Decisioning\Manifest\AuthorityManifestRiskPosture.cs` | 81.48 | 5 | No |
| 145 | `ArchLucid.Decisioning.Validation.SchemaValidationOptions` | `ArchLucid.Decisioning\Validation\SchemaValidationOptions.cs` | 85.00 | 3 | No |
| 146 | `ArchLucid.Decisioning.Validation.SchemaValidationResult` | `ArchLucid.Decisioning\Validation\SchemaValidationResult.cs` | 85.71 | 1 | No |
| 147 | `ArchLucid.Decisioning.Merge.DecisionEngineService` | `ArchLucid.Decisioning\Merge\DecisionEngineService.cs` | 89.80 | 5 | No |
| 148 | `ArchLucid.Decisioning.Findings.TraceCompletenessScore` | `ArchLucid.Decisioning\Findings\TraceCompletenessScore.cs` | 91.30 | 2 | No |
| 149 | `ArchLucid.Decisioning.Findings.ExplainabilityTraceCompletenessAnalyzer` | `ArchLucid.Decisioning\Findings\ExplainabilityTraceCompletenessAnalyzer.cs` | 93.27 | 7 | No |
| 150 | `ArchLucid.Decisioning.Findings.FindingPayloadRegistry` | `ArchLucid.Decisioning\Findings\FindingPayloadRegistry.cs` | 93.33 | 1 | No |
| 151 | `ArchLucid.Decisioning.Findings.EngineTraceCompleteness` | `ArchLucid.Decisioning\Findings\EngineTraceCompleteness.cs` | 94.44 | 1 | No |

### ArchLucid.Api.Client (100.00% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Client.Generated.ArchLucidApiClient` | `ArchLucid.Api.Client\ArchLucidApiClientSerializerSettings.cs` | 100.00 | 0 | No |
| 2 | `ArchLucid.Api.Client.Generated.FileParameter` | `ArchLucid.Api.Client\FileParameter.cs` | 100.00 | 0 | No |
| 3 | `ArchLucid.Api.Client.Generated.ProblemDetails` | `ArchLucid.Api.Client\ProblemDetails.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

_No classes below 95% line coverage in Cobertura for this assembly._

## Merged totals (reference)

- **Merged line coverage:** 57.72%
- **Merged branch coverage:** 45.32%

## How to refresh

```powershell
# Remove old shards so ReportGenerator does not merge stale + new Cobertura files.
Remove-Item -Recurse -Force .\coverage-gap-1a -ErrorAction SilentlyContinue
dotnet test ArchLucid.sln -c Release --settings coverage.runsettings `
  --collect:"XPlat Code Coverage" --results-directory .\coverage-gap-1a
dotnet tool restore
dotnet reportgenerator "-reports:coverage-gap-1a/**/coverage.cobertura.xml" "-targetdir:coverage-gap-1a/merged" "-reporttypes:Cobertura"
python scripts/ci/coverage_gap_analysis.py
# Or: gh run download <run-id> -n coverage-merged-cobertura -D .\ci-cov
#     python scripts/ci/coverage_gap_analysis.py --cobertura .\ci-cov\Cobertura.xml
```
