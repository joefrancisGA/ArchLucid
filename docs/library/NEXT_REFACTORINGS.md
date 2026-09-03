> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-03.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 items in the completed table shipped in PR #1098. The **2026-09-02** batch (items 1–30) shipped on **master** (2026-09-02). The **2026-09-02 pass-3** batch (items 1–10) shipped in PR **#1173**. The **2026-09-02 pass-4** batch (items 1–10) shipped in PR **#1178**. The **2026-09-02 pass-5** batch (items 1–10) shipped in PR **#1182**. The **2026-09-02 pass-6** batch (items 1–10) shipped in PR **#1186**. The **2026-09-02 pass-7** batch (items 1–10) shipped in PR **#1192**. The **2026-09-03 pass-8** batch (items 1–10) shipped in PR **#1231**. The **2026-09-03 pass-9** batch (items 1–10) shipped in PR **#1265**. The **2026-09-03 pass-10** batch (items 1–10) shipped in PR **#1307**.

## Completed (removed from active list)

| Item | Status |
|------|--------|
| Unify Data and Persistence (`ArchLucid.Persistence.*` merge) | Done — see `PERSISTENCE_CONSOLIDATION_PLAN.md` |
| Connection factory alignment | Done (2026-05-08) — unused `SqlConnectionFactory` removed |
| Dual pipeline coordinator closure | Done — ADR 0030 + `DualPipelineRegistrationDisciplineTests` |
| Decompose authority commit orchestrator | Done (2026-08-25) — `AuthorityCommit*Stage` handlers under `ArchLucid.Application/Runs/Orchestration/Commit/`; orchestrator ~283 lines |
| Extract authority pipeline stage handlers | Done (2026-08-25) — `AuthorityPipeline*Stage` handlers under `ArchLucid.Application/Runs/Orchestration/Pipeline/Stages/`; executor ~290 lines |
| Consolidate identity/auth bounded module | Done (2026-08-25) — `AuthAuditEmitter`, `AuthRateLimitHelper`, `AuthValidationResultMapper` in `ArchLucid.Application/Identity/`; all identity services migrated; `EmailOtpRequestFlow` extracted from `EmailOtpAuthService` |
| Tighten governance API boundaries | Done (2026-08-25) — `PolicyPackWorkflowFacade` in `ArchLucid.Application/Governance/PolicyPacks/`; `PolicyPacksController` thinned to HTTP concerns |
| Split `GovernanceWorkflowService` into workflow facade + stages | Done (2026-08-25) — `GovernanceWorkflowFacade` + submit/review/promote/activate stage handlers under `ArchLucid.Application/Governance/Workflow/`; `GovernanceWorkflowService` thinned to delegate; `GovernanceWorkflowFacadeTests` |
| Thin remaining fat controllers | Done (2026-08-25) — `GovernanceStickinessFacade`, `PilotsApplicationService`, `ComparisonsApplicationService`; legacy run-read routes thinned via `TraceabilityBundleExportApplicationService` + `AuthorityReadsController`; `GovernanceStickinessFacadeTests`, `ComparisonsApplicationServiceTests` |
| Finish demo/sample scenario decoupling | Done (2026-08-25) — `resolveSampleScenarioByPolicyPackId` / hero-finding registry lookups; UI helpers (`finding-display-from-inspect.ts`, `graph-mapper.ts`, `policy-pack-detail-resolver.ts`, `showcase-page-copy.ts`, `graph-buyer-node-detail.ts`, `provenance-graph-presentation.ts`) read from `archlucid-ui/src/lib/samples/registry.ts`; TB-978, TB-979, TB-980 |
| Unify Architecture Intelligence heuristic vs LLM stacks | Done (2026-08-25) — `IArchitectureIntelligenceReviewRouter` + `SpecialistReviewRouterService` / `AdversarialReviewRouterService`; `ArchitectureIntelligenceLlmJsonCompletionHelper` + response mapper/shapes; `UseLlmReview` option on `ArchitectureIntelligencePipelineOptions` |
| Deduplicate persistence twins (SQL/in-memory/Cosmos) | Done (2026-08-25) — `RunRepositoryCore` + `AgentExecutionTraceUpsertPolicy`; `SqlRunRepository` / `InMemoryRunRepository` share mapping, validation, archive/purge, and in-memory query selection; `RunRepositoryCoreTests`, `AgentExecutionTraceUpsertPolicyTests` |
| Decompose mega UI clients | Done (2026-08-25) — `BuyerCtoDemoTourOverlay` split into `CtoDemoTourPreflightPanel`, `CtoDemoTourPresenterNotesPanel`, `CtoDemoTourNavigationPanel`; `SsoWizardPageClient` → `useSsoWizardStepState` + `SsoWizardStepContent`; `AzureBoardsIntegrationPageClient` → `AzureBoardsConnectionStatusPanel`; Vitest coverage on extracted modules |
| Alias hand-authored `types/*` to OpenAPI schemas | Done (2026-08-25) — `authority.ts`, `operate-rhythm.ts`, `technology-ledger.ts` alias `components` from `@/lib/openapi-schemas`; UI-only fields via intersection; `openapi-type-aliases.test.ts` |
| Replace CLI `Program.cs` switch with command registry | Done (2026-08-25) — `CommandRegistry` + `CommandDescriptor` + `CliCommandHandlers`; `Program.cs` thinned to registry dispatch; `CommandRegistryTests` |
| Split Host.Composition DI partials (Agents / pipeline / alerts) | Done (2026-08-25) — `AgentCompositionModule`, `PipelineCompositionModule`, `AlertsCompositionModule` under `Startup/Modules/`; `CompositionModulesRegistrationDisciplineTests` |
| Decompose architecture-run execute orchestrator | Done (2026-09-01) — `ArchitectureRunExecute*Stage` handlers under `ArchLucid.Application/Runs/Orchestration/Execute/`; orchestrator thinned to stage delegation |
| Finish Host.Composition DI module extraction | Done (2026-09-01) — `WeeklyDigestCompositionModule`, `HostedCloudExtractorCompositionModule`, `TrialLifecycleCompositionModule`; discipline tests extended |
| Extract snapshot/artifact relational backfill core | Done (2026-09-01) — `SqlRelationalSliceBackfillCore` + `SqlRelationalSliceBackfillCoreTests`; graph/context/artifact backfills share helper |
| Unify compare HTTP surfaces | Done (2026-09-01) — `CompareRunsApplicationFacade`; `ComparisonController` + `RunComparisonController` delegate; routes unchanged |
| Thin remaining `GovernanceController` | Done (2026-09-01) — `GovernanceApprovalRequestsFacade`, `GovernancePromotionsActivationsFacade`, `GovernanceInsightsFacade` |
| Split `DemoSeedService` into scenario seeders | Done (2026-09-01) — `IDemoSeedScenarioSeeder` + six implementations under `Bootstrap/Seeders/`; `DemoSeedService` orchestrates via registry |
| Decompose closed-loop reasoning orchestrator | Done (2026-09-01) — `ClosedLoop*Stage` handlers under `ArchitectureIntelligence/Stages/`; orchestrator thinned to sequencer |
| Split `ArchLucidInstrumentation` by meter domain | Done (2026-09-01) — `ArchLucidGrowthFunnelMeters`, `ArchLucidLlmMeters`; instrumentation partials forward |
| Continue UI mega-client split (guided intake) | Done (2026-09-01) — `SocraticIntakeWizardStepClarifications`, `SocraticIntakeWizardFooterActions`, `NewRunWizardStepPanels`, `use-new-run-wizard-client`, `ArchitectureScopeUnderstandingCheckFields` |
| Alias remaining hand-authored UI types to OpenAPI | Done (2026-09-01) — `alerts`, `advisory`, `governance-workflow`, `digest-subscriptions`, `conversation` alias OpenAPI; `openapi-type-aliases.test.ts` extended to 47 keys |
| Decompose Quick Scan execution into stage handlers | Done (2026-09-02) — `QuickScan*Stage` handlers under `ArchLucid.Application/Architecture/Execute/`; orchestrator thinned to sequencer |
| Share an ITSM inbound webhook process pipeline | Done (2026-09-02) — `ItsmInboundWebhookProcessPipeline` + provider readers/mappers; ServiceNow/Jira processors delegate |
| Extract tenant trial-lifecycle repository core | Done (2026-09-02) — `TenantTrialLifecycleCore`; Dapper + InMemory trial partials share mapping/validation |
| Split `WorkspaceAiAvailabilityService` probes | Done (2026-09-02) — `WorkspaceAiAvailability*Probe` builders; service composes check rows |
| Thin remaining advisory / intake / export HTTP | Done (2026-09-02) — `AdvisoryWorkflowFacade`, `ArchitectureRequestIntakeFacade`, `RunExportQueryFacade`, `BillingCheckoutFacade` |
| Extract LLM tenant-budget period core | Done (2026-09-02) — `LlmTenantBudgetPeriodCore`; SQL + InMemory share period keys and state transitions |
| Split execute agent-loop stage (follow-on) | Done (2026-09-02) — `IAgentLoopPrepareStage` / `Invoke` / `Persist`; `ArchitectureRunExecuteAgentLoopStage` is a sequencer |
| Continue UI mega-client split (draft + findings queue) | Done (2026-09-02) — findings queue section shell, compact register filter, compare-form URL sync hook, `GraphViewerReactFlowTriggers` |
| Alias remaining hand-authored UI types to OpenAPI (wave 3) | Done (2026-09-02) — `policy-packs`, `graph`, `comparison`, `finding-inspect`, `auth`, learning/evolution modules; `openapi-type-aliases.test.ts` ~91 keys |
| Finish Host.Composition module extraction (retrieval + coordinator) | Done (2026-09-02) — `RetrievalCompositionModule`, `CoordinatorArtifactsCompositionModule`, `DataHealthJobsCompositionModule`; `AgentCompletion*Registrar` split |
| Extract `TenantRepositoryCore` (beyond trial lifecycle) | Done (2026-09-02) — `TenantRepositoryCore` for slug/workspace/erasure/copy; SQL + InMemory adapters thin |
| Split `RunsController` by route family | Done (2026-09-02) — partial controllers per route family (`Execute`, `Create`, `AsyncOperations`, `CommitReplayPin`, `ArchitectureRequests`, `Intake`, …) |
| Extract `DraftRequestRepositoryCore` | Done (2026-09-02) — shared filter/sort/status/document mapping; cache decorator unchanged |
| Extract integration-event outbox repository core | Done (2026-09-02) — `IntegrationEventOutboxRepositoryCore` for ordering, cap, clone rules |
| Extract `AlertRecordRepositoryCore` | Done (2026-09-02) — shared inbox list/filter and status transitions |
| Extract `ComparisonRecordRepositoryCore` | Done (2026-09-02) — shared search predicates and write/version rules |
| Share agent-result repository mapping | Done (2026-09-02) — `AgentResultRepositoryCore` for upsert/completeness/query projection |
| Unify agent-execution-trace query/patch across SQL, InMemory, and Cosmos | Done (2026-09-02) — `AgentExecutionTraceQueryPatchCore` extends upsert policy |
| Thin remaining governance HTTP after facades | Done (2026-09-02) — `*HttpMapper` types under `ArchLucid.Api/Http/Governance/` |
| Extract relational slice read / hydrate core | Done (2026-09-02) — `RelationalSliceReadCore` for golden-manifest and context-snapshot hydrates |
| Decompose `PortfolioRecurrenceFindingEngine` | Done (2026-09-02) — `IPortfolioRunScanSource`, `IRecurrenceIdentityMatcher`, `IPortfolioRecurrenceFindingEmitter` |
| Split `AuthorityRunDetailOperatorEnricher` into slices | Done (2026-09-02) — `IRunDetailEnrichmentSlice` per concern + composer |
| Decompose async run operation hosted service | Done (2026-09-02) — drain / create-complete / execute-replay workers extracted |
| Split `OperatorShellStatusService` probes | Done (2026-09-02) — probe builders return typed rows; service composes shell DTO |
| Finish demo-scenario seeder extraction | Done (2026-09-02) — `DemoSeedPersistenceChain` shared across scenario seeders |
| Share architecture-review-board PDF/DOCX section model | Done (2026-09-02) — section visitor over export model; PDF/DOCX renderers only |
| Continue UI mega-hook split (graph / compare / audit / findings queue) | Done (2026-09-02) — `use-compare-form-url-sync`, `GraphViewerReactFlowTriggers`, governance queue sections |
| Thin evolution + draft-planning HTTP/application gods | Done (2026-09-02) — `EvolutionApplicationFacade`, `DraftRequestApplicationFacade` |
| Split leftover fat workflow/identity stages | Done (2026-09-02) — promote sub-stages; identity-link persist vs notify |
| Extract Azure Boards outbound ticket connector pipeline | Done (2026-09-02) — outbound sync pipeline mirrors ITSM inbound shape |
| Decompose `FindingsOrchestrator` into stage handlers | Done (2026-09-02 pass-3) — `*Stage` handlers under `ArchLucid.Decisioning/Services/Findings/`; orchestrator thinned |
| Extract coordination outbox repository cores | Done (2026-09-02 pass-3) — `CoordinationOutboxRepositoryCore`; retrieval/projection/export repos share rules |
| Finish leftover persistence twin cores | Done (2026-09-02 pass-3) — finding-inspect, product-learning pilot signal, composite alert rules, coverage assignment, agent model catalog |
| Thin remaining HTTP via facades | Done (2026-09-02 pass-3) — `PolicyPackHttpFacade`, `TenantTrialFacade`, `DigestSubscriptionFacade`, `ItsmInboundWebhookFacade` |
| Share CLI buyer-proof / pilot-readiness helpers | Done (2026-09-02 pass-3) — `CliHttpProbeSession`, `BuyerPacketFolderWriter`; commands delegate |
| Continue UI mega-client split (hub / ask / run-detail) | Done (2026-09-02 pass-3) — `use-runs-dashboard-tabs`, `use-ask-page-url-sync`, `AskRunIdPicker*`, deferred run-detail imports |
| Alias hand-authored UI types to OpenAPI (wave 4) | Done (2026-09-02 pass-3) — governance, pilot value, product-learning, tenant settings, feasibility; `openapi-type-aliases.test.ts` ~135 keys |
| Decompose execute/create post-hook sequencers | Done (2026-09-02 pass-3) — `Execute/Hooks/*`, `Create/Hooks/*`; post stages are hook sequencers |
| Split `AuthorityPipelineWorkProcessor` | Done (2026-09-02 pass-3) — `IAuthorityPipelineWorkHandler` + execute handler; `AuthorityPipelineWorkRepositoryCore` |
| Extract graph inference rules + canonical mappers | Done (2026-09-02 pass-3) — `IGraphEdgeInferenceRule` rules; `CanonicalInfrastructureObjectMapper` helpers |
| Finish `IAuthorityPipelineWorkHandler` commit / extractor implementations | Done (2026-09-02 pass-4) — `WorkKind` on payload; `AuthorityPipelineWorkHandlerCore` + `AuthorityPipelineMaterializeWork`; commit/extractor/execute handlers |
| Split leftover execute-stage sequencers | Done (2026-09-02 pass-4) — idempotency, cancellation guard, persist rows, quality-gate retry stages; parents thin sequencers |
| Extract findings-snapshot repository core | Done (2026-09-02 pass-4) — `FindingsSnapshotRepositoryCore`; SQL + InMemory share scope/cap/serialize rules |
| Finish LLM tenant-budget twin after period core | Done (2026-09-02 pass-4) — `LlmTenantBudgetReserveCore` / `LlmTenantBudgetSettleCore`; InMemory + SQL Monthly delegate |
| Split `PolicyPackHttpFacade` and route leftover simulate HTTP | Done (2026-09-02 pass-4) — partial facades (Crud/Catalog/Simulate); `GovernanceController.Simulate` via facade |
| Finish CLI buyer-proof recipes after shared HTTP/folder helpers | Done (2026-09-02 pass-4) — `IPilotReadinessSlotRunner` + slot runners; `RealModeSmokeHealthProbe` |
| Extract demo-seeder scenario bodies after `DemoSeedPersistenceChain` | Done (2026-09-02 pass-4) — `TrialWelcomeWorkspaceSeed`, `RetailBaselineWorkspaceSeed` partials |
| Continue UI mega-client split (search, graph, compare, audit, alerts) | Done (2026-09-02 pass-4) — global search, compare-form, audit, alerts hooks/panels extracted |
| Alias hand-authored UI types to OpenAPI (wave 5) | Done (2026-09-02 pass-4) — draft-intake enums, stage-timeline, recommendation-learning-operational, global-search; `openapi-type-aliases.test.ts` ~162 keys |
| Split leftover workspace-AI probe composition + completion fallback | Done (2026-09-02 pass-4) — managed/customer/circuit-breaker probes; `AgentCompletionFallbackEligibility` + `AgentCompletionFallbackChain` |
| Split leftover `GovernanceStickinessController` route families | Done (2026-09-02 pass-5) — UI API split by register family; `governance-stickiness-api-*.ts` modules |
| Decompose `ReplayRunService` into stage handlers | Done (2026-09-02 pass-5) — `ReplayRun*Stage` under `Replay/`; service is thin sequencer |
| Split `EndToEndReplayComparisonService` into diff slices | Done (2026-09-02 pass-5) — `IReplayComparisonDiffSlice` + `EndToEndReplayComparisonReportComposer` |
| Unify Cosmos agent-execution-trace query with SQL/InMemory core | Done (2026-09-02 pass-5) — `CosmosAgentTraceQueryCore`; Cosmos query partial delegates |
| Extract identity persistence cores | Done (2026-09-02 pass-5) — `EmailOtpChallengeRepositoryCore`, `AuthenticationIdentityRepositoryCore`, `PlatformTenantAuthRecoveryGrantRepositoryCore` |
| Finish leftover CLI proof / doctor / scoreboard gods | Done (2026-09-02 pass-5) — health probes, scoreboard/drift parsers, `BuyerProofArtifactCollector`, brief section builders |
| Finish leftover demo-seeder scenario bodies | Done (2026-09-02 pass-5) — `CreatedSampleWorkspaceSeed.SeedPayload`, `MeridianAlpineWorkspaceSeed`, `NorthwindTourWorkspaceSeed` |
| Continue UI mega-client split (graph, run-detail, findings queue, CTO tour) | Done (2026-09-02 pass-5) — graph load/saved-views/buyer-shell hooks, run-detail tab compositions, CTO tour controller/shell, findings queue mode/synopsis |
| Alias hand-authored UI types to OpenAPI (wave 6) | Done (2026-09-02 pass-5) — advisory-scheduling, alert-routing/simulation, architecture-provenance, demo-preview/explain, exec-digest, recommendation-learning, teams-webhook; `openapi-type-aliases.test.ts` ~193 keys |
| Extend `RelationalSliceReadCore` for golden-manifest hydrate + context-snapshot reads | Done (2026-09-02 pass-5) — shared JSON deserialize/coerce helpers; hydrate readers delegate |
| Split leftover `GovernanceStickinessController` server route families | Done (2026-09-02 pass-6) — `GovernanceStickinessControllerCore` shared validation; partials delegate |
| Sub-split `ArchLucidGrowthFunnelMeters` and `ArchLucidLlmMeters` by instrument domain | Done (2026-09-02 pass-6) — `ArchLucidTrialSignupMeters`, `ArchLucidEmailOtpMeters`, `ArchLucidPilotRailMeters`, `ArchLucidLlmTokenMeters`, `ArchLucidLlmBatchMeters`, `ArchLucidLlmCircuitBreakerMeters` |
| Decompose `AuthenticationIdentityLinkProposalService` into proposal stages | Done (2026-09-02 pass-6) — `LinkProposal/*` create/confirm/cancel stages + `ExternalKeyEligibilityChecker`; service is thin sequencer |
| Extract `TenantItsmConnectorConnectionRepositoryCore` | Done (2026-09-02 pass-6) — shared mapping/auth-mode/enabled-state rules; SQL + InMemory delegate |
| Finish `ArchitectureRunExecuteOrchestrator` sequencer thinning | Done (2026-09-02 pass-6) — `ArchitectureRunExecuteScopeResolveStage`, `TelemetryStage`, `TailHooksStage`; orchestrator delegates only |
| Finish CLI registry + pilot-readiness slot extraction | Done (2026-09-02 pass-6) — `CommandRegistry.Diagnostics/Proof/Scaffold` partials; six named `PilotReadiness/*SlotRunner` types |
| Continue `GovernanceFindingsQueueClient` split (table + saved views) | Done (2026-09-02 pass-6) — `GovernanceFindingsQueueTableShell`, `use-governance-findings-queue-saved-views`, `use-governance-findings-queue-triage-targets` |
| Split contextual-help and settings master catalogs | Done (2026-09-02 pass-6) — `help-topic-rows-{governance,integrations,operator}.ts`; `settings-master-catalog-{workspace,integrations,security}.ts` |
| Alias remaining hand-authored UI types to OpenAPI (wave 7) | Done (2026-09-02 pass-6) — `agent-forensics`, `explanation`, `governance-dashboard`, `draft-intake`, `authority`; `openapi-type-aliases.test.ts` ~235 keys |
| Extend persistence cores for draft + usage-event twins | Done (2026-09-02 pass-6) — extended `DraftRequestRepositoryCore`; new `UsageEventRepositoryCore` for aggregation keys and cap rules |
| Split leftover `GovernanceStickinessController.ExceptionsAndSchedules` | Done (2026-09-02 pass-7) — `Exceptions`, `Schedules`, `Attestation` partials; routes unchanged |
| Split `TenantTrialFacade` into conversion / abuse / identity-handoff stages | Done (2026-09-02 pass-7) — `Tenancy/Trial/*` stages; facade is thin sequencer |
| Decompose `DraftRequestCrudService` and `ArchitectureRequestDraftService` into stages | Done (2026-09-02 pass-7) — `Drafts/Stages/*` and `Planning/Stages/*`; services are thin sequencers |
| Extract leftover persistence twin cores (billing, saved views, recommendation-learning) | Done (2026-09-02 pass-7) — `BillingLedgerCore`, `OperatorSavedViewRepositoryCore`, `RecommendationLearningProfileRepositoryCore` |
| Split `AuthSignInRoutingService` into evaluation / bypass / customer-message stages | Done (2026-09-02 pass-7) — `SignInRouting/*` evaluator, bypass resolver, message builder |
| Finish leftover CLI proof-pack / draft-new / smoke-probe gods | Done (2026-09-02 pass-7) — arg parsers, `RealModeSmoke/*` probe files, `CliCommandHandlers.Proof` / `Support` partials |
| Continue UI mega-client split (alerts, cloud connections, extract-upload) | Done (2026-09-02 pass-7) — table/form shells and state hooks for alerts, cloud connections, extract-upload |
| Split leftover page-help catalogs and structured-brief helper | Done (2026-09-02 pass-7) — `page-help-topic-rows-{operator,admin}-*.ts`; `architecture-draft-structured-brief-{state,apply}.ts` |
| Alias remaining hand-authored UI types to OpenAPI (wave 8) | Done (2026-09-02 pass-7) — `RunExplanation`, `FindingConfidenceLevel`, `PilotScorecard*`; `openapi-type-aliases.test.ts` ~239 keys |
| Decompose `ExplanationService` and split `RunExplanationConfidenceCalloutBuilder` | Done (2026-09-02 pass-7) — `Explanation/Stages/*`; risk/cost/compliance callout builders + orchestrator |
| Split leftover `PolicyPacksController` catalog route families | Done (2026-09-03 pass-8) — `Catalog.Read` / `Catalog.Mutate` partials; CRUD shell unchanged; routes and auth equivalent |
| Split `InfrastructureExtensions` rate-limiting vs CORS/cache | Done (2026-09-03 pass-8) — `InfrastructureExtensions.RateLimiting.cs`, `InfrastructureExtensions.CorsCache.cs`; authorization shell unchanged |
| Decompose `CoveragePreviewService` and `PolicyPackManagementService` into stages | Done (2026-09-03 pass-8) — `Coverage/Stages/*`, `PolicyPacks/Stages/*`; services are thin sequencers |
| Extend leftover persistence twin cores (alerts, decision traces, extractor packages) | Done (2026-09-03 pass-8) — extended `AlertRecordRepositoryCore`; `DecisionTraceRepositoryCore`, `CloudInventoryExtractorPackageRepositoryCore` |
| Split `LlmTenantWalletService` into consume / refill / settlement stages | Done (2026-09-03 pass-8) — `Budgeting/Wallet/*` stages; service composes views only |
| Finish leftover CLI draft-new loop + scoreboard + support-bundle gods | Done (2026-09-03 pass-8) — `DraftNewCommandIntakeLoop`, scoreboard rules/normalizer split, `SupportBundleCollector.*` partials, pilot-proof builders |
| Continue UI mega-client split (bundled packs, recommendation-learning, sign-in, governance overview) | Done (2026-09-03 pass-8) — state hooks + table/panel shells for bundled packs, recommendation-learning ops, sign-in flow, governance overview |
| Split leftover help-topic traffic catalog and operator page-help remainder | Done (2026-09-03 pass-8) — `help-topic-rows-{governance,integrations,pilot}.ts`; `page-help-topic-rows-operator-{architecture,pilot}.ts` |
| Alias remaining hand-authored UI types to OpenAPI (wave 9) | Done (2026-09-03 pass-8) — pagination concrete aliases; documented UI-only `RunSummaryWireExtensions` and `ArchLucidRole`; `openapi-type-aliases.test.ts` ~245 keys |
| Split leftover Host.Composition `RetrievalCompositionModule` and Quick Scan concurrency | Done (2026-09-03 pass-8) — `RetrievalCompositionModule.Agents` / `.Indexing`; `QuickScanDistributedConcurrencyAdmissionResult` + lease-renewal helper |
| Split leftover `PolicyPacksController` CRUD vs assignment and `RunComparisonController` route families | Done (2026-09-03 pass-9) — `PolicyPacksController.Crud` / `.Assignment`; `RunComparisonController.Agents` / `.Replay` partials |
| Split `PipelineExtensions` pre/post-Serilog vs health/docs | Done (2026-09-03 pass-9) — `PipelineExtensions.BeforeSerilog` / `.HealthDocs`; `InfrastructureExtensions.RateLimiting.Rejection` sub-split |
| Decompose `PolicyPackDryRunService` and `AzureExtractorIngestService.PreparedZip` into stages | Done (2026-09-03 pass-9) — `PolicyPackDryRun/Stages/*`, `AzureExtractor/Stages/*`; services are thin sequencers |
| Extend leftover persistence twin cores (drafts, findings snapshots, outbox, ITSM connector) | Done (2026-09-03 pass-9) — extended `DraftRequestRepositoryCore`, `FindingsSnapshotRepositoryCore`, `IntegrationEventOutboxRepositoryCore`, `TenantItsmConnectorConnectionRepositoryCore` |
| Split `RealLlmOutputStructuralValidator` and `DeclarationPremiseConflictClassifier` | Done (2026-09-03 pass-9) — validator partials (`TopLevelKeys` / `Findings` / `Trace`); classifier partials by conflict kind |
| Finish leftover CLI tenant-isolation + deployment-evidence probe gods | Done (2026-09-03 pass-9) — `TenantIsolationNegativeTestOfflineRunner` / `LiveRunner`; `DeploymentEvidenceProbeRunner.*` gate partials |
| Continue UI mega-client split (new-run wizard, admin tenants, run-detail deferred chunks) | Done (2026-09-03 pass-9) — wizard stage hooks, `AdminTenantsTableShell`, run-detail deferred chunk family modules |
| Split leftover UI fetch client and design-token shell catalog | Done (2026-09-03 pass-9) — `http-auth` / `http-proxy`; `design-tokens-shell-{layout,typography,chrome}` |
| Alias remaining hand-authored UI types to OpenAPI (wave 10) | Done (2026-09-03 pass-9) — `authority-run-detail-wire.ts`; `RunDetailAgentResult` mapping; `openapi-type-aliases.test.ts` ~245 keys |
| Split leftover Host.Composition `CoordinatorArtifactsCompositionModule` and reference-data hot path | Done (2026-09-03 pass-9) — `CoordinatorArtifactsCompositionModule.Artifacts` / `.Explanation`; `ArchLucidReferenceDataHotPathRegistrar.*` family partials |
| Split leftover `ManifestsController.Get` and `UserPreferencesController` / `TenantWorkspacesController` route families | Done (2026-09-03 pass-10) — `ManifestsController.Get.Manifest` / `.Diagram` / `.Summary`; `UserPreferencesController.Appearance` / `.CloudVisibility` / `.NotificationPrefs`; `TenantWorkspacesController.WorkspaceList` / `.ProjectCrud` / `.RetentionPurge` |
| Decompose `TopologyProposalRelationshipEndpointIndex` and `GoldenArchitectureTestRunner` into stages/partials | Done (2026-09-03 pass-10) — `TopologyProposalRelationshipEndpointIndex.*` partials; `IGoldenArchitectureInvokeStage` / `IGoldenArchitectureBenchmarkStage` under `ArchitectureIntelligence/Stages/` |
| Extend leftover persistence twin cores (`RunRepositoryCore` split + draft adapter thinning + golden-manifest hydrate) | Done (2026-09-03 pass-10) — `RunRepositoryCore.Query` / `.InMemoryOrdering`; `DraftRequestRepositoryCore.InMemory*`; `GoldenManifestPhase1RelationalRead.Hydrate.*`; `SqlRunRepository.Query.*` slices |
| Split `GcpCloudBillingCatalogClient` and `HeuristicAgentOutputSemanticEvaluator` | Done (2026-09-03 pass-10) — `GcpCatalogHttpClient` / `GcpSkuCache` / `GcpSkuPricingParser`; `HeuristicAgentOutputClaimEvidenceStage` / `HeuristicAgentOutputTraceQualityStage` |
| Split leftover CLI `DraftNewCommandIntakeLoop` and `BuyerProofPackCommand` | Done (2026-09-03 pass-10) — `DraftNewCommandConnectStage` / `AdmitStage` / `MustQuestionLoop`; `BuyerProofPackCommandFetch` / `BuyerProofPackZipWriter` |
| Continue UI mega-client split (showcase SSR, tenant cost settings, graph controls, run-detail shell) | Done (2026-09-03 pass-10) — showcase server resolution + view shell; `use-tenant-cost-settings-form`; graph control buyer/operator shells; `RunDetailPageViewShell` |
| Split leftover UI API catalogs (`policy-governance-api`, `downloads-api`) and runtime diagnostics | Done (2026-09-03 pass-10) — `policy-packs-api` / `governance-workflow-api`; `downloads-blob` / `downloads-export-jobs`; `client-runtime-diagnostics-*` concern modules |
| Split leftover `authority.ts` composites (wave 11 type modules) | Done (2026-09-03 pass-10) — `authority-run-summary.ts`, `authority-manifest.ts`, `authority-run-detail.ts`; barrel re-exports; `openapi-type-aliases.test.ts` wave-11 guards |
| Split leftover Host.Composition `DataHealthJobsCompositionModule` | Done (2026-09-03 pass-10) — `DataHealthJobsCompositionModule.HealthChecks` / `.Reconciliation` / `.BackgroundJobs` |
| Split `SchemaValidationService` schema registry vs cache vs validate | Done (2026-09-03 pass-10) — `SchemaValidationRegistry`, `SchemaValidationCache`; service is thin validator |

