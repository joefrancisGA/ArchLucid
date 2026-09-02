> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-02.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 items in the completed table shipped in PR #1098. The **2026-09-02** batch (items 1–30) shipped on **master** (2026-09-02). The **2026-09-02 pass-3** batch (items 1–10) shipped in PR **#1173**. The **2026-09-02 pass-4** batch (items 1–10) shipped in PR **#1178**.

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

## Active items (remaining)

**2026-09-02 pass 5 — suggestions only; do not treat this list as in-progress implementation.** Evidence from current line counts after PR **#1178** (pass-4 items 1–10). Same constraints as prior passes: keep HTTP routes, OpenAPI wire shapes, and tenant isolation unchanged unless a follow-up explicitly says otherwise.

1. **Split leftover `GovernanceStickinessController` route families** — Facade + HTTP mapper shipped; the controller is still the largest remaining governance HTTP god: `Registers` (**215**), `Dispositions` (**235**), `ExceptionsAndSchedules` (**317**), plus a **72**-line shell (**839** total). `governance-stickiness-api.ts` is **446** on the client. Split by register family (`risk` / `decision` / `waivers` / `exceptions`) so each partial owns one route family and mapping stays on `GovernanceStickinessHttpMapper`. **Impact:** High (buyer governance APIs, IDOR/rate-limit surface) · **Effort:** Medium · **Paths:** `ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.cs`, `GovernanceStickinessController.Registers.cs`, `GovernanceStickinessController.Dispositions.cs`, `GovernanceStickinessController.ExceptionsAndSchedules.cs`, `archlucid-ui/src/lib/api/governance-stickiness-api.ts`

2. **Decompose `ReplayRunService` into stage handlers** — Clone / prepare / execute-prepared / optional commit still live in one service (**562** across `ReplayRunService.cs` **125**, `Prepare` **76**, `CloneHelpers` **82**, `ExecutePrepared` **258**). Mirror the execute-orchestrator sequencer: `IReplayRunPrepareStage`, `IReplayRunCloneStage`, `IReplayRunExecutePreparedStage`, `IReplayRunCommitStage` under `Replay/`; keep determinism checks and authority-commit coupling behind those stages. **Impact:** High (determinism, replay, compare) · **Effort:** Medium · **Paths:** `ArchLucid.Application/ReplayRunService.cs`, `ReplayRunService.Prepare.cs`, `ReplayRunService.CloneHelpers.cs`, `ReplayRunService.ExecutePrepared.cs`

3. **Split `EndToEndReplayComparisonService` into diff slices** — Report builder is already partialled but still a coordination god (**524**: main **165**, `DiffAssembly` **63**, `ExportPairing` **88**, `FindingLifecycle` **71**, `InterpretationNotes` **137**). Extract `IReplayComparisonDiffSlice` per domain (agent results, manifests, exports, finding lifecycle, interpretation) plus a composer that only assembles the report. **Impact:** High (run diff / buyer compare UX) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Analysis/EndToEndReplayComparisonService.cs`, `EndToEndReplayComparisonService.DiffAssembly.cs`, `EndToEndReplayComparisonService.ExportPairing.cs`, `EndToEndReplayComparisonService.FindingLifecycle.cs`, `EndToEndReplayComparisonService.InterpretationNotes.cs`

4. **Unify Cosmos agent-execution-trace query with the SQL/InMemory core** — Pass-2 shipped `AgentExecutionTraceQueryPatchCore` for SQL + InMemory; `CosmosAgentExecutionTraceRepository.Query.cs` is still **408** and reimplements paging, run filters, and cost slices. Delegate shared predicates to an extended core (or `CosmosAgentTraceQueryCore`) so Cosmos reads cannot drift. **Impact:** High (trace forensics parity) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Cosmos/CosmosAgentExecutionTraceRepository.Query.cs`, `ArchLucid.Persistence` agent-execution-trace query core

