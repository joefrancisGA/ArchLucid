# SB-04 — A named Bastion subnet is not gone

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SB-02 or SB-03 in this session. Do not add **Show subnets**.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`

**Depends on:** SB-01. Orphan classification already receives the inventory graph from before peel rank 20. That was not enough. The owner checked one Bastion subnet in Azure and confirmed the subnet exists. The node list still says it no longer exists.

## Goal

The outline Problem column and the Bastion card stop saying `required subnet … no longer exists` when this inventory snapshot can name that subnet. A hidden subnet card is not the reason.

## Why

`TryClassifyOrphanedSubnetDependentResource` reads `subnet.id`, then `ipConfigurations`. When that id is non-empty and `IsArmIdResolvable` fails, it returns Orphaned immediately:

`required subnet {name} no longer exists`

`DiagramNodeHumanCaptionFactory` prints that as `Missing a required link: …`. The node list shows the same sentence.

`HasSubnetEdge` runs only when the subnet id is blank. A Bastion that already names `AzureBastionSubnet` never reaches it. The parent virtual network's `subnets` array is never read. `HostedAzureInventoryResourcePropertyExpander` can also store the same id as `ipConfiguration.subnet.id[n]`, which `TryReadSubnetArmId` does not read.

SB-01's regression covers a Bastion with a blank subnet id and a `bastionToSubnet` edge. The owner's Bastions have a subnet id. The exact node lookup misses, and the sentence remains.

The owner verified the subnet in Azure. SecureNow must recognize it from the snapshot it already has: a subnet node, a link to a subnet node, or the subnet list on the parent virtual network.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyOrphanedSubnetDependentResource`, `TryReadSubnetArmId`, `HasSubnetEdge`, `IsArmIdResolvable`)
- `ArchLucid.Core.Tests/AzureExtractor/InventoryDiagramOrphanedStateClassifierTests.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramOrphanedStateApplierTests.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs` (`ipConfiguration.subnet.id[n]`, virtual network `subnets`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`

## What to build

In `TryClassifyOrphanedSubnetDependentResource`, a Bastion, Azure Firewall, or virtual network gateway subnet is present when any of these is true on the analysis graph:

- A subnet node has the same ARM id.
- The resource has a link to a subnet node. Check this even when a subnet id is already present.
- The parent virtual network is a node in the graph, and its `subnets` property contains that subnet id or that subnet name.

Read the subnet id from `subnet.id`, from `ipConfigurations`, and from `ipConfiguration.subnet.id[n]`.

When the resource names a subnet and none of those three are true, do not use `no longer exists`. The message is `required subnet {name} is not in this inventory snapshot`. When no name is available, the message is `required subnet is not in this inventory snapshot`.

Keep peel rank 20. Do not draw subnet cards. Do not add a checkbox. Do not change route-table wording in this session.

## Tests

1. A Bastion has `subnet.id` for `AzureBastionSubnet`. The analysis graph has no subnet node with that id. It has the parent virtual network, and that network's `subnets` array contains the id. The Bastion is not Orphaned. The caption and connection-state message do not contain `no longer exists`.
2. A Bastion has `subnet.id` and a link to a subnet node whose own ARM id does not equal that `subnet.id`. The Bastion is not Orphaned. The message does not contain `no longer exists`.
3. A Bastion stores the id only as `ipConfiguration.subnet.id[0]`, and the parent virtual network lists that subnet. The message does not contain `no longer exists`.
4. A Bastion names a subnet, and the analysis graph has no matching subnet node, no subnet link, and no parent virtual network that lists it. The message is `required subnet {name} is not in this inventory snapshot`.
5. The SB-01 case stays: a blank subnet id plus a link to a subnet node is not Orphaned.

Use the classifier tests and `InventoryDiagramOrphanedStateApplierTests`. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once with `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'` if you edit Core, and run the classifier tests. If you edit ArtifactSynthesis, compile `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` and run `InventoryDiagramOrphanedStateApplierTests`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run SB-01, SB-02, SB-03, VN-07, or SN-QQ as greenfield.

## Done when

A Bastion whose subnet is named by the Bastion and listed on its virtual network in this snapshot no longer shows `no longer exists` in the node list. A subnet that the snapshot cannot name is described as not in this inventory snapshot.
