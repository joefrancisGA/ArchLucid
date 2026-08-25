> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-08-25.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

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

## Active items (remaining)

*(none)*

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
