> **Scope:** Coverage gap analysis (merged Cobertura) - tables from merged Cobertura; reflects whatever test assemblies produced `coverage-gap-1a/**/coverage.cobertura.xml`, not implicitly a green full solution.
>
> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# Coverage gap analysis (merged Cobertura)

**Generated:** from `coverage-gap-1a\merged\Cobertura.xml` (ReportGenerator Cobertura merge of Coverlet outputs from `dotnet test` + `--collect:"XPlat Code Coverage"`).

**Measurement:** Production `ArchLucid.*` assemblies only; excludes `*.Tests`, TestSupport, Benchmarks, and `ArchLucid.Worker` (`Program.cs` omitted per **`coverage.runsettings`** **`ExcludeByFile`**).

## All assemblies by line coverage (lowest first)

| Assembly | Line coverage % | Coverable lines (approx.) |
|----------|-----------------|---------------------------|
| ArchLucid.AgentSimulator | 0.00 | 582 |
| ArchLucid.Retrieval | 0.00 | 714 |
| ArchLucid.AgentRuntime | 3.53 | 11424 |
| ArchLucid.Application | 3.92 | 41283 |
| ArchLucid.Persistence | 8.53 | 29218 |
| ArchLucid.Host.Core | 18.76 | 12168 |
| ArchLucid.Core | 20.40 | 11946 |
| ArchLucid.Contracts | 23.90 | 6995 |
| ArchLucid.Notifications | 25.60 | 414 |
| ArchLucid.ArtifactSynthesis | 33.31 | 3664 |
| ArchLucid.Host.Composition | 72.83 | 4608 |
| ArchLucid.ContextIngestion | 76.22 | 2025 |
| ArchLucid.Analyzers | 82.18 | 1794 |
| ArchLucid.Capabilities.Cost | 83.61 | 122 |
| ArchLucid.Decisioning | 85.07 | 13406 |
| ArchLucid.Provenance | 88.12 | 730 |
| ArchLucid.Integrations.AzureDevOps | 90.15 | 671 |
| ArchLucid.KnowledgeGraph | 92.01 | 1180 |
| ArchLucid.Api.Client | 100.00 | 32 |

## Up to three classes per assembly with the most uncovered line entries

Per Cobertura **class** aggregate line blocks (`<class>/<lines>/<line hits="…"/>`). 
**Partial types** merged by **class name + file**.

### ArchLucid.AgentSimulator (0.00% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.AgentSimulator.Services.FakeScenarioFactory` | `ArchLucid.AgentSimulator\Services\FakeScenarioFactory.cs` | 256 |
| 2 | `ArchLucid.AgentSimulator.Services.DeterministicAgentSimulator` | `ArchLucid.AgentSimulator\Services\DeterministicAgentSimulator.cs` | 28 |
| 3 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 7 |

### ArchLucid.Retrieval (0.00% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Retrieval.Indexing.RetrievalDocumentBuilder` | `ArchLucid.Retrieval\Indexing\RetrievalDocumentBuilder.cs` | 69 |
| 2 | `ArchLucid.Retrieval.Indexing.RetrievalIndexingService` | `ArchLucid.Retrieval\Indexing\RetrievalIndexingService.cs` | 54 |
| 3 | `ArchLucid.Retrieval.Embedding.CircuitBreakingOpenAiEmbeddingClient` | `ArchLucid.Retrieval\Embedding\CircuitBreakingOpenAiEmbeddingClient.cs` | 46 |

### ArchLucid.AgentRuntime (3.53% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.AgentRuntime.AgentExecutionTraceRecorder` | `ArchLucid.AgentRuntime\AgentExecutionTraceRecorder.cs` | 385 |
| 2 | `ArchLucid.AgentRuntime.RealAgentExecutor` | `ArchLucid.AgentRuntime\RealAgentExecutor.cs` | 242 |
| 3 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputTraceQualityEvaluator` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputTraceQualityEvaluator.cs` | 233 |

### ArchLucid.Application (3.92% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Application.Bootstrap.DemoSeedService` | `ArchLucid.Application\Bootstrap\DemoSeedService.cs` | 765 |
| 2 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonExportService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonExportService.cs` | 405 |
| 3 | `ArchLucid.Application.Templates.ArchitectureRequestTemplates` | `ArchLucid.Application\Templates\ArchitectureRequestTemplates.cs` | 386 |

### ArchLucid.Persistence (8.53% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Persistence.Tenancy.DapperTenantRepository` | `ArchLucid.Persistence\Tenancy\DapperTenantRepository.cs` | 583 |
| 2 | `ArchLucid.Persistence.Tenancy.InMemoryTenantRepository` | `ArchLucid.Persistence\Tenancy\InMemoryTenantRepository.cs` | 529 |
| 3 | `ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineStagesExecutor` | `ArchLucid.Persistence\Orchestration\Pipeline\AuthorityPipelineStagesExecutor.cs` | 355 |