## Active items (remaining)

**2026-09-03 pass 11 — suggestions only; do not treat this list as in-progress implementation.** Evidence from current line counts after PR **#1307** (pass-10 items 1–10). Same constraints as prior passes: keep HTTP routes, OpenAPI wire shapes, and tenant isolation unchanged unless a follow-up explicitly says otherwise.

1. **Split leftover `GovernanceController.PolicyPacks` and ITSM connector/correlation route families** — Pass-10 split Manifests Get / UserPreferences / TenantWorkspaces; leftovers: `GovernanceController.PolicyPacks` **321** (schema-keys, content-schema, simulate, dry-run, draft, generate in one partial), `ItsmCorrelationController` **302** (batch list, CRUD, patch — no partials), `TenantItsmConnectorConnectionsController` **295** (connection CRUD plus Jira OAuth consent). Split PolicyPacks into `Simulate` / `DryRun` / `DraftGenerate` partials; split ITSM controllers by list vs mutate vs OAuth; keep facade delegation; routes and auth stay equivalent. **Impact:** High (governance simulate/dry-run / ITSM operator APIs) · **Effort:** Low–Medium · **Paths:** `ArchLucid.Api/Controllers/Governance/GovernanceController.PolicyPacks.cs`, `ArchLucid.Api/Controllers/Integrations/ItsmCorrelationController.cs`, `ArchLucid.Api/Controllers/Integrations/TenantItsmConnectorConnectionsController.cs`

