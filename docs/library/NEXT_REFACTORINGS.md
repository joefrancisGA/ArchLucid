> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-02.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 items in the completed table shipped in PR #1098. The **2026-09-02** batch (items 1–30) shipped on **master** (2026-09-02). The **2026-09-02 pass-3** batch (items 1–10) shipped in PR **#1173**.

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

## Active items (remaining)

**2026-09-02 pass 4 — suggestions only; do not treat this list as in-progress implementation.** Evidence from current line counts after PR **#1173** (pass-3 items 1–10). Same constraints as prior passes: keep HTTP routes, OpenAPI wire shapes, and tenant isolation unchanged unless a follow-up explicitly says otherwise.

1. **Finish `IAuthorityPipelineWorkHandler` commit / extractor implementations** — Pass-3 extracted the hosted drain and a full `AuthorityPipelineExecuteWorkHandler`; `AuthorityPipelineCommitWorkHandler` and `AuthorityPipelineExtractorWorkHandler` still `CanHandle` → `false` and throw `NotSupportedException`. Master also added `ShouldSkipLegacyRunStatusPatchAfterAuthorityProgress` on the execute path — keep that guard in any commit-phase handler. Implement real handlers (or delete the stubs and collapse `Kind` if those outbox payloads never exist). **Impact:** High (deferred authority outbox completeness) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Runs/Orchestration/Pipeline/AuthorityPipelineCommitWorkHandler.cs`, `AuthorityPipelineExtractorWorkHandler.cs`, `AuthorityPipelineExecuteWorkHandler.cs`

2. **Split leftover execute-stage sequencers (`PreExecute` / `Persistence` / `QualityGate` / orchestrator)** — Post-execute/create hooks shipped; remaining execute body is still large: `ArchitectureRunExecuteOrchestrator` (**376** — lease wrap + `ExecuteRun` / `ExecuteSelective` duplication), `ArchitectureRunExecutePreExecuteStage` (**292**), `ArchitectureRunExecutePersistenceStage` (**246**), `ArchitectureRunExecuteQualityGateStage` (**234**). Extract lease/admission, pre-execute load vs cancel vs mode, persist vs quality-gate handlers so the orchestrator stays a sequencer. **Impact:** High (every architecture-run execute) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.cs`, `Execute/ArchitectureRunExecutePreExecuteStage.cs`, `ArchitectureRunExecutePersistenceStage.cs`, `ArchitectureRunExecuteQualityGateStage.cs`

3. **Extract findings-snapshot repository core (SQL + in-memory)** — Finding-inspect twins shipped; snapshot persistence is still duplicated: `SqlFindingsSnapshotRepository` (**302**) dual-writes `FindingsJson` + relational `FindingRecords` with migrator-on-save, `InMemoryFindingsSnapshotRepository` (**349**) reimplements cap, scope, JSON round-trip, and priority ranks. Share `FindingsSnapshotRepositoryCore` for serialize/migrate/cap/scope rules; SQL keeps Dapper SQL. **Impact:** High (every findings snapshot load/save) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Repositories/SqlFindingsSnapshotRepository.cs`, `ArchLucid.Decisioning/Repositories/InMemoryFindingsSnapshotRepository.cs`

4. **Finish LLM tenant-budget twin after period core** — `LlmTenantBudgetPeriodCore` shipped; `InMemoryLlmTenantBudgetRepository` is still **367** lines (reserve/commit/warn/version) and SQL remains split across `Monthly` (**327**), `Daily` (**225**), `JudgeDaily` (**194**). Extract remaining token/USD state-machine helpers so InMemory and SQL share transitions; keep SQL period SQL in adapters. **Impact:** High (LLM spend gates) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Data/Repositories/InMemoryLlmTenantBudgetRepository.cs`, `SqlLlmTenantBudgetRepository.Monthly.cs`, `SqlLlmTenantBudgetRepository.Daily.cs`, `SqlLlmTenantBudgetRepository.JudgeDaily.cs`

