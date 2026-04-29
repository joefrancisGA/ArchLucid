> **Scope:** Living inventory for ADR 0021 coordinator strangler — post-PR A3 / PR A4 ([ADR 0030](../adr/0030-coordinator-authority-pipeline-unification.md)): what shipped, what stays pinned in CI, and what remains (PR B audit constants). Complements `DualPipelineRegistrationDisciplineTests` (now asserts coordinator interfaces are **gone**) and `scripts/ci/assert_coordinator_reference_ceiling.py` (reference-count ceiling).

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Coordinator strangler inventory

**Objective.** Make Phase 3 retirement work visible and reviewable without guessing which symbols still anchor the coordinator pipeline.

**Assumptions.** Authority is the operator manifest/commit path; **`ICoordinatorGoldenManifestRepository`** / **`ICoordinatorDecisionTraceRepository`** and **`dbo.GoldenManifestVersions`** are **removed** ([ADR 0030](../adr/0030-coordinator-authority-pipeline-unification.md) PR A3 + PR A4).

**Constraints.** Reintroducing coordinator interfaces or a second manifest table requires a **new ADR** — do not silently regress [`DualPipelineRegistrationDisciplineTests`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs).

> **Historical grounding ([ADR 0030](../adr/0030-coordinator-authority-pipeline-unification.md)).** Before PR A3, two pipelines persisted incompatible domain models to incompatible SQL tables. PR A3 deleted the coordinator ports and legacy commit orchestrator; PR A4 (**migration 111**) dropped **`dbo.GoldenManifestVersions`**. Committed manifests today persist only under **`dbo.GoldenManifests`** + relational satellites (`Authority` path).


---

## Migrate (completed — PR A3)

| Work item | Resolution |
|-----------|------------|
| `ICoordinatorGoldenManifestRepository` / `ICoordinatorDecisionTraceRepository` write consumers | **Deleted** — consumers use **`IGoldenManifestRepository`** + **`IUnifiedGoldenManifestReader`** (authority-only reads post-PR A3). |
| `POST /v1/architecture/*` run lifecycle | Implementation targets **`AuthorityDrivenArchitectureRunCommitOrchestrator`**; routes retain deprecation headers until a future ADR retires the HTTP surface. |
| `RunCommitOrchestratorFacade` coordinator branch | **Removed** with legacy orchestrator deletion (PR A3). |

---

## Keep (stable — do not weaken without ADR)

| Symbol / automation | Owning assembly / location | Risk note |
|---------------------|------------------------------|-----------|
| `IUnifiedGoldenManifestReader` | `ArchLucid.Persistence` | Authority-only post-PR A3 — single internal read façade for `GoldenManifest`. |
| `DualPipelineRegistrationDisciplineTests` | `ArchLucid.Api.Tests` | Asserts coordinator interfaces **do not** resolve in production DI; opposite invariant vs Phase 1 allow-list. |
| `AuditEventTypes_DoNotCollideAcrossPipelinesTests` | `ArchLucid.Core.Tests` | Prevents duplicate audit wire values until PR B retires **`CoordinatorRun*`** constants. |

---

## Remaining work (PR B — after 2026-05-15 Sunset)

Per [ADR 0029](../adr/0029-coordinator-strangler-acceleration-2026-05-15.md) § Lifecycle and [`PHASE_3_PR_B_TODO.md`](PHASE_3_PR_B_TODO.md):

| Item | Notes |
|------|--------|
| **`AuditEventTypes.CoordinatorRun*`** retirement | Dual-write / dashboard migration window as described in ADR 0021 Phase 2 framing; calendar deadline applies to **PR B**. |
| **`CoordinatorPipelineDeprecationFilter`** / route-family sunset | Operator **`POST /v1/architecture/*`** retirement is **not** part of PR A4 — separate ADR when HTTP surface shrinks. |

---

## Related automation

- Reference-count ceiling (non-test `.cs` hits vs baseline): `scripts/ci/assert_coordinator_reference_ceiling.py`
- Archived dual-path map: `docs/archive/dual-pipeline-navigator-superseded.md`
- Superseded completion scaffold: `docs/adr/0028-coordinator-strangler-completion.md` (**Superseded by** [ADR 0029](../adr/0029-coordinator-strangler-acceleration-2026-05-15.md))
