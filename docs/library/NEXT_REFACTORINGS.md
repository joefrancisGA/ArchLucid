> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-02.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 items in the completed table shipped in PR #1098. The **2026-09-02** batch (items 1–30) shipped in PR #1153. The **2026-09-02 pass 3** active list (items 1–10) is **suggestions only** (no product code for those items).

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

## Active items (remaining)

**2026-09-02 pass 3 — suggestions only; do not treat this list as in-progress implementation.** Evidence from current line counts after PR #1153 (items 1–30). Same constraints as prior passes: keep HTTP routes, OpenAPI wire shapes, and tenant isolation unchanged unless a follow-up explicitly says otherwise.

1. **Decompose `FindingsOrchestrator` into stage handlers** — `FindingsOrchestrator` is still **433** lines after portfolio-recurrence extraction: policy-expectation stamp, engine-adapter partition (defer `portfolio-recurrence`), parallel invoke, ordered merge, density gate, payload validate, engine-failure aggregation, and snapshot emit in one `GenerateFindingsSnapshotAsync`. Follow `ArchitectureRunExecute*Stage` / `ClosedLoop*Stage`: extract `PolicyStamp` / `EngineInvoke` / `MergeAndGate` / `SnapshotEmit` handlers and keep the orchestrator as a thin sequencer. **Impact:** High (every review’s finding snapshot) · **Effort:** Medium · **Paths:** `ArchLucid.Decisioning/Services/FindingsOrchestrator.cs`

