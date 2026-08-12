# ADR 0042: Canonical run-lifecycle write surface (alias deprecation)

**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Architecture review  
**Related:** [ADR 0030](0030-coordinator-authority-pipeline-unification.md), TB-302, TB-305

**Status note (2026-07-20, TB-919 — owner decision):** The **`v1/requests`**, **`v1/runs/{runId}/submit`**, and **`v1/runs/{runId}/manifest/finalize`** aliases (Â§ Decision 1) are **deleted**, not merely deprecated. Owner rationale: ArchLucid is still pre-release with no paying customer and no published client holding the aliases, so the deprecation/sunset window this ADR's Â§ Alternatives Considered #1 said "even a hypothetical caller needs" has no real caller to protect — the "later TB" from Â§ Decision 1 is **TB-919**. `RunAliasDeprecationMiddleware`, `RunWriteLifecycleRoutes`'s alias-template members, and the `archlucid_run_lifecycle_deprecated_alias_requests_total` counter (Â§ Verification) were removed with the routes. **This closes the last open item in the coordinator strangler migration** (see `docs/architecture/COORDINATOR_STRANGLER_INVENTORY.md`). If a future integrator ever depends on the deleted aliases, restoring them requires a new ADR, not reverting this note.

## Context

ADR 0030 PR A3/A4 collapsed the **data/orchestrator** dual pipeline: the coordinator repository family, the legacy commit orchestrator, `RunCommitPathSelector`, and `dbo.GoldenManifestVersions` were deleted, and `IArchitectureRunCommitOrchestrator` resolves only to `AuthorityDrivenArchitectureRunCommitOrchestrator`. What remained of the "two live pipelines" risk was at the **HTTP write surface**, not the data layer:

1. **Dual public write verbs** for each run-lifecycle operation on `RunsController`:
   - `POST v1/architecture/request` + alias `POST /v1/requests`
   - `POST v1/architecture/review/{runId}/execute` + alias `POST /v1/runs/{runId}/submit`
   - `POST v1/architecture/review/{runId}/finalize` + alias `POST /v1/runs/{runId}/manifest/finalize`
2. An **external result-push path** `POST v1/architecture/review/{runId}/result` (`SubmitAgentResult`) that injects an `AgentResult` directly.
3. **Decision primitives** (`DecisionEngineV2`, `IDecisionNodeRepository`, `DecisionNodeManifestMerger`) registered under a method named `RegisterCoordinatorDecisionEngineAndRepositories`, suggesting coordinator-era code.

Evidence (first-party clients): the UI (`archlucid-ui/src/lib/api/architecture-runs.ts`) and the CLI (`ArchLucid.Cli`) call only the `v1/architecture/*` family. The `v1/runs/*` and `v1/requests` aliases have **no first-party consumer** — they exist only in the OpenAPI surface.

## Decision

1. **Canonical family = `v1/architecture/*`.** The `v1/requests`, `v1/runs/{runId}/submit`, and `v1/runs/{runId}/manifest/finalize` aliases are **deprecated** but stay routable. `RunAliasDeprecationMiddleware` emits RFC 8594 `Deprecation: true` + a `Link; rel="successor-version"` header pointing at the canonical route. Routes are **not** deleted here (sunset is a later TB).
2. **Unified idempotency + audit by construction.** Each canonical route and its alias are declared as multiple `[HttpPost]` attributes on a **single MVC action**, so the idempotency key space and audit event are identical regardless of which verb a caller uses. `RunWriteLifecycleRoutes` is the single source of truth for the mapping; `CanonicalRunWriteSurfaceArchitectureTests` pins the shared-action contract.
3. **`/result` is append-only-to-in-progress.** `SubmitAgentResult` accepts a result only while the run is `TasksGenerated` or `WaitingForResults` (`RunStateTransitionService.ValidateResultSubmissionAllowed`); it cannot finalize/commit a run or mutate a committed one, so it can never bypass the commit orchestrator. Retained as a documented custom-agent extension point (removal would be a public-contract change requiring owner sign-off).
4. **Decision primitives are authority components.** They are consumed by `AuthorityDrivenArchitectureRunCommitOrchestrator`; the misleading registration method was renamed `RegisterCoordinatorDecisionEngineAndRepositories` → `RegisterAuthorityDecisionEngineAndRepositories` (no behavior change).
5. **Self-enforcing end-state.** `CanonicalRunWriteSurfaceArchitectureTests` fails the build when a new multi-verb run-lifecycle write route appears on `RunsController` without a corresponding `RunWriteLifecycleRoutes` entry (which itself requires an ADR). ADR 0021 Phase 3 gate (iv) (14-day zero-coordinator-write soak) is **not** force-closed — it remains owner/customer-traffic gated per ADR 0029.

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Keep aliases routable + deprecation headers | No breaking change for any hypothetical alias caller; clean migration signal | Two route shapes remain in OpenAPI until the sunset TB |
| Single action for canonical + alias | Idempotency + audit unified with zero divergence risk | Cannot mark only the alias `[Obsolete]`; deprecation is conveyed via middleware + XML docs |
| Retain `/result`, constrain it | Preserves the documented custom-agent integration point | Surface stays slightly larger than the minimal create→execute→commit core |
| Architecture test guard vs forcing gate (iv) | Prevents regression without a customer-traffic soak that cannot run pre-release | Formal Phase 3 sign-off still pending V1 traffic |

## Constraints

- Reuse the existing `ApiDeprecationHeadersMiddleware` posture for header semantics; do not introduce a new versioning scheme (ADR 0006/0013).
- No deletion of public routes and no retirement of `/result` in this ADR (owner sign-off + sunset window required).
- Do not amend historical ADRs 0021/0022/0029 content — append dated status notes only (ADRs are immutable once accepted).

## Expected impact

| Area | Impact |
|------|--------|
| **Security** | `/result` provably cannot finalize a run; no new bypass of the commit orchestrator. |
| **Scalability** | Negligible — one route-template check per request, headers deferred to `OnStarting`. |
| **Reliability** | Single audit/idempotency path per operation removes forensic divergence by route shape. |
| **Cost** | No infrastructure cost; engineering limited to middleware, a constants type, tests, and docs. |

## Alternatives considered

1. **Delete the aliases now.** Rejected — public-contract removal needs a deprecation/sunset window even with no known first-party consumer.
2. **Make `v1/runs/*` canonical** (matching the "authority" naming). Rejected — both first-party clients use `v1/architecture/*`; flipping canonical would break the UI and CLI.
3. **Force ADR 0021 gate (iv) closed.** Rejected — the 14-day zero-write soak requires customer traffic that does not exist pre-release (ADR 0029).

## Verification

- `ArchLucid.Architecture.Tests` — `CanonicalRunWriteSurfaceArchitectureTests`
- `ArchLucid.Api.Tests` — `RunWriteLifecycleRoutesTests`, `RunAliasDeprecationMiddlewareTests`, `DualPipelineRegistrationDisciplineTests`, `MvcControllerCoordinatorRepositoryFamilyGuardTests`
- **Observability:** `archlucid_run_lifecycle_deprecated_alias_requests_total` (`operation` label) — alias-traffic soak input for ADR 0021 gate (iv) before route sunset
- `ArchLucid.Application.Tests` — `RunStateTransitionServiceTests` (`/result` append-only invariant)
