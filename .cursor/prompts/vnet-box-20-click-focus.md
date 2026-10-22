# VN-20 — Click a card to dim the rest of the plate

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-08 and VN-19. Do not re-run VN-01 through VN-19.

## Goal

On a forest inventory diagram, clicking a resource card dims every other card, frame, and connector except that card, the virtual network that contains it, the resource-group frame that contains it, and the resources one connector away. The camera stays where it is.

## Why

Full subscription and Network plates are dense. `focusNodeIds` already zooms the camera to a dependency-neighborhood seed from the outline. A reader who is already looking at the plate needs to see one resource's neighborhood without leaving the page or changing the zoom.

## Read first

- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`layoutSvg`, `focusNodeIds` is camera fit only)
- `archlucid-ui/src/lib/architecture/architecture-diagram-camera-focus.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the `ArchitectureDiagramViewer` call, `visibleMermaidOutline`, `cameraFocusNodeIds`, `handleOutlineFocusNeighborhood`)
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts` (`InfraEvidenceMermaidOutline`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` (`sanitizeArchitectureDiagramSvg`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` (`g.node` id `node-{sanitizedId}`, `transform` is applied by the renderer)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs` (`g.vnet-frame` and `data-frame-id`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs` (`g.rg-frame`, `data-frame-cell-id`, plate rect class `rg-frame-plate`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` (`g.edge` has a title and no endpoint ids)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (edge loop and private-endpoint bundle)

## What to build

This is a diagrams-page interaction on the forest SVG. Do not change placement, gap constants, private-endpoint bundling, the cross-group fan-out checkbox, or same-group `likely` lines.

### Endpoint ids on painted edges

While painting the forest SVG, after each `g.edge` is created, set attributes. Do not rewrite the diagram AST, the Mermaid text, or the Graphviz DOT.

- A normal edge gets `data-from` and `data-to`. Each value is `MermaidIdSanitizer.Sanitize` of that end's node id.
- A bundled `private endpoint × N` edge gets `data-bundle-from` and `data-bundle-to` instead. Each value is the space-separated sanitized ids of the bundled edges' from-nodes and to-nodes, in ordinal order, with duplicates removed. Keep the bundled label and the lock.

`sanitizeArchitectureDiagramSvg` must leave `data-from`, `data-to`, `data-bundle-from`, and `data-bundle-to` in place. If DOMPurify strips them, allow only those four attributes.

### Kept set

Add a pure function, in its own file next to `architecture-diagram-camera-focus.ts`, that returns the kept node ids, the kept frame ids, and whether each painted edge stays bright.

Inputs are the clicked node id, the outline when present, and a list of painted facts the viewer reads from the SVG:

- Each `g.node`: id with the `node-` prefix removed, center point.
- Each `g.vnet-frame`: `data-frame-id`, rect (`x`, `y`, `width`, `height` on its first `rect`). The node id in that frame id is the text after the `vnet-` prefix.
- Each `g.rg-frame`: `data-frame-cell-id`, rect on `rect.rg-frame-plate`.
- Each `g.edge`: `data-from` / `data-to`, or `data-bundle-from` / `data-bundle-to`.

Read a node center from `transform="translate(x,y)"` plus the `rect.node-card` width and height: center x is translate x plus half the width, center y is translate y plus half the height. A center is inside a rect when it lies on the closed rectangle. Do not require `getBBox`.

Match ids the way `inventoryDiagramNodeElementMatchesFocusId` already normalizes tokens, so the SVG id and the outline id still meet when punctuation differs.

Kept nodes:

1. The clicked node.
2. The other end of every outline edge whose `from` or `to` is the clicked node. When the outline is absent, use the same one-hop read from `data-from` / `data-to`, and from each id in `data-bundle-from` / `data-bundle-to`.
3. Every painted node whose center lies inside a kept `vnet-frame`.

Kept frames:

- The `vnet-frame` whose rect contains the clicked node's center, when there is one.
- The `rg-frame` whose plate contains the clicked node's center, when there is one.
- A `vnet-frame` whose `vnet-` node id is a kept node. Clicking a Key Vault whose outline edge names the virtual network therefore keeps that virtual-network box and the painted cards inside it. The frame-anchor id is a kept endpoint id for edge matching. Do not paint a card for it.

A normal edge stays bright when both `data-from` and `data-to` are kept node ids. A bundled edge stays bright when at least one `data-bundle-from` id is kept and at least one `data-bundle-to` id is kept. Every other edge is dim.

### Viewer

Pass `visibleMermaidOutline` into `ArchitectureDiagramViewer` as an optional outline prop. Apply click-focus only when `layoutSvg` is set.

After the sanitized SVG is in the DOM, a click on `g.node` sets focus to that card. A second click on that same card clears focus. A click on the SVG that is not inside a `g.node` clears focus. Escape clears focus when the event target is not an `input`, `textarea`, or `select`. Clicking a dimmed card replaces the focus with that card. Leave dimmed cards clickable.

Dim by adding the class `diagram-click-dim` on the live DOM to each `g.node`, `g.edge`, `g.vnet-frame`, and `g.rg-frame` that is outside the kept set. Style that class at opacity `0.15`. Do not remove elements. Do not dim `g.legend`. Do not write the class or the opacity into the SVG string given to PNG export.

Show a status line, `data-testid="diagram-click-focus-status"`, with the text `Showing connections for {name}.` The name is the clicked node's `<title>` text, without a trailing ` — Private endpoint access`. Hide the line when focus is clear.

Clear click-focus when `layoutSvg` changes.

Leave `focusNodeIds`, `focusNonce`, zoom, and scroll unchanged. Leave `handleOutlineFocusNeighborhood` as the seed path that switches to the dependency neighborhood.

## Tests

1. Pure function. Clicked node `b` with outline edges `a → b` and `b → c` keeps `a`, `b`, and `c`. A fourth node with no edge is not kept.
2. Pure function. Clicked node `vm` has no outline edge to `nic`, and both centers lie in the same `vnet-frame`. Both stay kept, and that frame id is kept. A node outside the frame with no edge is not kept.
3. Pure function. Clicked node `vault` has one outline edge to `vnet-a`. The `vnet-frame` id is `vnet-vnet-a`. The frame and a painted member whose center is inside it stay kept. A bundled edge whose `data-bundle-from` contains `vault` and whose `data-bundle-to` contains `vnet-a` stays bright. A second bundle to `vnet-b` stays dim.
4. `ArchitectureDiagramViewer` with `layoutSvg`. Click one `g.node`. An unrelated `g.node` gains `diagram-click-dim`. The status line names the clicked card. Escape removes the class and the status line. A second click on the same card also clears. The SVG `viewBox` is the same after the click as before it.
5. Forest SVG. A normal edge has `data-from` and `data-to`. Three `private endpoint` edges from one resource group to one VNet still paint one `private endpoint × 3` title, and that edge's `data-bundle-from` lists all three targets.

## Acceptance criteria

- Clicking a card dims the unrelated cards, frames, and connectors and leaves the clicked card, its virtual network, its resource-group frame, and one-hop resources at full opacity.
- Clicking a private-endpoint target brightens the virtual network that connector names, including the painted cards inside that box, and the bundled line.
- Escape, a second click on the same card, or a click on empty canvas restores the plate.
- Camera zoom, seed focus, placement, bundling, and the extractor stay as they are.
- PNG export SVG does not contain `diagram-click-dim`.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests` and the Vitest files for the new helper and `ArchitectureDiagramViewer`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- Do not wrap a VNet neighborhood onto a second row. Do not hide same-group `likely` edges.

## Done when

Clicking one card on a Full subscription forest plate dims the rest, keeps that card's virtual network and one-hop connectors bright, and leaves the camera where the reader had it.
