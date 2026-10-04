# EX-PIP-01 — Save the public IP configuration when the customer package is collected

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SB-02 or SB-03 in this session. Do not add **Show subnets**. Do not change the public-IP classifier wording.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/AZURE_EXTRACTOR_PUBLIC_IP_PARENT_LUNA_PROMPTS.md`

**Depends on:** script `0.4.3` on master. If `$scriptVersion` in either customer package script is not `0.4.3`, stop.

## Goal

The next customer zip stores each attached public IP’s `ipConfiguration.id`, writes the existing `publicIpToNic` row, and the diagram graph the orphan classifier reads carries that id. A public IP whose parent is already in the snapshot no longer says `Missing a required link: no IP configuration or parent reference`.

## Why

That sentence is the fallthrough in `TryClassifyOrphanedPublicIp`. It means the graph node has no `ipConfiguration.id`, no `publicIpToNic` / `EXPOSES` / `inventory-public-ip` edge, and no other node citing this public IP. A parent id that is present while the parent row is absent uses a different sentence: `parent resource {name} no longer exists`.

On `Hmd_HI_HAP_Non_Prod`, a public IP in resource group `tie0-mcnp-npra-ni` has DNS name `kubernetes` and the portal says **Associated to: Virtual machine**. The address belongs to an AKS node. Its `ipConfiguration` points at a scale-set NIC, type `Microsoft.Compute/virtualMachineScaleSets/virtualMachines/networkInterfaces`, not `Microsoft.Network/networkInterfaces`.

`Get-ArchLucidArgNetworkAssociationQuerySpecs` queries virtual machines, `microsoft.network/networkinterfaces`, Bastion hosts, virtual networks, and private endpoints. It does not query `microsoft.network/publicipaddresses`. The NIC query never sees a scale-set NIC, so it never emits `publicIpToNic` for this address. `New-ArchLucidCollectedResourceGraphRecord` stores `properties = @{}`. `Get-ArchLucidAzureNetworkAssociationCompanionRows` can emit `publicIpToNic` from `ipConfiguration.id`, and that key is empty on the Resource Graph inventory, so the companion path adds nothing.

`AzureInventorySnapshotGraphResolver` copies Bastion subnet keys and the virtual network `subnets` array onto graph nodes. It does not copy `ipConfiguration.id`. Stamping that key into `resources.json` alone leaves the classifier blind. `AzureInventoryParentAttachmentParentResolver.AddPublicIpParents` reads `ipConfiguration.id` on the graph node and a `publicIpToNic` edge. `AzureInventoryArmEndpointNodeResolver` already attaches that edge to an ancestor when the scale-set NIC itself is not a snapshot row.

A zip collected before this change keeps the sentence. Do not backfill old zips. Do not invent a parent when `ipConfiguration` is absent.

## Read first

- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Get-ArchLucidArgNetworkAssociationQuerySpecs`, `Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph`, `Add-ArchLucidArgNetworkAssociationRowsFromBastionRecord`, `ConvertFrom-ArchLucidArgJsonArray`, `Get-ArchLucidArgNestedProperty`)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Add-ArchLucidBastionSubnetPropertiesFromAssociations`, `Resolve-ArchLucidAssociatedResourceFromIpConfiguration`, the `publicIPAddresses` block in `Get-ArchLucidAzureNetworkAssociationCompanionRows`)
- `scripts/azure/ArchLucid.ResourceGraph.helpers.ps1` (`New-ArchLucidCollectedResourceGraphRecord`)
- `scripts/azure/Get-SecureNowAzurePackage.ps1` (`$scriptVersion`, the Bastion stamp, `Write-ArchLucidResourcesJsonStream`)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` (the same two sites)
- `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1` (the spec count is 5)
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs` (`HydrateSubnetPlacementProperties`)
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventoryArmEndpointNodeResolver.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryParentAttachmentParentResolver.cs` (`AddPublicIpParents`)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyOrphanedPublicIp`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs` (`PublicIpToNic`)
- `ArchLucid.Application.Tests/InfraEvidence/AzureInventorySnapshotGraphResolverPeeringTests.cs`

## What to build

1. Add a query spec, kind `publicIpAddress`, and process it through `Invoke-ArchLucidResourceGraphPagedAssociationQuery`.

```kusto
Resources
| where type =~ 'microsoft.network/publicipaddresses'
| project id, type, ipConfiguration = properties.ipConfiguration
```

Apply the same resource-group filter the other specs use. Keep `-First 1000` and the skip-token loop. A failed page keeps rows already accepted and warns with the query kind. Do not rethrow.

