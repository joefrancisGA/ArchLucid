> **Scope:** Contributor-reference — prioritized refactor backlog for coding agents and maintainers.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-08-24.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

**Tracking:** Deferred engineering IDs live in **[`TECH_BACKLOG.md`](TECH_BACKLOG.md)**. This doc lists **cross-cutting structural refactors** that span multiple areas.

## Completed (removed from active list)

| Item | Status |
|------|--------|
| Unify Data and Persistence (`ArchLucid.Persistence.*` merge) | Done — see `PERSISTENCE_CONSOLIDATION_PLAN.md` |
| Connection factory alignment | Done (2026-05-08) — unused `SqlConnectionFactory` removed |
| Dual pipeline coordinator closure | Done — ADR 0030 + `DualPipelineRegistrationDisciplineTests` |

## Active items (prioritized top 10)

Execute in order when possible; quick wins (#11–#12) may ship ahead of larger items.

1. **Decompose authority commit orchestrator** — Split `AuthorityDrivenArchitectureRunCommitOrchestrator.cs` (~910 lines) and `AuthorityPipelineStagesExecutor.cs` into focused stages (governance, decision materialization, manifest reuse, audit, persistence). **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Application/Runs/Orchestration/`

5. ~~**Complete TanStack Query migration backlog**~~ — **Done** (2026-08-24): all `MIGRATION_BACKLOG` modules migrated; guard tests pass.

2. ~~**Abstract multi-cloud extractor pipeline**~~ — **Done** (2026-08-24): shared `HostedCloudExtractorRunResult` in `CloudExtractor/`; Azure/AWS/GCP wrappers delegate to it.

6. **Tighten governance API boundaries** — Move orchestration out of `PolicyPacksController.cs` (~925 lines); clarify workflow facade over 58 governance services. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Api/Controllers/Governance/`, `ArchLucid.Application/Governance/`

7. ~~**Shared Terraform posture module**~~ — **Done** (2026-08-24): `infra/modules/posture/` centralizes tier/waiver validation; nine stacks consume via `module "posture"`.

8. ~~**Split monolithic OpenAPI TypeScript output**~~ — **Done** (2026-08-24): `generate-api-types-split.mjs` emits `api-types/schemas.generated.ts` + `paths.generated.ts`; barrel at `api-types.generated.ts`.

9. **Merge API query controllers / retire legacy routes** — Consolidate `RunQueryController` and `AuthorityQueryController` overlapping reads; sunset legacy aliases. **Impact:** Medium · **Effort:** Medium · **Note:** `docs/architecture/api/REST_API_REDESIGN_IMPLEMENTATION_NOTES.md`

10. **Reduce configuration sprawl** — Pilot-minimal `appsettings` defaults; retire deprecated keys in `ConfigurationKeyCatalog.cs`; feature-grouped options. **Impact:** Medium · **Effort:** Medium · **Paths:** `ArchLucid.Api/appsettings*.json`, `ArchLucid.Core/Configuration/ConfigurationKeyCatalog.cs`

## Quick wins (slot early)

11. ~~**Remove duplicate sponsor summary services**~~ — **Done** (2026-08-24): removed unused `SponsorSummaryService` / `ISponsorSummaryService`; `ISponsorReportService` is canonical.

12. ~~**Align DemoSeedService with UI sample registry**~~ — **Done** (2026-08-24): `DemoSeedScenarioRegistry` maps seed steps to UI sample slugs; `BuildSeedSteps` reads registry order.

## Related (not duplicated here)

- **Contracts note:** Move heavy service interfaces out of `ArchLucid.Contracts` when team boundaries justify churn; keep DTOs in Contracts (ADR 0013).
- **Error message sanitization:** Ensure internal pipeline nomenclature does not leak in HTTP 400/500 responses.
- **Magic numbers / named bounds (MN-1 phase 2):** NSwag client style, optional `IOptions` for commit backoff.

## Archive

The April 2026 numbered backlog snapshot (`§8–§342`) was removed during doc cleanup (2026-07-22). Pre-cleanup text remains in git history.
