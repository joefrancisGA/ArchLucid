> **Scope:** Coverage gap analysis (merged Cobertura) - tables from the Cobertura file named under **Data source**; stale or partial local merges (or leftover shards under `coverage-gap-1a`) produce misleading percentages — clean the folder before `dotnet test` or use the CI **`coverage-merged-cobertura`** artifact.
>
> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# Coverage gap analysis (merged Cobertura)

## Solution coverage (merged totals)

| | |
|:--|--:|
| **Total line coverage** | **72.95%** |
| **Total branch coverage** | **58.71%** |

These merged Cobertura figures are the headline **solution** metrics for the scoped assemblies (same source file and exclusions as **Data source** / **Measurement** below). Per-assembly breakdowns are in the table **All assemblies by line coverage**. Narrative anchor: **Merged totals (reference)** at the end of this document.

**Data source:** `coverage-report-final\Cobertura.xml` (file mtime **2026-04-20 13:51:50 UTC**). For CI gate parity, prefer the **`coverage-merged-cobertura`** artifact from job **`.NET: merge coverage + gates`** (copy **`Cobertura.xml`** and run **`python scripts/ci/coverage_gap_analysis.py --cobertura <path>`**). See **`docs/library/CODE_COVERAGE.md`** — local merges without **`ARCHLUCID_SQL_TEST`** under-count SQL-only paths.

**Measurement:** Production `ArchLucid.*` assemblies only; excludes `*.Tests`, TestSupport, Benchmarks, and `ArchLucid.Worker` (`Program.cs` omitted per **`coverage.runsettings`** **`ExcludeByFile`**).

## All assemblies by line coverage (lowest first)

| Assembly | Line coverage % | Coverable lines (approx.) |
|----------|-----------------|---------------------------|
| ArchLucid.Persistence | 39.66 | 11201 |
| ArchLucid.Api | 60.79 | 16812 |
| ArchLucid.Host.Core | 71.19 | 8949 |
| ArchLucid.Application | 73.23 | 17865 |
| ArchLucid.AgentRuntime | 77.94 | 6125 |
| ArchLucid.Host.Composition | 79.45 | 2843 |
| ArchLucid.Persistence.Runtime | 80.05 | 1865 |
| ArchLucid.ArtifactSynthesis | 80.13 | 2738 |
| ArchLucid.Persistence.Alerts | 81.88 | 1920 |
| ArchLucid.Persistence.Coordination | 82.97 | 5824 |
| ArchLucid.Core | 84.58 | 3216 |
| ArchLucid.Persistence.Advisory | 85.35 | 1406 |
| ArchLucid.Cli | 86.70 | 1940 |
| ArchLucid.ContextIngestion | 91.01 | 1380 |
| ArchLucid.Contracts | 92.39 | 2001 |
| ArchLucid.Decisioning | 92.64 | 10404 |
| ArchLucid.Coordinator | 93.31 | 478 |
| ArchLucid.Retrieval | 95.07 | 610 |
| ArchLucid.KnowledgeGraph | 95.07 | 730 |
| ArchLucid.AgentSimulator | 96.45 | 564 |
| ArchLucid.Provenance | 96.70 | 666 |
| ArchLucid.Persistence.Integration | 99.19 | 494 |
| ArchLucid.Jobs.Cli | 100.00 | 36 |

## Up to three classes per assembly with the most uncovered line entries

Per Cobertura **class** aggregate line blocks (`<class>/<lines>/<line hits="…"/>`). 
**Partial types** merged by **class name + file**.

### ArchLucid.Persistence (39.66% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Persistence.Tenancy.DapperTenantRepository` | `ArchLucid.Persistence\Tenancy\DapperTenantRepository.cs` | 342 |
| 2 | `ArchLucid.Persistence.Tenancy.SqlTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\SqlTenantHardPurgeService.cs` | 263 |
| 3 | `ArchLucid.Persistence.GoldenManifests.GoldenManifestPhase1RelationalRead` | `ArchLucid.Persistence\GoldenManifests\GoldenManifestPhase1RelationalRead.cs` | 258 |

