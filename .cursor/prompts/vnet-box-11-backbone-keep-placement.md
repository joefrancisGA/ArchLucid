# VN-11 — Backbone keep still places the virtual machine in the VNet

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new VN in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-07 and VN-08. Do not re-run VN-01 through VN-10. Do not edit the customer extractor or the hosted collector.

## Goal

On a Full subscription diagram that falls through to backbone keep, a virtual machine placed on a subnet is still a member of the parent virtual network. The virtual network becomes a bounding box. The Key Vault, storage account, or database reached by a hidden private endpoint stays outside that box.

## Why

`DiagramHiddenSubnetVnetPlacementProjector` already rewrites a subnet placement edge onto the parent virtual network before a peel pass deletes the subnet. `InventoryDiagramPeelBudgetApplier` calls that projector only from `InventoryDiagramGraphPeelFilter`, and only once the excluded set contains a subnet ARM type.

A large Full subscription still exceeds `MermaidDiagramReadabilityThresholds` after that peel loop. The applier then calls `InventoryDiagramBackboneKeepFilter.Filter`. Subnets are peel rank 20, so they are not backbone. Virtual machines and virtual networks are backbone. The filter deletes the subnet node and every edge that touched it. It does not project first. The surviving graph has `vm-bam-test-01` and `vnet-aep-hi-test-wus-001` and no cited placement edge between them. `DiagramForestVnetMembership` then finds no member besides the virtual network, and the layout leaves the virtual network as a card inside the resource-group frame.

The `private endpoint` connector is a different edge. Its inference source is `InventoryPrivateEndpoint`. That source is not cited placement. It must keep running from the target service to the virtual network, and it must not put the service inside the box.

`vmToNic` and `nicToSubnet` are already in the imported package. This session does not collect anything new.

## Read first

- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramBackboneKeepFilter.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramPeelBudgetApplier.cs` (the Full subscription backbone-keep call)
- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramGraphPeelFilter.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/DiagramHiddenSubnetVnetPlacementProjector.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs` (`IsKnownPlacementSource`)
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramBackboneKeepFilterTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramHiddenSubnetVnetPlacementProjectorTests.cs`

## What to build

Project subnet placement before backbone keep drops the subnet nodes.

- Call `DiagramHiddenSubnetVnetPlacementProjector.Project` on the graph that still contains the subnet nodes. The excluded set passed to the projector contains `Microsoft.Network/virtualNetworks/subnets`.
- This filter runs for Full subscription, where VN-08 already allows cross-group members. Pass `allowCrossResourceGroupVnetPlacement: true`.
- Keep the projected edges, then drop every edge whose source or target node was removed. Match the order in `InventoryDiagramGraphPeelFilter`: project, then remove nodes, then keep original edges whose ends both survived, then append the projected edges.
- Leave the projector's own rules in place. A `nicToSubnet` edge whose source is a network interface still lifts to the virtual machine. A private-endpoint target is not walked into the virtual network. `InventoryPrivateEndpoint` stays out of `IsKnownPlacementSource`.
- Do not add an association type. Do not change `scripts/azure/`, script version, or `resources.json`.

## Tests

Extend `InventoryDiagramBackboneKeepFilterTests`.

1. One graph holds a virtual network, its subnet, a virtual machine in another resource group, `nicToSubnet` from that virtual machine to the subnet, a network security group, and a Key Vault with an `InventoryPrivateEndpoint` edge to the virtual network. After the filter, the subnet and the network security group are gone. An edge remains from the virtual machine to the virtual network with `InventoryHiddenSubnetVnetPlacement` and weight `1.0`. The Key Vault remains, and it has no `InventoryPeSubnet` edge.
2. `Filter_keeps_vms_and_sql_databases_and_drops_nsgs` still passes.
3. `DiagramHiddenSubnetVnetPlacementProjectorTests` still pass, including the peel-filter case that does not project a cross-group virtual machine. Backbone keep is the Full subscription path that allows the cross-group member. The peel filter's default stays same-group.

## Acceptance criteria

- Backbone keep preserves a cited virtual-machine placement on the parent virtual network, including a virtual machine in another resource group.
- The virtual network has a member, so the Full subscription layout can draw it as a box.
- A private-endpoint target stays outside the box.
- The customer extractor is unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `InventoryDiagramBackboneKeepFilterTests` and `DiagramHiddenSubnetVnetPlacementProjectorTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

After backbone keep, `vm-bam-test-01` still has `inventory-hidden-subnet-vnet-placement` to `vnet-aep-hi-test-wus-001`, and the Key Vault does not.
