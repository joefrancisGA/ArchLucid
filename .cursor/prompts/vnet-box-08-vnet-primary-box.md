# VN-08 — The VNet box is the primary container

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement VN-09 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-01, VN-02, VN-03, and VN-07. Do not re-run VN-01 through VN-07.

## Goal

On Full subscription and Network diagrams, a virtual network is the bounding box around every visible resource that is cited as placed in it, including resources in other resource groups. A subnet card may stay inside that box. A resource group name stays on the card. It does not decide the box.

## Why

Security analysts read these diagrams for reachability and blast radius. A VNet is that boundary. A resource group is an ownership and RBAC scope. `LayoutVnetAwareCell` calls `DiagramForestVnetMembership.Resolve` with `sameResourceGroupOnly: true`, and it runs inside one resource-group cell. A virtual machine in another group never enters the cell, so the VNet stays a card and the resource-group frame is the only box. VN-03 recorded that rule. This session replaces it for Full subscription and Network.

`DiagramHiddenSubnetVnetPlacementProjector` also skips a placement when the placed resource and the VNet have different `ArmResourceGroup` values. After peel removes the subnet, that skip leaves the same gap.

`DiagramNodeHumanCaptionFactory.CombinedPlainText` omits the resource group. The group is only on the accessibility title. Once a card moves into another group's VNet, the painted label has to keep the resource group.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`LayoutResourceGroupCell`, `LayoutVnetAwareCell`, `ResolveVnetInternalPlacementEdges`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/DiagramHiddenSubnetVnetPlacementProjector.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

For `DiagramMode.FullSubscription` and `DiagramMode.Network` only:

1. Resolve VNet membership across the whole diagram with `sameResourceGroupOnly: false`. Cited placement still comes from VN-01: subnet child, NIC, private endpoint, App Service, layout VM-to-VNet, and `InventoryHiddenSubnetVnetPlacement`. Collocation does not join a box.
2. Pack each VNet that has at least one other member as its own box before resource-group cells are the outer containers. Members in other resource groups move into that box. Visible subnet cards of that VNet stay inside the box. Do not add a subnet frame.
3. A Key Vault, storage account, or other card with no cited placement stays out of the box.
4. A VNet with no other member stays a card. Do not draw an empty box.
5. Suppress an `in` edge, including `likely · in`, when both ends are inside the same VNet box. Keep peering edges. Keep an `in` edge when one end is outside the box.
6. In `DiagramHiddenSubnetVnetPlacementProjector`, emit the projected edge when the placed resource and the VNet are in different resource groups. Weight stays `1.0`. `IsLayoutOnly` stays false.
7. When a painted card inside a VNet box has a different `ArmResourceGroup` from that VNet, include that resource group in `CombinedPlainText`.

Identity, Data, Data flow, Data architecture, AVD, Executive, Business continuity, and neighborhood diagrams keep the VN-03 same-group rule.

Do not change global gaps. Do not download icons. Do not add subnet boxes.

## Tests

Extend `DiagramForestVnetFrameLayoutTests`.

1. Full subscription. VNet and subnet in `rg-net`. Virtual machine in `rg-app` with a cited NIC-to-subnet placement. One `vnet-frame` contains the virtual machine. The painted virtual-machine label includes `rg-app`. A Key Vault in `rg-app` with no placement edge is outside the frame.
2. The same graph with the subnet type excluded by peel. The subnet card is gone. The virtual machine is still inside the one `vnet-frame`.
3. Two resources that only share a resource group, with a collocation edge, do not gain a `vnet-frame`.
4. A peering edge between two VNets is still drawn. An `in` edge whose both ends are inside one box is not drawn.
5. The same cross-group fixture compiled as Identity leaves the virtual machine outside `vnet-frame`.
6. Existing same-group `DiagramForestVnetFrameLayoutTests` still pass.

## Acceptance criteria

- Full subscription and Network show one VNet box for a network that spans resource groups.
- The resource group remains readable on a card that crossed groups.
- Subnet cards that are still on the diagram sit inside the parent VNet box.
- Other diagram modes still follow VN-03.
- No empty VNet box and no subnet box.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests` and `DiagramHiddenSubnetVnetPlacementProjectorTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full-subscription fixture with the virtual machine in another resource group shows that virtual machine inside the VNet box, with its resource group still on the card.