### ArchLucid.Api (60.79% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Api.Services.Admin.AdminDiagnosticsService` | `ArchLucid.Api\Services\Admin\AdminDiagnosticsService.cs` | 200 |
| 2 | `ArchLucid.Api.Controllers.Governance.GovernanceController` | `ArchLucid.Api\Controllers\Governance\GovernanceController.cs` | 148 |
| 3 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationService` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationService.cs` | 119 |

### ArchLucid.Host.Core (71.19% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Host.Core.DataConsistency.DataConsistencyOrphanProbeExecutor` | `ArchLucid.Host.Core\DataConsistency\DataConsistencyOrphanProbeExecutor.cs` | 149 |
| 2 | `ArchLucid.Host.Core.Jobs.BackgroundJobQueueProcessorHostedService` | `ArchLucid.Host.Core\Jobs\BackgroundJobQueueProcessorHostedService.cs` | 102 |
| 3 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkProcessor` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkProcessor.cs` | 78 |

### ArchLucid.Application (73.23% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonExportService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonExportService.cs` | 222 |
| 2 | `ArchLucid.Application.Notifications.Email.TrialLifecycleEmailDispatcher` | `ArchLucid.Application\Notifications\Email\TrialLifecycleEmailDispatcher.cs` | 184 |
| 3 | `ArchLucid.Application.Explanation.RunRationaleService` | `ArchLucid.Application\Explanation\RunRationaleService.cs` | 169 |

### ArchLucid.AgentRuntime (77.94% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.AgentRuntime.LlmCompletionAccountingClient` | `ArchLucid.AgentRuntime\LlmCompletionAccountingClient.cs` | 75 |
| 2 | `ArchLucid.AgentRuntime.AgentExecutionTraceRecorder` | `ArchLucid.AgentRuntime\AgentExecutionTraceRecorder.cs` | 62 |
| 3 | `ArchLucid.AgentRuntime.ComplianceAgentHandler` | `ArchLucid.AgentRuntime\ComplianceAgentHandler.cs` | 55 |

### ArchLucid.Host.Composition (79.45% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` | 133 |
| 2 | `ArchLucid.Host.Composition.Configuration.ArchLucidStorageServiceCollectionExtensions` | `ArchLucid.Host.Composition\Configuration\ArchLucidStorageServiceCollectionExtensions.cs` | 67 |
| 3 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.DataHealthAndJobs.cs` | 24 |

### ArchLucid.Persistence.Runtime (80.05% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Persistence.Caching.DistributedHotPathReadCache` | `ArchLucid.Persistence.Runtime\Caching\DistributedHotPathReadCache.cs` | 56 |
| 2 | `ArchLucid.Persistence.BlobStore.AzureBlobArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\AzureBlobArtifactBlobStore.cs` | 29 |
| 3 | `ArchLucid.Persistence.Orchestration.AuthorityRunOrchestrator` | `ArchLucid.Persistence.Runtime\Orchestration\AuthorityRunOrchestrator.cs` | 29 |

### ArchLucid.ArtifactSynthesis (80.13% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.ArtifactSynthesis.Docx.DocxExportService` | `ArchLucid.ArtifactSynthesis\Docx\DocxExportService.cs` | 156 |
| 2 | `ArchLucid.ArtifactSynthesis.Docx.Builders.WordDocumentBuilder` | `ArchLucid.ArtifactSynthesis\Docx\Builders\WordDocumentBuilder.cs` | 60 |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.ComplianceMatrixArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ComplianceMatrixArtifactGenerator.cs` | 11 |

### ArchLucid.Persistence.Alerts (81.88% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Persistence.Simulation.RuleSimulationService` | `ArchLucid.Persistence.Alerts\Simulation\RuleSimulationService.cs` | 104 |
| 2 | `ArchLucid.Persistence.Simulation.AlertSimulationContextProvider` | `ArchLucid.Persistence.Alerts\Simulation\AlertSimulationContextProvider.cs` | 53 |
| 3 | `ArchLucid.Persistence.AlertSuppressionPolicy` | `ArchLucid.Persistence.Alerts\AlertSuppressionPolicy.cs` | 9 |

