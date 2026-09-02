> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-02.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 items in the completed table shipped in PR #1098. The **2026-09-02** batch (items 1–30) shipped on **master** (2026-09-02). The **2026-09-02 pass-3** batch (items 1–10) shipped in PR **#1173**. The **2026-09-02 pass-4** batch (items 1–10) shipped in PR **#1178**. The **2026-09-02 pass-5** batch (items 1–10) shipped in PR **#1182**. The **2026-09-02 pass-6** batch (items 1–10) shipped in PR **#1186**.

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

## Active items (remaining)

**2026-09-02 pass 7 — suggestions only; do not treat this list as in-progress implementation.** Evidence from current line counts after PR **#1186** (pass-6 items 1–10). Same constraints as prior passes: keep HTTP routes, OpenAPI wire shapes, and tenant isolation unchanged unless a follow-up explicitly says otherwise.

1. **Split leftover `GovernanceStickinessController.ExceptionsAndSchedules`** — Pass-6 extracted `GovernanceStickinessControllerCore`; Registers **207** and Dispositions **218** are in range, but `ExceptionsAndSchedules` is still **340** and mixes three route families: `risk-exceptions` (create/list/revoke/renew), `recurrence-schedules` (CRUD + preview), and `realized-value/attestation`. Split into `Exceptions`, `Schedules`, and `Attestation` partials that keep delegating to `GovernanceStickinessFacade` + `GovernanceStickinessHttpMapper`; routes and auth attributes stay equivalent. **Impact:** High (buyer governance APIs, IDOR/rate-limit surface) · **Effort:** Low–Medium · **Paths:** `ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.ExceptionsAndSchedules.cs`, `GovernanceStickinessControllerCore.cs`

2. **Split `TenantTrialFacade` into conversion / abuse / identity-handoff stages** — Pass-3 thinned `TenantTrialController` via this facade; the facade itself is still a **341**-line god mixing trial conversion, self-service abuse checks, identity-user handoff, and lifecycle scheduler reads. Extract `ITenantTrialConversionStage`, `ITenantTrialAbuseGuard`, and `ITenantTrialIdentityHandoffStage`; facade becomes a thin sequencer. **Impact:** High (trial/billing correctness, identity handoff) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Tenancy/TenantTrialFacade.cs`, `ArchLucid.Api/Controllers/Tenancy/TenantTrialController.cs`

3. **Decompose `DraftRequestCrudService` and `ArchitectureRequestDraftService` into stages** — Draft HTTP is already facaded; leftover application gods are `DraftRequestCrudService` **333** (create / list / status / delete / name-collision / semantic-merge) and `ArchitectureRequestDraftService` **322** (LLM JSON extract + unique-pass + assumption-evidence contradiction). Mirror pass-6 identity-link split: `IDraftRequestCreateStage` / `MutateStage` / `DeleteStage` and `IArchitectureRequestDraftExtractStage` / `NormalizeStage`; services become sequencers. **Impact:** High (guided intake / draft correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Drafts/DraftRequestCrudService.cs`, `ArchLucid.Application/Planning/ArchitectureRequestDraftService.cs`

4. **Extract leftover persistence twin cores (billing, saved views, recommendation-learning)** — Pass-6 covered ITSM connector + draft/usage-event; remaining SQL/in-memory twins still share no core: `SqlBillingLedger` **316** / `InMemoryBillingLedger` **276** (subscription status, checkout upsert, webhook status, state history); `DapperOperatorSavedViewRepository` **284** / `InMemoryOperatorSavedViewRepository` **182** (surface filter, shared-view visibility, payload JSON); `DapperRecommendationLearningProfileRepository` **286** / `InMemoryRecommendationLearningProfileRepository` **122**. Add `BillingLedgerCore`, `OperatorSavedViewRepositoryCore`, and `RecommendationLearningProfileRepositoryCore` for mapping, status transitions, and cap/filter rules; adapters stay Dapper/in-memory only. **Impact:** High (billing / operator UX / advisory learning parity) · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Billing/SqlBillingLedger.cs`, `InMemoryBillingLedger.cs`, `ArchLucid.Persistence/Data/Repositories/DapperOperatorSavedViewRepository.cs`, `InMemoryOperatorSavedViewRepository.cs`, `ArchLucid.Persistence/Advisory/DapperRecommendationLearningProfileRepository.cs`, `InMemoryRecommendationLearningProfileRepository.cs`

5. **Split `AuthSignInRoutingService` into evaluation vs bypass vs customer-message stages** — Identity persistence cores and link-proposal stages shipped in pass-5/6; leftover sign-in routing is a single **325**-line service owning enterprise-SSO requirement, email-OTP allow, bypass kinds, and customer-facing messages. Extract `IAuthSignInRoutingEvaluator`, `IAuthSignInBypassResolver`, and `AuthSignInRoutingCustomerMessageBuilder`; service composes the evaluation DTO only. **Impact:** High (auth routing correctness) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Identity/AuthSignInRoutingService.cs`, `archlucid-ui/src/app/(operator)/auth/signin/SignInFlowClient.tsx`

