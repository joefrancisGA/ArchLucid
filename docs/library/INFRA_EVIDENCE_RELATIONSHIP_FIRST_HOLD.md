> **Scope:** Contributor-reference — written hold for relationship-first inventory topology collection (**IE-RF-12**). Internal engineering only.
> **Spine:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Prompts:** [`../architecture/INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](../architecture/INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md)

# Relationship-first topology hold (IE-RF-12)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/infra-evidence-rf-12-hold.md`](../../.cursor/prompts/infra-evidence-rf-12-hold.md) only when a session starts ARM template export, `dependsOn`-as-architecture, a second collector, or Azure calls at diagram render time.

## Authorized spine (IE-RF-01–IE-RF-11)

```text
ARG index (ids/types)
    → ARG relationship projections (typed JSON paths)
    → type-scoped ARM list GETs (hosted + ARG-truncation fill)
    → network-associations.json (catalog associationType)
    → AzureInventorySecurityEdgeMaterializer (ProvenanceKind)
    → DiagramAst / Mermaid (optional display-only derived edges)
```

Optional **IE-RF-10** effective NSG/routes are **not** the executive diagram spine. They fail soft.

## Do not implement (ever from IE-RF sessions)

| Temptation | Hold |
|-----------|------|
| `Export-AzResourceGroup` / live ARM export as “intent” | Export is deployed state; reconstructed `dependsOn` is a deploy DAG |
| `dependsOn` as architecture arrows (`NIC1 --> VM1`) | Deploy order, not VM∈VNet |
| Second ZIP / `Get-SecureNowAttackPathPackage.ps1` | One collector family |
| GET every resource id in the subscription | Type-scoped lists + ARG projections |
| Azure HTTP from `DiagramAstFromGraphCompiler` / mermaid routes | Append-only snapshots |
| Network Watcher topology as primary graph | Optional fail-soft only (**IE-RF-10**) |
| Flow logs / VM Insights as architecture edges | Observed traffic ≠ intended topology |
| Promote Storage `nsgAllowRule` heuristic to ObservedFact | DeterministicInference |
| `terraform apply` / ARM writes | Plane §2 |
| `IFindingEngine` coverage engines | `HOLD_NO_COVERAGE_ENGINES.md` |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IE-RF-01–IE-RF-11** and the plane. Do not export ARM templates “just for diagrams.”