### ArchLucid.Persistence.Coordination (82.97% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Persistence.Coordination.Compare.AuthorityCompareService` | `ArchLucid.Persistence.Coordination\Compare\AuthorityCompareService.cs` | 167 |
| 2 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementThemeExtractionService` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementThemeExtractionService.cs` | 44 |
| 3 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementPlanningService` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementPlanningService.cs` | 42 |

### ArchLucid.Core (84.58% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Core.Diagnostics.ArchLucidInstrumentation` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 38 |
| 2 | `ArchLucid.Core.Audit.InMemoryAuditRetryQueue` | `ArchLucid.Core\Audit\InMemoryAuditRetryQueue.cs` | 34 |
| 3 | `ArchLucid.Core.Llm.Redaction.PromptRedactor` | `ArchLucid.Core\Llm\Redaction\PromptRedactor.cs` | 28 |

### ArchLucid.Persistence.Advisory (85.35% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Persistence.AdvisoryScanRunner` | `ArchLucid.Persistence.Advisory\AdvisoryScanRunner.cs` | 74 |
| 2 | `ArchLucid.Persistence.InMemoryAdvisoryScanExecutionRepository` | `ArchLucid.Persistence.Advisory\InMemoryAdvisoryScanExecutionRepository.cs` | 8 |
| 3 | `ArchLucid.Persistence.InMemoryDigestDeliveryAttemptRepository` | `ArchLucid.Persistence.Advisory\InMemoryDigestDeliveryAttemptRepository.cs` | 8 |

### ArchLucid.Cli (86.70% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Cli.Commands.TraceCommand` | `ArchLucid.Cli\Commands\TraceCommand.cs` | 35 |
| 2 | `ArchLucid.Cli.Support.SupportBundleCollector` | `ArchLucid.Cli\Support\SupportBundleCollector.cs` | 31 |
| 3 | `ArchLucid.Cli.ArchLucidProjectScaffolder` | `ArchLucid.Cli\ArchLucidProjectScaffolder.cs` | 27 |

### ArchLucid.ContextIngestion (91.01% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalInfrastructureEnricher` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalInfrastructureEnricher.cs` | 19 |
| 2 | `ArchLucid.ContextIngestion.Infrastructure.JsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\JsonInfrastructureDeclarationParser.cs` | 18 |
| 3 | `ArchLucid.ContextIngestion.Infrastructure.TerraformShowJsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\TerraformShowJsonInfrastructureDeclarationParser.cs` | 14 |

### ArchLucid.Contracts (92.39% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Contracts.Explanation.FindingExplainabilityResult` | `ArchLucid.Contracts\Explanation\FindingExplainabilityResult.cs` | 17 |
| 2 | `ArchLucid.Contracts.Common.AgentTypeKeys` | `ArchLucid.Contracts\Common\AgentTypeKeys.cs` | 14 |
| 3 | `ArchLucid.Contracts.Evolution.SimulationReadProfile` | `ArchLucid.Contracts\Evolution\SimulationReadProfile.cs` | 13 |

### ArchLucid.Decisioning (92.64% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery` | `ArchLucid.Decisioning\Plugins\FindingEnginePluginDiscovery.cs` | 75 |
| 2 | `ArchLucid.Decisioning.Governance.Resolution.EffectiveGovernanceResolver` | `ArchLucid.Decisioning\Governance\Resolution\EffectiveGovernanceResolver.cs` | 43 |
| 3 | `ArchLucid.Decisioning.Manifest.Builders.DefaultGoldenManifestBuilder` | `ArchLucid.Decisioning\Manifest\Builders\DefaultGoldenManifestBuilder.cs` | 32 |

### ArchLucid.Coordinator (93.31% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Coordinator.Services.CoordinatorService` | `ArchLucid.Coordinator\Services\CoordinatorService.cs` | 15 |
| 2 | `ArchLucid.Coordinator.Services.RunStarterTaskFactory` | `ArchLucid.Coordinator\Services\RunStarterTaskFactory.cs` | 1 |

