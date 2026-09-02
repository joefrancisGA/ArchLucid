> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-02.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 items in the completed table shipped in PR #1098. The **2026-09-02** active list is **suggestions only** (no product code for those ten items).

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

## Active items (remaining)

**2026-09-02 pass — suggestions only; do not treat this list as in-progress implementation.** Evidence from current line counts after the 2026-09-01 extraction batch. Same constraints as prior passes: keep HTTP routes, OpenAPI wire shapes, and tenant isolation unchanged unless a follow-up explicitly says otherwise.

1. **Decompose Quick Scan execution into stage handlers** — `QuickScanExecutionOrchestrator` is still a god-object after helpers for usage recording: `Execute.cs` is **367** lines mixing anonymous emergency-disable, safety options, global budget reservation, distributed concurrency, identity-abuse gating, cost estimate, scan invoke, and telemetry. Follow `ArchitectureRunExecute*Stage`: extract `PreExecute` / `BudgetAndConcurrency` / `ScanInvoke` / `UsageAndAudit` handlers and keep the orchestrator as a thin sequencer. **Impact:** High (public Quick Scan path) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Architecture/QuickScanExecutionOrchestrator*.cs`

2. **Share an ITSM inbound webhook process pipeline** — `ItsmInboundServiceNowWebhookProcessor` (**338**) and `ItsmInboundJiraWebhookProcessor` (**327**) duplicate payload-size reject, external-key length, regex validation, provider status→human-review mapping, disposition sync, and audit reject helpers. They already share `ItsmInboundWebhookSyncSupport` and `ItsmInboundDispositionSync`. Extract a provider-parameterized pipeline (`IItsmInboundPayloadReader` + status mapper + shared `TryProcessUpdateAsync`) so a third connector cannot copy-paste the same 80-line preamble. **Impact:** Medium (inbound status fidelity) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Integrations/Itsm/ItsmInbound*WebhookProcessor.cs`

