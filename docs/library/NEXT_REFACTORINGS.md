> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-03.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 items in the completed table shipped in PR #1098. The **2026-09-02** batch (items 1–30) shipped on **master** (2026-09-02). The **2026-09-02 pass-3** batch (items 1–10) shipped in PR **#1173**. The **2026-09-02 pass-4** batch (items 1–10) shipped in PR **#1178**. The **2026-09-02 pass-5** batch (items 1–10) shipped in PR **#1182**. The **2026-09-02 pass-6** batch (items 1–10) shipped in PR **#1186**. The **2026-09-02 pass-7** batch (items 1–10) shipped in PR **#1192**. The **2026-09-03 pass-8** batch (items 1–10) shipped in PR **#1231**.

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

## Active items (remaining)

**2026-09-03 pass 9 — suggestions only; do not treat this list as in-progress implementation.** Evidence from current line counts after PR **#1231** (pass-8 items 1–10). Same constraints as prior passes: keep HTTP routes, OpenAPI wire shapes, and tenant isolation unchanged unless a follow-up explicitly says otherwise.

1. **Split leftover `PolicyPacksController` CRUD vs assignment and `RunComparisonController` route families** — Pass-8 split catalog into `Catalog.Read` / `Catalog.Mutate`; HTTP leftovers: `PolicyPacksController` **330** (create/publish/assign/archive/delete/duplicate/list/enabled still one file) and `RunComparisonController` **333** (agent compare, summary, end-to-end replay compare, export — no partials). Split PolicyPacks into `Crud` / `Assignment` partials; split RunComparison into `Agents` / `Replay` partials; keep facade delegation; routes and auth stay equivalent. **Impact:** High (policy-pack + compare buyer APIs) · **Effort:** Low–Medium · **Paths:** `ArchLucid.Api/Controllers/Governance/PolicyPacksController.cs`, `ArchLucid.Api/Controllers/Authority/RunComparisonController.cs`

2. **Split `PipelineExtensions` pre/post-Serilog vs health/docs** — Pass-8 extracted rate-limiting vs CORS/cache; leftover API pipeline god **250**: `UseArchLucidPipelineBeforeSerilogRequestLogging` / `AfterSerilogRequestLogging` mix correlation, payload caps, auth, CORS, SAML, exception handling, health, and Scalar. Extract `PipelineExtensions.BeforeSerilog.cs` and `PipelineExtensions.HealthDocs.cs`; keep call order in the shell. Optional follow-on: sub-split `InfrastructureExtensions.RateLimiting.cs` (**279**) policy table vs rejection handler. **Impact:** Medium (startup middleware maintainability) · **Effort:** Low · **Paths:** `ArchLucid.Api/Startup/PipelineExtensions.cs`, `ArchLucid.Api/Startup/InfrastructureExtensions.RateLimiting.cs`