2. **Decompose `RunFindingsQueryService` and `ComparisonReplayPayloadComplexity` into stages/partials** — Pass-10 staged golden-architecture invoke/benchmark and topology index partials; leftovers: findings query **358** mixes list, CSV export, evidence-chain, and inspect; replay-payload complexity **361** mixes manifest-diff list properties, agent-delta lists, and JSON walk scoring. Extract `IRunFindingsListStage` / `IRunFindingsInspectStage` / `IRunFindingsCsvExportStage`; split payload complexity into `*.ManifestDiff` / `*.AgentDelta` partials; parents become sequencers. **Impact:** High (run-findings reads / comparison-replay cost heuristics) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Runs/Query/RunFindingsQueryService.cs`, `ArchLucid.Application/Analysis/ComparisonReplayPayloadComplexity.cs`

3. **Extend leftover persistence (`CosmosAgentExecutionTraceRepository.Query` + `SqlRunRepository.Write` + orphan blob cleanup)** — Pass-10 split `RunRepositoryCore` Query/InMemoryOrdering and `SqlRunRepository.Query.*`; leftovers: Cosmos trace Query **342** still mixes get-by-trace-id, run page, and LLM cost slices; `SqlRunRepository.Write` **327** mixes save/update, archive, and hard-delete purge; `AgentTraceOrphanBlobCleanupService` **339** mixes blob enumeration, orphan matching, and delete. Split Cosmos Query into `ById` / `RunPage` / `LlmCost`; Write into `Save` / `Archive` / `Purge`; extract blob-enum vs delete helpers. **Impact:** High (agent-trace reads / run archival / blob hygiene) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Cosmos/CosmosAgentExecutionTraceRepository.Query.cs`, `ArchLucid.Persistence/Repositories/SqlRunRepository.Write.cs`, `ArchLucid.Persistence/Archival/AgentTraceOrphanBlobCleanupService.cs`