5. **Split `PolicyPackHttpFacade` and route leftover simulate HTTP** — Pass-3 moved orchestration into `PolicyPackHttpFacade` (**462**, ~20 methods: CRUD, catalog promote/demote, effective content, dry-run). `GovernanceController.PolicyPacks` is still **320** and owns `Simulate` outside the facade. Split catalog vs assignment vs simulate/validate command handlers; point `GovernanceController.Simulate` at the same facade so pre-commit simulation is not a second HTTP path. **Impact:** High (policy-pack operator surface) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Governance/PolicyPacks/PolicyPackHttpFacade.cs`, `ArchLucid.Api/Controllers/Governance/GovernanceController.PolicyPacks.cs`

6. **Finish CLI buyer-proof recipes after shared HTTP/folder helpers** — `CliHttpProbeSession` / `BuyerPacketFolderWriter` shipped; leftover gods still inline slot recipes and parsers: `RealModeSmokeRunner` (**481**), `DoctorQuickStartReadiness` (**469**), `DecisionOwnerScoreboardParser` (**464**), `PilotReadinessBundleRunner` (**456**), `SponsorPacketBuyerDecisionBriefBuilder` (**454**), `GoldenCohortDriftCommand` (**408**). Extract `IPilotReadinessSlot` (one class per slot) + scoreboard/drift parsers; runners stay recipes. **Impact:** Medium (pilot proof / doctor / smoke / golden cohort) · **Effort:** Medium · **Paths:** `ArchLucid.Cli/Commands/RealModeSmokeRunner.cs`, `PilotReadinessBundleRunner.cs`, `DecisionOwnerScoreboardParser.cs`, `SponsorPacketBuyerDecisionBriefBuilder.cs`, `GoldenCohortDriftCommand.cs`, `Diagnostics/DoctorQuickStartReadiness.cs`

7. **Extract demo-seeder scenario bodies after `DemoSeedPersistenceChain`** — Persistence chain shipped; individual seeders still assemble full demo graphs: `DemoSeedTrialWelcomeSeeder` (**496**), `DemoSeedRetailBaselineSeeder` (**389**), `DemoSeedCreatedSampleSeeder` (**370**). Extract finding/manifest/artifact builders per scenario so seeders only choose IDs and call the chain. **Impact:** Medium (demo workspaces / GA fixtures) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Bootstrap/Seeders/DemoSeedTrialWelcomeSeeder.cs`, `DemoSeedRetailBaselineSeeder.cs`, `DemoSeedCreatedSampleSeeder.cs`

8. **Continue UI mega-client split (search, graph, compare, audit, alerts)** — Hub/ask/run-detail splits shipped; remaining mega files: `GlobalSearchBar.tsx` (**570** — command palette + route-local findings/reviews/run-detail search), `use-graph-page-state.ts` (**462**), `use-compare-form.ts` (**451**), `use-audit-page-search.ts` (**450**), `RunDetailTabbedWorkspace.tsx` (**450**), `use-alerts-inbox-controller.ts` (**447**). Extract route-local search adapters and graph/compare/audit/alerts query vs URL vs render hooks. **Impact:** High (shell search + compare + graph + alerts) · **Effort:** Medium · **Paths:** `archlucid-ui/src/components/GlobalSearchBar.tsx`, `src/app/(operator)/insights/evidence-graph/_sections/use-graph-page-state.ts`, `src/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form.ts`, `src/app/(operator)/governance/audit/_sections/use-audit-page-search.ts`, `src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailTabbedWorkspace.tsx`, `src/components/alerts/use-alerts-inbox-controller.ts`

9. **Alias remaining hand-authored UI types to OpenAPI (wave 5)** — Wave 4 shipped **135** keys. Still hand-authored (or only partially aliased): `draft-intake.ts`, `explanation.ts`, `recommendation-learning.ts` / `recommendation-learning-operational.ts`, `agent-forensics.ts`, `stage-timeline.ts`, `alert-routing.ts` / `alert-simulation.ts` / `alert-tuning.ts`, `advisory-scheduling.ts`, `architecture-provenance.ts`, `demo-preview.ts` / `demo-explain.ts`, `exec-digest-preferences.ts`, `teams-incoming-webhook-connection.ts`, `pagination.ts`. Continue module-by-module aliases plus test keys; keep `pilot-scorecard.ts` hand-authored (wire shape still differs from `PilotScorecardResponse`). **Impact:** Medium (contract drift) · **Effort:** Medium · **Paths:** `archlucid-ui/src/types/`, `archlucid-ui/src/types/openapi-type-aliases.test.ts`

10. **Split leftover workspace-AI probe composition + completion fallback** — Probe *builders* shipped; `WorkspaceAiAvailabilityService` is still **425** lines (customer vs platform vs simulator branching, debug dictionary, timeout budget). `FallbackAgentCompletionClient` is **381** (primary + ordered fallbacks, `AsyncLocal` metadata). Extract `IWorkspaceAiAvailabilityProbePlan` (customer / platform / simulator) and `FallbackAttemptRunner` so the service/client only compose results. **Impact:** High (execute recovery + LLM fallback traces) · **Effort:** Medium · **Paths:** `ArchLucid.Host.Composition/Services/WorkspaceAiAvailabilityService.cs`, `ArchLucid.AgentRuntime/FallbackAgentCompletionClient.cs`

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