### ArchLucid.Retrieval (95.07% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Retrieval.Embedding.CircuitBreakingOpenAiEmbeddingClient` | `ArchLucid.Retrieval\Embedding\CircuitBreakingOpenAiEmbeddingClient.cs` | 10 |
| 2 | `ArchLucid.Retrieval.Indexing.InMemoryVectorIndex` | `ArchLucid.Retrieval\Indexing\InMemoryVectorIndex.cs` | 2 |
| 3 | `ArchLucid.Retrieval.Indexing.RetrievalIndexingService` | `ArchLucid.Retrieval\Indexing\RetrievalIndexingService.cs` | 2 |

### ArchLucid.KnowledgeGraph (95.07% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer` | `ArchLucid.KnowledgeGraph\Inference\DefaultGraphEdgeInferer.cs` | 11 |
| 2 | `ArchLucid.KnowledgeGraph.Repositories.InMemoryGraphSnapshotRepository` | `ArchLucid.KnowledgeGraph\Repositories\InMemoryGraphSnapshotRepository.cs` | 4 |
| 3 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotIndexedEdge` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotIndexedEdge.cs` | 3 |

### ArchLucid.AgentSimulator (96.45% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 7 |
| 2 | `ArchLucid.AgentSimulator.Services.DeterministicAgentSimulator` | `ArchLucid.AgentSimulator\Services\DeterministicAgentSimulator.cs` | 3 |

### ArchLucid.Provenance (96.70% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Provenance.Services.ProvenanceGraphAlgorithms` | `ArchLucid.Provenance\Services\ProvenanceGraphAlgorithms.cs` | 11 |

### ArchLucid.Persistence.Integration (99.19% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Persistence.InMemoryIntegrationEventOutboxRepository` | `ArchLucid.Persistence.Integration\InMemoryIntegrationEventOutboxRepository.cs` | 1 |
| 2 | `ArchLucid.Persistence.OutboxAwareIntegrationEventPublishing` | `ArchLucid.Persistence.Integration\OutboxAwareIntegrationEventPublishing.cs` | 1 |

### ArchLucid.Jobs.Cli (100.00% line coverage)

_No uncovered line rows in Cobertura for this package (or only branches uncovered)._

## Merged totals (reference)

- **Merged line coverage:** 72.95%
- **Merged branch coverage:** 58.71%

## Recent targeted tests (correctness improvement track)

