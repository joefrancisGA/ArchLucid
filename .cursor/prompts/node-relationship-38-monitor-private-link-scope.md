# NR-38 — Link an Azure Monitor private link scope to visible members

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not treat a private link scope as a data-flow hop. Do not put a Log Analytics workspace on the plate. Do not infer a member from a name or a resource group.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04, NR-05, and NR-24. The owner is looking at a `Microsoft.Insights/privateLinkScopes` card on the full subscription diagram. The outline says it stands alone. Scoped workspaces stay off the plate. Membership and private-endpoint proof are not stored.

## Goal

The next inventory capture stores each Azure Monitor private link scope (AMPLS) scoped resource and each scope private-endpoint connection. When a scoped resource id is already a visible node, draw one solid **Scopes monitoring for** line from that scope to that node. When a stored private endpoint cites the scope, reuse the existing **Private access** path from NR-24. A scope with no visible member and no cited private endpoint stays unconnected. Scoped-resource and private-endpoint-connection child rows are not diagram cards. Log Analytics workspaces stay off the plate.

## Why

`InventoryDiagramIndirectRelationshipClassifier` treats any ARM type that contains `privateLinkScopes` as `PrivateLinkScope`. `InventoryDiagramOrphanedStateClassifier.TryClassifyUnconnected` then marks that node Unconnected when it has no cited diagram edge. The outline renders Unconnected as `Stands alone`. That label is the current evidence, not a claim that Azure has no members.

NR-04 named the cited proof: scoped-resource membership and private-endpoint connections. Nothing collects them.

Customer script inventory (`Get-ArchLucidAzureResourcesViaResourceGraph`) projects `id`, `name`, `type`, `location`, `tags`, `sku`, and `resourceGroup`. It does not project AMPLS properties. `Get-ArchLucidArgNetworkAssociationQuerySpecs` has no query for `microsoft.insights/privatelinkscopes/scopedresources` or `microsoft.insights/privatelinkscopes/privateendpointconnections`. A scope GET does not embed the member list. Members live on child resources of type `Microsoft.Insights/privateLinkScopes/scopedResources`, in `properties.linkedResourceId`. Private endpoints that land on the scope live on `Microsoft.Insights/privateLinkScopes/privateEndpointConnections`, in `properties.privateEndpoint.id`.

Hosted collection lists network types in `HostedAzureArmNetworkTypeListDescriptors` and PaaS types in `HostedAzureArmPaasTypeListDescriptors`. Neither list includes `Microsoft.Insights/privateLinkScopes`, so a hosted snapshot can omit the scope entirely. Customer script is why an AMPLS card can already be on the plate.

`InventoryDiagramDataFlowTraversalHopClassifier` does not treat a private link scope as a traversal hop. Keep that. AMPLS is a monitoring-plane access boundary, in the same family as an NSG, not a firewall hop.

`Contains("privateLinkScopes")` would also classify Azure Arc `Microsoft.HybridCompute/privateLinkScopes` and AMPLS child rows as the same category if those rows become nodes. Only `Microsoft.Insights/privateLinkScopes` is a diagram node for this prompt.

A Log Analytics workspace is not a general-diagram card. Do not add one to show AMPLS membership. Draw **Scopes monitoring for** only when the linked resource is already a visible node (for example an Application Insights component or a data-collection endpoint already on the plate).

