> **Scope:** Coordinator vs Authority pipeline parity evidence (ADR 0021).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Coordinator → Authority parity runbook

**Audience:** Platform / SRE + architecture reviewers.

**Objective:** Capture **measurable parity** between the Coordinator and Authority pipelines while ADR 0021 phases execute (latency, audit volume, replay outcomes).

## Cadence

| Environment | Minimum frequency | Owner |
|-------------|-------------------|-------|
| Staging | Weekly during strangler | Platform |
| Production | Weekly while both pipelines accept writes | Platform |

## Metrics to record

| Metric | Source | Notes |
|--------|--------|-------|
| p95 / p99 API latency (`POST /v1/architecture/request`, `POST …/execute`, `POST …/commit`) | Application Insights or Grafana | Split by pipeline discriminator in logs where available. |
| Audit row ingest rate | `dbo.AuditEvents` count / hour | Expect temporary uplift during Phase 2 dual-write. |
| Replay parity | `POST /v1/architecture/review/{id}/replay` verify mode | Record 422 drift payloads when mismatched. |

## Template (fill per window)

| Window start (UTC) | Window end (UTC) | Tenant sample | Coordinator p95 ms | Authority p95 ms | Audit rows/hr | Replay parity OK? | Notes |
|--------------------|------------------|-----------------|----------------------|------------------|-----------------|---------------------|-------|
| *(TBD)* | *(TBD)* | *(TBD)* | | | | | |

### Automated probe (`scripts/ci/coordinator_parity_probe.py`)

Mechanical counts from `dbo.AuditEvents` (last 24h window): **legacy coordinator** (`CoordinatorRun*`) / **canonical** (`Run.*`) / **authority** (`RunStarted`, `RunCompleted`). Latency columns remain manual until wired.

**Historical note:** `.github/workflows/coordinator-parity-daily.yml` formerly upserted this table nightly; **retired 2026-05-05** with Phase 3 **PR B** ([ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)) — the coordinator pipeline is gone, so the nightly auto-append was vacuous. Operators may still run `python scripts/ci/coordinator_parity_probe.py --runbook docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md` manually against a SQL-backed environment if a future ADR restores parity-gate semantics (e.g. post-V1).

<!-- coordinator-parity-probe:table -->
| Window start (UTC) | Window end (UTC) | Tenant sample | Coordinator p95 ms | Authority p95 ms | Audit rows/hr | Replay parity OK? | Notes |
|--------------------|------------------|-----------------|----------------------|------------------|-----------------|---------------------|-------|
| 2026-04-21 06:41 UTC | 2026-04-22 06:41 UTC | *(sample)* | - | - | - / - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-22 06:42 UTC | 2026-04-23 06:42 UTC | *(sample)* | - | - | - / - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-23 06:42 UTC | 2026-04-24 06:42 UTC | *(sample)* | - | - | - / - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-24 06:34 UTC | 2026-04-25 06:34 UTC | *(sample)* | - | - | - / - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-25 06:41 UTC | 2026-04-26 06:41 UTC | *(sample)* | - | - | - / - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-26 06:57 UTC | 2026-04-27 06:57 UTC | *(sample)* | - | - | - / - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-27 06:58 UTC | 2026-04-28 06:58 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-28 06:53 UTC | 2026-04-29 06:53 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-29 06:56 UTC | 2026-04-30 06:56 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-04-30 06:58 UTC | 2026-05-01 06:58 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-05-01 06:42 UTC | 2026-05-02 06:42 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-05-02 06:54 UTC | 2026-05-03 06:54 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-05-03 07:06 UTC | 2026-05-04 07:06 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
| 2026-05-04 06:50 UTC | 2026-05-05 06:50 UTC | *(sample)* | - | - | - / - | - | auto `scripts/ci/coordinator_parity_probe.py` |
<!-- /coordinator-parity-probe:table -->

## Phase 3 gate status (2026-04-21, updated 2026-04-22) {#phase-3-gate-status}