### ArchLucid.Host.Core (18.76% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Host.Core.DataConsistency.DataConsistencyOrphanProbeExecutor` | `ArchLucid.Host.Core\DataConsistency\DataConsistencyOrphanProbeExecutor.cs` | 286 |
| 2 | `ArchLucid.Host.Core.Services.Ask.AskService` | `ArchLucid.Host.Core\Services\Ask\AskService.cs` | 209 |
| 3 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkProcessor` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkProcessor.cs` | 141 |

### ArchLucid.Core (20.40% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Core.Configuration.ConfigurationKeyCatalog` | `ArchLucid.Core\Configuration\ConfigurationKeyCatalog.cs` | 400 |
| 2 | `ArchLucid.Core.Diagnostics.ArchLucidInstrumentation` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 284 |
| 3 | `ArchLucid.Core.GoldenCorpus.RealLlmOutputStructuralValidator` | `ArchLucid.Core\GoldenCorpus\RealLlmOutputStructuralValidator.cs` | 152 |

### ArchLucid.Contracts (23.90% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Contracts.ValueReports.ValueReportReviewCycleSectionFormatter` | `ArchLucid.Contracts\ValueReports\ValueReportReviewCycleSectionFormatter.cs` | 95 |
| 2 | `ArchLucid.Contracts.Agents.AgentExecutionTrace` | `ArchLucid.Contracts\Agents\AgentExecutionTrace.cs` | 60 |
| 3 | `ArchLucid.Contracts.Metadata.RunExportRecord` | `ArchLucid.Contracts\Metadata\RunExportRecord.cs` | 54 |

### ArchLucid.Notifications (25.60% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Notifications.AuthorityRunCommittedChatOpsHook` | `ArchLucid.Notifications\AuthorityRunCommittedChatOpsHook.cs` | 63 |
| 2 | `ArchLucid.Notifications.ChatOpsIncomingWebhookBodies` | `ArchLucid.Notifications\ChatOpsIncomingWebhookBodies.cs` | 40 |
| 3 | `ArchLucid.Notifications.SlackInteractivityVerifier` | `ArchLucid.Notifications\SlackInteractivityVerifier.cs` | 29 |

### ArchLucid.ArtifactSynthesis (33.31% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.ArtifactSynthesis.Docx.DocxExportService` | `ArchLucid.ArtifactSynthesis\Docx\DocxExportService.cs` | 321 |
| 2 | `ArchLucid.ArtifactSynthesis.Docx.Builders.WordDocumentBuilder` | `ArchLucid.ArtifactSynthesis\Docx\Builders\WordDocumentBuilder.cs` | 132 |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.ReferenceArchitectureMarkdownGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ReferenceArchitectureMarkdownGenerator.cs` | 101 |

### ArchLucid.Host.Composition (72.83% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` | 331 |
| 2 | `ArchLucid.Host.Composition.Configuration.ArchLucidStorageServiceCollectionExtensions` | `ArchLucid.Host.Composition\Configuration\ArchLucidStorageServiceCollectionExtensions.cs` | 98 |
| 3 | `ArchLucid.Host.Composition.ValueReports.InMemoryValueReportJobQueue` | `ArchLucid.Host.Composition\ValueReports\InMemoryValueReportJobQueue.cs` | 75 |

### ArchLucid.ContextIngestion (76.22% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalInfrastructureEnricher` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalInfrastructureEnricher.cs` | 20 |
| 2 | `ArchLucid.ContextIngestion.Infrastructure.ContextConnectorPipeline` | `ArchLucid.ContextIngestion\Infrastructure\ContextConnectorPipeline.cs` | 19 |
| 3 | `ArchLucid.ContextIngestion.Infrastructure.JsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\JsonInfrastructureDeclarationParser.cs` | 19 |

### ArchLucid.Analyzers (82.18% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Analyzers.ForeachToLinqAnalyzer` | `ArchLucid.Analyzers\ForeachToLinqAnalyzer.cs` | 41 |
| 2 | `ArchLucid.Analyzers.TenantIdentityBoundaryAnalyzer` | `ArchLucid.Analyzers\TenantIdentityBoundaryAnalyzer.cs` | 36 |
| 3 | `ArchLucid.Analyzers.MutableStaticAnalyzer` | `ArchLucid.Analyzers\MutableStaticAnalyzer.cs` | 21 |

### ArchLucid.Capabilities.Cost (83.61% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Capabilities.Cost.CostAgentHandler` | `ArchLucid.Capabilities.Cost\CostAgentHandler.cs` | 10 |

### ArchLucid.Decisioning (85.07% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Decisioning.Repositories.InMemoryFindingsSnapshotRepository` | `ArchLucid.Decisioning\Repositories\InMemoryFindingsSnapshotRepository.cs` | 83 |
| 2 | `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery` | `ArchLucid.Decisioning\Plugins\FindingEnginePluginDiscovery.cs` | 75 |
| 3 | `ArchLucid.Decisioning.Merge.AgentProposalManifestMerger` | `ArchLucid.Decisioning\Merge\AgentProposalManifestMerger.cs` | 69 |