2. **Extract remaining coordination outbox repository cores** — Integration-event outbox has `IntegrationEventOutboxRepositoryCore`; three sibling outboxes still duplicate cursor, retry, clone, and cap: retrieval indexing (**InMemory 304** / **Dapper 247**, combined **551**), post-commit projection (**InMemory 303** / **Dapper 205**, combined **508**), run-export blob push (**InMemory 287** / **Dapper 201**, combined **488**). Shared `CoordinationOutboxRepositoryCore` (or per-family cores parameterized by payload) so SQL keeps Dapper SQL and in-memory keeps dictionary mutation. **Impact:** High (retrieval / projection / export delivery) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Coordination/Retrieval/`, `Coordination/Projection/`, `Coordination/Export/`

3. **Extract leftover persistence twins (inspect, learning, alerts, coverage, catalog)** — Item 15’s optional composite-alert batch did not land; remaining Dapper/InMemory families without a core: finding-inspect read (**Dapper 361** / **InMemory 157**), product-learning pilot signal (**Dapper 358** / **InMemory 227**), composite alert rules (**Dapper 336** / **InMemory 113**), coverage assignment (**Dapper 312** / **InMemory 89**), agent model catalog (**Dapper 350** / **InMemory 97**). Follow `AlertRecordRepositoryCore`: mapping + filter/status transitions in one helper; adapters stay thin. **Impact:** Medium–High (inspect + operator inbox + learning) · **Effort:** High · **Paths:** `ArchLucid.Persistence/Findings/`, `Coordination/ProductLearning/`, `Alerts/DapperCompositeAlertRuleRepository.cs`, `Data/Repositories/*CoverageAssignment*`, `Agents/*AgentModelCatalog*`

4. **Thin remaining HTTP after facades (policy packs, trial, digest, ITSM inbound)** — Facades and `*HttpMapper`s exist; these controllers still own orchestration: `PolicyPacksController` (**344**) + `Catalog` (**330**) + `Simulate` (**200**), `TenantTrialController` (**340**), `DigestSubscriptionsController` (**320**), `ItsmInboundWebhooksController` (**322**), plus `GovernanceController.PolicyPacks` (**320**) overlapping the policy-pack surface. Introduce `PolicyPackHttpFacade` / `TenantTrialFacade` / `DigestSubscriptionFacade` / `ItsmInboundWebhookFacade`; controllers stay auth + Problem Details. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Api/Controllers/Governance/PolicyPacksController*.cs`, `Controllers/Tenancy/TenantTrialController.cs`, `Controllers/Advisory/DigestSubscriptionsController.cs`, `Controllers/Integrations/ItsmInboundWebhooksController.cs`

5. **Split CLI buyer-proof / pilot-readiness command cluster** — Registry dispatch shipped; command bodies are still god-objects sharing HTTP fetch, folder layout, JSON write, and claim-lint: `PilotProofPacketCommand` (**482**), `RealModeSmokeRunner` (**481**), `DoctorQuickStartReadiness` (**480**), `SponsorPacketBuyerDecisionBriefBuilder` (**459**), `PilotReadinessBundleRunner` (**456**), `BuyerProofPackCommand` (**431**). Extract `CliHttpProbeSession` + `BuyerPacketFolderWriter`; each command keeps argv parse + a short recipe. **Impact:** Medium (pilot proof / doctor / smoke) · **Effort:** Medium · **Paths:** `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`, `RealModeSmokeRunner.cs`, `Diagnostics/DoctorQuickStartReadiness.cs`, `Commands/SponsorPacketBuyerDecisionBriefBuilder.cs`, `PilotReadinessBundleRunner.cs`, `BuyerProofPackCommand.cs`

6. **Continue UI mega-client split (reviews hub, ask, run-detail workspace)** — Graph / compare / audit / findings-queue hooks shipped; remaining mega hooks/clients: `use-runs-dashboard-panel.ts` (**469** — tabs, attention filter, demo merge, load phase), `use-ask-page.ts` (**458** — stream, citations, continue-last, demo seed), `AskRunIdPicker.tsx` (**455**), `RunDetailTabbedWorkspace.tsx` (**454** — deferred chunk orchestra), `AppShellClient.tsx` (**433**). Extract query-state vs URL-sync vs render; run-detail keeps a thin tab host. **Impact:** High (home + ask + run detail) · **Effort:** Medium · **Paths:** `archlucid-ui/src/components/operator-home/use-runs-dashboard-panel.ts`, `src/app/(operator)/insights/ask-review-questions/_sections/use-ask-page.ts`, `src/components/AskRunIdPicker.tsx`, `src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailTabbedWorkspace.tsx`, `src/components/AppShellClient.tsx`

7. **Alias remaining hand-authored UI types to OpenAPI (wave 4)** — Wave 3 shipped **91** keys (`policy-packs`, `graph`, `comparison`, `finding-inspect`, `auth`, learning/evolution). Still hand-authored: `draft-intake.ts`, `tenant-trial-status.ts` / `tenant-homepage-settings.ts` / `tenant-cost-settings.ts` / `tenant-cost-estimate.ts`, `product-learning.ts`, `recommendation-learning.ts` / `recommendation-learning-operational.ts`, `governance-resolution.ts` / `governance-environment-catalog.ts` / `governance-dashboard.ts`, `feasibility-verdict.ts`, `explanation.ts`, `pilot-scorecard.ts` / `pilot-value-report.ts`, `policy-pack-dry-run.ts`, `pre-finalize-checklist.ts`. Continue module-by-module aliases plus test keys; keep UI-only fields as intersections. **Impact:** Medium (contract drift) · **Effort:** Medium · **Paths:** `archlucid-ui/src/types/`, `archlucid-ui/src/types/openapi-type-aliases.test.ts`

8. **Split leftover execute/create orchestrator sequencers** — Execute stages shipped; sequencers are still large: `ArchitectureRunExecuteOrchestrator` (**376**), `ArchitectureRunExecutePostExecuteHooks` (**318** — audit, baseline mutation, integration events), `ArchitectureRunExecutePreExecuteStage` (**292**). Create never got the same treatment: `ArchitectureRunCreateOrchestrator` (**263**) + `Enlisted` (**207**) + `PostCreateHooks` (**222**) + `BatchCreate` (**204**). Extract post-execute/create hook handlers (`Audit` / `OutboxPublish` / `BaselineMutation`) so orchestrators stay sequencers. **Impact:** High (run create + execute) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.cs`, `ArchitectureRunExecutePostExecuteHooks.cs`, `Execute/ArchitectureRunExecutePreExecuteStage.cs`, `ArchitectureRunCreateOrchestrator*.cs`

9. **Decompose `AuthorityPipelineWorkProcessor` hosted drain** — **344** lines on a `RecoverableOutboxProcessorBase` still mix scope factory, agent execution, Azure extractor enlistment, technology-ledger mapping, and coordination enqueue. Extract `IAuthorityPipelineWorkHandler` per work kind (execute / commit / extractor) + a thin processor that only leases, retries, and completes. Pair with the still-twin `Dapper`/`InMemory` `AuthorityPipelineWorkRepository` (**269** / **252**). **Impact:** High (deferred authority outbox) · **Effort:** Medium · **Paths:** `ArchLucid.Host.Core/Hosted/AuthorityPipelineWorkProcessor.cs`, `ArchLucid.Persistence/Orchestration/*AuthorityPipelineWorkRepository.cs`

10. **Share graph-inference + infrastructure-declaration mappers** — `DefaultGraphEdgeInferer` (**376**) inlines containment, policy/requirement/security targeting, and topology-relationship weights in one `InferEdges`. `KubernetesManifestCanonicalObjectMapper` (**373**) and `CanonicalInfrastructurePropertyBag` (**336**) plus `TechnologyLedgerCanonicalObjectMapper` (**308**) re-walk cloud object → canonical node/edge shapes. Extract `IGraphEdgeInferenceRule` (one rule per weight family) and a shared `CanonicalInfrastructureObjectMapper` parameterized by cloud family. **Impact:** Medium (graph + inventory fidelity) · **Effort:** Medium · **Paths:** `ArchLucid.KnowledgeGraph/Inference/DefaultGraphEdgeInferer.cs`, `ArchLucid.ContextIngestion/Infrastructure/KubernetesManifestCanonicalObjectMapper.cs`, `CanonicalInfrastructurePropertyBag.cs`, `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerCanonicalObjectMapper.cs`

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
