# SA-22 — Hold: not a scanner platform fork

**This prompt is not implementation.** Paste only if a session starts apply, mega-graph, `IFindingEngine`, SIEM, or confidence percentages.

Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Keep SecureNow architect work inside the infrastructure-evidence plane: one Azure collector, operational finding stream, advisory execute, verify on next snapshot.

## Why

The lecture’s end-state pipeline is correct **except** Execute-as-cloud-mutation, one graph of every node type, and control-plane “data flowed” claims. Those would make SecureNow a change-management platform, a CMDB, or a dangerous narrator.

## Do not implement (ever from SA sessions)

| Temptation | Hold |
|------------|------|
| `terraform apply` / ARM PUT / write roles | IE plane §2; SA plane §2 |
| Second ZIP collector / `Get-SecureNowAttackPathPackage.ps1` | One collector family |
| `IFindingEngine` / DX-77 / golden-corpus coverage engines | `HOLD_NO_COVERAGE_ENGINES.md` |
| Findings as traversable graph nodes | Circular engines |
| Per-pod K8s inventory as V1 nodes | Stale immediately; cluster+MI first |
| Activity-log SIEM / near-real-time every change | Snapshot neighborhood (SA-13) |
| Confidence `82%` | Ordinal bands only |
| Multiplicative risk as product of record | SA-09 independent dimensions |
| Observed exfiltration from ARG | Capability-to-flow + HumanAssertion |
| AWS/GCP path engines in this set | Azure-first SecureNow |
| Mega-graph (CMDB + GitHub + pods + findings) | Adapters fail soft |
| Second API host / Security SQL catalog | PL-05 |
| Desktop review tabs behind **More** | workspace rule |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **SA-01–SA-21** and the plane. Do not “just this once” apply to a lab subscription from ArchLucid.

## Done when

The hold is written. No code from this file.
