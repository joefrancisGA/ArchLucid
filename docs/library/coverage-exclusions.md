> **Scope:** Contributor-reference — Code Coverage Exclusions - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Code Coverage Exclusions

This document describes the classes and methods excluded from code coverage via `[ExcludeFromCodeCoverage]` and the justification for each exclusion.

## Enforced CI coverage gates

After the full-solution run, ReportGenerator merges Coverlet fragments to **`Cobertura.xml`**; **`scripts/ci/assert_merged_line_coverage_min.py`** enforces the floors below in **`.github/workflows/ci.yml`** job **`.NET: merge coverage + gates`** (`dotnet-coverage-merge`). That job unions **corset fast-core** Cobertura (`coverage-fast-core-*` artifacts) with **full-regression** unit/libs/slow shards. Parsing and the product filter are in **`scripts/ci/coverage_cobertura.py`**. **`is_product_archlucid_package()`** applies the per-package gate only to production **`ArchLucid.*`** assemblies (excludes test projects and **`ArchLucid.TestSupport`**); packages with zero coverable `<line/>` rows are skipped.

| Metric | Threshold | Script | CI job | Failure behavior |
|--------|-----------|--------|--------|------------------|
| Merged **line** | **76%** (RC27: above CI **#2938** ~**74.94%** and aligned with run [31330145538](https://github.com/joefrancisGA/ArchLucid/actions/runs/31330145538) ~**75.36%** + `*PackageCoverageBatchRc27Tests` uplift; target V1.1 **95%**) | [`scripts/ci/assert_merged_line_coverage_min.py`](../../scripts/ci/assert_merged_line_coverage_min.py) (positional **`76`** in **`.github/workflows/ci.yml`** `dotnet-coverage-merge`) | `.NET: merge coverage + gates` (`dotnet-coverage-merge`) | Exit **1** if root `line-rate` × 100 is below the floor. |
| Merged **branch** | **60%** (above CI **#2938** ~**59.67%**; RC27 measured ~**60.17%**) | same (`--min-branch-pct 60`) | same | Exit **1** if root `branch-rate` × 100 is below the floor. |
| Per-product **line** | **89%** (RC28 ratchet) | same (`--min-package-line-pct 89`; script default **60**) | same | Exit **1** if any gated **`ArchLucid.*`** product package is below the floor or has coverable lines but missing `line-rate`. **`--skip-package-line-gate`** for **`ArchLucid.Api`** (Integration HTTP tests without Coverlet on integration shards), **`ArchLucid.Mcp`**, **`ArchLucid.Backfill.Cli`**, and RC interim skips for **`ArchLucid.Cli`**, **`ArchLucid.Host.Core`**, **`ArchLucid.Persistence`**, **`ArchLucid.Application`**, **`ArchLucid.AgentRuntime`**, **`ArchLucid.Host.Composition`** until coverage batches close the gap. |

**Ratchet (merged line):** **[`.coverage-floor`](../../.coverage-floor)** is the committed anchor (**78.00**; effective minimum **76%** with default **2%** slack, matching the hard floor); **`assert_coverage_floor_ratchet.py`** runs in **`dotnet-coverage-merge`** after the merged-line floor. Target ratchet path: **76 → 78 → 95%** (V1.1). See **[`V1_DEFERRED.md`](V1_DEFERRED.md)**.

**Advisory per-package band (non-blocking):** When **`--warn-below-package-line-pct`** (default **70**) is greater than **`--min-package-line-pct`**, packages that **pass** the merge floor but sit **below** the advisory ceiling get plain-text lines written to **`--annotations-file`** (e.g. **`coverage-annotations-assert.txt`** in the **`coverage-metrics`** artifact). The **`coverage-pr-comment`** job appends that file to **`coverage-annotations.txt`** and emits each line as a GitHub **`::warning::`** for visibility. This does **not** fail the build.

**Exit 2** (script-wide): merged file missing/unparseable, or root **`line-rate`** or **`branch-rate`** missing so gates cannot be evaluated without silently passing.

**Rationale:** **76 / 60 / 86** on merged Cobertura (`dotnet-coverage-merge` is warn-only via `continue-on-error`), with **`.coverage-floor`** ratchet enabled on merged line. RC27 added `*PackageCoverageBatchRc27Tests` for Core/Contracts/Retrieval/ArtifactSynthesis (package gate) plus Application/Persistence/Host.Core/AgentRuntime (merged uplift). Six large packages remain skipped at the package floor until further batches land; **`ArchLucid.Api`** remains skipped until Integration-category HTTP tests are collected on Coverlet shards (see **`test.runsettings`** vs **`coverage.runsettings`** in **`.github/workflows/ci.yml`**). If CI is red on any gate, add tests (or justified **`[ExcludeFromCodeCoverage]`** per **Exclusion Policy** below), then re-run full regression — ratchet floors upward only with explicit sign-off.

**PR comment:** **`scripts/ci/build_coverage_pr_comment.py`** lists any product **`ArchLucid.*`** package under the per-package merge floor as the **same CI gate** as [`assert_merged_line_coverage_min.py`](../../scripts/ci/assert_merged_line_coverage_min.py) on merged Cobertura (not a separate “warning” threshold).

**Exclusions in `coverage.runsettings`:** Tier-5 excludes (generated **OpenAPI** client, **NSwag** output, etc.) shrink denominators for merged Cobertura; gates still apply to the merged tree. **`ArchLucid.Worker/Program.cs`** is also excluded (**composition root**; logic is covered in `Host.Composition` / `Host.Core`). See the **`coverage.runsettings`** file at repo root for the current exclude list.

**Stryker:** Scheduled mutation runs use multiple **`stryker-config*.json`** files (Persistence, Application, Decisioning, AgentRuntime); baseline scores are asserted via **`scripts/ci/assert_stryker_score_vs_baseline.py`** against **`stryker-baselines.json`**. Narrative: **[MUTATION_TESTING_STRYKER.md](MUTATION_TESTING_STRYKER.md)**.

## Exclusion Policy

Code is excluded from coverage only when:

1. It is a **thin wrapper** around an external SDK or service that cannot be exercised without a live external dependency (e.g., Azure OpenAI, SQL Server, external CLI tools).
2. It is a **pure data-transfer object** (DTO) used for Dapper row mapping with no logic (auto-properties only).
3. It is **application startup wiring** that is exercised by integration tests against `WebApplicationFactory` but not by unit tests.
4. The effort to unit-test the code **exceeds the risk** it represents, and the code is covered by integration or E2E tests instead.

Code with testable pure logic is **never** excluded, even when it lives in a class that also has untestable infrastructure code. In those cases, only the untestable method is excluded (e.g., `SqlSchemaBootstrapper.EnsureSchemaAsync`).

Exclusions change Cobertura denominators; CI still enforces **merged line**, **merged branch**, and **per-product line** gates on the merged report (see **Enforced CI coverage gates**).

---

## Category 1: Azure SDK / External Service Thin Wrappers

These classes delegate directly to Azure SDKs or HTTP clients with minimal or no branching logic. Testing them requires live Azure endpoints or HTTP servers.

| Class | Assembly | Justification |
|-------|----------|---------------|
| `AzureOpenAiCompletionClient` | AgentRuntime | Wraps `Azure.AI.OpenAI.ChatClient` |
| `AzureOpenAiEmbeddingClient` | Retrieval | Wraps `Azure.AI.OpenAI.EmbeddingClient` |
| `AzureOpenAiEmbeddingService` | Retrieval | Passthrough adapter over `IOpenAiEmbeddingClient` |
| `AzureAiSearchVectorIndex` | Retrieval | Passthrough adapter over `IAzureSearchClient` |
| `NotConfiguredAzureSearchClient` | Retrieval | Sentinel; every method throws `InvalidOperationException` |
| `HttpWebhookPoster` | Api | POSTs JSON via `IHttpClientFactory`; delivery channels mock `IWebhookPoster` |
| `HostedAwsExtractorClient` | Integrations.AwsExtractor | AWS STS AssumeRoleWithWebIdentity + Resource Explorer search; exercised via hosted-run integration tests with live AWS |
| `AzureManagedIdentityAwsWebIdentityTokenProvider` | Integrations.AwsExtractor | Azure `ManagedIdentityCredential` token exchange for AWS web identity |
| `HostedGcpExtractorClient` | Integrations.GcpExtractor | GCP Workload Identity + Cloud Asset Inventory search; exercised via hosted-run integration tests with live GCP |
| `AzureManagedIdentityGcpSubjectTokenProvider` | Integrations.GcpExtractor | Azure `ManagedIdentityCredential` subject token for GCP WIF |

## Category 2: Configuration / Options DTOs

| Class | Assembly | Justification |
|-------|----------|---------------|
| `AzureOpenAiOptions` | AgentRuntime | Config-binding DTO (`IOptions<T>`) with no logic |
| `SqlServerOptions` / nested settings | Persistence | Config-binding DTO (`IOptions<T>`) with no logic |

## Category 3: SQL Connection / RLS Infrastructure

These classes open live SQL Server connections, execute `sp_set_session_context`, or manage `SqlTransaction` lifecycle. They require a running SQL Server instance.

| Class | Assembly | Justification |
|-------|----------|---------------|
| `SqlConnectionFactory` | Persistence | Opens `SqlConnection` |
| `SqlConnectionFactory` | Data | Opens `SqlConnection` via `IConfiguration` |
| `RlsSessionContextApplicator` | Persistence | Executes `sp_set_session_context` via `SqlCommand` |
| `SessionContextSqlConnectionFactory` | Persistence | Decorator over `ResilientSqlConnectionFactory` + RLS applicator |
| `DapperArchLucidUnitOfWork` | Persistence | Wraps `IDbConnection`/`IDbTransaction` commit/rollback |
| `DapperArchLucidUnitOfWorkFactory` | Persistence | Opens connection and begins transaction |

**Note:** `ResilientSqlConnectionFactory` is **not** excluded because its `ComputeDelay` method contains testable exponential-backoff logic.

## Category 4: SQL-Dependent Repository Implementations

All Dapper/SQL repository classes that execute queries against SQL Server. Each implements an interface that has a corresponding `InMemory*` implementation tested by unit tests.

### ArchLucid.Persistence (29 classes)

- `DapperProductLearningPlanningRepository`
- `DapperProductLearningPilotSignalRepository`
- `DapperPolicyPackAssignmentRepository`, `DapperPolicyPackRepository`, `DapperPolicyPackVersionRepository`
- `DapperConversationThreadRepository`, `DapperConversationMessageRepository`
- `DapperArchitectureDigestRepository`, `DapperRecommendationRepository`, `DapperRecommendationLearningProfileRepository`, `DapperDigestSubscriptionRepository`, `DapperDigestDeliveryAttemptRepository`, `DapperAdvisoryScanScheduleRepository`, `DapperAdvisoryScanExecutionRepository`
- `DapperCompositeAlertRuleRepository`, `DapperAlertRuleRepository`, `DapperAlertRoutingSubscriptionRepository`, `DapperAlertRecordRepository`, `DapperAlertDeliveryAttemptRepository`
- `DapperAuditRepository`
- `DapperRetrievalIndexingOutboxRepository`
- `SqlRunRepository`, `SqlFindingsSnapshotRepository`, `SqlDecisionTraceRepository`, `SqlGraphSnapshotRepository`, `SqlArtifactBundleRepository`, `SqlGoldenManifestRepository`, `SqlContextSnapshotRepository`
- `SqlProvenanceSnapshotRepository`

### ArchLucid.Persistence — workflow Dapper repositories (`ArchLucid.Persistence.Data.Repositories`, 17 classes)

- `AgentEvaluationRepository`, `AgentEvidencePackageRepository`, `AgentExecutionTraceRepository`, `AgentResultRepository`, `AgentTaskRepository`
- `ArchitectureRequestRepository`, `ArchitectureRunIdempotencyRepository`, `ArchitectureRunRepository`
- `ComparisonRecordRepository`, `DecisionNodeRepository`, `DecisionTraceRepository`
- `EvidenceBundleRepository`, `GoldenManifestRepository`
- `GovernanceApprovalRequestRepository`, `GovernanceEnvironmentActivationRepository`, `GovernancePromotionRecordRepository`
- `RunExportRecordRepository`

## Category 5: SQL-Dependent Service Classes

| Class | Assembly | Justification |
|-------|----------|---------------|
| `SqlCutoverReadinessService` | Persistence | Every method runs aggregate SQL queries via Dapper |
| `SqlRelationalBackfillService` | Persistence | Scans SQL tables and inserts relational slices via Dapper |

## Category 6: Dapper Row-Mapping DTOs

Pure data-transfer objects used by Dapper for SQL result mapping. They contain only `{ get; init; }` auto-properties with no methods or logic.

| File | Classes | Assembly |
|------|---------|----------|
| `ProductLearningPlanningSqlRows.cs` | `ProductLearningScopeSqlRow`, `ProductLearningImprovementThemeSqlRow`, `ProductLearningImprovementPlanSqlRow`, `ProductLearningImprovementPlanSignalLinkSqlRow`, `ProductLearningImprovementPlanArtifactLinkSqlRow` | Persistence |
| `ProductLearningPilotSignalSqlRows.cs` | `FeedbackAggregateSqlRow`, `ArtifactOutcomeTrendSqlRow`, `RepeatedCommentThemeSqlRow` | Persistence |
| `GraphSnapshotStorageRow.cs` | `GraphSnapshotStorageRow` | Persistence |
| `GoldenManifestStorageRow.cs` | `GoldenManifestStorageRow` | Persistence |
| `FindingsSnapshotStorageRow.cs` | `FindingsSnapshotStorageRow` | Persistence |
| `ContextSnapshotStorageRow.cs` | `ContextSnapshotStorageRow` | Persistence |
| `ArtifactBundleStorageRow.cs` | `ArtifactBundleStorageRow` | Persistence |

## Category 2b: ArchLucid.Api HTTP request/response DTOs

Pure API contract types with auto-properties only (no methods or validation logic). Controllers and services with branching logic are **not** excluded here even when Cobertura reports 0% — many are exercised by `Category=Integration` tests on shards that run without Coverlet (see **ArchLucid.Api measurement vs testing** below).

**TB-635 pure-DTO bucket (21 types, closed **TB-636** 2026-07-07):** each carries `[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]`.

| File | Class |
|------|-------|
| `Controllers/Admin/AdminArchiveRunsBatchRequest.cs` | `AdminArchiveRunsBatchRequest` |
| `Controllers/Admin/AdminArchiveRunsByIdsRequest.cs` | `AdminArchiveRunsByIdsRequest` |
| `Controllers/Admin/TenantProvisionAdminRequest.cs` | `TenantProvisionAdminRequest` |
| `Controllers/Alerts/AlertsAcknowledgeBatchItemResult.cs` | `AlertsAcknowledgeBatchItemResult` |
| `Controllers/Alerts/AlertsAcknowledgeBatchRequest.cs` | `AlertsAcknowledgeBatchRequest` |
| `Controllers/Alerts/AlertsAcknowledgeBatchResponse.cs` | `AlertsAcknowledgeBatchResponse` |
| `Controllers/Governance/GovernanceApprovalBatchReviewRequest.cs` | `GovernanceApprovalBatchReviewRequest` |
| `Controllers/Governance/GovernanceBatchReviewItemResult.cs` | `GovernanceBatchReviewItemResult` |
| `Controllers/Governance/GovernanceBatchReviewResponse.cs` | `GovernanceBatchReviewResponse` |
| `Models/E2e/E2eHarnessBillingSimulatePostRequest.cs` | `E2eHarnessBillingSimulatePostRequest` |
| `Models/E2e/E2eHarnessTrialExpiresPostRequest.cs` | `E2eHarnessTrialExpiresPostRequest` |
| `Models/Evolution/EvolutionSimulationRunResponse.cs` | `EvolutionSimulationRunResponse` |
| `Models/Learning/LearningPlanDetailResponse.cs` | `LearningPlanDetailResponse` |
| `Models/Learning/LearningPlanEvidenceCountsResponse.cs` | `LearningPlanEvidenceCountsResponse` |
| `Models/Learning/LearningPlanListItemResponse.cs` | `LearningPlanListItemResponse` |
| `Models/Learning/LearningPlanStepResponse.cs` | `LearningPlanStepResponse` |
| `Models/Learning/LearningThemeResponse.cs` | `LearningThemeResponse` |
| `Models/Tenancy/TenantRegistrationRequest.cs` | `TenantRegistrationRequest` |
| `Models/Tenancy/TenantTrialConvertRequest.cs` | `TenantTrialConvertRequest` |
| `Services/Admin/DataConsistencyOrphanCounts.cs` | `DataConsistencyOrphanCounts` |
| `Services/Admin/OrphanComparisonRemediationResult.cs` | `OrphanComparisonRemediationResult` |

| `Models/Auth/TrialLocalRegisterRequest.cs` | `TrialLocalRegisterRequest` |
| `Models/Auth/TrialLocalRegisterResponse.cs` | `TrialLocalRegisterResponse` |
| `Models/Auth/TrialLocalTokenRequest.cs` | `TrialLocalTokenRequest` |
| `Models/Auth/TrialLocalTokenResponse.cs` | `TrialLocalTokenResponse` |
| `Models/Auth/TrialLocalVerifyEmailRequest.cs` | `TrialLocalVerifyEmailRequest` |

**TB-639 genuinely-untested bucket (32 types, closed 2026-07-07):** each row below is closed by **Category=Unit** tests, **Category=Integration** authorization smokes (`GenuinelyUntestedControllersIntegrationTests`), or Category 8 startup exclusion — not duplicate shallow controller unit tests.

| Resolution | Class | Test / exclusion |
|------------|-------|------------------|
| Integration smoke | `TenantsAdminController` | `GenuinelyUntestedControllersIntegrationTests` |
| Integration smoke | `RecommendationLearningController` | same |
| Integration smoke | `AlertRoutingSubscriptionsController` | same |
| Integration smoke | `AlertSimulationController` | same |
| Integration smoke | `AlertTuningController` | same |
| Integration smoke | `CompositeAlertRulesController` | same |
| Integration smoke | `TrialLocalIdentityAuthController` | same |
| Integration smoke | `AuthorityReplayController` | same |
| Integration smoke | `AuthorityRunEventsController` | same |
| Integration smoke | `RunAgentEvaluationController` | same |
| Integration smoke | `E2EHarnessController` | same (disabled harness → 404) |
| Category 2b DTO | `TrialLocalRegisterRequest` … `TrialLocalVerifyEmailRequest` | `[ExcludeFromCodeCoverage]` (TB-636 pattern) |
| Unit | `PagingParameters` | `PagingParametersTests` |
| Unit | `ReplayArtifactResponseFactory` | `ReplayArtifactResponseFactoryTests` |
| Unit | `ApiFileResults` | `ApiFileResultsTests` |
| Unit | `EvolutionOutcomeShadowReader` | `EvolutionOutcomeShadowReaderTests` |
| Unit | `TrialLimitProblemResponse` | `TrialLimitFilterTests` (`Category=Unit`) |
| Unit | `TrialLimitAuthorizationHandler` | `TrialLimitAuthorizationPipelineTests` |
| Unit | `TrialLimitExceededAuditFilter` | same |
| Unit | `TrialLimitAuthorizationResultHandler` | same |
| Unit | `LearningPlanningReadService` | `LearningPlanningReadServiceTests` |
| Unit | `OpenApiAuthDocumentMutator` | `OpenApiAuthDocumentMutatorTests` |
| Unit | `ProblemDetailsResponsesOperationFilter` | `ProblemDetailsResponsesOperationFilterTests` |
| Unit | `RateLimitingRolePartitionBuilder` | `RateLimitingRolePartitionBuilderTests` |
| Unit | `EvolutionSimulationReportBuilder` | `EvolutionSimulationReportBuilderTests` (`Category=Unit`) |
| Unit | `LocalTrialJwtIssuer` | `LocalTrialJwtIssuerTests` |
| Category 8 startup | `PipelineExtensions` | ASP.NET pipeline registration; exercised via `WebApplicationFactory` integration hosts |
| Category 8 startup | `InfrastructureExtensions` | DI/bootstrap wiring; exercised via integration hosts |

Additional auto-property-only API DTOs outside the TB-635 inventory (e.g. run/manifest response types under `ArchLucid.Api/Models/**` and `ArchLucid.Api/Contracts/**`) may carry the same attribute when triaged; they are not listed here until inventoried.

## ArchLucid.Api measurement vs testing

Merged Cobertura **understates** `ArchLucid.Api` HTTP coverage:

| `ArchLucid.Api.Tests` filter | Run settings | Coverlet |
| --- | --- | --- |
| `Category!=Slow&Category!=Integration` | `coverage.runsettings` | **On** |
| `Category=Slow` (SQL subset) | `coverage.runsettings` | **On** |
| `Category=Integration` (six parallel shards) | `test.runsettings` | **Off** — collector finalization unstable under chunked SQL load |

**Owner decision (2026-07-05):** keep Coverlet disabled on Integration shards. CI continues `--skip-package-line-gate ArchLucid.Api` until merged per-package % reflects real risk (DTO exclusions + optional future Coverlet stability work). Integration tests remain the authoritative behavior coverage for controllers; 0% on those types is a **measurement gap**, not a testing gap.

**Removing `--skip-package-line-gate ArchLucid.Api` (all required):**

1. **TB-636** pure-DTO exclusions are applied so Cobertura denominators are honest (closed 2026-07-07).
2. **TB-639** genuinely-untested logic is covered or carries a documented Category 1/4 exclusion — not duplicate unit tests for Integration-covered controllers (**Done** 2026-07-07).
3. Either Integration shards collect Coverlet reliably on `test.runsettings` (separate collector-stability initiative), **or** merged Cobertura otherwise includes Integration-category hits.
4. A full **`dotnet-full-regression`** merge shows **`ArchLucid.Api`** at or above the **63%** per-product line floor **without** the skip flag.

Until then, treat low **`ArchLucid.Api`** percentages in PR comments as advisory; use the **TB-635** `integration-covered` bucket to distinguish measurement gaps from real test debt.

## Category 7: Process-External / Filesystem Tools

| Class | Assembly | Justification |
|-------|----------|---------------|
| `MermaidCliDiagramImageRenderer` | Application | Requires `mmdc` CLI tool installed on host |
| `FileSystemDocumentLogoProvider` | Application | Reads logo files from local filesystem |

## Category 8: Application Startup / CLI Dispatch

| Class | Assembly | Justification |
|-------|----------|---------------|
| `Program` (partial) | Api | ASP.NET startup wiring; tested via `WebApplicationFactory` integration tests |
| `Program` (partial) | Worker | Background worker host wiring (`WebApplication` + DI + config validation); exercised by **`ArchLucid.Worker.Tests`** but omitted from Cobertura via **`coverage.runsettings`** **`ExcludeByFile`** (**`ArchLucid.Worker/Program.cs`**) so merged line denominators are not dominated by an uninstrumented entrypoint |
| `Program` (static) | Cli | CLI argument dispatch and console I/O |
| `Program` (static) | Jobs.Cli | ACA Jobs composition root (`WebApplication` + DI + schema bootstrap); **`JobsCommandLine`** is unit-tested in **`ArchLucid.Jobs.Cli.Tests`** |
| `ApiKeyAuthenticationHandler` | Api | ASP.NET authentication handler; tested via HTTP pipeline integration tests |

## Category 8b: CLI API-orchestration subcommands (`ArchLucid.Cli`)

These `internal static` command entry points wire console output to `ArchLucidApiClient` (already excluded in this assembly). Unit-testing them end-to-end would duplicate HTTP client tests; `SupportBundleCollector`, `ManifestValidator`, `CliCommandShared`, and related helpers retain line coverage.

| Class | Assembly | Justification |
|-------|----------|---------------|
| `ComparisonsCommand` | Cli | Comparisons / replay / diagnostics against API |
| `DoctorCommand` | Cli | Multi-probe readiness against API |
| `RunCommand` | Cli | Run workflow + API + filesystem |
| `SupportBundleCommand` | Cli | Thin wrapper over `SupportBundleCollector` (tested) |
| `ArtifactsCommand` | Cli | Artifact download via API |
| `StatusCommand` | Cli | Run status via API |
| `SubmitCommand` | Cli | Agent result POST via API |
| `CommitCommand` | Cli | Commit manifest via API |
| `HealthCommand` | Cli | Reachability via `ArchLucidApiClient` |

## Category 9: Method-Level Exclusions

| Class | Method | Justification |
|-------|--------|---------------|
| `SqlSchemaBootstrapper` | `EnsureSchemaAsync` | Reads file and executes SQL batches. `SplitGoBatches` remains testable and is **not** excluded. |

## Category 10: Assembly-Level Exclusions

| Assembly | Justification |
|----------|---------------|
| `ArchLucid.TestSupport` | Test infrastructure (fakes, builders, helpers); not production code |

---

## Coverage Results After Exclusions

| Metric | Before Exclusions | After Exclusions | Delta |
|--------|-------------------|------------------|-------|
| Line coverage | 62.5% | **73%** | +10.5pp |
| Branch coverage | ~50% | **58.6%** | +8.6pp |
| Method coverage | ~72% | **81.6%** | +9.6pp |
| Assemblies | 19 | 17 | -2 |
| Classes | ~1050 | 905 | -145 |

The improvement is due to removing untestable SQL infrastructure code from the denominator, giving an accurate picture of how well the testable codebase is covered.

## Cobertura merge (why no Coverlet `<Threshold>`)

`coverage.runsettings` does **not** set Coverlet `<Threshold>`: collectors run **per test assembly**, so a single assembly-wide threshold would not match solution-wide coverage. CI merges fragments with ReportGenerator in **.NET: full regression (SQL)**, then applies the gates in **Enforced CI coverage gates**. **`scripts/ci/build_coverage_pr_comment.py`** reuses **`coverage_cobertura.py`** for PR summary text (per-package **63%** line matches **`assert_merged_line_coverage_min.py`**).

### Tracking — packages under the 63% per-product line floor

Merged **`Cobertura.xml`** is produced only after a successful **full regression** test run (see **`.github/workflows/ci.yml`** → **`.NET: full regression (SQL)`**). If that job fails **`assert_merged_line_coverage_min.py`** on the per-package gate, the script stdout lists each offending **`ArchLucid.*`** package and its line percentage.

**Remediation:** Add or extend tests for that assembly, adjust **`[ExcludeFromCodeCoverage]`** only per **Exclusion Policy** above, or open a time-bound exemption with an explicit tracking item (issue/ADR) — do not weaken the gate without product sign-off.




## ArchLucid.Api Cobertura triage (TB-635)

Merged Cobertura understates **ArchLucid.Api** integration coverage because Integration-category tests run on shards without Coverlet (`test.runsettings`). The classified inventory lives in [`COVERAGE_GAP_ANALYSIS.md`](../COVERAGE_GAP_ANALYSIS.md) under **TB-635 Cobertura triage inventory**.

| Bucket | Count |
|--------|------:|
| pure-DTO | 21 |
| integration-covered | 33 |
| small-logic | 34 |
| genuinely-untested | 32 |