3. **Decompose `PolicyPackDryRunService` and `AzureExtractorIngestService.PreparedZip` into stages** — Pass-8 staged coverage preview / pack management; leftovers: dry-run service **303** mixes run-detail load, delta compute, mandatory redaction, and audit-on-failure; prepared-zip ingest partial **321** mixes zip validation, blob persist, agent-result seeding, and audit. Extract `IPolicyPackDryRunLoadStage` / `IPolicyPackDryRunRedactAuditStage` and `IAzureExtractorPreparedZipValidateStage` / `PersistStage`; services become sequencers. **Impact:** High (governance what-if / extractor ingest correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Governance/PolicyPackDryRunService.cs`, `ArchLucid.Application/AzureExtractor/AzureExtractorIngestService.PreparedZip.cs`

4. **Extend leftover persistence twin cores (drafts, findings snapshots, outbox, ITSM connector)** — Pass-8 covered alerts/decision-traces/extractor packages; leftovers: `InMemoryDraftRequestRepository` **383** still owns CRUD/reaper/child-branch queries despite `DraftRequestRepositoryCore` (**136**); `InMemoryFindingsSnapshotRepository` **313** vs SQL twin with `FindingsSnapshotRepositoryCore` only **59**; `InMemoryIntegrationEventOutboxRepository` **338** duplicates enqueue/retry/dead-letter; `SqlTenantItsmConnectorConnectionRepository` **327** still owns SQL + credential mapping despite `TenantItsmConnectorConnectionRepositoryCore` (**115**). Expand those cores; adapters delegate. **Impact:** High (drafts / findings / outbox / ITSM parity) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Data/Repositories/InMemoryDraftRequestRepository.cs`, `ArchLucid.Decisioning/Repositories/InMemoryFindingsSnapshotRepository.cs`, `ArchLucid.Persistence/IntegrationOutbox/InMemoryIntegrationEventOutboxRepository.cs`, `ArchLucid.Persistence/Integrations/SqlTenantItsmConnectorConnectionRepository.cs`

5. **Split `RealLlmOutputStructuralValidator` and `DeclarationPremiseConflictClassifier`** — Largest leftover analysis gods: Core validator **536** mixes AgentResult JSON shape, finding-content heuristics, trace completeness, and per-agent-type rules; Decisioning classifier **400** packs private-network, TLS, admin-ingress, and workload-isolation detectors with shared negation parsing. Split validator by concern (`TopLevelKeys` / `Findings` / `Trace`); split classifier by conflict kind (`*.PrivateNetwork.cs`, `*.Tls.cs`, …). **Impact:** High (golden-corpus / declaration-conflict correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Core/GoldenCorpus/RealLlmOutputStructuralValidator.cs`, `ArchLucid.Decisioning/Analysis/DeclarationPremiseConflictClassifier.cs`

6. **Finish leftover CLI tenant-isolation + deployment-evidence probe gods** — Pass-8 extracted draft-new intake, scoreboard rules, and support-bundle partials; leftovers: `TenantIsolationNegativeTestRunner` **340** mixes offline manifest replay, live HTTP probes, scope-header forging, and report aggregation; `DeploymentEvidenceProbeRunner` **338** mixes multi-gate filesystem probes and JSON report composition. Extract `TenantIsolationNegativeTestOfflineRunner` / `LiveRunner`; split deployment probes by gate family. **Impact:** Medium (tenant-isolation doctor / deployment evidence packets) · **Effort:** Medium · **Paths:** `ArchLucid.Cli/Commands/TenantIsolationNegativeTestRunner.cs`, `ArchLucid.Cli/Commands/DeploymentEvidenceProbeRunner.cs`

7. **Continue UI mega-client split (new-run wizard, admin tenants, run-detail deferred chunks)** — Pass-8 thinned bundled packs / recommendation-learning / sign-in / governance overview; remaining operator gods: `use-new-run-wizard-client.tsx` **440** (form state, baseline metrics, policy-pack mismatch, LLM budget gate, SSE stream), `AdminTenantsPageClient.tsx` **430** (list/query, provision, suspend, table), `run-detail-page-view-deferred-chunks.tsx` **443** (deferred chunk manifest + skeletons for every run-detail section). Extract stage hooks and table/chunk-map shells; pages become composition + routing only. **Impact:** High (intake / tenant admin / run-detail UX) · **Effort:** Medium · **Paths:** `archlucid-ui/src/app/(operator)/architecture/reviews/new/use-new-run-wizard-client.tsx`, `archlucid-ui/src/app/(operator)/internal/tenants/_sections/AdminTenantsPageClient.tsx`, `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-page-view-deferred-chunks.tsx`

8. **Split leftover UI fetch client and design-token shell catalog** — Pass-8 finished help-topic traffic / operator page-help domain modules; leftovers: `lib/api/http.ts` **459** mixes browser vs server fetch, OIDC refresh, correlation headers, trial-limit bridging, sandbox mocks, and warmup retry; `design-tokens-shell.ts` **483** mixes CSS var registry, layout shells, typography, CTA widths, and operator chrome. Extract `http-auth.ts` / `http-proxy.ts` (or equivalent) and `design-tokens-shell-{layout,typography,chrome}.ts`; keep public barrels. **Impact:** High (every API call / operator chrome tokens) · **Effort:** Medium · **Paths:** `archlucid-ui/src/lib/api/http.ts`, `archlucid-ui/src/lib/design-tokens-shell.ts`

9. **Alias remaining hand-authored UI types to OpenAPI (wave 10)** — Wave 9 shipped **245** keys (pagination concrete aliases; `RunSummaryWireExtensions` and `ArchLucidRole` documented as UI-only). Still hand-authored: `authority.ts` **306** `RunDetailAgentFinding` / `RunDetailAgentResult` / `RunDetail` composite because the OpenAPI snapshot emits `AgentResult` as `{}`; leftover `agent-forensics.ts` `AgentTraceRawSnapshot`. Prefer fixing the OpenAPI schema so `AgentResult` is a real object, then alias; otherwise split `authority-run-detail-wire.ts` and extend `openapi-type-aliases.test.ts`. **Impact:** Medium (contract drift on run-detail) · **Effort:** Medium · **Paths:** `archlucid-ui/src/types/authority.ts`, `archlucid-ui/src/types/agent-forensics.ts`, `archlucid-ui/src/types/openapi-type-aliases.test.ts`

10. **Split leftover Host.Composition `CoordinatorArtifactsCompositionModule` and reference-data hot path** — Pass-8 split `RetrievalCompositionModule` Agents/Indexing; leftovers: `CoordinatorArtifactsCompositionModule` **319** (authority decision engine, explanation summary, LLM cost override, artifact synthesis, infra cost sizing in one file) and `ArchLucidReferenceDataHotPathRegistrar` **308** (hot-path cache decorators across ~15 repository families). Extract `CoordinatorArtifactsCompositionModule.Artifacts.cs` / `.Explanation.cs`; split hot-path registrar by repository family groups. **Impact:** Medium (DI / cache-decorator maintainability) · **Effort:** Medium · **Paths:** `ArchLucid.Host.Composition/Startup/Modules/CoordinatorArtifactsCompositionModule.cs`, `ArchLucid.Host.Composition/Configuration/ArchLucidReferenceDataHotPathRegistrar.cs`

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
