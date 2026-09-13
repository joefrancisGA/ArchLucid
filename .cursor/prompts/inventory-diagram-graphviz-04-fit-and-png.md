# IDG-04 — Fit Graphviz SVG in the inventory viewport and match PNG export

**Wave:** inventory-diagram-graphviz (**IDG**). **Depends on:** IDG-03. **Do not** implement IDG-05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Graphviz SVG in the Inventory diagrams viewport must use the same **camera** as Mermaid: contain-fit, 11 px label floor, isotropic zoom, crop to **node-union** (not a padded empty plate). Inventory **Export PNG** must rasterize the **Graphviz** layout (`fdp -Tpng` or SVG→PNG), not a second dagre pass via mermaid-cli, when `LayoutEngine` is `graphviz-fdp`.

## Why

`fdp` usually emits a tight viewBox, but Graphviz can still pad. The owner screenshot is a camera + layout failure; once layout is Graphviz, the camera must not resurrect a white sea. PNG that still goes through mermaid-cli would disagree with the canvas.

## Context

- `archlucid-ui/src/lib/help/help-mermaid.ts` — `fitMermaidSvgElementToViewport`, `resolveMermaidNodeUnionViewBox`, `g.node` union. Graphviz SVG also uses `g.node` in stock SVG output — **verify** against a real `fdp -Tsvg` fixture; if the class differs, query a documented fallback (`g[id^="node"]`) in one helper, not a copy-paste of the whole camera.
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` — `ExportMermaidPng`
- `ArchLucid.Application/Diagrams/MermaidCliDiagramImageRenderer.cs` — keep for Mermaid-only exports
- IDG-02 renderer — add `RenderPngAsync` or `-Tpng` next to SVG

## What to build

1. Viewport: after inserting Graphviz SVG, call the same `fitMermaidSvgElementToViewport` (rename only if the name is a lie — a shared `fitInventoryDiagramSvgElementToViewport` in `help-mermaid.ts` or a new `inventory-diagram-svg-viewport.ts` **own file** if you must generalize). Reset ink cache on new SVG insert.
2. Node union: if Graphviz wraps nodes without `class="node"`, map them so the union crop still runs. Incomplete union → keep source viewBox (IDS-03 rule: never clip a missing node).
3. PNG: when inventory export runs and layout was Graphviz, render PNG from the same DOT (or from sanitized SVG) so connectors match the canvas. When Graphviz is down, keep mermaid-cli PNG from the Mermaid string (honest fail-soft).
4. Tests:
   - Vitest: Graphviz-like SVG with 11 `g.node` clustered vs a padded viewBox → fitted viewBox is the union; default fit does not leave a 4× empty plate.
   - Application: PNG export uses Graphviz renderer when `LayoutEngine` is graphviz-fdp (mock).
   - Help-topic mermaid width-fill path **unchanged**.
5. Do **not** change zoom percent meaning (IDL-03: 100% = fitted base).

## Acceptance criteria

- Owner-shape Graphviz SVG at default zoom shows the node cluster, not one node on the right of a white sea.
- Export PNG for that snapshot matches Graphviz layout when `fdp` succeeded.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** retune Mermaid init constants. **Do not** add svg-pan-zoom.
- Verification:
  - `cd archlucid-ui && npx vitest run src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx`
  - `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaid'`
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