5. **Extract identity persistence cores (email OTP / auth identity / recovery grants)** — Tenant/run cores shipped; identity twins have none. Remaining cluster: `DapperEmailOtpChallengeRepository.Complete` (**287**) vs `InMemoryEmailOtpChallengeRepository` (**287**), `InMemoryAuthenticationIdentityRepository` (**258**) vs Dapper lookup (**235**), `DapperPlatformTenantAuthRecoveryGrantRepository` (**291**). Share mapping, rate-limit keys, and lifecycle transitions in `EmailOtpChallengeRepositoryCore`, `AuthenticationIdentityRepositoryCore`, `PlatformTenantAuthRecoveryGrantRepositoryCore`. **Impact:** High (auth/security correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Identity/DapperEmailOtpChallengeRepository.Complete.cs`, `InMemoryEmailOtpChallengeRepository.cs`, `InMemoryAuthenticationIdentityRepository.cs`, `DapperAuthenticationIdentityRepository.Lookup.cs`, `DapperPlatformTenantAuthRecoveryGrantRepository.cs`

6. **Finish leftover CLI proof / doctor / scoreboard gods after slot runners** — Pass-4 extracted two `IPilotReadinessSlotRunner` classes and `RealModeSmokeHealthProbe`; leftover recipes are still inline: `DoctorQuickStartReadiness` (**469**), `DecisionOwnerScoreboardParser` (**464**), `SponsorPacketBuyerDecisionBriefBuilder` (**454**), `RealModeSmokeRunner` (**447**), `BuyerProofPackCommand` / `PilotProofPacketCommand` (**411** each), `GoldenCohortDriftCommand` (**408**). Extract remaining slots plus `IBuyerProofArtifactCollector` / scoreboard-drift parsers so commands stay argument parse + recipe. **Impact:** Medium (pilot proof / doctor / golden cohort / GTM packets) · **Effort:** Medium · **Paths:** `ArchLucid.Cli/Diagnostics/DoctorQuickStartReadiness.cs`, `ArchLucid.Cli/Commands/DecisionOwnerScoreboardParser.cs`, `ArchLucid.Cli/Commands/SponsorPacketBuyerDecisionBriefBuilder.cs`, `ArchLucid.Cli/Commands/RealModeSmokeRunner.cs`, `ArchLucid.Cli/Commands/BuyerProofPackCommand.cs`, `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`, `ArchLucid.Cli/Commands/GoldenCohortDriftCommand.cs`

7. **Finish leftover demo-seeder scenario bodies** — Pass-4 extracted `TrialWelcomeWorkspaceSeed` / `RetailBaselineWorkspaceSeed`; remaining seeders still assemble graphs: `DemoSeedCreatedSampleSeeder` (**370**) even though `CreatedSampleWorkspaceSeed*` partials already exist (**396** combined), `DemoSeedMeridianAlpineSeeder` (**319**), `DemoSeedNorthwindTourSeeder` (**266**). Thin seeders to ID choice + `DemoSeedPersistenceChain`; extract `MeridianAlpineWorkspaceSeed` / `NorthwindTourWorkspaceSeed` partials. **Impact:** Medium (demo workspaces / GA fixtures) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Bootstrap/Seeders/DemoSeedCreatedSampleSeeder.cs`, `DemoSeedMeridianAlpineSeeder.cs`, `DemoSeedNorthwindTourSeeder.cs`, `ArchLucid.Application/Bootstrap/CreatedSampleWorkspaceSeed*.cs`

8. **Continue UI mega-client split (graph, run-detail workspace, findings queue, CTO tour)** — Pass-4 split search/compare/audit/alerts; leftover mega files: `use-graph-page-state.ts` (**462**), `RunDetailTabbedWorkspace.tsx` (**450**), `BuyerCtoDemoTourOverlay.tsx` (**445**), `GovernanceFindingsQueueClient.tsx` (**417**). Extract graph load vs saved-views vs buyer-shell hooks, remaining run-detail tab compositions, `useBuyerCtoDemoTourController`, and findings-queue mode/synopsis hooks. **Impact:** High (graph / run-detail / governance queue / GTM demo) · **Effort:** Medium · **Paths:** `archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/use-graph-page-state.ts`, `src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailTabbedWorkspace.tsx`, `src/components/BuyerCtoDemoTourOverlay.tsx`, `src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx`

9. **Alias remaining hand-authored UI types to OpenAPI (wave 6)** — Wave 5 shipped **162** keys. Still fully hand-authored: `advisory-scheduling.ts`, `alert-routing.ts`, `alert-simulation.ts`, `architecture-provenance.ts`, `demo-preview.ts`, `demo-explain.ts`, `exec-digest-preferences.ts`, `recommendation-learning.ts`, `teams-incoming-webhook-connection.ts`, `pagination.ts`. Continue module-by-module aliases plus test keys; keep `pilot-scorecard.ts` hand-authored (wire shape still differs from `PilotScorecardResponse`). **Impact:** Medium (contract drift) · **Effort:** Medium · **Paths:** `archlucid-ui/src/types/`, `archlucid-ui/src/types/openapi-type-aliases.test.ts`

10. **Extend `RelationalSliceReadCore` for golden-manifest hydrate + context-snapshot reads** — Pass-2 extracted shared hydrate helpers; leftover readers are still fat: `GoldenManifestPhase1RelationalRead.Hydrate.cs` (**326**) and `ContextSnapshotRelationalRead.cs` (**287**). Share column maps and JSON fallback/coerce rules in an extended core; SQL readers stay Dapper-only. **Impact:** Medium–High (authority read hot path) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/GoldenManifests/GoldenManifestPhase1RelationalRead.Hydrate.cs`, `ArchLucid.Persistence/ContextSnapshots/ContextSnapshotRelationalRead.cs`, `ArchLucid.Persistence/RelationalRead/RelationalSliceReadCore.cs`

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
