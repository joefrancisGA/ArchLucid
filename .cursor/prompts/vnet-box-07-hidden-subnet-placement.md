# VN-07 — Hidden subnets still build the VNet box

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new VN in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-01 (`DiagramForestVnetMembership`) and VN-02 (VNet pack inside the resource-group cell).

## Goal

A virtual network becomes a bounding box around the visible resources that are placed in its subnets, even when no subnet card is drawn. Subnet nodes may be omitted. They remain the join from a placed resource to its parent VNet.

## Why

`DiagramForestVnetMembership` only sees nodes and edges that survived onto the diagram. A member is a visible subnet card under the VNet, or a cited placement edge whose target is that VNet or a visible subnet of it. `InventoryDiagramGraphPeelFilter` deletes `Microsoft.Network/virtualNetworks/subnets` (peel rank 20) and every edge that touched those nodes before compile. The VNet type is never peeled, so the card remains and the member set is empty. `LayoutVnetAwareCell` then skips the frame.

The parent VNet id is already in the subnet ARM id. `DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId` cuts the id at `/subnets/`. The box does not need a subnet card, a subnet frame, or a painted line to the subnet.

Network interfaces already work this way: the card is omitted, the hop stays in the graph long enough to place the owner. Subnet peel does not. It removes the hop before layout.

`DiagramEdgeVisibility.VisibleEdges` drops `IsLayoutOnly` edges, and `LayoutVnetAwareCell` reads those visible edges. A layout-only placement edge cannot join the box. A normal edge from the owner to the VNet can. `ResolveVnetInternalPlacementEdges` already suppresses a cited placement edge when both ends are members of the VNet, so the line is not painted once the box exists.

## Read first

- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramGraphPeelFilter.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramPeelBudgetApplier.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`LayoutVnetAwareCell`, `ResolveVnetInternalPlacementEdges`)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstVnetTopologyResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramNicOwnerResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeVisibility.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs`
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs` (`IsSubnetArmType`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`

## What to build

Add `DiagramHiddenSubnetVnetPlacementProjector` in `ArchLucid.ArtifactSynthesis/`. One type per file. Call it from `InventoryDiagramGraphPeelFilter.Filter` before nodes are removed, only when the excluded set contains a subnet ARM type (`AzureInventoryTopologyCategory.IsSubnetArmType`).

On the graph that still contains those subnet nodes, for each edge whose target is a subnet node:

1. Resolve the parent VNet with `TryResolveVnetIdFromSubnetArmId`. Skip the edge when that VNet node is missing or is itself excluded.
2. The placed resource is the edge source. When the source is a network interface, lift it to the compute owner with the same VM-to-NIC fact `DiagramNicOwnerResolver` already uses. Skip the edge when the owner cannot be resolved.
3. Skip private-endpoint target edges. Do not walk from a private endpoint to the storage account, SQL server, or other target and put that target in the VNet. A private endpoint that is itself the source may be placed only when that endpoint node will remain in the filtered graph.
4. Emit a projected edge only when the placed resource and the VNet share `ArmResourceGroup`. A workload in another resource group stays outside the box and gains no new line.
5. The projected edge runs from the placed resource to the VNet node. Weight is `1.0`. `IsLayoutOnly` stays false. Inference source is a new `GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement` (`inventory-hidden-subnet-vnet-placement`). Add that source to `DiagramForestVnetMembership.IsKnownPlacementSource` so the existing same-group pack treats it as cited placement.

Then the filter deletes the subnet nodes as it does today. Do not put subnet cards back. Do not add a subnet frame. Do not change peel rank, readability thresholds, or which types are peeled.

Collocation (`InventoryResourceGroupCollocation`) is not a placement edge. Do not project it.

Leave NSG promotion, route-table promotion, effective-NSG weight, and Data flow port annotations alone.

## Tests

Add `DiagramHiddenSubnetVnetPlacementProjectorTests` in `ArchLucid.ArtifactSynthesis.Tests/`.

1. One resource group holds a VNet, a subnet, a virtual machine, its NIC (`vmToNic`, `nicToSubnet`), and a Key Vault with no hop. Filter with the subnet type excluded. The subnet node is gone. A projected edge remains from the virtual machine to the VNet with `InventoryHiddenSubnetVnetPlacement` and weight `1.0`. The Key Vault has no such edge.
2. Compile that filtered graph as `DiagramMode.FullSubscription` and render with `DiagramForestLayoutSvgRenderer`. The SVG has one `vnet-frame` whose rect contains the virtual machine and does not contain the Key Vault. The VNet name is the frame caption. There is no subnet `node-card` and no VNet `node-card`. The projected edge is not painted.
3. Two subnets of one VNet, one virtual machine on each: one `vnet-frame`, both virtual machines inside it.
4. The virtual machine's resource group differs from the VNet's: no projected edge, and no `vnet-frame` when the VNet has no same-group placed resource.
5. A private endpoint in the subnet whose target is a storage account in the same resource group: the storage account is outside the box.
6. Existing `DiagramForestVnetMembershipTests` and `DiagramForestVnetFrameLayoutTests` still pass. Collocation-only groups still do not gain a `vnet-frame`.

## Acceptance criteria

- A peeled subnet still places its same-group virtual machines, App Services, and other subnet-placed resources inside the parent VNet box.
- No subnet card is added to make the box possible.
- The Key Vault that only shares the resource group stays outside the box.
- Cross-group placement does not create a box member or a new connector.
- Private-endpoint targets are not pulled into the VNet.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramHiddenSubnetVnetPlacementProjectorTests`, `DiagramForestVnetMembershipTests`, and `DiagramForestVnetFrameLayoutTests`.
- Do not bump `ComponentHorizontalGap` or `ComponentVerticalGap`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full-subscription fixture whose subnet nodes were removed still shows one VNet box inside the resource group, with only the resources placed in that VNet's subnets inside it.
