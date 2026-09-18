# IDLC-HOLD — No IDT gap rewind, no htmlLabels, no RG boxes, no hidden hint

**This prompt is not implementation.** Paste only if a session starts loosening mermaid `nodeSpacing` / `rankSpacing`, sets `flowchart.htmlLabels: true`, draws resource-group frames, restores `alpack_*`, or deletes / `sr-only`s the stacked zoom hint to hide overlap.

Follow [`.cursor/prompts/inventory-diagram-label-collision-00-index.md`](inventory-diagram-label-collision-00-index.md) global constraints.

## Goal

Keep IDLC as **label geometry and sanitizer honesty**. Cluster titles get their own class, band, and Graphviz margin. Forest name + RG stay two lines. The zoom hint stays visible and accurate.

## Why

IDT-01 already set owner-tight `16/20/6`. Raising plate padding to make room for titles undoes that wave and reopens the white-sea complaint. `htmlLabels: true` reintroduces `foreignObject` (DOMPurify strips them; PNG export taints). RG bounding boxes are IDR-HOLD. Hiding the hint violates IDV-04 (Ctrl+scroll / focus-first must remain true).

## Do not implement (ever from IDLC sessions)

| Temptation | Hold |
|-----------|------|
| Set `ARCHITECTURE_DIAGRAM_MERMAID_PADDING` / nodeSpacing / rankSpacing back to `28/32/10` or higher | IDT-01; not the failure |
| `htmlLabels: true` | FO stripped; empty boxes; canvas export |
| Bounding rects by `ArmResourceGroup` | IDR-HOLD; packing is by connected component |
| Restore `alpack_*` packing subgraphs | Mermaid 11 LR flip; IDH deleted them |
| Undo `FlattenSparseSubgraphs` so more clusters “show titles” | Empty-box regression |
| `sr-only` the stacked hint or delete `ARCHITECTURE_DIAGRAM_VIEWPORT_HINT` | IDV-04 honesty |
| Prefer Graphviz-primary Full subscription to get cluster chrome | Forest-first; IDG hold |
| Extractor / ARM `dependsOn` / second collector | Plane; **IE-RF-12** |
| Desktop review tabs behind **More** | workspace rule |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IDLC-01–IDLC-04**. Do not ship overlapping titles as “fixed” by hiding the hint.

## Done when

The hold is written. No code from this file.
