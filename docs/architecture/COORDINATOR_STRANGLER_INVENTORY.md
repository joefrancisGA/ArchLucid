> **Scope:** Living inventory for ADR 0021 coordinator strangler — symbols and route families tagged migrate / keep / delete with ownership and risk notes. Complements `DualPipelineRegistrationDisciplineTests` (type-level allow list) and `scripts/ci/assert_coordinator_reference_ceiling.py` (reference-count ceiling).

# Coordinator strangler inventory

**Objective.** Make Phase 3 retirement work visible and reviewable without guessing which symbols still anchor the coordinator pipeline.

**Assumptions.** Authority remains the supported long-term operator pipeline; coordinator contracts persist until exit gates in ADR 0021 / draft ADR 0028 clear.

**Constraints.** No runtime routing change from this document alone; owner-only dates and ADR 0022 state flips stay in `docs/PENDING_QUESTIONS.md` item 16.

---

## Migrate (target: authority façade or unified reader)

| Symbol / route family | Owning assembly | Last touched PR | Risk note |
|----------------------|-----------------|-----------------|----------|
| `ICoordinatorGoldenManifestRepository` write consumers outside unified reader | `ArchLucid.Application` | _PR link TBD_ | New readers must use `IUnifiedGoldenManifestReader`; extra write-side consumers extend Phase 3 scope. |
| `ICoordinatorDecisionTraceRepository` | `ArchLucid.Application`, `ArchLucid.Persistence` | _PR link TBD_ | Collapsing with authority trace port risks audit wire collisions (see ADR 0010). |
| `POST /v1/architecture/*` coordinator run lifecycle | `ArchLucid.Api` | _PR link TBD_ | Public clients still use string `RunId` path; migrate only with dual-run support and contract tests. |
| `RunCommitOrchestratorFacade` coordinator branch | `ArchLucid.Application` | _PR link TBD_ | Facade intentionally hides coordinator vs authority selection; changing split affects replay parity. |

---

## Keep (stable until superseding ADR)

| Symbol / route family | Owning assembly | Last touched PR | Risk note |
|----------------------|-----------------|-----------------|----------|
| `IUnifiedGoldenManifestReader` | `ArchLucid.Persistence` | _PR link TBD_ | Phase 1 read façade — expand HTTP consumers here, not new coordinator repos. |
| `DualPipelineRegistrationDisciplineTests` | `ArchLucid.Api.Tests` | _PR link TBD_ | Pins DI split + `ICoordinatorGoldenManifestRepository` allow list; do not weaken without ADR update. |
| `AuditEventTypes_DoNotCollideAcrossPipelinesTests` | `ArchLucid.Core.Tests` | _PR link TBD_ | Prevents coordinator/authority audit constant collisions on the wire. |
| `scripts/ci/coordinator_parity_probe.py` | repo root | _PR link TBD_ | Nightly parity row append to `COORDINATOR_TO_AUTHORITY_PARITY.md`. |

---

## Delete (blocked — requires exit gates)

| Symbol / route family | Owning assembly | Last touched PR | Risk note |
|----------------------|-----------------|-----------------|----------|
| `ICoordinatorGoldenManifestRepository` (interface) | `ArchLucid.Persistence` | _PR link TBD_ | **Do not delete** until ADR 0021 Phase 3 + replay/run-volume parity evidence; deleting early revives ADR 0010 collision class. |
| `ICoordinatorDecisionTraceRepository` | `ArchLucid.Persistence` | _PR link TBD_ | Same as manifest port — needs write-side façade and migration window. |
| Legacy `Coordinator*` HTTP route tree wholesale | `ArchLucid.Api` | _PR link TBD_ | Customer and demo scripts still target `/v1/architecture/*`; needs deprecation ADR and CLI cut-over. |

---

## Related automation

- Reference-count ceiling (non-test `.cs` hits vs baseline): `scripts/ci/assert_coordinator_reference_ceiling.py`
- Dual-pipeline map: `docs/DUAL_PIPELINE_NAVIGATOR.md`
- Draft completion ADR scaffold: `docs/adr/0028-coordinator-strangler-completion.md`
