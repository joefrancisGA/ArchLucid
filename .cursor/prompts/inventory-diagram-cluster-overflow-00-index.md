<!-- Inventory-diagram cluster overflow — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-16 owner screenshot on SecureNow Inventory
     diagrams (Executive): a truncated-label node sticks out of its dashed
     swimlane bounding box. Do not implement from this index. -->

# Inventory-diagram cluster overflow — Composer prompt (IDF-01)

ArchLucid sells a **seat for a repeat professional**. A swimlane that does not enclose its nodes is a lying diagram: the operator cannot trust which resources belong to which group.

**Do not implement from this index.** Paste **`.cursor/prompts/inventory-diagram-cluster-overflow-01-cluster-bbox-from-node-union.md`** in a Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_CLUSTER_OVERFLOW_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_CLUSTER_OVERFLOW_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDL / IDS / IDT / IDH / IDG / IDR.** Do **not** start forest pack-by-RG (that is still **IDR-HOLD**). This wave only **repaints existing cluster chrome** so it contains member nodes.

## Diagnosis (locked — do not re-diagnose)

Owner screenshot (2026-09-16): Inventory diagrams, mode **Executive**, snapshot captured 9/10/2026 (424 resources, id `bebca1ae-9fba-408a-99ce-2794678c4281`). All four **Always show on Executive diagrams** tiers checked. Status: **61 resources in 55 connected components. 31 visible relationships.** Nested dashed swimlanes. Rightmost-column node **`avd01 pner nonprod persistens...`** (auto-truncated label) sticks out of the parent dashed rectangle. Shorter siblings in that column (`avd01-002`, `vm bam-ppd-01`) sit on or inside the same edge.

### Which engine painted the boxes

Inventory-forest (`DiagramForestLayoutSvgRenderer`) **does not emit cluster rects** (IDR-HOLD). The screenshot has nested dashed frames, so the canvas is **Graphviz `fdp` clusters** (fallback when forest SVG is absent) and/or **client Mermaid subgraphs**. Walkthrough “connected components” counts AST topology; it does not name the paint engine.

Graphviz default cluster chrome is a **dashed** polygon. Mermaid 11 `g.cluster > rect` is a solid stroke unless CSS dashes it. The owner frame is dashed → treat **Graphviz `cluster_*`** as the primary live path, and still fix **Mermaid `g.cluster`** because `sanitizeArchitectureDiagramSvg` paints both.

### Causal chain (locked)

1. **Subgraphs survived flatten.** Executive + always-show tiers produced ~61 nodes. `FlattenSparseSubgraphs` (threshold 8) only flattens when there are many *empty* swimlanes. Few RGs with many members, or **Region ** swimlanes (IDL-05 exemption), keep Subscription → RG → VNet frames in the AST. `DiagramSubgraphPlanner` still nests VNets under `RG {name}`.
2. **DOT emits clusters that `fdp` does not layout.** `DiagramAstGraphvizDotEmitter` writes `subgraph cluster_{id} { label=...; nodes; children }` with **no `margin` / `pad` / `bb`**. `GraphvizDotEmitOptions` sets `layout=fdp`, `sep`, `K`, `pack` — those separate *graphs*, not cluster interiors. Graphviz documents clusters as a **`dot`** feature. `fdp` still *draws* a dashed box from an approximate bb that **misses the widest member**.
3. **The overflowing node is wider than its column.** `formatArchitectureDiagramCanvasLabelLines` / `DiagramInventoryNodeCanvasLabelFormatter` ellipsize auto-generated Azure names onto **one long `...` line** instead of wrapping. That line is still wider than short neighbors (`avd01-002`). Cluster bb was computed from typical/layout width, not this node’s painted width.
4. **Mermaid path has the same class of bug.** `flowchart.padding = 6` is the cluster pad. After render, `replaceMermaidForeignObjectLabelsWithSvgText` + `[&_svg_.nodeLabel]:text-[15px]` can make SVG text (and the visual node) wider than dagre’s measured width. `growNodeRectToFitLabelLines` grows **height only**. Cluster rects are never recomputed. `g.node` `getBBox` is **local to a translated group** (IDC-02); unmapped boxes crop or miss ink.
5. **Camera crop prefers node union** (`readMappedNodeInkBBox`) and SVG `overflow: visible`, so the node stays on screen **outside** the lying box. The operator sees a resource that is not inside its group.

**Signature:** clustered inventory canvas (Graphviz `g.cluster` polygon or Mermaid `g.cluster rect`) whose right (or bottom) edge is left of a member `g.node` box; the overflowing node’s label is a truncated single line (`...`) wider than same-rank siblings.

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Honest frames** | Layout-engine cluster bb (fdp/dagre) | Cluster shape = user-space union of member node boxes + pad, after labels are final | IDF-01 |

## What this set does *not* change

Keep: inventory-forest packing by connected component (no new forest frames). Sparse flatten. Region exemption. Graphviz `fdp` as fallback engine (do **not** switch the default to `dot`). Export Mermaid text. Outline tables. IDR captions. Help-topic `MermaidDiagram` width-fill.

Do **not** retune `nodeSpacing` / `rankSpacing` / wrappingWidth. Do **not** force uniform node widths as the fix. Do **not** pack forest by RG. Do **not** hide desktop review workspace tabs.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-cluster-overflow-01-cluster-bbox-from-node-union.md` | Cluster chrome does not enclose the widest truncated-label member |

Suggested Cloud Agent branch: `cursor/inventory-diagram-cluster-bbox-e579`. Implementation uses a **new** feature branch. This prompt-set PR may live on `cursor/inventory-diagram-cluster-overflow-prompt-e579`.

## After the prompt

Summarize: files changed, tests run, whether a fixture with a wide `...` node inside a too-narrow cluster now has the cluster containing every member box, residual risk (PNG if still Graphviz-raw).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused Vitest from `archlucid-ui/` named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
