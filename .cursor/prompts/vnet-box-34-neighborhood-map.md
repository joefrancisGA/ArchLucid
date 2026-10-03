# VN-34 — Full subscription opens as a map of neighborhoods

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-32 and VN-33. Do not re-run VN-01 through VN-33. Do not restore the VN-25 through VN-31 overview caption layer.

## Goal

On Full subscription and Network, a large diagram opens as a map of neighborhood tiles whose text stays readable. Clicking a tile opens that neighborhood on the existing forest plate, fitted by the VN-32 zoom rule. The full plate, the 60% floor, and the PNG export stay as they are.

## Why

VN-33 made the plate about 1.6:1. VN-32 stopped the viewer at 60%. On `Hmd_HI_HAP_Non_Prod` the plate still holds on the order of 150 cards. Any zoom that shows the whole plate paints card text at a few pixels. At 60% the reader sees about a quarter of the plate and pans. Moving boxes cannot change that. The layout already knows the neighborhoods: each VNet plus the resource groups seated beside it, a resource group shared by two VNets, and the leftover groups. The reader needs those neighborhoods as tiles, and the existing plate as the detail of one tile.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `VnetPrimaryGroup`, `VnetRemainderCell`, `BuildVnetPrimaryPlacements`, `ResolveWinningVnet`, `ResolveSharedVnetPair`, `IsVnetPrimaryTitle`, `EmitSvg`, `ResolvePrivateEndpointBundles`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs` (`data-frame-id` on `vnet-frame`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs` (`data-frame-cell-id` on `rg-frame`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` (`id="node-{sanitizedId}"`)
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidIdSanitizer.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestSingletonTailPlanner.cs` (`other-resource-groups-rollup`, threshold 8)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs` — helpers `Inventory`, `Vnet`, `Workload`, `Cited`, and the fixtures `Render_full_subscription_seats_connected_resource_group_beside_vnet` and `Render_shared_resource_group_sits_between_two_vnets`
- `archlucid-ui/src/lib/help/help-mermaid.ts` — `fitInventoryDiagramSvgElementToFocusNodeIds`, `resolveMermaidViewportDefaultZoom`
- `archlucid-ui/src/lib/architecture/architecture-diagram-fullscreen-url.ts` — `MIN_ARCHITECTURE_DIAGRAM_ZOOM`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `focusNodeIds`, the sanitized-SVG callback used for PNG export
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewportControls.tsx`
- `archlucid-ui/src/lib/architecture/architecture-diagram-copy.ts`

## What to build

### Neighborhood index in the SVG

This is extra markup on the plate. Do not change placement coordinates, `PlateTargetAspect`, row wrapping, edge routing, stubs, private-endpoint bundling, or the Graphviz PNG path.

When `IsVnetPrimaryTitle` is false, emit no neighborhood metadata. When it is true, add one `<metadata id="diagram-neighborhoods">` element as the first child of the `<svg>`, built with `XElement` so titles are escaped. Compute it from the groups `BuildVnetPrimaryPlacements` already builds. Do not re-derive seating in the UI.

A **non-anchor node** is any placed node that is not `IsFrameAnchor`.

Neighborhood ids and kinds:

| Kind | Id | Which cells |
| --- | --- | --- |
| `vnet` | `vnet:{vnetNodeId}` | One `VnetPrimaryGroup`, plus every remainder cell whose `ResolveWinningVnet` is that vnet and whose `ResolveSharedVnetPair` is null. Those cells are seated beside the VNet and are part of this tile. |
| `shared` | `shared:{frameCellId}` | A remainder cell whose `ResolveSharedVnetPair` is non-null. Its own tile, between the two VNets. |
| `remainder` | `remainder:{frameCellId}` | An unplaced remainder cell with two or more non-anchor nodes. |
| `other` | `other-resource-groups` | The unplaced remainder cells that each have exactly one non-anchor node, when that set has at least two cells. One tile. |

`frameCellId` is the `FrameCellId` already written to `data-frame-cell-id`. A cell that `ShouldDrawFrame` rejects has no frame id; use `remainder:{cell.GroupName}` and omit the `<frame>` child.

`other` title is `Other resource groups ({cell count})`. Its `resource-count` is the cell count. Its `<member>` children are those nodes. A cell whose only node has `NodeId` `other-resource-groups-rollup` is the `other` tile by itself, using that node's `Label`, and is not merged with any other cell.

A single unplaced one-node cell that is not the rollup is `kind="remainder"`, not `other`.

`resource-count` for `vnet`, `shared`, and `remainder` is the number of non-anchor nodes in that neighborhood. The VNet frame anchor is not a resource.

Each neighborhood element, in this order: vnet groups in `BuildVnetPrimaryPlacements` walk order, then shared cells in remainder-cell order, then remainder tiles in remainder-cell order, then `other` last.

```xml
<neighborhood id="vnet:app" kind="vnet" title="app-vnet" resource-count="4">
  <member id="vm-a"/>
  <frame id="vnet-app"/>
  <type name="virtualMachines" count="2"/>
</neighborhood>
<link from="shared:rg-sec" to="vnet:app" count="1"/>
```

- `<member id>` is `MermaidIdSanitizer.Sanitize(nodeId)`, the same suffix `DiagramForestNodeSvgEmitter` puts on `node-{id}`.
- `<frame id>` is `vnet-{vnetNodeId}` for the VNet frame, and each included cell's `FrameCellId` for an `rg-frame`.
- `<type>` groups non-anchor nodes by the last segment of `ArmResourceType` (`virtualMachines`, `vaults`). Skip a node with no type. Emit at most four, highest count first, ordinal name for ties.

Links use `visibleEdges` **before** `ResolvePrivateEndpointBundles`, so a bundled private-endpoint line still counts as N dependencies. Skip `edge.IsLayoutOnly`. Skip `InferenceSource` equal to `GraphEdgeInferenceSources.InventoryResourceGroupCollocation`. Map each endpoint to the neighborhood that lists it. Skip an edge whose ends fall in the same neighborhood or whose end is in no neighborhood. Count unordered pairs. Emit one `<link>` with `from` less than `to` under `StringComparer.Ordinal`, ordered by `from` then `to`.

After the frame layers are added, set `data-neighborhood-id` on each `vnet-frame` and `rg-frame` whose `data-frame-id` or `data-frame-cell-id` appears as a `<frame id>`. The value is the neighborhood id. Frames with no neighborhood get no attribute.

### Map in the viewer

Add `archlucid-ui/src/lib/architecture/architecture-diagram-neighborhood-map.ts`:

- `parseDiagramNeighborhoodMap(markup: string): DiagramNeighborhoodMap | null` returns null when `metadata#diagram-neighborhoods` is absent.
- `shouldAutoOpenDiagramNeighborhoodMap(map)` returns true when `neighborhoods.length >= 4` or the sum of `resource-count` is `>= 40`. Export those two thresholds as named constants.

Add `archlucid-ui/src/components/architecture/DiagramNeighborhoodMapView.tsx`. Props: the parsed map, and `onOpenNeighborhood(id: string)`.

- Region `aria-label` from `architecture-diagram-copy.ts`: `Subscription map`.
- CSS grid, `minmax(220px, 1fr)`, 16px gap. Each tile is a `<button>` with `data-testid={"architecture-diagram-neighborhood-tile-" + id}`.
- Tile text, in this order: the title at 14px `#0f172a`, truncated with an ellipsis, `title` attribute holding the full name; `{resource-count} resources` at 12px `#64748b`; up to four type chips `{name} {count}` at 12px. No new icon pack and no Azure SVG download. The type name is the metadata text.
- Under the grid, a `<ul>` of bundled connectors. One item per link: `{from title} — {count} — {to title}`. Show at most 12, then one item `+ {rest} more links`. Do not draw connector geometry on the map. The plate keeps VN-19, VN-23, and VN-24.

Wire it in `ArchitectureDiagramViewer`:

- Parse the map from the plate markup that is already painted.
- When `focusNodeIds.length > 0`, skip the map and render the plate as today. That prop is the dependency-neighborhood camera.
- When the map is null, render the plate as today and show no Map/Plate control.
- Otherwise the surface is `map`, `plate`, or `neighborhood`. Auto-open uses `shouldAutoOpenDiagramNeighborhoodMap`. A smaller map still has the toggle and starts on the plate.
- Add an optional toggle to `ArchitectureDiagramViewportControls`, `data-testid="architecture-diagram-surface-toggle"`. On the map the label is `Plate`. On the plate and on an open neighborhood the label is `Map`. Strings live in `architecture-diagram-copy.ts`.
- The map surface hides the zoom cluster. Plate and neighborhood keep it, including the 60% floor.
- Clicking a tile sets the surface to `neighborhood` and shows the existing SVG. Fit with `fitInventoryDiagramSvgElementToFocusNodeIds` using that neighborhood's member ids, then `resolveMermaidViewportDefaultZoom(baseFit, MIN_ARCHITECTURE_DIAGRAM_ZOOM)`. Measure only after the plate host is visible. Do not add a second camera and do not change the fit function.
- Above an open neighborhood, a button `Map` (`data-testid="architecture-diagram-map-back"`) and the neighborhood title as text. The button returns to the map.
- `Plate` clears the open neighborhood and shows the full plate at today's default zoom.
- Keep the plate SVG mounted for export. The callback that receives sanitized SVG for PNG export still receives the full plate markup while the map is on screen. The map is HTML and is not the export.

## Tests

`DiagramForestVnetFrameLayoutTests.cs`, using the existing `Inventory` helper. A workload `Cited` to a VNet is a member of that VNet, not a remainder cell. A remainder cell is a workload in another resource group with a `private endpoint` edge to the VNet, as in `Render_full_subscription_seats_connected_resource_group_beside_vnet`. A shared cell has one private-endpoint edge to each of two VNets, as in `Render_shared_resource_group_sits_between_two_vnets`.

1. One VNet with one cited virtual machine, one seated Key Vault in another resource group, one shared Key Vault between two VNets, one unplaced resource group with two virtual machines, and two unplaced one-node resource groups. The metadata has one `vnet` whose `resource-count` includes the cited machine and the seated vault, one `shared`, one `remainder` with `resource-count` 2, and one `other` titled `Other resource groups (2)`. The `vnet-frame` and the seated `rg-frame` carry the same `data-neighborhood-id`. The shared frame carries `shared:…`. A `<link>` between the shared id and each vnet id has `count` 1. No `<link>` connects the seated vault to its own VNet.
2. A one-VNet, one-member Network diagram emits one `vnet` neighborhood and no `other` tile.
3. An Executive title emits no `metadata#diagram-neighborhoods`.

`architecture-diagram-neighborhood-map.test.ts`:

4. `parseDiagramNeighborhoodMap` returns null for an SVG with no metadata, and returns the neighborhoods and links for a fixture that matches the XML above.
5. `shouldAutoOpenDiagramNeighborhoodMap` is false for three neighborhoods whose counts sum to 10, and true for four neighborhoods and for one neighborhood with `resource-count` 40.

`DiagramNeighborhoodMapView.test.tsx`:

6. Renders one button per neighborhood, the resource count, and one link row. Clicking a tile calls `onOpenNeighborhood` with that id. A thirteenth link renders as `+ 1 more links`.

Do not require the pre-existing `ArchitectureDiagramViewer.test.tsx` interaction failures to go green. If you add a viewer case, keep it in the new files.

## Acceptance criteria

- Full subscription and Network with at least four neighborhoods, or at least 40 resources, open on the map. Tile titles are 14px. The reader does not zoom the map.
- A private-endpoint line from a resource group seated beside a VNet does not appear as a map link. Lines between neighborhoods appear once, with a count.
- Clicking a tile shows that neighborhood on the existing plate. A neighborhood that fits opens at 100%. One that does not follows the VN-32 floor and width fit.
- `Map` returns to the map. `Plate` shows the full VN-33 plate. PNG export is that full plate.
- Executive, resource-group, and data-flow diagrams have no map and no toggle.
- `rg overview-caption archlucid-ui/src` returns nothing.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestVnetFrameLayoutTests'`.
- Run `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'` once.
- Run the new Vitest files and `npm run typecheck` in `archlucid-ui`.
- Do not commit. Do not edit unrelated dirty files.
- Do not change the extractor, `MIN_ARCHITECTURE_DIAGRAM_ZOOM`, `PlateTargetAspect`, or `MERMAID_VIEWPORT_MIN_FIT_SCALE`.
- Do not add an icon pack, a findings badge, or a second layout engine.

## Done when

`Hmd_HI_HAP_Non_Prod` Full subscription opens as a map of readable tiles. Clicking one tile shows that neighborhood on the plate at 60% or higher. Plate returns the wide VN-33 diagram. The PNG is still the full plate.