NR-24 already labels a hidden private endpoint **Private access**. Reuse that path when the stored private-endpoint target is the AMPLS. Do not invent a second private-endpoint edge renderer.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramIndirectRelationshipClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowTraversalHopClassifier.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryNetworkSecurityPerimeterResourceTypes.cs` (exact-type + omit-child pattern)
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Get-ArchLucidArgNetworkAssociationQuerySpecs`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmNetworkTypeListDescriptors.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmPaasTypeListDescriptors.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs`
- `.cursor/prompts/node-relationship-24-private-access.md` (label reuse only)

## What to build

1. Add association type `monitorPrivateLinkScopeToResource`. Evidence label **Current**. Diagram label **Scopes monitoring for**. Inference source `inventory-ampls-scoped-resource`. One class per new type if the catalog pattern needs a new definition object. Reuse the existing association row and edge materializer. Do not add a second edge path.
2. Customer script: add one Resource Graph query for `microsoft.insights/privatelinkscopes/scopedresources`. Project the child id and `linkedResourceId = tostring(properties.linkedResourceId)`. The scope id is the child id with the `/scopedResources/{name}` suffix removed. Emit one association row from that scope id to `linkedResourceId` when both ids are non-empty.
3. Customer script: add one Resource Graph query for `microsoft.insights/privatelinkscopes/privateendpointconnections`. Project the child id and `privateEndpointId = tostring(properties.privateEndpoint.id)`. Feed that private-endpoint id into the existing private-endpoint target path so NR-24 can draw **Private access**. Do not add a third edge renderer.
4. Hosted extractor: list `Microsoft.Insights/privateLinkScopes`, then list `scopedResources` and `privateEndpointConnections` children with a GET. Use a stable `api-version` documented for Azure Monitor private link scopes. Do not invent a preview version when Learn documents a GA version. Store the same scope id, linked resource id, and private-endpoint id.
5. When the linked resource id is a visible node in the snapshot, draw one solid **Scopes monitoring for** edge from the scope to that member. Two scoped-resource rows that name the same member produce one edge. A linked Log Analytics workspace that is not a diagram node does not create a node and does not create an edge.
6. Classify only the exact type `Microsoft.Insights/privateLinkScopes` as `PrivateLinkScope`. Do not emit diagram nodes for `.../scopedResources` or `.../privateEndpointConnections`. Do not classify `Microsoft.HybridCompute/privateLinkScopes` as the same category.
7. Keep the new association out of `InventoryDiagramDataFlowTraversalHopClassifier`. Do not add the scope to `IsTraversalHopArmType`.
8. A scope with no visible member and no cited private endpoint stays Unconnected. The outline keeps `Stands alone`. A linked resource id that is not a visible node does not create a node.

Do not draw a line because the scope name contains `monitor` or a workspace name. Do not draw a line from resource-group collocation. Do not query AMPLS diagnostic logs. Do not add a Log Analytics workspace card. Do not change NR-24's hidden-versus-visible private-endpoint rule.

Bump `scriptVersion` and `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch from the version already in those files.

## Tests

1. A scoped-resource whose id ends in `/privateLinkScopes/ampls-prod/scopedResources/appi-1` and whose `linkedResourceId` is an Application Insights component already on the plate emits one `monitorPrivateLinkScopeToResource` row from `ampls-prod` to that component. A second scoped-resource row to the same component does not emit a second diagram edge.
2. A snapshot with that stored row draws one solid **Scopes monitoring for** edge. The scope is not Unconnected. The edge is not a data-flow hop.
3. A scoped-resource whose `linkedResourceId` is a Log Analytics workspace that is not a diagram node stores the association row and draws no edge and no workspace card.
4. A scope with no scoped-resource row and no private-endpoint connection stays Unconnected.
5. A scoped-resource or private-endpoint-connection child resource is not a diagram node.
6. A hidden private endpoint whose stored target is the AMPLS draws **Private access** using the NR-24 path. A visible private endpoint, when Show network details is on, stays a card and does not also draw that shortcut.
7. `Microsoft.HybridCompute/privateLinkScopes` is not classified as `PrivateLinkScope`.

Use the Resource Graph association tests, one hosted association builder test with a fake payload, and one diagram applier or materializer test. Do not call Azure. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests. Run the focused Pester file for the Resource Graph association change.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-37 or SB-01 through SB-06 as greenfield.

## Done when

After the next collection, the AMPLS has one solid **Scopes monitoring for** line to each in-snapshot visible resource cited by a stored scoped-resource row. A cited private endpoint uses **Private access**. The scope no longer stands alone when at least one such visible member or cited private endpoint is in the snapshot. A scope with no stored visible member still stands alone. The current snapshot keeps the old result until that subscription is captured again.
