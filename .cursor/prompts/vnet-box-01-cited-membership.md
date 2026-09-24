# VN-01 — Cited VNet membership

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement VN-02 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

## Goal

Decide which visible diagram nodes belong in a virtual network from cited placement, not from the display label. `DiagramForestNestedFrameResolver` must use that decision. Collocation edges stay on the canvas and do not add members.

## Why

The resolver treats an edge labeled `in` or `likely · in` whose target is the VNet as containment. A VM whose `in` edge points at a subnet is left out. `AzureInventorySnapshotSameResourceGroupEdgeHydrator` adds `likely · in` from every workload to the only VNet in a resource group (`GraphEdgeInferenceSources.InventoryResourceGroupCollocation`). A box built from those edges copies the resource-group frame.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstVnetTopologyResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstLayoutEdgeBuilder.cs`
- `ArchLucid.ArtifactSynthesis/DiagramEdgeProvenanceDisplayLabelBuilder.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotSameResourceGroupEdgeHydrator.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs` (`NicToSubnet`, `PeToSubnet`, `AppServiceToSubnet`)

## What to build

Add `DiagramForestVnetMembership` in `ArchLucid.ArtifactSynthesis/Layout/`. One type per file. It takes the visible nodes and edges and returns, per VNet node, the node ids that belong in that VNet.

A node belongs when any of these is true:

- It is the VNet node.
- Its ARM id is a subnet id under that VNet (`/subnets/` after the VNet id). Use `DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId` rather than a second parser.
- A cited placement edge runs from the node to that VNet, or from the node to a subnet of that VNet. Cited means the edge is not collocation. Read `InferenceSource` (and the pre-humanized association when it is still on the edge). Treat `nicToSubnet`, `peToSubnet`, `appServiceToSubnet`, `inventory-nic-subnet`, `inventory-pe-subnet`, `inventory-appservice-subnet`, and `InventoryLayoutVmVnet` as cited. Treat `InventoryResourceGroupCollocation` as not cited.

Do not infer membership from the strings `in` or `likely · in` alone.

Point `DiagramForestNestedFrameResolver` at this type. Keep the current paint path: still a post-hoc rectangle, still skip when the member set is only the VNet, still require the VNet node to be placed. Do not change packing, captions, PNG clusters, or subnet frames.

## Tests

Add `DiagramForestVnetMembershipTests` in `ArchLucid.ArtifactSynthesis.Tests/`.

1. VM `in` edge to a subnet, subnet ARM id under the VNet: VM, subnet, and VNet are members.
2. The only edges into the VNet are collocation (`InventoryResourceGroupCollocation`, label `likely · in`): the member set is the VNet alone, and the resolver emits no `vnet-frame`.
3. A Key Vault in the same resource group with no cited hop is not a member.
4. Existing `Render_network_inventory_adds_subscription_and_vnet_frames` still passes. Give that fixture edge `InferenceSource = InventoryLayoutVmVnet` if membership now requires it.

## Acceptance criteria

- Membership ignores display-label wording.
- Collocation does not create a VNet frame.
- A subnet-targeted cited hop places the workload in the parent VNet.
- No packing change, no PNG change, no new icon, no subnet-frame work.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetMembershipTests` and `DiagramForestLayoutSvgRendererTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A reviewer can see which edges are allowed to put a card in a VNet, and a collocation-only resource group does not gain a `vnet-frame`.