2. Add `Add-ArchLucidArgNetworkAssociationRowsFromPublicIpRecord`. Read `ipConfiguration` as an object or a JSON string. Take its `id` with `Get-ArchLucidArgNestedProperty`. Do not wrap the value in `"$( ... )"` before parsing. When that id contains `/ipConfigurations/`, emit the existing association type `publicIpToNic`. `fromResourceId` is the public IP. `toResourceId` is the resource id `Resolve-ArchLucidAssociatedResourceFromIpConfiguration` already returns, including a scale-set NIC id. Leave `nicToSubnet`, `bastionToSubnet`, and the other existing types alone.

3. Stamp `ipConfiguration.id` onto that public IP and rewrite `resources.json`, mirroring `Add-ArchLucidBastionSubnetPropertiesFromAssociations`. The stored value is the full configuration ARM id, including `/ipConfigurations/{name}`. The association target stays the stripped parent. Keep those two values distinct: carry the full id in a small in-memory list built while the ARG row is processed, and pass that list into the stamp. Do not add a field to `network-associations.json`. Do not write the stripped parent into `ipConfiguration.id`. Call the stamp beside the Bastion stamp, before `Write-ArchLucidResourcesJsonStream`, in both customer scripts. Write the key only when it is absent. An unattached public IP, with no `ipConfiguration`, gets no row and no key.

4. When the diagram graph is built, copy snapshot key `ipConfiguration.id` onto graph nodes whose type contains `publicIPAddresses`. Extend `HydrateSubnetPlacementProperties`, or add a sibling called from the same place. Copy only that key. Leave the classifier, the parent resolver, and `AzureInventoryArmEndpointNodeResolver` as they are. A `publicIpToNic` edge whose target resolves to an ancestor is already enough for `AddPublicIpParents` when that ancestor is a graph node.

5. Bump `$scriptVersion` from `0.4.3` to `0.4.4` in both customer scripts. Do not rewrite fixtures that embed `"0.4.0"`, `"0.4.1"`, `"0.4.2"`, or `"0.4.3"` as sample zip content.

Do not add an association type. Do not add public IP addresses to `HostedAzureArmNetworkTypeListDescriptors`. `HostedAzureInventoryResourcePropertyExpander` already writes `ipConfiguration.id` when a hosted payload has it; the graph copy helps that snapshot too. Do not fill `resources.json` with full ARM property bags. Do not change the inventory `project` list on the primary resource query.

## Tests

Extend `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1`.

1. The spec count is 6, and the new spec matches `microsoft.network/publicipaddresses`.
2. A public IP whose `ipConfiguration` is an object, with `id` pointing at `.../virtualMachineScaleSets/vmss1/virtualMachines/0/networkInterfaces/nic1/ipConfigurations/ipconfig1`, emits one `publicIpToNic` row. `toResourceId` is that id with `/ipConfigurations/ipconfig1` removed.
3. The same `ipConfiguration` passed as a JSON string emits the same row.
4. `$null` and a public IP with no `ipConfiguration` emit no `publicIpToNic` row.

Extend `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`.

5. Stamping from that `publicIpToNic` fact writes `ipConfiguration.id` onto a public IP whose property bag was empty. The stored value is the full configuration id, not the stripped parent.

Add a focused test beside `TryResolveGraphAsync_copies_bastion_subnet_and_vnet_subnets_properties` in `AzureInventorySnapshotGraphResolverPeeringTests`.

6. A public IP snapshot property `ipConfiguration.id` whose parent NIC is also a graph node is copied onto the public IP graph node. Classifying that public IP is not Orphaned. `MissingRequirementMessage` does not contain `no IP configuration or parent reference`. State may be Unconnected. Do not require State null.
7. A public IP with no `ipConfiguration.id`, and no `publicIpToNic` relationship, still has no `ipConfiguration.id` on its graph node.

Do not add a live Azure test. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Run `pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"` and the same command for `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`.
- For the graph resolver, compile `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` and run the new test. If that project fails to compile on an unrelated Persistence package conflict, build `ArchLucid.Core` and `ArchLucid.Application`, then build the test project with `-p:BuildProjectReferences=false` and run `dotnet test --no-build` on the new test.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run EX-SP, EX-PE, SB-01, SB-02, SB-03, SB-04, SB-05, VN, or SN-QQ as greenfield.

## Done when

A Pester case that passes a scale-set NIC `ipConfiguration` writes one `publicIpToNic` row and stamps the full `ipConfiguration.id` onto the public IP. The diagram graph shows that key to the existing classifier. A public IP whose parent NIC is in the snapshot no longer captions `no IP configuration or parent reference`. Both customer scripts stamp `scriptVersion` `0.4.4`. A zip collected before this change keeps the sentence until that subscription is collected again.
