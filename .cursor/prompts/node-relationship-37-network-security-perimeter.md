# NR-37 — Link a network security perimeter to its associated resources

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not treat a perimeter as a data-flow hop. Do not infer a member from a name, a resource group, or `publicNetworkAccess`.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04 and NR-05. The owner is looking at `databricks-nsp` (`Microsoft.Network/networkSecurityPerimeters`) on the full subscription diagram. The outline says it stands alone. That name is not evidence that a Databricks workspace is a member.

## Goal

The next inventory capture stores each network security perimeter resource association. When the association names a resource that is already a node in the snapshot, draw one solid **Secures** line from that perimeter to that resource. A perimeter with no stored association stays unconnected. Profiles, access rules, and association resources are not diagram cards.

## Why

`InventoryDiagramIndirectRelationshipClassifier` treats any ARM type that contains `networkSecurityPerimeters` as `NetworkSecurityPerimeter`. `InventoryDiagramOrphanedStateClassifier.TryClassifyUnconnected` then marks that node Unconnected when it has no cited diagram edge. The outline renders Unconnected as `Stands alone`. That label is the current evidence, not a claim that Azure has no members.

NR-04 named the cited proof: explicit profile membership and resource associations. Nothing collects them.

Customer script inventory (`Get-ArchLucidAzureResourcesViaResourceGraph`) projects `id`, `name`, `type`, `location`, `tags`, `sku`, and `resourceGroup`. It does not project perimeter properties. `Get-ArchLucidArgNetworkAssociationQuerySpecs` has no query for `microsoft.network/networksecurityperimeters/resourceassociations`. A perimeter GET does not embed the member list. Members live on child resources of type `Microsoft.Network/networkSecurityPerimeters/resourceAssociations`, in `properties.privateLinkResource.id`, with `properties.profile.id` and `properties.accessMode`.

Hosted collection lists network types in `HostedAzureArmNetworkTypeListDescriptors`. That list does not include network security perimeters, so a hosted snapshot can omit the perimeter entirely. Customer script is why `databricks-nsp` is on the plate.

`InventoryDiagramDataFlowTraversalHopClassifier` does not treat a perimeter as a traversal hop. Keep that. A perimeter is a PaaS access boundary, in the same family as an NSG, not a firewall hop.

`Contains("networkSecurityPerimeters")` would also classify profiles, access rules, and association rows as the same category if those rows become nodes. Only the perimeter resource itself is a diagram node.

A Databricks workspace still links to its subnets through the existing `databricksWorkspaceToSubnet` association. That is VNet injection. It is not perimeter membership.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramIndirectRelationshipClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowTraversalHopClassifier.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Get-ArchLucidArgNetworkAssociationQuerySpecs`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmNetworkTypeListDescriptors.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramContainerImageRelationshipApplier.cs` (label pattern only)

## What to build

1. Add association type `networkSecurityPerimeterToResource`. Evidence label **Current**. Diagram label **Secures**. Inference source `inventory-nsp-association`. One class per new type if the catalog pattern needs a new definition object. Reuse the existing association row and edge materializer. Do not add a second edge path.
2. Customer script: add one Resource Graph query for `microsoft.network/networksecurityperimeters/resourceassociations`. Project the association id, `privateLinkResourceId = tostring(properties.privateLinkResource.id)`, `profileId = tostring(properties.profile.id)`, and `accessMode = tostring(properties.accessMode)`. The perimeter id is the association id with the `/resourceAssociations/{name}` suffix removed. Emit one association row from that perimeter id to `privateLinkResourceId` when both ids are non-empty.
3. Hosted extractor: list the same child resources with a GET. Use a stable `api-version` documented for Network Security Perimeter resource associations. Do not invent a preview version when Learn documents a stable version. Store the same perimeter id, member id, profile id, and access mode.
4. When the member id is a node in the snapshot, draw one solid **Secures** edge from the perimeter to that member. Two associations that name the same member produce one edge. Keep profile id and access mode on the edge properties.
5. Classify only the exact type `Microsoft.Network/networkSecurityPerimeters` as `NetworkSecurityPerimeter`. Do not emit diagram nodes for `.../profiles`, `.../profiles/accessRules`, or `.../resourceAssociations`.
6. Keep the new association out of `InventoryDiagramDataFlowTraversalHopClassifier`. Do not add the perimeter to `IsTraversalHopArmType`.
7. A perimeter with no stored association stays Unconnected. The outline keeps `Stands alone`. A member id that is not a node in the snapshot does not create a node.

Do not draw a line because the perimeter name contains `databricks`. Do not draw a line from resource-group collocation. Do not treat `publicNetworkAccess` = `SecuredByPerimeter` as membership unless a resource association cites that resource id. Do not collect access-rule CIDRs or inbound/outbound prefixes in this session. Do not query NSP diagnostic logs. Do not change Databricks subnet edges.

Bump `scriptVersion` and `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch from the version already in those files.

## Tests

1. A resource association whose id ends in `/networkSecurityPerimeters/databricks-nsp/resourceAssociations/storage-1` and whose `privateLinkResource.id` is a storage account emits one `networkSecurityPerimeterToResource` row from `databricks-nsp` to that storage account. Profile id and access mode are stored. A second association to the same storage account does not emit a second diagram edge.
2. A snapshot with that stored row draws one solid **Secures** edge. The perimeter is not Unconnected. The edge is not a data-flow hop.
3. A perimeter with no association row stays Unconnected.
4. A profile, access rule, or resource association resource is not a diagram node.
5. A perimeter named `databricks-nsp` with no association does not link to a Databricks workspace in the same resource group.
6. A storage account whose only signal is `publicNetworkAccess` = `SecuredByPerimeter` does not gain a **Secures** edge.

Use the Resource Graph association tests, one hosted association builder test with a fake payload, and one diagram applier or materializer test. Do not call Azure. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests. Run the focused Pester file for the Resource Graph association change.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-36 or SB-01 through SB-06 as greenfield.

## Done when

After the next collection, `databricks-nsp` has one solid **Secures** line to each in-snapshot resource cited by a stored resource association. It no longer stands alone when at least one such member is in the snapshot. A perimeter with no stored association still stands alone. The current snapshot keeps the old result until that subscription is captured again.
