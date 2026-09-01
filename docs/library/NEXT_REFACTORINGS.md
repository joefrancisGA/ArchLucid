> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-09-01.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

**Note:** The 2026-09-01 refresh began as a docs-only suggestion list, but subsequent commits on the same branch implemented several of the listed refactors (composition modules, backfill core, instrumentation meter split, execute-orchestrator stages, demo seeders, closed-loop stages, compare/governance thinning, UI intake splits); the PR description has been updated to reflect that this change-set now includes product code.

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

## Active items (remaining)

Suggestions only — **do not implement** from this list until an owner picks an item. Each row is a cross-cutting structural refactor (not a product feature). Evidence is from the 2026-09-01 tree; line counts exclude tests and generated files.

1. **Decompose architecture-run execute orchestrator** — Split `ArchitectureRunExecuteOrchestrator` (~1,450 lines across six partials: main, agent loop, pre-execute, persistence, quality gate, failure summary) into focused execute-stage handlers, matching the 2026-08-25 commit/pipeline stage extraction. The type still takes 30+ constructor dependencies and owns safety precheck, budget admit, agent batch, quality-gate retry, and persistence in one partial class. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator*.cs`

2. **Finish Host.Composition DI module extraction** — After Agents / Pipeline / Alerts modules shipped, `ServiceCollectionExtensions` still has **32** remaining partials (~2,663 lines). Near-identical registration twins remain for weekly sponsor / executive / architecture digest workers, hosted Azure / AWS / GCP extractors, and trial-lifecycle email vs scheduler. Lift those into `Startup/Modules/` registrars and extend `CompositionModulesRegistrationDisciplineTests`. **Impact:** High · **Effort:** Medium · **Paths:** `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions*.cs`, `ArchLucid.Host.Composition/Startup/Modules/`

3. **Extract snapshot/artifact relational backfill core** — `SqlGraphSnapshotRepository`, `SqlContextSnapshotRepository`, and `SqlArtifactBundleRepository` each implement the same “COUNT slice rows, insert when empty while JSON columns still hold data” backfill. Follow the `RunRepositoryCore` pattern: one shared idempotent backfill helper parameterized by table/key, keep entity mapping in the three repositories. **Impact:** Medium · **Effort:** Medium · **Paths:** `ArchLucid.Persistence/Repositories/Sql*SnapshotRepository.Backfill.cs`, `SqlArtifactBundleRepository.Backfill.cs`

4. **Unify compare HTTP surfaces** — Three controllers still own overlapping run-to-run compare: `ComparisonController` (`GET /v1/compare` golden-manifest delta), `ComparisonsController` (`/v1/architecture` history / drift / replay), and `RunComparisonController` (`/v1/architecture/review/compare/agents` plus end-to-end replay). Collapse HTTP to one compare bounded controller (or one facade) so OpenAPI, UI compare pages, and audit emission share one load-validated-run-pair path. Keep wire routes stable with `[Obsolete]` aliases if needed. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Api/Controllers/Planning/Comparison*.cs`, `ArchLucid.Api/Controllers/Authority/RunComparisonController.cs`

5. **Thin remaining `GovernanceController`** — `PolicyPacksController` was already facaded; `GovernanceController` is still ~1,546 lines across six partials (approval requests **483**, policy packs **320**, promotions/activations **300**, insights **236**). Move orchestration into application facades (approval-request, promotion/activation, insights) so the controller stays HTTP mapping, auth, and Problem Details. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Api/Controllers/Governance/GovernanceController*.cs`, `ArchLucid.Application/Governance/`

6. **Split `DemoSeedService` into scenario seeders** — `DemoSeedScenarioRegistry` shipped; the service is still a mega-partial (~2,134 lines, eight files). `TrialWelcome` (**489**), `CreatedSample` (**354**), `RetailBaseline` (**332**), and `MeridianAlpine` (**304**) still share persistence and FK-chain writes through one type. Extract per-scenario seeders behind the registry so trial welcome, retail baseline, and sample packs can evolve independently. **Impact:** Medium (product seeds) · **Effort:** Medium · **Paths:** `ArchLucid.Application/Bootstrap/DemoSeedService*.cs`

7. **Decompose closed-loop reasoning orchestrator** — `ClosedLoopArchitectureReasoningOrchestrator` (~1,082 lines: stages, live review, cache) still sequences extraction, interview, specialist/adversarial review, recommendations, impact, and publish in one partial class with 20+ dependencies. Heuristic vs LLM routing already has a router; extract stage handlers (same shape as authority pipeline stages) and keep the orchestrator as a thin sequencer. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Application/ArchitectureIntelligence/ClosedLoopArchitectureReasoningOrchestrator*.cs`

8. **Split `ArchLucidInstrumentation` by meter domain** — The static instrumentation type is ~3,188 lines across 12 partials. `GrowthFunnel` alone is **643** lines of counter catalog; `Llm` is **490**. Partial files hide a single god type: callers still import one class for trial funnel, LLM wallet, retrieval, caches, and run telemetry. Introduce domain meter types (growth, LLM, retrieval, runs) with a thin `AppMeter` factory so cardinality rules stay local to each domain. **Impact:** Medium · **Effort:** Medium · **Paths:** `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation*.cs`

9. **Continue UI mega-client split (guided intake)** — The 2026-08-25 UI split covered buyer tour, SSO wizard, and Azure Boards. Remaining mega clients: `SocraticIntakeWizard.tsx` (**562**), `NewRunWizardClient.tsx` (**467**), `ArchitectureScopeUnderstandingCheckPanel.tsx` (**502**), plus large page hooks (`use-graph-page-state`, `use-compare-form`, `use-audit-page-search`). Extract step panels and hooks; keep buyer-polished vs operator chrome as composition, not one render function. **Impact:** High (intake regressions) · **Effort:** Medium · **Paths:** `archlucid-ui/src/app/(operator)/architecture/reviews/new/`, `archlucid-ui/src/components/architecture/`

10. **Alias remaining hand-authored UI types to OpenAPI** — Authority / operate-rhythm / technology-ledger aliases shipped. `archlucid-ui/src/types/` still has ~40 hand-authored modules (alerts, advisory, governance-*, learning, digest, draft-intake, conversation, …) that duplicate snapshot schemas. Continue module-by-module aliases plus `openapi-type-aliases.test.ts` keys; keep UI-only fields as intersections. Aligns with `UI_ARCHITECTURE_V1_1.md` §3 remainder. **Impact:** Medium (contract drift) · **Effort:** Medium · **Paths:** `archlucid-ui/src/types/`, `archlucid-ui/src/lib/openapi-schemas.ts`

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
