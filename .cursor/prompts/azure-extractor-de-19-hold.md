# AX-DE-HOLD — no secrets, no Kudu, no hosted POST, no fake consumers

**This prompt is not implementation.** Paste only if a session starts secret harvest, Kudu/SCM scrape, hosted POST, diagram-time Azure HTTP, minting Fabric/Power BI, ARM `dependsOn` arrows, or a second collector.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

Library copy: [`docs/library/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md`](../../docs/library/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_HOLD.md).

## Goal

Keep diagram enrichment inside the existing extractor → snapshot → `DiagramAst` spine.

## Do not implement (ever from AX-DE sessions)

| Temptation | Hold |
|-----------|------|
| Second ZIP collector | Plane §1 |
| `Export-AzResourceGroup` / `dependsOn` | IE-RF-12 |
| GET every resource id | Type-scoped lists |
| Azure HTTP at render | Snapshots only |
| Hosted `config/list` / Cost / Policy Insights POST | GET-only hosted; AX-DE-18 is Tier 1 |
| Secret values / connection strings / certificates | Trust boundary |
| Kudu, VM disk, AKS ConfigMap crawl | Out of inventory plane |
| Flow logs / App Insights map as architecture | Observed ≠ declared |
| Fake Databricks / Fabric / Power BI nodes | Empty stage is honest |
| TLS 1.3 / Confidential badges from ARM | No source |
| Promote hostname or RBAC to ObservedFact | May access / Likely connected |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop tabs behind **More** | workspace rule |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **AX-DE-01–18** and the plane.

## Done when

The hold is written. No code from this file.
