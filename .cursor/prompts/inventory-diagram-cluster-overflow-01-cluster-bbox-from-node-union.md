# IDF-01 — Cluster bounding box from member-node union

**Wave:** inventory-diagram-cluster-overflow (**IDF**). **Depends on:** trunk. **Do not** re-run IDL / IDS / IDT / IDH / IDG / IDR. **Do not** pack forest by resource group.

Do not implement from the wave index. Implement only *What to build*.

## Goal

After inventory/architecture SVG labels are final, every **existing** cluster frame (`g.cluster` rect or polygon) must fully enclose its member nodes in SVG user space, including a node whose auto-truncated label is wider than same-rank siblings.

Do **not** invent new forest RG frames. Do **not** move nodes. Do **not** change `fdp` / dagre spacing.

## Why

Owner 2026-09-16 Executive inventory diagram: nested dashed swimlane; rightmost node `avd01 pner nonprod persistens...` sticks out of the box. Graphviz `fdp` draws cluster polygons from an approximate bb (clusters are a `dot` feature). Mermaid `flowchart.padding` is 6 and post-render SVG text can be wider than dagre’s measured width. The camera already crops to **node** ink (`overflow: visible`), so the lie is the frame, not a clipped node.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — `replaceMermaidForeignObjectLabelsWithSvgText` / `sanitizeArchitectureDiagramSvg` already run on **both** client Mermaid SVG and `layoutSvg` (Graphviz or forest). Forest has `g.node` and **no** `g.cluster` — a cluster rewrite must no-op there.
- `archlucid-ui/src/lib/help/help-mermaid.ts` — `mapLocalBBoxToSvgUserSpace`, `queryInventoryDiagramNodeElements` (`g.node` and `g[id^="node"]`). **Do not** use unmapped `g.node.getBBox()` (local to translate).
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` — emits `subgraph cluster_*` with only `label=`; do **not** “fix” this by switching `layout=dot` or bumping `sep`.
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts` — `padding: 6`; do **not** retune spacing as the fix.
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `[&_svg_.cluster_rect]` CSS; host already sets SVG overflow visible.
- Owner shape: Executive, always-show tiers on, nested RG/VNet clusters, one wide ellipsized label in the rightmost column.

## What to build

1. Add a pure function (own file under `archlucid-ui/src/lib/architecture/`, e.g. `fit-inventory-diagram-cluster-frames.ts`) that takes SVG markup (string) **or** a parsed `svg` element and:
   - Finds `g.cluster` (Mermaid and Graphviz). Skip packing leftovers whose id/class contains `alpack` if any remain.
   - Walks **innermost first** (clusters with no descendant `g.cluster` first, then parents).
   - For each cluster, collects member ink: descendant nodes via `queryInventoryDiagramNodeElements` that are **inside this cluster group** and not inside a **nested** `g.cluster` (parent frames also union **child cluster shapes** after those children were fitted).
   - Maps each member box with `mapLocalBBoxToSvgUserSpace` (or the same CTM pattern if the helper stays in `help-mermaid.ts` — import it; do not copy a broken `getCTM` mix).
   - Builds the axis-aligned union, then **pad ≥ 8px** on all sides. Add extra top pad so a cluster-label (`text` / `.cluster-label`) is not covered (measure the label box if present; otherwise ≥ 16px top).
   - Writes the frame:
     - Mermaid: `g.cluster > rect` (and `path` if that is the outline) — set `x`, `y`, `width`, `height` in **the rect’s local space** (inverse of the cluster group transform), not raw user-space numbers dumped onto a translated group.
     - Graphviz: `g.cluster > polygon` (sometimes `path`) — rewrite `points` to the padded rectangle in the polygon’s local space.
   - No-op when there are no clusters, no member nodes, or union is degenerate. Do not throw.
2. Call it from `replaceMermaidForeignObjectLabelsWithSvgText` **after** foreignObject replacement, `wrapExistingNodeSvgLabels`, and `growNodeRectToFitLabelLines`, **before** serialize. That way Graphviz `layoutSvg` and Mermaid share one pass.
3. Tests (Vitest, jsdom; stub `getBBox` / `getScreenCTM` the same way `help-mermaid.test.ts` / `ArchitectureDiagramViewer.test.tsx` already do):
   - **Owner overflow:** cluster `rect`/`polygon` width 120; member node at local x=80 width=70 (right edge past the frame); truncated label text `avd01 pner nonprod persistens...`. After the pass, cluster right edge ≥ node right + pad. Node `transform` / node rect size **unchanged**.
   - **Nested:** inner cluster fitted first; outer cluster contains the inner frame and a direct sibling node.
   - **Forest / no clusters:** SVG with only `g.node` (inventory-forest shape) is byte-stable aside from serializer whitespace.
   - **Probe:** skip the rewrite (test helper or `describe` with the function not applied) — the overflow fixture **fails** the containment assertion; with the function it passes.
4. Do **not** edit DOT `layout=`, `sep`, or `K`. Do **not** edit `ARCHITECTURE_DIAGRAM_MERMAID_PADDING` as the fix. Do **not** add RG packing to `DiagramForestLayoutSvgRenderer`. Do **not** change Export Mermaid. PNG: if Download PNG still rasters Graphviz SVG **before** this sanitizer, either run the same rewrite on that SVG in this prompt (small C# port only if the PNG path already sanitizes in-process) **or** leave PNG as residual and name it in the PR — do not silently ship a lying PNG.

## Acceptance criteria

- Owner-shape clustered Executive canvas: every member node box (including the wide `...` node) lies strictly inside its parent cluster outline after pad.
- Nested VNet/RG frames still nest; inner frame does not clip inner nodes; outer frame contains inner frame.
- Inventory-forest canvases without clusters look the same.
- Reverting the rewrite fails the overflow fixture.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** use `ghost` / `link` `Button` variants.
- **Do not** start IDR forest bounding boxes / pack-by-RG / flatten rewind.
- **Do not** switch inventory layout default from `fdp` to `dot`.
- TypeScript: no inline imports; exhaustive `switch` with `never` if you switch on shape kind.
- Verification: `cd archlucid-ui && npx vitest run` on the new test file plus `src/lib/architecture/architecture-diagram-svg.ts` tests if you extend them. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build, no `next dev` unless you must screenshot — this prompt is fixture-provable.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
