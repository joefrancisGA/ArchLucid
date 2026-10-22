# VN-19 — Bundle private-endpoint lines to one VNet

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-10 and VN-15. Do not re-run VN-01 through VN-18.

## Goal

On Full subscription and Network diagrams, several private-endpoint connectors from one resource group to one VNet paint as one line. The line is labelled `private endpoint × N`. Each target card keeps its lock.

## Why

`EmitSvg` draws every visible edge from card to card. A resource group that holds five Key Vaults, storage accounts, or databases behind private endpoints therefore draws five parallel lines to the same VNet. Those bands are the dense stripes across the plate. The lock from `DiagramForestPrivateEndpointAccessSvgEmitter` already marks each private resource.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`EmitSvg`, the edge loop, `ResolveEdgeEndpoints`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestPrivateEndpointAccessSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestOrthogonalEdgeRouter.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs` (`InventoryPrivateEndpoint`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

Do this while painting the forest SVG. Do not rewrite the diagram AST, the Mermaid text, or the Graphviz DOT.

A bundle is every visible edge that would have been painted, whose label trims to `private endpoint` under ordinal ignore case, and whose inference source is `inventory-private-endpoint`.

Group those edges by the resource-group frame of one end and the VNet frame of the other. The resource-group end has a `FrameCellId`. The VNet end is the frame anchor or a member with that `VnetFrameId`. Skip an edge whose ends do not have both frames. Skip an edge whose both ends sit inside the same VNet frame.

When a group has two or more edges:

1. Do not paint those edges.
2. Paint one edge. Its label is `private endpoint × N`, using the multiplication sign `×` and the count of bundled edges. Copy `InferenceSource` from one of the bundled edges so the stroke stays the same.
3. Route that edge with `DiagramForestOrthogonalEdgeRouter` between the resource-group frame rectangle and the VNet frame rectangle. Use the facing-edge midpoints, the same horizontal-or-vertical choice `ResolveEdgeEndpoints` already uses for cards.

When a group has one edge, paint that edge as today, still labelled `private endpoint`.

Leave the lock on each private card. Leave peering, `in`, `used by`, and every other label as separate lines. Do not move cards. Do not change gap constants.

## Tests

Extend `DiagramForestVnetFrameLayoutTests`. Edge titles are the `<title>` text inside an element whose class is `edge`.

1. Full subscription. One VNet with one cited virtual machine. Three Key Vaults in one other resource group, each with a `private endpoint` edge to the VNet and inference source `inventory-private-endpoint`. The SVG contains one edge title `private endpoint × 3`. It contains no edge title that is only `private endpoint`. Each vault still has an element whose class is `private-endpoint-access`.
2. Two Key Vaults in one resource group, one edge to `vnet-a` and one edge to `vnet-b`. The SVG contains two edge titles `private endpoint` and no `private endpoint ×` title.
3. One Key Vault with one `private endpoint` edge still paints a single edge titled `private endpoint`.

## Acceptance criteria

- Two or more private-endpoint lines from one resource group to one VNet become one labelled line.
- A single private-endpoint line stays a single line.
- Lines to different VNets stay separate.
- Locks stay on the private cards.
- Other edge labels, placement, and the extractor are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full subscription SVG with three private endpoints from one resource group to one VNet shows one line labelled `private endpoint × 3`, and each of those resources still shows its lock.
