# VN-12 — Diagram repair keeps the VNet placement source

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new VN in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-07, VN-08, and VN-11. Do not re-run VN-01 through VN-11. Do not edit the customer extractor or the hosted collector.

## Goal

After deterministic Mermaid repair, a virtual machine that is placed in a virtual network is still a cited member. The Full subscription layout draws that virtual network as a bounding box. A private-endpoint connector stays a line. It does not put the Key Vault, storage account, or database inside the box.

## Why

`DiagramForestVnetMembership` opens a box only from a cited placement source: `inventory-nic-subnet`, `inventory-hidden-subnet-vnet-placement`, `inventory-layout-vm-vnet`, and the other sources in `IsKnownPlacementSource`. It does not treat the display word `in` as placement.

`MermaidDiagramInventoryRenderOrchestrator` compiles the diagram, then `MermaidDiagramRenderPipeline` repairs that AST again. `MermaidDiagramDeterministicRepairer.Repair` copies each edge's endpoints, display label, and `IsLayoutOnly`. It leaves `InferenceSource` null. The forest renderer lays out `RepairedAst`.

The placement edge still paints, because the label survived. Membership no longer sees `inventory-nic-subnet` or `inventory-hidden-subnet-vnet-placement`, so the member set is empty and the virtual network stays a card inside the resource-group frame. A `private endpoint` label survives the same way and still must not count as membership.

VN-11 can project the virtual machine onto the parent virtual network before backbone keep deletes the subnet. That projection is discarded at repair, before layout. `vmToNic` and `nicToSubnet` are already in the imported package.

## Read first

- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramDeterministicRepairer.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramRenderPipeline.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramInventoryRenderOrchestrator.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs` (`IsKnownPlacementSource`)
- `ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs` (`InventoryNicSubnet`, `InventoryHiddenSubnetVnetPlacement`, `InventoryPrivateEndpoint`)

## What to build

When `MermaidDiagramDeterministicRepairer` copies an edge, copy `InferenceSource` and `ProvenanceKind` onto the repaired edge. Keep `IsLayoutOnly` as it is.

Do not add the display word `in` to `IsKnownPlacementSource`. Do not add `private endpoint` or `InventoryPrivateEndpoint` to that list. Do not change duplicate-edge collapsing except to preserve the source on the edge that is kept. Do not change the extractor.

## Tests

Add `MermaidDiagramDeterministicRepairerPlacementSourceTests` in `ArchLucid.ArtifactSynthesis.Tests/`.

1. Repair an edge whose label is `in` and whose inference source is `InventoryHiddenSubnetVnetPlacement`. The repaired edge still has that inference source.
2. Repair an edge whose label is `private endpoint` and whose inference source is `InventoryPrivateEndpoint`. The repaired edge still has that inference source. `DiagramForestVnetMembership.IsCitedPlacementEdge` is false for it.
3. Build a Full subscription AST titled `Azure inventory (FullSubscription)` with a virtual network, a virtual machine in another resource group, and one edge from the virtual machine to the virtual network labeled `in` with inference source `InventoryNicSubnet`. Repair that AST, then render it with `DiagramForestLayoutSvgRenderer`. The SVG has one `vnet-frame`. The virtual machine sits inside that frame. Add a Key Vault with a `private endpoint` edge to the same virtual network and inference source `InventoryPrivateEndpoint`. The Key Vault is outside the frame.

## Acceptance criteria

- Repair no longer clears a cited placement source.
- A Full subscription diagram can draw the virtual network as a box from the repaired AST.
- The private-endpoint target stays outside the box.
- The customer extractor is unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `MermaidDiagramDeterministicRepairerPlacementSourceTests` and `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A repaired Full subscription diagram still carries `inventory-nic-subnet` or `inventory-hidden-subnet-vnet-placement` from `vm-bam-test-01` to `vnet-aep-hi-test-wus-001`, and that virtual network renders as a `vnet-frame` with the virtual machine inside it.