### ArchLucid.Provenance (88.12% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Provenance.DecisionProvenanceSnapshot` | `ArchLucid.Provenance\DecisionProvenanceSnapshot.cs` | 15 |
| 2 | `ArchLucid.Provenance.Services.ProvenanceGraphAlgorithms` | `ArchLucid.Provenance\Services\ProvenanceGraphAlgorithms.cs` | 11 |
| 3 | `ArchLucid.Provenance.GraphEdgeVm` | `ArchLucid.Provenance\GraphViewModels.cs` | 8 |

### ArchLucid.Integrations.AzureDevOps (90.15% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.Integrations.AzureDevOps.AzureDevOpsPullRequestDecorator` | `ArchLucid.Integrations.AzureDevOps\AzureDevOpsPullRequestDecorator.cs` | 30 |
| 2 | `ArchLucid.Integrations.AzureDevOps.AuthorityRunCompletedAzureDevOpsIntegrationEventHandler` | `ArchLucid.Integrations.AzureDevOps\AuthorityRunCompletedAzureDevOpsIntegrationEventHandler.cs` | 2 |

### ArchLucid.KnowledgeGraph (92.01% line coverage)

| Rank | Class | File | Uncovered line entries |
|------|-------|------|------------------------|
| 1 | `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer` | `ArchLucid.KnowledgeGraph\Inference\DefaultGraphEdgeInferer.cs` | 11 |
| 2 | `ArchLucid.KnowledgeGraph.Repositories.InMemoryGraphSnapshotRepository` | `ArchLucid.KnowledgeGraph\Repositories\InMemoryGraphSnapshotRepository.cs` | 8 |
| 3 | `ArchLucid.KnowledgeGraph.Caching.NonCachingGraphSnapshotProjectionCache` | `ArchLucid.KnowledgeGraph\Caching\NonCachingGraphSnapshotProjectionCache.cs` | 7 |

### ArchLucid.Api.Client (100.00% line coverage)

_No uncovered line rows in Cobertura for this package (or only branches uncovered)._

## Merged totals (reference)

- **Merged line coverage:** 22.61%
- **Merged branch coverage:** 16.12%

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
- **2026-04-15 — doc refresh:** Full **`coverage-gap-report`** pipeline (solution test + ReportGenerator + **`scripts/ci/coverage_gap_analysis.py`**). Merged totals above; **ArchLucid.Persistence** remains the lowest assembly (~53% line).
- **2026-04-15 — tests:** **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`** — relational **decisions** (**GoldenManifestDecisionEvidenceLinks** / **GoldenManifestDecisionNodeLinks**, **SortOrder**), **provenance** from **GoldenManifestProvenanceSourceGraphNodes** + **GoldenManifestProvenanceAppliedRules** without source-finding rows, relational **warnings** + **provenance source findings**, JSON fallbacks (**AssumptionsJson**, **ProvenanceJson**, **DecisionsJson**) when relational slice rows are absent. **`GraphSnapshotRelationalReadDirectSqlIntegrationTests`** — **GraphSnapshotWarnings** override + **EdgesJson** merge when **GraphSnapshotEdgeProperties** is empty. **`FindingsSnapshotRelationalReadDirectSqlIntegrationTests`** — full relational **FindingRecords** path. **`RunLifecycleStatePropertyTests`** (`ArchLucid.Application.Tests`) — FsCheck **`CommitRunAsync`** gates. **`GovernanceWorkflowTransitionConflictPropertyTests`** — concurrent terminal peer → **`GovernanceApprovalReviewConflictException`**; invalid env pairs on **`SubmitApprovalRequestAsync`**. **`GovernanceWorkflowSegregationAndPromotionPropertyTests`** — **`PromoteAsync`** rejects approval **ManifestVersion** mismatch. **`scripts/ci/coverage_gap_analysis.py`** — **`ValueError`** handler uses the correct file path variable.
- **2026-04-14:** Extended **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`** with relational **warnings** and **provenance source findings** (SQL). **`AlertEvaluatorDeduplicationKeyPropertyTests`** — dedupe keys for **`CriticalRecommendationCount`** and **`NewComplianceGapCount`** (`ArchLucid.Decisioning.Tests`).

## How to refresh

Narrative bullets under **Recent targeted tests** live in `docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md` and are merged by this script when that file exists.

```powershell
dotnet test ArchLucid.sln -c Release --settings coverage.runsettings `
  --collect:"XPlat Code Coverage" --results-directory .\coverage-gap-1a
dotnet tool restore
dotnet reportgenerator "-reports:coverage-gap-1a/**/coverage.cobertura.xml" "-targetdir:coverage-gap-1a/merged" "-reporttypes:Cobertura"
python scripts/ci/coverage_gap_analysis.py
```
