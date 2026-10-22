> **Scope:** Contributor-reference — written hold for Azure extractor diagram-enrichment collection (**AX-DE-HOLD**). Internal engineering only.
> **Spine:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Prompts:** [`../architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](../architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) · **Feasibility:** [`../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md)

# Azure extractor diagram enrichment hold (AX-DE-HOLD)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/azure-extractor-de-19-hold.md`](../../.cursor/prompts/azure-extractor-de-19-hold.md) only when a session starts secret harvest, Kudu scrape, hosted POST, diagram-time Azure HTTP, fake Fabric/Power BI, or a second collector.

## Authorized spine

```text
Existing extractor family (Tier 1 PowerShell + hosted GET-only)
    → optional schema-v2 sibling JSON (fail-soft)
    → AzureInventoryRelationshipAssociationTypes (AX-DE-01)
    → snapshot relationships (ProvenanceKind)
    → DiagramAst / Mermaid labels (May access / Sends diagnostics to / …)
```

Join **already-collected** ZIP facts first (**AX-DE-02–04**). Then type-scoped ARM lists. Then optional extra-permission Tier 1 (`config/list`).

## Do not implement (ever from AX-DE sessions)

| Temptation | Hold |
|-----------|------|
| Second ZIP / `Get-SecureNowAttackPathPackage.ps1` | One collector family |
| `Export-AzResourceGroup` / `dependsOn` as architecture | IE-RF-12 |
| GET every resource id | Type-scoped lists + ARG projections |
| Azure HTTP at Mermaid / `DiagramAst` compile | Append-only snapshots |
| Hosted POST (`config/list`, Cost query, Policy Insights states) | Hosted is GET-only; **AX-DE-18** is Tier 1 only |
| Key Vault secret values, connection strings, certificates | Trust boundary |
| Kudu / SCM / VM disk / AKS ConfigMap crawl | Security review; false positives |
| Flow logs / App Insights map as architecture arrows | Observed ≠ declared |
| Mint Fabric / Power BI / Databricks nodes when ARM type is absent | SN-DF empty-stage honesty |
| Stamp TLS 1.3 or Confidential from inventory | No source |
| Promote hostname-only or RBAC-only to ObservedFact / “confirmed dependency” | Probable / Inferred only |
| `terraform apply` / ARM writes / write roles | Plane §2 |
| `IFindingEngine` coverage engines | `HOLD_NO_COVERAGE_ENGINES.md` |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **AX-DE-01–18** and the plane.
