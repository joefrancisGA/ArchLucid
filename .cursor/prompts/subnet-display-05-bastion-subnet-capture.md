# SB-05 — Save the Bastion subnet when Azure is read

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SB-02 or SB-03 in this session. Do not add **Show subnets**. Do not change the SB-04 classifier wording.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`

**Depends on:** SB-04, which is already on master. The outline still says `Missing a required link: required subnet is not in this inventory snapshot` for Bastion hosts. There is no subnet name in that sentence. The owner confirmed the subnet exists in Azure.

## Goal

The next inventory capture stores the Bastion subnet id, and the diagram graph the orphan classifier reads carries that id. When the snapshot also has that subnet, the Bastion card and the outline Problem column no longer say the required subnet is missing.

## Why

The sentence with no subnet name is the blank-id branch in `TryClassifyOrphanedSubnetDependentResource`. SB-04 clears that branch only when the analysis graph already has a subnet id on the Bastion, a link to a subnet node, or that id inside a virtual network node's `subnets` property. A live diagram has none of those.

The subscription resource list does not include `ipConfigurations`. `BuildProperties` keeps `provisioningState` for a Bastion. `HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists` re-fetches full details for firewalls, NAT gateways, network interfaces, and virtual networks. `Microsoft.Network/bastionHosts` is not on that list, and `HostedAzureInventoryResourcePropertyExpander` has no Bastion branch, so the subnet id Azure returns is never stored.

`AzureInventorySnapshotGraphResolver` then copies only ARM identity onto each graph node. The classifier reads those graph-node properties. A subnet id that stayed on the snapshot property table would still be invisible. The virtual network `subnets` array is already stored on the snapshot row and is not copied onto the virtual-network graph node. `HasSubnetListedOnVirtualNetwork` returns false while the Bastion id is blank.

A snapshot already saved does not gain this id. The sentence clears after the next capture of that subscription. Do not backfill old snapshots. Do not guess a subnet named `AzureBastionSubnet` when the Bastion row has no subnet id.

## Read first

- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs` (`ListSubscriptionResourcesAsync`, `BuildProperties`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmNetworkTypeListDescriptors.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmNetworkResourceEnricher.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs` (`AddNicProperties`, virtual network `subnets`, `AddAzureFirewallProperties`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs` (`AddNicAssociations`, `AddFirewallAssociations`)
- `ArchLucid.Integrations.AzureExtractor.Tests/HostedAzureInventoryResourcePropertyExpanderTests.cs`
- `ArchLucid.Integrations.AzureExtractor.Tests/HostedAzureInventoryNetworkAssociationBuilderTests.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs` (`FirewallToSubnet`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipArmKind.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryReadSubnetArmId`, `HasSubnetListedOnVirtualNetwork`)

## What to build

1. Add `Microsoft.Network/bastionHosts` to `HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists`, using the same network API version as `azureFirewalls`. The relative path is `providers/Microsoft.Network/bastionHosts`.
2. When the resource type contains `bastionHosts`, flatten `ipConfigurations` the way `AddNicProperties` already does for a network interface. Write `ipConfiguration.subnet.id[{index}]`, and for index 0 also write `ipConfiguration.subnet.id`. When that configuration has a public IP, write `ipConfiguration.publicIPAddress.id[{index}]` too.
3. From those subnet ids, write a `bastionToSubnet` association, the same shape as `firewallToSubnet`. Add the constant, a Bastion arm kind, and an observed catalog row beside `FirewallToSubnet`. The edge verb is `CONNECTS_TO`. The inference source is `inventory-bastion-subnet`.
4. When the diagram graph is built, copy only these snapshot property keys onto the matching graph node:
   - Bastion: `ipConfiguration.subnet.id` and every key that starts with `ipConfiguration.subnet.id[`
   - Virtual network: `subnets`
   Do not copy the rest of the property bag. Leave the SB-04 classifier as it is. Those copied keys are what `TryReadSubnetArmId` and `HasSubnetListedOnVirtualNetwork` already accept.

Do not add virtual network gateways to the type list. Do not draw subnet cards. Do not change peel rank 20.

## Tests

1. Expanding a Bastion payload whose `ipConfigurations[0].properties.subnet.id` is `AzureBastionSubnet` stores that id as `ipConfiguration.subnet.id` and as `ipConfiguration.subnet.id[0]`.
2. A Bastion resource with that property produces one `bastionToSubnet` association whose target is that subnet id.
3. A snapshot graph whose Bastion properties contain `ipConfiguration.subnet.id[0]`, and whose parent virtual network properties contain a `subnets` array with that same id, still has both values on the graph nodes. Classifying that Bastion is not Orphaned. The connection-state message does not contain `is not in this inventory snapshot`.
4. A Bastion payload with no `ipConfigurations` still has no subnet id. Do not invent one.

Use the expander tests, the association-builder tests, and a focused graph-resolver test beside `AzureInventorySnapshotGraphResolverPeeringTests`. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit. For the extractor, compile `ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj` and run the expander and association-builder tests. If you edit Core, compile `ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj`. If you edit the graph resolver, compile `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` and run the new graph-resolver test.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run SB-01, SB-02, SB-03, SB-04, EX-SP, VN-07, or SN-QQ as greenfield.

## Done when

A Bastion read with a subnet id keeps that id, the diagram graph shows it to the existing classifier, and a snapshot that also lists that subnet does not caption the Bastion with `required subnet is not in this inventory snapshot`. A snapshot captured before this change keeps the sentence until that subscription is captured again.
