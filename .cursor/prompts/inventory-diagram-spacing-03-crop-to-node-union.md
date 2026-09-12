# IDS-03 — Crop the camera to the union of node boxes

**Wave:** inventory-diagram-spacing (**IDS**). **Depends on:** none (viewer-only; works with or without IDS-01/02). **Do not** implement IDS-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The inventory / architecture mermaid camera must follow the **union of `g.node` bounding boxes** (plus modest padding). Mermaid's source `viewBox` remains the fallback when that union is missing or incomplete. Empty padding around a corner-hugging node must not survive as a white sea.

## Why

IDL-04 made Mermaid's emitted viewBox authoritative and allowed measured crop only when measured ink was:

1. inside the source,
2. ≥ 60% of source width **and** height,
3. **flush with all four source extents** (`measuredCoversSourceExtents`).

(3) means measured ≈ source. The 60% rule plus flush-extents **disabled tightening** for the case IDL-04's own example claimed to allow (source `4000×3000`, measured `1500×1100` is 37% of width — would keep source).

Owner screenshot: one readable node on the **right** of a large empty canvas. That is a padded source viewBox (basis-curve bbox + disconnected-component plate) that failed the flush test, so the camera kept the empty plate. IDL-03's min-fit-scale then scrolled that plate at ≥ 11 px labels.

IDS-01 (linear curves) shrinks edge-path inflation; IDS-02 packs components. This prompt still has to drop leftover Mermaid padding. **Do not include `.edgePath` in the union** — path bbox is what inflated the plate.

## Context

- `archlucid-ui/src/lib/help/help-mermaid.ts` — `resolveMermaidInkViewBox`, `readMermaidInkBBox`, `readMappedNodeInkBBox`, `ensureMermaidInkViewBox`, `MERMAID_SOURCE_VIEWBOX_ATTR`
- `archlucid-ui/src/lib/help/help-mermaid.test.ts` — existing IDL-04 tests (clipped 866×206 must **still** reject a *partial* measured box that is not the node union)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — mermaid path only
- `archlucid-ui/src/components/help/MermaidDiagram.tsx` — help width-fill; **must not change**

## What to build

1. Add `resolveMermaidNodeUnionViewBox(sourceViewBox, nodeUnion, nodeCount, expectedNodeCount, paddingPx)` (own export, or extend `resolveMermaidInkViewBox` with an explicit `nodeUnion` + `measuredAllNodes` flag). Rules:
   - If `nodeUnion` is null, or `nodeCount !== expectedNodeCount`, or `expectedNodeCount === 0` → return **source** (or today's no-source measured fallback). Comment: a union that missed a `g.node` would clip a row the way IDL-04 feared.
   - If `nodeUnion` sits **inside** source (with a 1 px tolerance) → return `nodeUnion` inset by `paddingPx` on each side (x/y minus pad, width/height plus 2×pad). **No 60% test. No flush-extents test.**
   - If `nodeUnion` extends outside source → **source** (mis-mapped CTM, same as IDL-04).
   - Keep the old 60% + flush path only as a fallback when a non-node `measuredInk` is supplied without a per-node union (legacy `readMermaidInkBBox` group box). Inventory mermaid viewport must pass the per-node union.
2. `ensureMermaidInkViewBox` on the **viewport** path: query `g.node` (or `[id^="flowchart-"][class~="node"]` — use whichever the live SVG uses; assert in the test DOM). Union their user-space boxes via the existing `mapLocalBBoxToSvgUserSpace`. Pass `expectedNodeCount = svg.querySelectorAll("g.node").length`.
3. Padding: reuse the existing `paddingPx` argument (callers pass 12). Do not invent a second pad.
4. Cache: still `mermaidInkViewBoxBySvg`; `resetMermaidSvgViewportInkCache` remains required on new SVG insert (IDL-04). Do not re-crop on zoom (IDL-03 zoom is pixel size only).
5. Tests (fail on master, pass after):
   - Source `0 0 4000 800`, node-union `2800 40 900 120`, 11/11 nodes → crop to union + padding (ink on the right of a padded plate **is** tightened). This is the owner screenshot.
   - Source `0 0 1144 322`, measured *group* box `119 54 866 206` **without** a 11-node union → still **source** (IDL-04 clipped-grid fixture must not regress).
   - Node-union that drops a node (`nodeCount 10`, `expected 11`) → source.
   - Node-union outside source → source.
   - `fitMermaidSvgElementToViewport` with a jsdom SVG: source viewBox huge, 11 node rects clustered in the top-right → fitted `viewBox` is the union, `fitScale` closer to 1, `overflows` false or modest.
   - Help `fitMermaidSvgElementToHost` tests unchanged.

## Acceptance criteria

- Owner-shape plate: default zoom shows the node cluster, not a white sea with one node on the right edge of the viewBox.
- IDL-04 clipped-grid regression still fails if someone passes a partial group bbox as the union.
- Help-topic mermaid tests green.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change zoom clamps (IDL-03). **Do not** change Mermaid init (IDS-01). **Do not** touch backend.
- **Do not** add dependencies.
- TB-645 vocabulary. Sentence case.
- Verification: from `archlucid-ui/`, `npx vitest run src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx`. No full build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