**ADR 0030 Phase 3 is unblocked for the pre-release window.** Gates **(i)** (30-day post-PR-A soak) and **(iv)** (14 contiguous green daily rows in the parity table above) are both **waived** per ADR 0029 (owner Q&A 2026-04-21 + follow-up; historical ADR removed — see [`redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02)). Gate (iv) was waived because pre-release there is no customer traffic on either pipeline, the daily probe needs a SQL secret that only meaningfully exists post-V1, and holding the gate would create a chicken-and-egg block on shipping V1. Gate **(ii)** (`dotnet test --filter "Suite=Core|Suite=Integration"` green on `main`) **remains in force**. Gate **(iii)** is satisfied for PR A2 by the **cohort parity integration tests** described in the gate table below (`ArchitectureRunCommitPathParityIntegrationTests`); the live-API E2E workflow remains an additional regression signal on `main` but is not the sole owner of gate (iii) for this sub-PR.

**PR A2 (2026-04-22) — sub-PR evidence for gates (ii) and (iii) framing:**

| Gate | PR A2 mechanical evidence |
|------|---------------------------|
| **(ii)** | `dotnet test --filter "Suite=Core|Suite=Integration"` green on `main` (full Core + Integration CI slice). |
| **(iii)** {#pr-a2-cohort-parity-evidence} | `ArchitectureRunCommitPathParityIntegrationTests` in `ArchLucid.Api.Tests`: two factories (`Coordinator:LegacyRunCommitPath` true vs false) run the same simulator create → execute → commit idempotency key, assert identical **traceability-bundle.zip** entry names, and assert **stable** `PilotRunDeltasResponse` fields match (findings-by-severity histogram, audit row count + truncation flag, LLM call count, demo flag, top severity string). Clocks, seconds-to-commit, `topFindingId`, and evidence-chain pointers are intentionally out of scope. Live workflow E2E remains additional signal but PR A2 satisfies gate (iii) for the pre-release waiver window via this cohort. |

**Cut-over date: 2026-05-15** (latest-by; PR A may merge earlier once gates (ii) and (iii) clear). See [ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md) for the closed migration record.

**Both waivers expire automatically** if ArchLucid ships V1 to a paying customer before PR A merges — at that point [ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md) would be amended to restore both gates and recomputes the cut-over date. After V1 ships, any *future* coordinator-style refactor (none currently planned) must satisfy gates (i)–(iv) in full; the daily probe and runbook stay live for that purpose.

**Daily probe status.** **Retired 2026-05-05** with PR B — `coordinator-parity-daily.yml` removed; no nightly auto-append. Historical sample rows remain in the table above. If V1 ships and a future change restores gate (iv), reintroduce automation via a new ADR/workflow.

**Closing report (2026-07-20, TB-919):** Gate (iv) is resolved without a 14-day soak — the surface it was gating (the deprecated alias routes) no longer exists. The coordinator strangler migration ([ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)) has no open items: the data/orchestrator layer closed 2026-04-29 (PR A4), the HTTP write surface collapsed to one canonical family 2026-06-06 (ADR 0042/TB-305), and the deprecated aliases from that collapse were deleted 2026-07-20 (TB-919). Reopen this subsection only if a future coordinator-style refactor is proposed (none currently planned) and gate (iv) needs to be satisfied against real customer traffic post-V1.

## HTTP write-surface collapse (2026-06-06, ADR 0042 / TB-305)

The **code-level** dual pipeline is fully retired. Beyond the data/orchestrator deletion (ADR 0030 PR A3/A4), the HTTP run-lifecycle **write surface** is now collapsed onto the canonical `v1/architecture/*` family:

- `v1/requests`, `v1/runs/{runId}/submit`, `v1/runs/{runId}/manifest/finalize` are **deprecated-but-routable** aliases that share a single MVC action with their canonical counterparts, so idempotency keys and audit events are identical regardless of verb. `RunAliasDeprecationMiddleware` emits `Deprecation` + `Link; rel="successor-version"` headers on alias responses.
- `POST v1/architecture/review/{runId}/result` is constrained to append-only-to-in-progress (`RunStateTransitionService.ValidateResultSubmissionAllowed`) — it cannot finalize a run or bypass the commit orchestrator.
- `CanonicalRunWriteSurfaceArchitectureTests` fails the build if a new dual-write verb appears without an ADR-cited `RunWriteLifecycleRoutes` entry.

This closed the **code-level** half of ADR 0021 on 2026-06-06; the remaining gate **(iv)** item (14 contiguous zero-coordinator-write days) is now **resolved (TB-919, 2026-07-20)** — see below.

**Alias-traffic soak probe — retired (TB-919, 2026-07-20).** `RunAliasDeprecationMiddleware` formerly incremented **`archlucid_run_lifecycle_deprecated_alias_requests_total`** (label **`operation`** = `create` | `execute` | `commit`) on every deprecated-alias hit, as a soak input before deleting the alias routes. Owner decision 2026-07-20: pre-release, no paying customer, no published client depends on the aliases — deleted `v1/requests`, `v1/runs/{runId}/submit`, and `v1/runs/{runId}/manifest/finalize` directly rather than waiting out a 14-day soak with no real traffic to observe. The middleware and counter were removed with the routes (`ArchLucid.Api/Middleware/RunAliasDeprecationMiddleware.cs`, `ArchLucidInstrumentation.RunLifecycleDeprecatedAliasRequestsTotal` both deleted).

## Related

- [ADR 0030 — Coordinator → Authority pipeline unification](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)
- [dual-pipeline-navigator-superseded.md](../archive/dual-pipeline-navigator-superseded.md)
