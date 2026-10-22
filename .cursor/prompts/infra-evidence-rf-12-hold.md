# IE-RF-12 — Hold: no ARM export, no dependsOn architecture, no diagram-time Azure

**This prompt is not implementation.** Paste only if a session starts ARM template export, `dependsOn` as architecture arrows, a second collector, GET-every-resource, or Azure HTTP from Mermaid compile.

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints.

Library copy: [`docs/library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../../docs/library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md).

## Goal

Keep relationship-first topology inside the existing extractor → snapshot → `DiagramAst` spine.

## Why

ARM/Bicep **source** is intent (declaration ingest, four-reality). Live ARM **export** is another view of deployed state. Resource Graph + type lists answer “what exists.” `dependsOn` answers deploy order. Mixing those produces a deployment DAG labeled as architecture and a false “drift” signal (ARG vs export).

## Do not implement (ever from IE-RF sessions)

| Temptation | Hold |
|-----------|------|
| `Export-AzResourceGroup` / template export as diagram source | Deployed-state serialization; reconstructed `dependsOn` |
| `NIC1 --> VM1` from `dependsOn` | Deploy order, not VM∈VNet |
| Second ZIP / `Get-SecureNowAttackPathPackage.ps1` | Plane: one collector family |
| `GET` each resource id in the subscription | Type-scoped lists + ARG projections |
| Azure HTTP in `DiagramAstFromGraphCompiler` or mermaid routes | Append-only snapshots |
| Network Watcher topology as the primary graph | Optional fail-soft only in **IE-RF-10** |
| Flow logs / VM Insights as architecture edges | Observed traffic ≠ intended topology |
| Promote Storage `nsgAllowRule` heuristic to ObservedFact | DeterministicInference |
| Compare ARG vs live ARM export and call it four-reality drift | Real drift is declared vs observed vs diagram vs historical (**SA-12**) |
| `terraform apply` / ARM writes | Plane §2 |
| `IFindingEngine` coverage engines | `HOLD_NO_COVERAGE_ENGINES.md` |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IE-RF-01–IE-RF-11** and the plane. Do not export ARM templates “just for diagrams.”

## Done when

The hold is written. No code from this file.
