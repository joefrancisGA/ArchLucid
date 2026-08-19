> **Scope:** Living inventory for ADR 0021 coordinator strangler — post-PR A3 / PR A4 ([ADR 0030](adrs/0030-coordinator-authority-pipeline-unification.md)): what shipped, what stays pinned in CI, and what is **product/ADR follow-up** (not dual storage). Complements [`DualPipelineRegistrationDisciplineTests`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs) (pins **no** resurrected `ICoordinatorGoldenManifestRepository` / `ICoordinatorDecisionTraceRepository`, authority repository namespaces, and `AuthorityDrivenArchitectureRunCommitOrchestrator`), [`MvcControllerCoordinatorRepositoryFamilyGuardTests`](../../ArchLucid.Api.Tests/Startup/MvcControllerCoordinatorRepositoryFamilyGuardTests.cs) ([**`V1_SCOPE` Section 3**](../library/V1_SCOPE.md) — MVC constructor surface), and [`scripts/ci/assert_coordinator_reference_ceiling.py`](../../scripts/ci/assert_coordinator_reference_ceiling.py) (reference-count ceiling).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Coordinator strangler inventory

**Objective.** Make Phase 3 retirement work visible and reviewable without guessing which symbols still anchor the coordinator pipeline.

**Assumptions.** Authority is the operator manifest/commit path; **`ICoordinatorGoldenManifestRepository`** / **`ICoordinatorDecisionTraceRepository`** and **`dbo.GoldenManifestVersions`** are **removed** ([ADR 0030](adrs/0030-coordinator-authority-pipeline-unification.md) PR A3 + PR A4).

**Constraints.** Reintroducing coordinator interfaces or a second manifest table requires a **new ADR** — do not silently regress [`DualPipelineRegistrationDisciplineTests`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs) or [`MvcControllerCoordinatorRepositoryFamilyGuardTests`](../../ArchLucid.Api.Tests/Startup/MvcControllerCoordinatorRepositoryFamilyGuardTests.cs) ([**`V1_SCOPE` Section 3**](../library/V1_SCOPE.md): net-new HTTP routes must not extend only the retired coordinator-repository family).

> **Historical grounding ([ADR 0030](adrs/0030-coordinator-authority-pipeline-unification.md)).** Before PR A3, two pipelines persisted incompatible domain models to incompatible SQL tables. PR A3 deleted the coordinator ports and legacy commit orchestrator; PR A4 (**migration 111**) dropped **`dbo.GoldenManifestVersions`**. Committed manifests today persist only under **`dbo.GoldenManifests`** + relational satellites (`Authority` path).


---

## Migrate (completed — PR A3)

| Work item | Resolution |
|-----------|------------|
| `ICoordinatorGoldenManifestRepository` / `ICoordinatorDecisionTraceRepository` write consumers | **Deleted** — consumers use **`IGoldenManifestRepository`** + **`IUnifiedGoldenManifestReader`** (authority-only reads post-PR A3). |
| `POST /v1/architecture/*` run lifecycle | Implementation targets **`AuthorityDrivenArchitectureRunCommitOrchestrator`**. **`CoordinatorPipelineDeprecationFilter`** was **removed** ([ADR 0030](adrs/0030-coordinator-authority-pipeline-unification.md) PR A final cleanup); optional **`Deprecation`** / **`Sunset`** headers use **[`ApiDeprecationHeadersMiddleware`](../../ArchLucid.Api/Middleware/ApiDeprecationHeadersMiddleware.cs)** + **[`ApiDeprecationOptions`](../../ArchLucid.Host.Core/Configuration/ApiDeprecationOptions.cs)** (`ApiDeprecation:*` appsettings). Narrowing/removing the **route surface** awaits a future ADR. |
| `RunCommitOrchestratorFacade` coordinator branch | **Removed** with legacy orchestrator deletion (PR A3). |

---

## Keep (stable — do not weaken without ADR)

