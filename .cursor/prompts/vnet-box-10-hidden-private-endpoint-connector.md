# VN-10 — A hidden private endpoint still connects its target

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new VN in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/AZURE_PRIVATE_ENDPOINT_HIDDEN_PLACEMENT_LUNA_PROMPTS.md`

**Depends on:** VN-07, VN-08, and EX-PE-01's association types (`peToSubnet`, `peToNic`, `privateEndpointTarget`). Do not re-run VN-01 through VN-09. The customer script may still be `0.4.1` when this session starts. Build the diagram behavior against those association types. Do not edit the collector in this session.

## Goal

When the private-endpoint card is hidden, the Key Vault, storage account, or database it reaches has a painted connector to the virtual network that holds that endpoint. The service card stays in its resource group. The virtual network box does not gain the service as a member. The service is Connected.

## Why

`AzureInventorySnapshotHiddenHopComposer.AddPrivateEndpointPlacementEdges` copies private-endpoint placement onto the target. The new edge runs from the Key Vault to the subnet, with association `peToSubnet` and inference source `InventoryPeSubnet`, and the label humanizes to `in`. `DiagramForestVnetMembership.IsKnownPlacementSource` treats `peToSubnet` and `InventoryPeSubnet` as cited placement, so the service becomes a member of the VNet.

VN-07 already forbids that walk. A private endpoint may sit in the subnet. The storage account, Key Vault, or database stays outside the box. One service can have endpoints in more than one virtual network, so its card stays in the resource group.

Full subscription hides the private-endpoint card unless Show private endpoints is on. `DiagramPrivateEndpointTargetAnnotator` sets `HasPrivateEndpointAccess` from the private-endpoint-to-target edge, and `DiagramPrivateEndpointCanvasPruner` then removes the card and every diagram edge that touched it. The lock can remain. It does not draw the line to the virtual network. `nicToSubnet` on the hidden `pendp-*` interface dies with the hidden interface unless `peToNic` or `peToSubnet` names the private endpoint first.

`InventoryDiagramOrphanedStateApplier` marks a node Connected when it sits on a cited diagram edge that is not layout-only and not resource-group collocation. A connector that never reaches the diagram leaves the service Unknown.

## Read first

- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotHiddenHopComposer.cs` (`AddPrivateEndpointPlacementEdges`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs` (`IsKnownPlacementSource`)
- `ArchLucid.ArtifactSynthesis/Mermaid/DiagramHiddenSubnetVnetPlacementProjector.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramPrivateEndpointTargetAnnotator.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramPrivateEndpointCanvasPruner.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramRelationshipVerbCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstVnetTopologyResolver.cs` (`TryResolveVnetIdFromSubnetArmId`)
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestPrivateEndpointAccessSvgEmitter.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs` (`InventoryPrivateEndpoint`, `InventoryPeSubnet`)

## What to build

Stop copying hidden private-endpoint placement onto the target as `PeToSubnet` or `InventoryPeSubnet`. That edge is what puts the service inside the box.

When the private-endpoint node will be omitted from the diagram, emit one connector from the target service to the parent virtual network:

1. Start from `peToSubnet` on the private endpoint. Resolve the parent virtual network with `TryResolveVnetIdFromSubnetArmId`.
2. When the only placement is `peToNic`, follow that interface's `nicToSubnet` to the subnet, then to the same parent virtual network.
3. Skip the connector when the virtual network node is missing.
4. The connector runs from the target service to the virtual network node. Weight is `1.0`. `IsLayoutOnly` stays false. Inference source is the existing `GraphEdgeInferenceSources.InventoryPrivateEndpoint`.
5. Display label is `private endpoint`. Do not humanize this connector as `in`. A `peToSubnet` or `InventoryPeSubnet` edge whose source is a visible private-endpoint card may still say `in`, because that card is in the subnet.
6. Do not add `InventoryPrivateEndpoint` or `privateEndpointTarget` to `IsKnownPlacementSource`.

A visible private endpoint, when Show private endpoints is on, remains a VNet member from its own `peToSubnet` or from `nicToSubnet` lifted through `peToNic`. The target service is still not a member.

The target and the virtual network may sit in different resource groups. Draw the connector anyway. Two private endpoints on one service, in two virtual networks, produce two connectors and one card.

Keep `HasPrivateEndpointAccess` and the lock badge. Keep VM placement (`vmToNic`, `nicToSubnet`, `InventoryLayoutVmVnet`, `InventoryHiddenSubnetVnetPlacement`) as it is. Collocation, diagnostics, identity, an NSG, a route table, peering, and a resource name that contains `vnet` do not create this connector.

The painted connector is a cited diagram edge, so `InventoryDiagramOrphanedStateApplier` counts the target as Connected. Do not leave it Used, Orphaned, or Unknown. Do not treat the connector as VNet membership.

## Tests

Add `DiagramHiddenPrivateEndpointConnectorTests` in `ArchLucid.ArtifactSynthesis.Tests/`.

1. A hidden private endpoint has `peToSubnet` to a subnet of VNet A and `privateEndpointTarget` to a Key Vault in another resource group. Compile `DiagramMode.FullSubscription` with private-endpoint nodes excluded. The diagram has a connector from the Key Vault to VNet A labeled `private endpoint`. The Key Vault is not a member of the `vnet-frame`. No edge from the Key Vault uses `InventoryPeSubnet`. The lock badge remains.
2. The same graph plus a same-group virtual machine on that subnet: the virtual machine is inside the `vnet-frame`, the Key Vault is outside, and the connector is still present.
3. Show private endpoints: the private-endpoint card is a member of the VNet, the Key Vault is not, and the private-endpoint card is still drawn.
4. One Key Vault with private endpoints in two virtual networks: two connectors, and the Key Vault is inside neither frame.
5. A Key Vault that only shares the resource group, with no private-endpoint hop, gains no connector and is not a VNet member.
6. Existing `DiagramHiddenSubnetVnetPlacementProjectorTests` still keep the storage account outside the box.

## Acceptance criteria

- A hidden private endpoint draws `private endpoint` from the target service to the virtual network that contains the endpoint.
- The target card stays in its resource group.
- The target is Connected.
- The VNet box members are the resources placed in the virtual network, such as the virtual machine. The target service is not one of them.
- A visible private-endpoint card may sit in the box. The target still does not.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramHiddenPrivateEndpointConnectorTests` and `DiagramHiddenSubnetVnetPlacementProjectorTests`.
- Do not edit the customer collector or the hosted zip builder.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

With private-endpoint cards hidden, the Key Vault stays outside `vnet-aep-hi-test-wus-001` and a `private endpoint` connector runs from that Key Vault to the virtual network. A virtual machine placed on the subnet is inside the box.
