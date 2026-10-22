# IDG-HOLD — No extractor DOT, no ARM dependsOn architecture, no second collector

**This prompt is not implementation.** Paste only if a session starts emitting Graphviz from PowerShell, ARM template export, `dependsOn` as architecture arrows, or a second Azure harvest “for diagrams.”

Follow [`.cursor/prompts/inventory-diagram-graphviz-00-index.md`](inventory-diagram-graphviz-00-index.md) global constraints.

Library copy: [`docs/library/INFRA_EVIDENCE_GRAPHVIZ_LAYOUT_HOLD.md`](../../docs/library/INFRA_EVIDENCE_GRAPHVIZ_LAYOUT_HOLD.md).

## Goal

Keep Graphviz as a **layout renderer on `DiagramAst`**. Collection stays Resource Graph + type-scoped ARM lists → snapshot → graph → AST.

## Why

Owner advice that said “ARM/Bicep → edges → DOT” is the wrong source. `dependsOn` is a deploy DAG. The extractor already delivered the 11 VNets and 6 peerings. Layout is not a harvest problem. **IE-RF-12** still holds.

## Do not implement (ever from IDG sessions)

| Temptation | Hold |
|-----------|------|
| `Get-ArchLucidAzurePackage.ps1` writes `.dot` | Extractor stays evidence ZIP; DOT is a server renderer |
| `Export-AzResourceGroup` / live ARM export as diagram source | **IE-RF-12** |
| `AppGateway -> WebVM` from `dependsOn` | Deploy order, not topology |
| Second ZIP / second collector for Graphviz | Plane: one collector family |
| Azure HTTP at diagram render time | Append-only snapshots |
| Graphviz `dot` (layered) as the default engine | Same forest-spread as dagre; this wave is **`fdp`** |
| Another Mermaid `nodeSpacing` / `rankSpacing` pass | Already 16/20/6; not the failure |
| elk / svg-pan-zoom “just for layout” | Out of this wave |
| Desktop review tabs behind **More** | workspace rule |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IDG-01–IDG-05**. Do not generate DOT from ARM “just for diagrams.”

## Done when

The hold is written. No code from this file.
