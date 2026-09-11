# SecureNow architect hold (SA-22)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/securenow-architect-22-hold-no-apply-no-mega-graph.md`](../../.cursor/prompts/securenow-architect-22-hold-no-apply-no-mega-graph.md) only when a session starts apply, mega-graph, `IFindingEngine`, SIEM, or confidence percentages.

## Goal

Keep SecureNow architect work inside the infrastructure-evidence plane: one Azure collector, operational finding stream, advisory execute, verify on next snapshot.

## Why

The lecture’s end-state pipeline is correct **except** Execute-as-cloud-mutation, one graph of every node type, and control-plane “data flowed” claims. Those would make SecureNow a change-management platform, a CMDB, or a dangerous narrator.

## Authorized spine (SA-01–SA-21)

```text
Azure + optional adapters (Entra / CI federated identity)
        → Normalized evidence (AzureInventorySnapshot)     [IE plane]
              → Security evidence graph projection         [SA-02]
                    → Path engines (privilege, reachability, capability-to-flow, …)
                          → SecurityEvidencePath + OperationalSecurityFinding (PathId)
                                → Ranking, cut points, advisory remediation
                                      → Verify on next snapshot
```

Contract: [`SECURENOW_ARCHITECT_PLANE.md`](SECURENOW_ARCHITECT_PLANE.md). Coverage-engine hold: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md).

## Do not implement (ever from SA sessions)

| Temptation | Hold |
|------------|------|
| `terraform apply` / ARM PUT / write roles | IE plane §2; SA plane §2 |
| Second ZIP collector / `Get-SecureNowAttackPathPackage.ps1` | One collector family |
| `IFindingEngine` / DX-77 / golden-corpus coverage engines | `HOLD_NO_COVERAGE_ENGINES.md` |
| Findings as traversable graph nodes | Circular engines |
| Per-pod K8s inventory as V1 nodes | Stale immediately; cluster+MI first |
| Activity-log SIEM / near-real-time every change | Snapshot neighborhood (SA-13) |
| Confidence `82%` | Ordinal bands only (SA-21) |
| Multiplicative risk as product of record | SA-09 independent dimensions |
| Observed exfiltration from ARG | Capability-to-flow + HumanAssertion |
| AWS/GCP path engines in this set | Azure-first SecureNow |
| Mega-graph (CMDB + GitHub + pods + findings) | Adapters fail soft |
| Second API host / Security SQL catalog | PL-05 |
| Desktop review tabs behind **More** | workspace rule |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **SA-01–SA-21** and the plane. Do not “just this once” apply to a lab subscription from ArchLucid.

## Agent checklist (after SA-01–SA-21 work)

- Files changed stay inside IE + operational path stream
- Tests run for touched areas; no new `IFindingEngine` types
- Residual gaps surface as `InsufficientEvidence`, not silent expansion
- Architecture review `IFindingEngine` stream unchanged
- No-apply hold still holds

## Related

- [`SECURENOW_ARCHITECT_PLANE.md`](SECURENOW_ARCHITECT_PLANE.md)
- [`../architecture/SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md)
- [`.cursor/prompts/securenow-architect-00-index.md`](../../.cursor/prompts/securenow-architect-00-index.md)
- [`SECURENOW_FEDERATED_CI_ADAPTER.md`](SECURENOW_FEDERATED_CI_ADAPTER.md) (SA-19)
- [`SECURENOW_ENTRA_GROUP_ADAPTER.md`](SECURENOW_ENTRA_GROUP_ADAPTER.md) (SA-20)
- [`SECURENOW_HONESTY_COPY.md`](SECURENOW_HONESTY_COPY.md) (SA-21)
