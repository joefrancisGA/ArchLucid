# SB-07 — Save the firewall subnet id in the SecureNow package

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SB-02, SB-03, or DFV-26 in this session. Do not add **Show subnets**. Do not change the classifier wording. Do not draw subnet cards.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`

**Depends on:** SB-04, SB-05, and SB-06, which are already on master. The outline says `Missing a required link: required subnet is not in this inventory snapshot` for `fw_hi_nprd_wvd` (`Microsoft.Network/azureFirewalls`, resource group `anly-edw-nprd-hi`). There is no subnet name in that sentence. The owner confirmed the subnet exists in Azure. It is `AzureFirewallSubnet` on the firewall's virtual network.

## Goal

The next SecureNow package stores the firewall's own subnet id on the firewall resource, and stores that same id in the parent virtual network's `subnets` list. The diagram graph already copies those keys. After the owner re-uploads, `fw_hi_nprd_wvd` no longer says the required subnet is missing.

## Why

The sentence with no subnet name is the blank-id branch in `TryClassifyOrphanedSubnetDependentResource`. It runs for `Microsoft.Network/azureFirewalls` only when the diagram graph has no subnet id and no edge to a subnet node. A named sentence (`required subnet AzureFirewallSubnet is not in this inventory snapshot`) would mean the id was stored and the subnet resource was absent. This sentence means the id was never stored.

`New-ArchLucidCollectedResourceGraphRecord` sets `properties` to `{}`. The Resource Graph inventory query does not project firewall `ipConfigurations`. `Add-ArchLucidArgNetworkAssociationRowsFromFirewallRecord` already reads those configurations while it builds `firewallToSubnet`, then keeps the private IP only in memory. It does not write `ipConfiguration.subnet.id[0]` onto the firewall resource. `Add-ArchLucidBastionSubnetPropertiesFromAssociations` does that write for a Bastion, from `bastionToSubnet`, before `resources.json` is saved. There is no firewall equivalent.

SB-06 copies `ipConfigurations`, `ipConfiguration.subnet.id[`, and the virtual network `subnets` array onto the diagram graph when the snapshot already has them. This ZIP has neither. Copying every `firewallToSubnet` row onto the firewall would be the wrong subnet: that association also names application subnets whose route next hop is the firewall. The orphan sentence is about the firewall's own IP-configuration subnet.

`HasSubnetListedOnVirtualNetwork` clears the sentence when the virtual-network graph node lists that subnet id. The virtual-network ARG query already projects `properties.subnets`, and that projection is not written back onto the virtual-network resource. A firewall id with an empty virtual-network `subnets` property still fails the check when the subnet card has been peeled.

## Read first

- `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`
- `scripts/azure/ArchLucid.ResourceGraph.helpers.ps1` (`New-ArchLucidCollectedResourceGraphRecord`)
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Add-ArchLucidArgNetworkAssociationRowsFromFirewallRecord`, the `microsoft.network/azurefirewalls` and `microsoft.network/virtualnetworks` query specs)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Add-ArchLucidBastionSubnetPropertiesFromAssociations`)
- `scripts/azure/Get-SecureNowAzurePackage.ps1` and `scripts/azure/Get-ArchLucidAzurePackage.ps1` (the bastion property copy sits immediately before `Write-ArchLucidResourcesJsonStream`)
- `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1`
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs` (`HydrateSubnetPlacementProperties`)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryReadSubnetArmId`, `HasSubnetListedOnVirtualNetwork`)

## What to build

1. Branch `sb/07-firewall-subnet-capture` from current `master`.
2. While the firewall ARG page is in memory, remember each IP-configuration subnet id with the firewall resource id. This is the subnet on `ipConfigurations[].properties.subnet.id`, and `managementIpConfiguration.properties.subnet.id` when that id is present. Do not remember a subnet that appears only because a user route uses this firewall as a `VirtualAppliance` next hop.
3. Before `resources.json` is written, stamp the matching firewall resource the way the Bastion stamp works. Write `ipConfiguration.subnet.id[0]` for the first IP-configuration subnet id, and `ipConfiguration.subnet.id[n]` for each further one. Also write `ipConfiguration.subnet.id` for the first. When a management subnet id is present, write `managementIpConfiguration.subnet.id`. Leave a key that is already set. Do not write `privateIPAddress`, firewall rules, threat intel, or the route list.
4. Call that stamp from both package scripts, beside `Add-ArchLucidBastionSubnetPropertiesFromAssociations`.
5. From the virtual-network ARG page, when that resource's `properties.subnets` is empty, write a JSON array of objects that each have an `id`. Include every subnet id the query already returned, including `AzureFirewallSubnet`. Do not replace a `subnets` value that is already present. Do not add NSG, route-table, or address-prefix fields to that compact array.
6. Leave the classifier and `HydrateSubnetPlacementProperties` alone. They already read these keys. Do not add a subnet, virtual network, NIC, or NSG card. Do not change peel rank 20. Do not change Data Flow **Routes through**.

## Tests

1. A firewall ARG record whose IP configuration names `AzureFirewallSubnet` stamps `ipConfiguration.subnet.id` and `ipConfiguration.subnet.id[0]` with that id. The private IP does not appear on the resource.
2. A `firewallToSubnet` row that exists only because a route next hop matches the firewall does not become `ipConfiguration.subnet.id`.
3. A virtual network whose `properties.subnets` is empty receives a `subnets` array containing the firewall subnet id. A virtual network that already has `subnets` keeps that value.
4. A firewall with no IP-configuration subnet id is left without one. Do not invent `AzureFirewallSubnet`.

## Acceptance criteria

- The new package can name the firewall's own subnet without storing the private IP.
- The parent virtual network lists that subnet id.
- `fw_hi_nprd_wvd` is not captioned with the unnamed missing-subnet sentence after the new package is uploaded.
- A firewall that Azure really left without a subnet id keeps the sentence.
- Routed application subnets stay on `firewallToSubnet` and are not written as the firewall's own subnet.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Read-only Resource Graph. Do not collect firewall rules.
- No `ConfigureAwait(false)` in tests.
- Working-tree safety. Stage only the Resource Graph association helper, the property stamp, the two package scripts, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"
```

## Done when

Tests pass. Tell the owner the current `Hmd_HI_HAP_Non_Prod` ZIP stays unchanged until they re-run `scripts/azure/Run-SecureNowAzureExtractor.ps1` and upload the new package. After that upload, `fw_hi_nprd_wvd` should have `ipConfiguration.subnet.id[0]` set to its `AzureFirewallSubnet`, the parent virtual network `subnets` list should contain that id, and the outline should no longer say `required subnet is not in this inventory snapshot` with no subnet name. Wait for that look before any commit.