4. **Split `FindingJsonConverter.Primitives` and `AgentOutputLlmSemanticJudge`** — Pass-10 extracted GCP catalog HTTP/cache/parser and heuristic claim/trace stages; leftovers: finding JSON primitives **449** mix string/dict readers, numeric coerce, and datetime parse; LLM semantic judge **348** mixes eligibility/budget peek, completion, and rubric parse. Extract `FindingJsonStringReaders` / `FindingJsonNumericReaders` / `FindingJsonDateReaders`; split judge into `Eligibility` / `CompleteParse` stages. Keep converter and judge results identical. **Impact:** High (finding deserialize / opt-in LLM judge correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.Primitives.cs`, `ArchLucid.AgentRuntime/Evaluation/AgentOutputLlmSemanticJudge.cs`

5. **Split leftover CLI `ArchLucidCliApiClient.Runs` and `GoldenCohortDriftCommand`** — Pass-10 extracted draft-new connect/admit/MUST-loop and buyer-proof fetch/ZIP; leftovers: CLI runs client **406** mixes create, submit-result, execute, commit, fingerprint, and seed; `GoldenCohortDriftCommand` **314** mixes arg parse, live cohort fetch, SHA/category compare, and optional real-LLM structural checks. Extract `ArchLucidCliApiClient.Runs.Create` / `.ExecuteCommit` / `.FingerprintSeed`; split drift into parse vs compare vs structural-check. **Impact:** Medium (CLI run lifecycle / golden-cohort drift) · **Effort:** Medium · **Paths:** `ArchLucid.Cli/ArchLucidCliApiClient.Runs.cs`, `ArchLucid.Cli/Commands/GoldenCohortDriftCommand.cs`

6. **Continue UI mega-client split (global search, draft list, run-detail tabs, account security)** — Pass-10 thinned showcase SSR, tenant cost settings, graph controls, and run-detail shell; remaining gods: `GlobalSearchBar` **570** (command palette vs header local search vs review-detail section search), `ArchitectureDraftListClient` **473** (filters, empty states, row actions), `RunDetailTabbedWorkspace` **450** (tab chrome vs deferred chunk wiring), `AccountSecurityPageClient` **441** (sign-in methods, recovery, session). Extract hooks and shells; pages become composition only. **Impact:** High (operator search / drafts / run-detail / account security UX) · **Effort:** Medium · **Paths:** `archlucid-ui/src/components/GlobalSearchBar.tsx`, `archlucid-ui/src/components/architecture/ArchitectureDraftListClient.tsx`, `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailTabbedWorkspace.tsx`, `archlucid-ui/src/app/(operator)/account/security/AccountSecurityPageClient.tsx`

7. **Split leftover UI API catalogs (`governance-stickiness-api` remainder and `architecture-runs-mutate`)** — Pass-10 split `policy-packs-api` / `governance-workflow-api` and downloads blob/export-jobs; leftovers: `governance-stickiness-api.ts` **446** still duplicates types already in `governance-stickiness-api-types.ts` and mixes remaining posture/recurrence/attestation calls; `architecture-runs-mutate.ts` **436** mixes create (idempotency/in-flight), pin/commit/execute, and seed/restore. Deduplicate types into the existing types module; split mutate into `architecture-runs-create` / `architecture-runs-lifecycle`; keep barrel re-exports. **Impact:** High (governance stickiness / run-mutate client maintainability) · **Effort:** Medium · **Paths:** `archlucid-ui/src/lib/api/governance-stickiness-api.ts`, `archlucid-ui/src/lib/api/architecture-runs-mutate.ts`

8. **Split leftover type composites (wave 12 type modules)** — Wave 11 shipped `authority-run-summary` / `authority-manifest` / `authority-run-detail` barrels and **245** OpenAPI alias keys; leftovers: `explanation.ts` **178** mixes `RunExplanation`, provenance, and structured envelope; `draft-intake.ts` **164** mixes lifecycle status with actor/trust descriptors; `authority-run-detail.ts` **129** still mixes trust-evidence aliases, provenance graph, pipeline timeline, and documented UI-only extras. Split into `explanation-run.ts` / `explanation-structured.ts`, `draft-intake-actors.ts`, `authority-run-detail-trust.ts` / `authority-run-detail-provenance.ts`; keep documented UI-only extensions; extend `openapi-type-aliases.test.ts` (do not drop the empty-`AgentResult` snapshot guard). **Impact:** Medium (contract drift on explanation / draft-intake / run-detail) · **Effort:** Low–Medium · **Paths:** `archlucid-ui/src/types/explanation.ts`, `archlucid-ui/src/types/draft-intake.ts`, `archlucid-ui/src/types/authority-run-detail.ts`, `archlucid-ui/src/types/openapi-type-aliases.test.ts`

9. **Split leftover Host.Composition `RunLifecycleOrchestrationCompositionRegistrar` and `ServiceCollectionExtensions` composer** — Pass-10 split DataHealthJobs HealthChecks/Reconciliation/BackgroundJobs; leftovers: run-lifecycle registrar **277** registers coverage/posture, create hooks, execute stages, and findings query in one `Register`; `ServiceCollectionExtensions` **266** still mixes hosted startup probes, outbound HTTP clients, and module dispatch. Extract `RunLifecycleOrchestrationCompositionRegistrar.Coverage` / `.CreateHooks` / `.ExecuteStages`; keep `Register` / `AddArchLucidApplicationServices` as thin composers. **Impact:** Medium (DI / run-lifecycle maintainability) · **Effort:** Low–Medium · **Paths:** `ArchLucid.Host.Composition/Startup/Modules/RunLifecycleOrchestrationCompositionRegistrar.cs`, `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.cs`

10. **Split `ComparisonService` section comparers and `ExplanationFaithfulnessChecker`** — Pass-10 extracted schema registry vs cache from `SchemaValidationService`; leftovers: `ComparisonService` **288** mixes decisions, requirements, security, topology, and cost comparers; `ExplanationFaithfulnessChecker` **288** mixes stopword/token extraction, corpus flatten, and unsupported-token listing. Extract `IManifestSectionComparer` slices (or `ComparisonService.*` partials per section); split faithfulness into token-extract vs corpus-check. Keep comparison keys and faithfulness report semantics identical. **Impact:** Medium (manifest compare / explanation faithfulness correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Decisioning/Comparison/ComparisonService.cs`, `ArchLucid.Decisioning/Findings/ExplanationFaithfulnessChecker.cs`

## Completed (2026-08-24 pass)

| # | Item | Notes |
|---|------|-------|
| 2 | Multi-cloud extractor pipeline | `HostedCloudExtractorRunResult` shared envelope |
| 5 | TanStack Query migration | `MIGRATION_BACKLOG` cleared; guard tests pass |
| 7 | Terraform posture module | `infra/modules/posture/` |
| 8 | OpenAPI TS split | `api-types/schemas.generated.ts` + `paths.generated.ts` |
| 9 | Merge API query controllers / retire legacy routes | `AuthorityReadsController` + `AuthorityRunReadHandlers`; `/v1/runs/*` canonical reads; legacy `[Obsolete]` |
| 10 | Reduce configuration sprawl | Pilot overlay, slim base appsettings, deprecated key catalog tags |
| 11 | Duplicate sponsor services | Removed unused `SponsorSummaryService` |
| 12 | DemoSeed registry | `DemoSeedScenarioRegistry` |

## Related (not duplicated here)

- **Contracts note:** Move heavy service interfaces out of `ArchLucid.Contracts` when team boundaries justify churn; keep DTOs in Contracts (ADR 0013).
- **Error message sanitization:** Ensure internal pipeline nomenclature does not leak in HTTP 400/500 responses.
- **Magic numbers / named bounds (MN-1 phase 2):** NSwag client style, optional `IOptions` for commit backoff.

## Archive

The April 2026 numbered backlog snapshot (`§8–§342`) was removed during doc cleanup (2026-07-22). Pre-cleanup text remains in git history.