3. **Extract tenant trial-lifecycle repository core** — `DapperTenantRepository.TrialLifecycle` (**322**) and `InMemoryTenantRepository.TrialLifecycle` (**321**) implement the same `CommitSelfServiceTrialAsync` / convert / expire field graph with duplicated parameter lists and assignment order. Follow `RunRepositoryCore`: one mapping + validation helper for trial columns; SQL keeps Dapper SQL, in-memory keeps dictionary mutation. **Impact:** Medium (trial conversion drift) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Tenancy/*TenantRepository.TrialLifecycle.cs`

4. **Split `WorkspaceAiAvailabilityService` probes** — Host composition’s largest remaining service (**517** lines) sequences scope, budget policy, Azure OpenAI connection, secret presence, execution mode, and a live completion probe in one type that takes `IServiceProvider` to build `AzureOpenAiCompletionClient`. Extract check builders (`BudgetProbe`, `ConnectionProbe`, `LiveCompletionProbe`) returning `WorkspaceAiAvailabilityCheckRow` so diagnostics can fail independently without a 70-line `ProbeAsync`. **Impact:** Medium (review-failure recovery UX) · **Effort:** Medium · **Paths:** `ArchLucid.Host.Composition/Services/WorkspaceAiAvailabilityService.cs`

5. **Thin remaining advisory / intake / export HTTP** — After compare and governance facades, these controllers still own orchestration: `AdvisoryController` (**342** — plans, persisted recommendations, accept/defer), `RunsController.Intake` (**349** — advisory draft parse without persist), `ExportsController` (**316** — export history, record get, diff, replay trigger), `BillingCheckoutController` (**327** — provider registry + ledger + marketplace connectivity). Introduce application facades (`AdvisoryWorkflowFacade`, `ArchitectureRequestIntakeFacade`, `RunExportQueryFacade`, `BillingCheckoutFacade`); controllers stay HTTP, auth, Problem Details. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Api/Controllers/Advisory/AdvisoryController.cs`, `ArchLucid.Api/Controllers/Authority/RunsController.Intake.cs`, `ArchLucid.Api/Controllers/Authority/ExportsController.cs`, `ArchLucid.Api/Controllers/Billing/BillingCheckoutController.cs`

6. **Extract LLM tenant-budget period core** — `SqlLlmTenantBudgetRepository.Monthly` (**351**) and `InMemoryLlmTenantBudgetRepository` (**366**, plus daily/judge partials on SQL) duplicate period-key parse/format, get-or-create, reservation, and consume/version semantics. Follow `RunRepositoryCore`: shared `LlmTenantBudgetPeriodCore` for UTC period keys and state transitions; SQL keeps Dapper + rowversion, in-memory keeps `ConcurrentDictionary`. **Impact:** High (wallet correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Data/Repositories/SqlLlmTenantBudgetRepository*.cs`, `ArchLucid.Persistence/Data/Repositories/InMemoryLlmTenantBudgetRepository.cs`

7. **Split execute agent-loop stage (follow-on)** — Execute orchestrator extraction left `ArchitectureRunExecuteAgentLoopStage` at **421** lines — still larger than the thinned orchestrator (**365**). It mixes request reload, content-safety precheck, task/evidence build, LLM wallet, agent invoke, and result persistence. Extract `AgentLoopPrepareStage` / `AgentLoopInvokeStage` / `AgentLoopPersistStage` (same folder) so the stage handler is a sequencer, not a second god-object. **Impact:** High (run execute) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Runs/Orchestration/Execute/ArchitectureRunExecuteAgentLoopStage.cs`

8. **Continue UI mega-client split (draft + findings queue)** — Guided-intake wizard steps shipped; remaining mega render/hooks: `ArchitectureDraftStructuredBriefFields.tsx` (**474** — capabilities/quality/failure-mode lists + suggest rail), `GovernanceFindingsQueueAssignedToMeShell.tsx` (**485** — empty states, filter bar, posture, ITSM checklist, continue-oldest), `IntegrationEventsDlqPageClient.tsx` (**471** — list/filter/bulk-retry/suppress), `use-architecture-draft-autosave.ts` (**~395** — create/patch/debounce/offline). Extract field groups, empty-state composition, and autosave persist vs hydrate. **Impact:** High (intake + triage regressions) · **Effort:** Medium · **Paths:** `archlucid-ui/src/components/architecture/ArchitectureDraftStructuredBriefFields.tsx`, `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell.tsx`, `archlucid-ui/src/app/(operator)/internal/failed-integration-messages/`, `archlucid-ui/src/hooks/use-architecture-draft-autosave.ts`

9. **Alias remaining hand-authored UI types to OpenAPI (wave 3)** — Alerts / advisory / governance-workflow / digest / conversation aliases shipped (`openapi-type-aliases.test.ts` **47** keys). Still hand-authored: `policy-packs.ts`, `graph.ts`, `comparison.ts`, `finding-inspect.ts`, `auth.ts`, plus learning / evolution / alert-tuning / composite-alert-rules. Continue module-by-module aliases plus test keys; keep UI-only fields as intersections (`GraphNodeVm.reasoningTrace`, inspect `recommendedActions`). **Impact:** Medium (contract drift) · **Effort:** Medium · **Paths:** `archlucid-ui/src/types/`, `archlucid-ui/src/types/openapi-type-aliases.test.ts`

10. **Finish Host.Composition module extraction (retrieval + coordinator)** — Agent / pipeline / alerts / weekly-digest / hosted-extractor / trial-lifecycle modules shipped. Remaining fat partials on `ServiceCollectionExtensions`: `Retrieval.cs` (**329** — agent runtime, prompts, findings, evidence, simulator), `CoordinatorAndArtifacts.cs` (**304**), `DataHealthAndJobs.cs` (**282**). Also `AgentCompletionPipelineHelpers` (**385**) is still a grab-bag inside the Agents module. Extract `RetrievalCompositionModule` / `CoordinatorArtifactsCompositionModule` / `DataHealthJobsCompositionModule` and extend `CompositionModulesRegistrationDisciplineTests`. **Impact:** Medium (host wiring) · **Effort:** Medium · **Paths:** `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Retrieval.cs`, `ServiceCollectionExtensions.CoordinatorAndArtifacts.cs`, `ServiceCollectionExtensions.DataHealthAndJobs.cs`, `Startup/Modules/Agents/AgentCompletionPipelineHelpers.cs`

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
