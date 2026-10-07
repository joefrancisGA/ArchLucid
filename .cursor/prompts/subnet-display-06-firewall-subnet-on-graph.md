# SB-06 — Put the firewall subnet id on the diagram graph

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SB-02 or SB-03 in this session. Do not add **Show subnets**. Do not change the SB-04 classifier wording.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`

**Depends on:** SB-04 and SB-05, which are already on master. The outline says `Missing a required link: required subnet is not in this inventory snapshot` for `fw_hi_nprd_wvd` (`Microsoft.Network/azureFirewalls`, resource group `anly-edw-nprd-hi`). There is no subnet name in that sentence. The owner confirmed the subnet exists in Azure.

## Goal

The diagram graph the orphan classifier reads carries the firewall subnet id that the snapshot already stored. When the parent virtual network in that same snapshot lists the subnet, the firewall card and the outline Problem column no longer say the required subnet is missing. A snapshot that already contains `ipConfigurations` does not need another Azure read.

## Why

The sentence with no subnet name is the blank-id branch in `TryClassifyOrphanedSubnetDependentResource`. It runs for a firewall only when the analysis graph has no subnet id and no edge to a subnet node.

`AddAzureFirewallProperties` already stores the firewall `ipConfigurations` array. `AddFirewallAssociations` already writes `firewallToSubnet` from `properties.subnet.id` inside that array. `TryReadSubnetArmId` already parses an `ipConfigurations` JSON array. `HasSubnetListedOnVirtualNetwork` already accepts that id when the parent virtual network node's `subnets` property contains it. SB-05 already copies `subnets` onto the virtual-network graph node.

`HydrateSubnetPlacementProperties` copies Bastion `ipConfiguration.subnet.id` keys and the virtual network `subnets` array. It does not copy firewall `ipConfigurations`. The classifier never sees the id, so it never consults the virtual network list. `firewallToSubnet` does not clear the sentence unless the subnet is its own graph node. On the Full subscription plate the subnet is not a card.

Do not guess a subnet named `AzureFirewallSubnet` when the firewall row has no subnet id. Do not treat a virtual-hub firewall (`virtualHub.id`, no subnet id) as this bug. Leave that firewall on the existing sentence.

## Read first

- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs` (`HydrateSubnetPlacementProperties`)
- `ArchLucid.Application.Tests/InfraEvidence/AzureInventorySnapshotGraphResolverPeeringTests.cs` (`TryResolveGraphAsync_copies_bastion_subnet_and_vnet_subnets_properties`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs` (`AddAzureFirewallProperties`, `AddNicProperties`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs` (`AddFirewallAssociations`)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryReadSubnetArmId`, `TryReadSubnetArmIdFromIpConfigurations`, `HasSubnetListedOnVirtualNetwork`)
- `ArchLucid.Integrations.AzureExtractor.Tests/HostedAzureInventoryResourcePropertyExpanderTests.cs`

## What to build

1. When the diagram graph is built, copy the snapshot property key `ipConfigurations` onto the matching `Microsoft.Network/azureFirewalls` graph node. Copy nothing else from that property bag. Leave the SB-04 classifier as it is. The copied JSON is what `TryReadSubnetArmId` already accepts, and the virtual network `subnets` copy from SB-05 is what `HasSubnetListedOnVirtualNetwork` already accepts.
2. When expanding a firewall, also flatten `ipConfigurations` the way `AddNicProperties` already does. Write `ipConfiguration.subnet.id[{index}]` for each configuration that has `properties.subnet.id`. When `managementIpConfiguration.properties.subnet.id` is present, write it as `managementIpConfiguration.subnet.id`. Copy those flattened keys onto the firewall graph node as well, using the same allow-list as the Bastion keys: exact `managementIpConfiguration.subnet.id`, and every key that starts with `ipConfiguration.subnet.id[`.
3. Teach `AddFirewallAssociations` to read the flattened keys in addition to the raw `ipConfigurations` array, so a later capture still emits `firewallToSubnet`. Do not add a new association type.

Do not add another Azure list call. Firewalls are already on `HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists`. Do not draw subnet cards. Do not change peel rank 20. Do not change the Bastion copy. Do not invent a subnet id.

## Tests

1. Expanding a firewall payload whose `ipConfigurations[0].properties.subnet.id` is `AzureFirewallSubnet` still stores the raw `ipConfigurations` array and also stores that id as `ipConfiguration.subnet.id[0]`. A `managementIpConfiguration.properties.subnet.id` of `AzureFirewallManagementSubnet` is stored as `managementIpConfiguration.subnet.id`.
2. A snapshot graph whose firewall properties contain `ipConfigurations` with that subnet id, and whose parent virtual network properties contain a `subnets` array with the same id, still has both values on the graph nodes. Classifying that firewall is not Orphaned. The connection-state message does not contain `is not in this inventory snapshot`. There is no subnet node on the graph.
3. A firewall payload with an empty `ipConfigurations` array and no `managementIpConfiguration` still has no subnet id. Do not invent `AzureFirewallSubnet`.

Use the expander tests and a focused graph-resolver test beside `TryResolveGraphAsync_copies_bastion_subnet_and_vnet_subnets_properties`. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit. If you edit the graph resolver, compile `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` and run the new graph-resolver test. If you edit the extractor, compile `ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj` and run the expander tests. If you edit the association builder, run `HostedAzureInventoryNetworkAssociationBuilderTests`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run SB-01, SB-02, SB-03, SB-04, SB-05, EX-SP, VN-07, or SN-QQ as greenfield.

## Done when

A firewall whose snapshot already stores `ipConfigurations` with a subnet id, and whose parent virtual network lists that same id, is not captioned `required subnet is not in this inventory snapshot`. Rendering the current snapshot is enough for that case. A firewall row with no subnet id keeps the sentence. A snapshot captured before the flattener still works, because the raw `ipConfigurations` copy is what the classifier already parses.
