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

## Active items (remaining)

1. **Decompose authority commit orchestrator** — Split `AuthorityDrivenArchitectureRunCommitOrchestrator.cs` (~910 lines) and `AuthorityPipelineStagesExecutor.cs` into focused stages (governance, decision materialization, manifest reuse, audit, persistence). **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Application/Runs/Orchestration/`

3. **Consolidate identity/auth bounded module** — Shared rate-limit, audit, and validation primitives across OTP, SSO, identity linking, and trial bootstrap in `ArchLucid.Application/Identity/`. **Impact:** High · **Effort:** High

4. **Finish demo/sample scenario decoupling** — Complete typed sample-definition layer so UI, seeds, and tests stop branching on healthcare/Claims literals. **Impact:** High (product) · **Effort:** Medium · **Backlog:** TB-978, TB-979, TB-980 · **Paths:** `archlucid-ui/src/lib/samples/`, `DemoSeedService.*.cs`

6. **Tighten governance API boundaries** — Move orchestration out of `PolicyPacksController.cs` (~925 lines); clarify workflow facade over 58 governance services. **Impact:** High · **Effort:** High · **Paths:** `ArchLucid.Api/Controllers/Governance/`, `ArchLucid.Application/Governance/`

9. **Merge API query controllers / retire legacy routes** — Consolidate `RunQueryController` and `AuthorityQueryController` overlapping reads; sunset legacy aliases. **Impact:** Medium · **Effort:** Medium · **Note:** `docs/architecture/api/REST_API_REDESIGN_IMPLEMENTATION_NOTES.md`

10. **Merge API query controllers / retire legacy routes** — Consolidate `RunQueryController` and `AuthorityQueryController` overlapping reads; sunset legacy aliases. **Impact:** Medium · **Effort:** Medium · **Note:** `docs/architecture/api/REST_API_REDESIGN_IMPLEMENTATION_NOTES.md`

## Completed (2026-08-24 pass)

| # | Item | Notes |
|---|------|-------|
| 2 | Multi-cloud extractor pipeline | `HostedCloudExtractorRunResult` shared envelope |
| 5 | TanStack Query migration | `MIGRATION_BACKLOG` cleared; guard tests pass |
| 7 | Terraform posture module | `infra/modules/posture/` |
| 8 | OpenAPI TS split | `api-types/schemas.generated.ts` + `paths.generated.ts` |
| 10 | Reduce configuration sprawl | Pilot overlay, slim base appsettings, deprecated key catalog tags |
| 11 | Duplicate sponsor services | Removed unused `SponsorSummaryService` |
| 12 | DemoSeed registry | `DemoSeedScenarioRegistry` |

## Related (not duplicated here)

- **Contracts note:** Move heavy service interfaces out of `ArchLucid.Contracts` when team boundaries justify churn; keep DTOs in Contracts (ADR 0013).
- **Error message sanitization:** Ensure internal pipeline nomenclature does not leak in HTTP 400/500 responses.
- **Magic numbers / named bounds (MN-1 phase 2):** NSwag client style, optional `IOptions` for commit backoff.

## Archive

The April 2026 numbered backlog snapshot (`§8–§342`) was removed during doc cleanup (2026-07-22). Pre-cleanup text remains in git history.
