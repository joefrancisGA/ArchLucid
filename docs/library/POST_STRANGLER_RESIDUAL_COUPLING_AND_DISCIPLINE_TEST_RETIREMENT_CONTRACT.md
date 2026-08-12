> **Scope:** Engineering source of truth — post-storage strangler residual coupling hunt and discipline-test retirement gates (**TB-1204**). Honesty CI **TB-1205**.

# Post-strangler residual coupling and discipline-test retirement (TB-1204)

> **Audience:** Maintainers evaluating “strangler complete” language and anti-resurrection pins.  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#post-strangler-residual-coupling-m-206) (**M-205** / **M-206**).  
> **Next delete slice:** [`STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md`](./STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md) (**TB-1034**).  
> **Honesty CI:** **TB-1205** (open).

---

## Decision in one line

**Storage strangler Done ≠ residual coupling closed.** Hunt soft bridges and mental-model dualism; **keep** discipline tests until explicit supersession gates pass — never delete pins solely because inventory says complete.

---

## Hunt matrix (post-storage-complete)

| Residual class | Examples | Hunt signal |
| --- | --- | --- |
| **DTO / projection bleed** | `ContractGoldenManifestMapper`, `AuthorityCommitProjectionBuilder`, `ContractGoldenManifestPersistence` | New fields mapped only on one side |
| **AgentTask mental model** | `execute` / `result` / `commit` taught as default | Docs/UI imply peer lifecycle to Authority (**TB-1007** / **TB-1034**) |
| **Dual hasher** | `ManifestHashService` vs `GoldenManifestFingerprint` | Equating cohort SHA with production hash (**TB-1156**) |
| **Vocabulary** | “coordinator” in UI/docs/DI names | Buyer reads dual live storage |
| **Ceiling / allowlist hygiene** | `assert_coordinator_reference_ceiling.py`, comment-inflated baselines | Bypass tokens creep upward |
| **Host naming residue** | `ServiceCollectionExtensions.CoordinatorAndArtifacts.cs` | Suggests live coordinator stack |
| **MVC blind spots** | `[FromServices]` coordinator families | NetArch gaps (**TB-1005**) |

**Inventory anchor:** [`COORDINATOR_STRANGLER_INVENTORY.md`](../architecture/COORDINATOR_STRANGLER_INVENTORY.md) — “none outstanding” is **storage** closure only.

---

## Keep vs retire discipline tests

| Pin | Default | Retire only when |
| --- | --- | --- |
| `DualPipelineRegistrationDisciplineTests` | **Keep** | Superseding forbidden-type / NetArch coverage with **zero** coordinator-specific exceptions |
| `CoordinatorStranglerCompletionArchitectureTests` | **Keep** | Same + gated artifact proven vacuous (**TB-919** pattern) |
| `MvcControllerCoordinatorRepositoryFamilyGuardTests` | **Keep** | Repository families remain deleted with replacement guard |
| `assert_coordinator_reference_ceiling.py` | **Keep** | Allowlist/bypass/ceiling tokens → 0 after comment cleanup |

**Never:** delete pins solely because inventory / **TB-919** says complete.

---

## Retirement gates (all required)

| # | Gate |
| --- | --- |
| a | Superseding forbidden-type / NetArch coverage with **zero** coordinator-specific exceptions, **or** gated artifact proven vacuous |
| b | Allowlist / bypass / ceiling tokens → 0 after comment cleanup |
| c | **TB-1007** + **TB-1034** Done (or explicit ADR keep for `/result`) |
| d | Honesty CI (**TB-1008** / **TB-1035** / **TB-1205**) green |
| e | Optional soft-bridge collapse ADR before retiring projection known-empty CI |

---

## Forbidden claims

| Too strong | Safe |
| --- | --- |
| “Strangler complete → delete DualPipeline tests” | Cite retirement gates above |
| AgentTask verbs = dual **storage** repos | Extension loop / mappers ≠ second SoR |
| “No residual coupling” from storage removal alone | Hunt matrix still applies |
| Contracts↔Authority mappers prove dual pipeline ships | Mapping ≠ dual live write path |

---

## Explicit non-claims

- Does not reintroduce `ICoordinator*` repositories.
- Does not implement `/result` sunset (**TB-1034** / ADR 0066).
- Does not unify dual hashers (**TB-1156**).

**Related:** **TB-1007** · **TB-1034** · **TB-1156** · Done **TB-919** · GTM **M-205** / **M-206** · **TB-1205**.
