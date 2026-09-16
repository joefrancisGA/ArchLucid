# IDR-HOLD — No resource-group bounding boxes, no RG packing, no flatten rewind

**This prompt is not implementation.** Paste only if a session starts drawing RG frames on the forest canvas, packing by resource group, preferring Graphviz clusters for Full subscription, or undoing sparse swimlane flatten.

Follow [`.cursor/prompts/inventory-diagram-rg-caption-00-index.md`](inventory-diagram-rg-caption-00-index.md) global constraints.

## Goal

Keep IDR as **captions on cards**. Membership becomes readable on the existing four-column forest. Layout and subgraph painting stay as they are.

## Why

Owner asked for resource groups as bounding boxes, then asked for the **easiest** helpful slice. Forest packing is by connected component, not RG. Boxes on the current grid would overlap and lie. Nested subscription → RG → VNet → subnet frames are a second layout engine. Sparse flatten (Executive / Network / Data / Identity, threshold 8) exists because Mermaid empty swimlanes were unreadable. IDG already chose forest-first with Graphviz fallback — do not invert that to get clusters. Pack-then-frame is **IDA-08**.

## Do not implement (ever from IDR sessions)

| Temptation | Hold |
|-----------|------|
| Bounding rects around current node positions by `ArmResourceGroup` | Positions are not RG-clustered; frames would overlap |
| Forest pack-by-RG + `g.subgraph` frames | **IDA-08**, not an IDR chat |
| Nested VNet/subnet cluster rects | Recursive cluster packer; out of IDR |
| Prefer `graphviz-fdp` for Full subscription so DOT `cluster_rg` shows | Hundreds of nodes; forest exists because owner layout was already hard |
| Undo `FlattenSparseSubgraphs` so Mermaid subgraphs “show RGs” | Empty-box regression on Executive/Network/Data/Identity |
| Restore `alpack_*` packing subgraphs | Mermaid 11 LR flip; IDH deleted them |
| Another `nodeSpacing` / camera pass “so RGs fit” | Not the failure |
| Extractor / ARM `dependsOn` / second collector | Plane; **IE-RF-12** |
| Desktop review tabs behind **More** | workspace rule |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IDR-01–IDR-03**. For pack-then-frame, paste **IDA-08** in a **new** IDA session. Do not ship overlapping boxes as a demo.

## Done when

The hold is written. No code from this file.
