# IDA-HOLD — No Microsoft icons, no nested frames, no gap retune

**This prompt is not implementation.** Paste only if a session starts official Azure product icons, nested VNet/subnet cluster rects, another Mermaid `nodeSpacing` pass, Graphviz `dot` as default, elk/React Flow for inventory, or RG frames **without** IDA-08’s pack-first / no-overlap / singleton-caption rules.

Follow [`.cursor/prompts/inventory-diagram-aesthetics-00-index.md`](inventory-diagram-aesthetics-00-index.md) global constraints.

## Goal

Keep IDA as **Carbon-like forest chrome** on the existing `DiagramAst` → inventory-forest spine. Recognizability comes from original pictograms + accent bars + RG frames, not from a second collector or a Microsoft CDN.

## Why

`DiagramInventoryPictogramSvgEmitter` is **explicitly not Microsoft artwork**. Shipping Azure architecture icons is a **license and brand** decision, not an engineering default. Nested subscription → RG → VNet → subnet frames is a second layout engine (IDR-HOLD already said so). IDT/IDG forbids another dagre gap pass. React Flow is used for evidence graphs, not inventory.

## Do not implement (ever from IDA sessions)

| Temptation | Hold |
|-----------|------|
| Microsoft Azure product icons / `IMG` from a static Azure icon pack | Licensing; IDA-02 accents are the allowed color cue |
| Nested VNet / subnet / NIC frames inside RG boxes | Recursive cluster packer; out of IDA-08 |
| Draw RG rects on the **current** connected-component grid without packing | Overlap; that is why IDR-HOLD exists |
| Undo `FlattenSparseSubgraphs` so Mermaid “shows RGs” | Empty-box regression |
| Restore `alpack_*` | Mermaid 11 LR flip |
| Another `nodeSpacing` / `rankSpacing` / `padding` pass | IDG hold; not the aesthetic failure |
| Default engine Graphviz `dot` | Layered spread; `fdp` remains fallback |
| elk / svg-pan-zoom / React Flow inventory canvas | Different product surface |
| Extractor DOT / ARM `dependsOn` as architecture arrows | Plane; **IE-RF-12** |
| Desktop review tabs behind **More** | workspace rule |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Honey `#D4A84B` “brand” fill returning as a theme | Attention color; IDA-01 retired it |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IDA-01–IDA-12**. For icons, write a one-paragraph owner question (license source, dark-mode variants, PNG export) — do not download icon SVGs.

## Done when

The hold is written. No code from this file.