6. **Finish leftover CLI proof-pack / draft-new / smoke-probe gods** — Pass-6 split `CommandRegistry` partials and named pilot-readiness slots; leftovers: `PilotProofPacketCommand` **406**, `DraftNewCommand` **393**, `BuyerProofPackCommand` **386**, `RealModeSmokeRunProbes.cs` **371** (create/execute/poll probes in one file), `CliCommandHandlers.Misc` **369**. Extract packet writers/arg parsers; split smoke probes into `RealModeSmokeCreateRunProbe.cs` / `ExecuteRunProbe.cs` / `PollRunProbe.cs`; split Misc handlers into `CliCommandHandlers.Proof.cs` / `Support.cs`. **Impact:** Medium (pilot proof / doctor / GTM packets) · **Effort:** Medium · **Paths:** `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`, `DraftNewCommand.cs`, `BuyerProofPackCommand.cs`, `RealModeSmokeRunProbes.cs`, `ArchLucid.Cli/CliCommandHandlers.Misc.cs`

7. **Continue UI mega-client split (alerts, cloud connections, extract-upload)** — Pass-6 thinned findings-queue table/saved-views; remaining operator gods: `AlertRulesContent.tsx` **439**, `AlertTuningForm.tsx` **439**, `CloudConnectionsPageClient.tsx` **437**, `ExtractUploadSettingsPageClient.tsx` **440**. Extract table/form shells and provider-list / zip-drop hooks; pages become composition + routing only. **Impact:** High (alerts / integrations UX) · **Effort:** Medium · **Paths:** `archlucid-ui/src/components/alerts/AlertRulesContent.tsx`, `AlertTuningForm.tsx`, `archlucid-ui/src/app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsPageClient.tsx`, `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx`

8. **Split leftover page-help catalogs and structured-brief helper** — Pass-6 split contextual-help + settings master catalogs; leftover catalogs are still gods: `page-help-topic-rows-operator.ts` **477**, `page-help-topic-rows-admin.ts` **445**, plus `architecture-draft-structured-brief.ts` **487** mixing state types, confirm/deny field keys, and apply/merge helpers. Extract domain row modules (`page-help-topic-rows-operator-governance.ts`, `-integrations.ts`) and `architecture-draft-structured-brief-state.ts` / `-apply.ts`. **Impact:** Medium (help/intake IA maintainability) · **Effort:** Low–Medium · **Paths:** `archlucid-ui/src/lib/usability/page-help-topic-rows-operator.ts`, `page-help-topic-rows-admin.ts`, `archlucid-ui/src/lib/architecture/architecture-draft-structured-brief.ts`

9. **Alias remaining hand-authored UI types to OpenAPI (wave 8)** — Wave 7 shipped **235** keys. Still fully or partially hand-authored: `explanation.ts` (`RunExplanation` object, local `FindingConfidenceLevel` union — OpenAPI has `RunExplanationSummary` / `FindingConfidenceLevel`); `pilot-scorecard.ts` (**25**, comment says not yet aliased; `PilotScorecardResponse` exists in the snapshot); leftover `authority.ts` list enrichments (`RunSummaryWireExtensions` **~30** optional keys). Keep `pagination.ts` and `auth.ts` role union intentional. Extend `openapi-type-aliases.test.ts`. **Impact:** Medium (contract drift) · **Effort:** Medium · **Paths:** `archlucid-ui/src/types/explanation.ts`, `pilot-scorecard.ts`, `authority.ts`, `archlucid-ui/src/types/openapi-type-aliases.test.ts`

10. **Decompose `ExplanationService` and split `RunExplanationConfidenceCalloutBuilder`** — Execute orchestrator thinning shipped in pass-6; leftover explanation gods: `ExplanationService` **323** (deterministic signals + LLM JSON + schema validate + fallback narrative) and `RunExplanationConfidenceCalloutBuilder` **432** (callout families in one builder). Extract `IExplanationSignalStage` / `IExplanationLlmNarrativeStage` / `IExplanationFallbackStage`; split callout builder by family (risk / cost / compliance / confidence). **Impact:** High (buyer explanation / confidence UX) · **Effort:** Medium · **Paths:** `ArchLucid.AgentRuntime/Explanation/ExplanationService.cs`, `ArchLucid.Core/Explanation/RunExplanationConfidenceCalloutBuilder.cs`

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