- **2026-05-14 — Persistence (tenancy):** **`DapperTenantRepositoryConstructorTests`** — primary-constructor **`ArgumentNullException`** parameter names; **`DapperTenantRepositorySqlIntegrationTests`** — **`SystemWithPerTenantCatalogs`** suspend + **`ListTrialLifecycleAutomationTenantIdsAsync`** fan-out (same DB + active binding), **`TryIncrementActiveTrialRunAsync`** external connection/transaction, **`UpdateEntraTenantIdAsync`** miss + Entra collision, **`MarkTrialConvertedAsync`** null tier (**`CASE`** preserves tier), expired / inactive trial seat paths, **`TryMarkFirstManifestCommittedAsync`** zero ratio when limit unset, **`ListTenantIdsPendingTrialArchitecturePreseedAsync`** non-positive **`take`** clamp.
- **2026-05-14 — Api (`Demo` quick-start path):** **`QuickStartServiceTests`** — Moq **`IArchitectureRunCreateOrchestrator`** / **`IArchitectureRunExecuteOrchestrator`** / **`IArchitectureRunCommitOrchestrator`**; preset vs free-text **`ArchitectureRequest`** shaping (**`NormalizeDescription`**, constraints/capabilities), **`TopFindings`** severity ordering / **`DisplayTitle`** fallbacks, **`PublicSiteOptions`** deep links, **`IAuditService`** **`RunSubmitted`** / **`RunCompleted`** with **`Guid.TryParse`** vs opaque **`run id`**.
- **2026-05-14 — Api.Client (maintained surface):** **`FileParameterTests`** + **`ArchLucidApiClientWireTests`** — **`HttpClient`** stubs (**`VersionAsync`**, **`MeAsync`**, **`ExecutiveSummaryAsync`** / **`ProblemDetails`**), **`JsonStringEnumConverter`** parity (**`CitationReference`**), **`BaseUrl`** normalization. **`coverage.runsettings`** still excludes **`ArchLucid.Api.Client/Generated/`** from Cobertura line totals (hand-maintained surface only).
- **2026-05-13 — Integrations.AzureDevOps (unit) + coverage bookkeeping:** **`ArchLucid.Integrations.AzureDevOps.Tests`** now cover PR decorator compare skips/fallbacks, wire-format edge cases, markdown formatters, and the authority-run handler. Merged Cobertura refreshed: **`ArchLucid.Integrations.AzureDevOps`** at **90.15% line** (up from ~59.7%).
- **2026-05-13 — Api (no-SQL unit slice):** **`QuickStartPresetsTests`** (**`TryGet`**, keys, **`LogicalScopePins`**); **`AdminDiagnosticsServiceNonSqlTests`** — outbox snapshot aggregation, **`StorageProvider=InMemory`** short-circuit for orphan counts/remediations (strict **`IDbConnectionFactory`**), archival audit when **`IRunRepository`** returns updates.
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Api / Evolution):** **`EvolutionSimulationServiceTests`** — Moq repositories + **`IArchitectureAnalysisService`** / **`ISimulationEvaluationService`**; **`CreateCandidateFromImprovementPlanAsync`** throws **`EvolutionResourceNotFoundException`** with **`ProblemTypes.LearningImprovementPlanNotFound`** when plan missing; **`RunShadowEvaluationAsync`** with empty **`LinkedArchitectureRunIds`** updates candidate to **`Simulated`**, returns no simulation rows, never calls analysis/evaluation or run insert/delete.
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Api / Advisory):** **`AdvisoryControllerListRecommendationsIntegrationTests`** — **`GET /v1/advisory/runs/{runId}/recommendations`**: **200** + empty **`RecommendationRecordResponse`** list for a never-seeded run id; same after architecture **commit** before **`GET …/improvements`** (no persisted recommendations yet).
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Application / export):** **`EndToEndReplayComparisonExportServiceTests`** — Moq **`IEndToEndReplayComparisonSummaryFormatter`**; **`GenerateMarkdown`** **short** vs **default** (separator, **`## Run Metadata Diff`**, **`### Interpretation Notes`** / **`### Warnings`**); **`GenerateHtml`** **short** omits extended sections (**`Run Metadata Diff`**, interpretation lists).
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Persistence / Findings):** **`FindingsSnapshotRelationalReadOrderedAlternativePathsDirectSqlIntegrationTests`** — one **`FindingRecords`** row plus two **`FindingTraceAlternativePaths`** rows inserted with **non-monotonic** **`SortOrder`** (1 then 0); **`LoadRelationalSnapshotAsync`** returns **`ExplainabilityTrace.AlternativePathsConsidered`** in **`ORDER BY SortOrder`** order.
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Persistence / GoldenManifest):** **`GoldenManifestPhase1RelationalReadOrderedAssumptionsDirectSqlIntegrationTests`** — two **`GoldenManifestAssumptions`** rows inserted with **non-monotonic** **`SortOrder`** (1 then 0); **`HydrateAsync`** returns **`Assumptions`** in **`ORDER BY SortOrder`** order; **`AssumptionsJson`** ignored when relational rows exist.
- **2026-04-16 — Improvement 1 (`lowest-assembly-tests` slice, Persistence / Graph):** **`GraphSnapshotRelationalReadOrderedWarningsNoEdgesDirectSqlIntegrationTests`** — no relational nodes or edges; two **`GraphSnapshotWarnings`** rows inserted with **non-monotonic** **`SortOrder`** (1 then 0); asserts **`HydrateAsync`** returns warnings in **`ORDER BY SortOrder`** order and ignores **`WarningsJson`** on the relational path.
- **2026-04-16 — Weighted improvements 1–6 (verification + carry-over):** **`scripts/ci/assert_v1_traceability.py`** (per-assembly “no test matches” no longer zeroes whole solution; UTF-8 stdout; ASCII-safe logging). **`coverage_gap_analysis.py`** doc refresh from **`coverage-gap-1a/merged/Cobertura.xml`**. **Persistence:** migration **073** + **`SqlRunRepository`** archival cascade to **`ArtifactBundles`** / **`AgentExecutionTraces`** / **`ComparisonRecords`**; **`SqlRunRepositoryArchivalExtendedCascadeTests`**. **API:** **`ApiControllerMutationPolicyGuardTests`**, **`ApiVersioningReaderRoutingTests`**, combined **`QueryString`** + **`Header`** **`api-version`** readers. **Host.Composition:** **`AuthSafetyGuardTests`** + **`ArchLucidAuthorizationPoliciesRegistrationTests`** (regression for **Imp2** prompts).
- **2026-04-15 — Improvement 1 (branch / fallback branches, Persistence):** **`GoldenManifestPhase1RelationalReadWhitespaceJsonFallbackDirectSqlIntegrationTests`** — no relational slice rows + **whitespace/empty** **AssumptionsJson** / **WarningsJson** / **ProvenanceJson** / **DecisionsJson** + **ComplianceJson** whitespace → empty lists / default **ComplianceSection** (**`FallbackDeserializeList`**, **`FallbackDeserializeProvenance`**, **`FallbackDeserializeDecisions`**, **`DeserializeCompliance`**). **`GraphSnapshotRelationalReadJsonMergePartialEdgeDirectSqlIntegrationTests`** — **EdgesJson** merge on when **GraphSnapshotEdgeProperties** is empty; relational edge **e-sql-only** absent from **EdgesJson** → **`jsonById.TryGetValue`** false (no label/prop merge). **`FindingsSnapshotRelationalReadMinimalChildrenDirectSqlIntegrationTests`** — single **FindingRecord** with no child tables → empty **RelatedNodeIds** / **RecommendedActions** / **Properties** / **ExplainabilityTrace** slices.
- **2026-04-15 — Six improvement prompts (single session):** Run archival **SQL cascade** (**`066_GoldenManifestsFindingsSnapshots_ArchivedUtc`**, **`SqlRunRepository`** transactional batch + by-id); **`DataArchivalOrphanProbeSqlIntegrationTests`** asserts **`ArchivedUtc`** on **`dbo.GoldenManifests`** / **`dbo.FindingsSnapshots`**. **`DurableAuditLogRetry`** + **`DurableAuditLogRetryTests`**; **`ArchitectureRunCreateOrchestrator`** uses retry for **`CoordinatorRunCreated`**. **`IntegrationEventOutboxProcessorTests.ProcessPendingBatchAsync_processes_multiple_entries_in_one_batch`**; **`DataArchivalCoordinatorTests.RunOnceAsync_when_all_retention_non_positive_skips_archival_paths`**. Outbox convergence: **`archlucid:slo:integration_event_outbox_oldest_age_seconds`** + **`ArchLucidIntegrationEventOutboxConvergenceSlow`** (60s / 5m), **[API_SLOS.md](API_SLOS.md)** § Outbox convergence. **`stryker-config.persistence-coordination.json`** + scheduled workflow matrix + **`stryker-baselines.json`** (**PersistenceCoordination** 65%). **`ApiControllerProblemDetailsSourceGuardTests`** — bare **`Conflict()`** / **`BadRequest()`** guard.
- **2026-04-15 — Correctness prompts 1 / 2 / 3 / 5 / 6 (session):** **`ManifestVersionIncrementRules`** + **`ManifestVersionIncrementPropertyTests`**; **`ArchitectureRunStatusTransitionPropertyTests`**; **`AlertDeliveryCompositeKeyPropertyTests`**; **`AgentExecutionTraceRecorderRecordAsyncEdgeTests`**; **`DapperArchitectureRunIdempotencyRepositoryContractTests.TryInsert_parallel_same_key_only_one_wins`** (SQL); **`DataArchivalOrphanProbeSqlIntegrationTests`** (orphan probe SQL mirrored from **`DataConsistencyOrphanProbeSql`**, post-**`DataArchivalCoordinator`**); **`IntegrationEventPublishingTests`** + **`CircuitBreakerGateAuditCallbackTests`** (fatal-exception filters on **`IntegrationEventPublishing`**, **`CircuitBreakerGate`**, **`CircuitBreakerAuditBridge`**). Cursor rule **`.cursor/rules/SingleLineThrowNoBraces.mdc`** (single-line **`throw`** without braces when it is the only statement).
- **2026-04-15 — Improvement 1 (prompts `coverage-gap-report`, `lowest-assembly-tests`, `governance-workflow-fscheck`):** ReportGenerator merge from **`coverage-gap-1a/**/coverage.cobertura.xml`** after a **partial** full-solution run (**`GreenfieldSqlBootIntegrationTests`** failed once with SQL “Operation cancelled by user” — re-run **`dotnet test ArchLucid.sln`** with coverage for a clean merge). **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`**: relational **decisions** with **no** **GoldenManifestDecisionEvidenceLinks** / **GoldenManifestDecisionNodeLinks**; **provenance** with **GoldenManifestProvenanceAppliedRules** only (findings + graph nodes empty, JSON provenance loses to relational rules). **`GovernanceWorkflowDryRunSubmissionPropertyTests`**: FsCheck dry **`SubmitApprovalRequestAsync`** → **Submitted** shape, **`CreateAsync` / baseline / durable audit** never called (valid dev→test and test→prod pairs).
- **2026-04-15 — doc refresh:** Full **`coverage-gap-report`** pipeline (solution test + ReportGenerator + **`scripts/ci/coverage_gap_analysis.py`**). Narrative bullets may lag the **Data source** timestamp in **`docs/COVERAGE_GAP_ANALYSIS.md`**; trust the generated tables for percentages.
- **2026-04-15 — tests:** **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`** — relational **decisions** (**GoldenManifestDecisionEvidenceLinks** / **GoldenManifestDecisionNodeLinks**, **SortOrder**), **provenance** from **GoldenManifestProvenanceSourceGraphNodes** + **GoldenManifestProvenanceAppliedRules** without source-finding rows, relational **warnings** + **provenance source findings**, JSON fallbacks (**AssumptionsJson**, **ProvenanceJson**, **DecisionsJson**) when relational slice rows are absent. **`GraphSnapshotRelationalReadDirectSqlIntegrationTests`** — **GraphSnapshotWarnings** override + **EdgesJson** merge when **GraphSnapshotEdgeProperties** is empty. **`FindingsSnapshotRelationalReadDirectSqlIntegrationTests`** — full relational **FindingRecords** path. **`RunLifecycleStatePropertyTests`** (`ArchLucid.Application.Tests`) — FsCheck **`CommitRunAsync`** gates. **`GovernanceWorkflowTransitionConflictPropertyTests`** — concurrent terminal peer → **`GovernanceApprovalReviewConflictException`**; invalid env pairs on **`SubmitApprovalRequestAsync`**. **`GovernanceWorkflowSegregationAndPromotionPropertyTests`** — **`PromoteAsync`** rejects approval **ManifestVersion** mismatch. **`scripts/ci/coverage_gap_analysis.py`** — **`ValueError`** handler uses the correct file path variable.
- **2026-04-14:** Extended **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`** with relational **warnings** and **provenance source findings** (SQL). **`AlertEvaluatorDeduplicationKeyPropertyTests`** — dedupe keys for **`CriticalRecommendationCount`** and **`NewComplianceGapCount`** (`ArchLucid.Decisioning.Tests`).

## How to refresh

Narrative bullets under **Recent targeted tests** live in `docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md` and are merged by this script when that file exists.

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