| Symbol / automation | Owning assembly / location | Risk note |
|---------------------|------------------------------|-----------|
| `IUnifiedGoldenManifestReader` | Contract: **[`ArchLucid.Core/Persistence/Ports/IUnifiedGoldenManifestReader.cs`](../../ArchLucid.Core/Persistence/Ports/IUnifiedGoldenManifestReader.cs)** · impl: **`UnifiedGoldenManifestReader`** (**[`ArchLucid.Persistence/Reads/UnifiedGoldenManifestReader.cs`](../../ArchLucid.Persistence/Reads/UnifiedGoldenManifestReader.cs)**) | Authority-only post-PR A3 read façade; DI resolves Persistence concrete (see **`UnifiedGoldenManifestReader_resolves_from_Persistence_namespace`** in [`DualPipelineRegistrationDisciplineTests`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs)). |
| `DualPipelineRegistrationDisciplineTests` | **[`ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs)** | Pins ADR 0030 PR A3 closure — no resurrected **`ICoordinatorGoldenManifestRepository`** / **`ICoordinatorDecisionTraceRepository`**; authority repos from **Decisioning** or **Persistence** namespaces; **`IArchitectureRunCommitOrchestrator`** → **`AuthorityDrivenArchitectureRunCommitOrchestrator`**. |
| **`MvcControllerCoordinatorRepositoryFamilyGuardTests`** | **[`ArchLucid.Api.Tests/Startup/MvcControllerCoordinatorRepositoryFamilyGuardTests.cs`](../../ArchLucid.Api.Tests/Startup/MvcControllerCoordinatorRepositoryFamilyGuardTests.cs)** | [**`V1_SCOPE` Section 3**](../library/V1_SCOPE.md); [**ADR 0030**](adrs/0030-coordinator-authority-pipeline-unification.md) — rejects **exported** MVC **`ControllerBase`** types whose constructors take retired coordinator-family dependencies (narrow allow-list in source + ADR if an escape hatch is ever required). |
| **`AuditEventTypesDoNotCollideAcrossPipelinesTests`** | **[`ArchLucid.Core.Tests/Audit/AuditEventTypes_DoNotCollideAcrossPipelinesTests.cs`](../../ArchLucid.Core.Tests/Audit/AuditEventTypes_DoNotCollideAcrossPipelinesTests.cs)** | Non-collision / uniqueness invariants across **`AuditEventTypes.Run.*`**, **`RunStarted`** / **`RunCompleted`**, **`Baseline`** nesting — aligned to [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md). |

---

## Completed in code (track ADR archival separately)

| Item | Resolution |
|------|------------|
| **`AuditEventTypes.CoordinatorRun*`** literals | **Removed** — regression guard **`Legacy_CoordinatorRun_audit_constants_are_removed_from_AuditEventTypes`** in **[`DependencyConstraintTests`](../../ArchLucid.Architecture.Tests/DependencyConstraintTests.cs)** (**only** remaining `CoordinatorRun` substring hits in **`*.cs`** are that test). |
| **`CoordinatorPipelineDeprecationFilter`** + **`CoordinatorPipelineDeprecatedAttribute`** + coordinator-only deprecation tests | **Deleted** per [ADR 0030](adrs/0030-coordinator-authority-pipeline-unification.md) header (**PR A final cleanup**). |

---

## Completed in docs (PR B — 2026-05-05)

| Item | Resolution |
|------|------------|
| Phase 3 **PR B** (audit-constant retirement checklist) | **Closed** 2026-05-05; former working-surface file **`PHASE_3_PR_B_TODO.md`** and **`assert_pr_b_tracker_in_sync.py`** retired; ADRs 0010, 0021, 0022, 0028, 0029 superseded by [ADR 0030](adrs/0030-coordinator-authority-pipeline-unification.md) (removed ADRs listed in [`redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02)). |

---

## Remaining product / ADR follow-up

**None outstanding as of 2026-07-20 (TB-919).** The one previously-open item — the deprecated `v1/runs/*` / `v1/requests` alias routes and strangler gate (iv) — is **closed**:

| Item | Notes |
|------|-------|
| Operator **`POST /v1/architecture/*`** lifecycle | Routes **persist**; this is the one canonical run-lifecycle write family. The deprecated aliases (`v1/requests`, `v1/runs/{runId}/submit`, `v1/runs/{runId}/manifest/finalize`) that TB-305/ADR 0042 kept routable were **deleted** (**TB-919**, 2026-07-20) — pre-release, no paying customer, safe to close now rather than wait for a customer-traffic trigger. `RunAliasDeprecationMiddleware` and the `archlucid_run_lifecycle_deprecated_alias_requests_total` metric were removed along with the routes. Strangler gate (iv) is resolved by removing the surface it was gating, not by accumulating 14 zero-write days. |

---

## Related automation

- Reference-count ceiling (non-test `.cs` hits vs baseline): `scripts/ci/assert_coordinator_reference_ceiling.py`
- Integration tests canonical run-write guard (Improvement 3, 2026-06-23; **retired TB-919** 2026-07-20 once the alias routes it guarded were deleted): formerly `scripts/ci/assert_integration_tests_canonical_run_writes.py`.
- Architecture closure pins: [`CoordinatorStranglerCompletionArchitectureTests`](../../ArchLucid.Architecture.Tests/CoordinatorStranglerCompletionArchitectureTests.cs) — retired coordinator types absent, single `AuthorityDrivenArchitectureRunCommitOrchestrator`, `RegisterAuthorityDecisionEngineAndRepositories` naming.
- Archived dual-path map: `docs/archive/dual-pipeline-navigator-superseded.md`
- Removed historical ADRs: [`redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02)

---

## Improvement 3 closure (2026-06-23)

**Status:** Code-complete strangler per ADR 0030 PR A3/A4 + ADR 0042 canonical write surface. Legacy coordinator repositories, commit orchestrator, and `dbo.GoldenManifestVersions` are removed; integration tests and CI guards pin the authority-only path.

| Deliverable | Location |
|-------------|----------|
| Production type retirement pins | [`CoordinatorStranglerCompletionArchitectureTests`](../../ArchLucid.Architecture.Tests/CoordinatorStranglerCompletionArchitectureTests.cs) |
| DI registration naming (TB-305 decision D) | Same + [`DualPipelineRegistrationDisciplineTests`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs) |
| Integration test canonical write guard | **Retired** (**TB-919**, 2026-07-20) — vacuous once the alias routes it guarded were deleted |
| HTTP alias sunset (customer traffic soak) | **Done** (**TB-919**, 2026-07-20) — aliases deleted pre-release; owner decision, no customer-traffic soak needed |
