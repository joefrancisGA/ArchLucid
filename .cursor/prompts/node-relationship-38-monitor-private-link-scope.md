# NR-38 — Link an Azure Monitor private link scope to scoped resources and private endpoints

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not treat a private link scope as a data-flow hop. Do not infer a scoped member from a name, a resource group, or diagnostic settings alone.

**Implementation (Composer):** shipped in **PR #4703** — follow-up fixes branch from `origin/master` only. Paste [`.cursor/prompts/node-relationship-39-kubernetes-service-load-balancer-composer.md`](node-relationship-39-kubernetes-service-load-balancer-composer.md) for the next slice (NR-39).

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04, NR-05, and NR-24. The owner is looking at `extension-pls` (`Microsoft.Insights/privateLinkScopes`) on the full subscription diagram. The outline says it stands alone. That name is not evidence that a Log Analytics workspace or Application Insights component is already linked in Azure.

## Goal

The next inventory capture stores each Azure Monitor Private Link Scope (AMPLS) **scoped resource** and each cited **private endpoint connection** on the scope. When `properties.linkedResourceId` names a resource that is already a node in the snapshot, draw one solid **Scopes monitoring for** line from that scope to that resource. When a stored private endpoint in the snapshot is cited on the scope’s `privateEndpointConnections`, draw one solid **Private access** line from that private endpoint to the scope (same visibility rules as NR-24). A scope with no stored scoped resource and no resolvable private endpoint connection stays unconnected. Scoped-resource child rows are not diagram cards.

## Why

`InventoryDiagramIndirectRelationshipClassifier` classifies any ARM type that **contains** `privateLinkScopes` as `PrivateLinkScope`. `InventoryDiagramOrphanedStateClassifier.TryClassifyUnconnected` then marks that node Unconnected when it has no cited diagram edge. The outline renders Unconnected as `Stands alone`.

NR-04 named the cited proof: the Azure Monitor scope and its **VNet private-link configuration**. Nothing collects scoped resources or scope private endpoint connections today.

Membership is not on the parent scope GET. It lives on child resources `Microsoft.Insights/privateLinkScopes/scopedResources` (`properties.linkedResourceId`, optional `properties.kind`) and on `properties.privateEndpointConnections[]` on the scope (private endpoint resource id).

Customer script inventory does not query `microsoft.insights/privatelinkscopes/scopedresources`. Hosted collection does not list AMPLS children. The scope appears because `Get-AzResource` / Resource Graph lists the parent.

`AzureInventoryNeverShowArmTypes` already omits `Microsoft.OperationalInsights/workspaces` from inventory and diagram nodes. A scoped Log Analytics workspace is still stored in `network-associations.json`, but **no line is drawn** when the linked resource is never shown. That is honest evidence, not a failure. Application Insights components and other visible linked types can receive **Scopes monitoring for** when they are in the snapshot.

`InventoryDiagramDataFlowTraversalHopClassifier` must not treat a private link scope as a traversal hop.

`Contains("privateLinkScopes")` would classify scoped-resource children as the same indirect category if they become nodes. Only the parent `Microsoft.Insights/privateLinkScopes` is a diagram node.

Do not confuse this with `Microsoft.Network/networkSecurityPerimeters` (NR-37) or with a Kubernetes load balancer in the node resource group.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramIndirectRelationshipClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowTraversalHopClassifier.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryNeverShowArmTypes.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramPrivateAccessRelationshipApplier.cs` (NR-24 pattern)
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramNetworkSecurityPerimeterRelationshipApplier.cs` (NR-37 label applier pattern)
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmPaasTypeListDescriptors.cs` or network descriptors as appropriate
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs`

## What to build

1. Add association type `monitorPrivateLinkScopeToScopedResource`. Evidence label **Current**. Diagram label **Scopes monitoring for**. Inference source `inventory-ampls-scoped-resource`. Reuse the existing association row and `AzureInventoryNetworkAssociationEdgeMapper` path.
2. Add association type `privateEndpointToMonitorPrivateLinkScope` **only if** NR-24’s existing `privateEndpointTarget` / **Private access** path cannot represent an AMPLS scope id as the target. Prefer reusing NR-24 when the stored PE target id is the scope. Document the choice in code comments only when non-obvious.
3. Customer script: add one Resource Graph query for `microsoft.insights/privatelinkscopes/scopedresources`. Project `id`, `linkedResourceId = tostring(properties.linkedResourceId)`, and `kind = tostring(properties.kind)`. The scope id is the scoped-resource id with the `/scopedResources/{name}` suffix removed. Emit one association row from that scope id to `linkedResourceId` when both ids are non-empty. Store optional `kind` on the association row when present.
4. Customer script or companion derivation: when a collected `Microsoft.Insights/privateLinkScopes` resource has `privateEndpointConnections` in properties (full GET or ARG projection), emit rows that cite each connected private endpoint id and the scope id. Do not invent connections without stored ids.
5. Hosted extractor: list `Microsoft.Insights/privateLinkScopes` and list `scopedResources` per scope (GET with `api-version` from [Microsoft Learn](https://learn.microsoft.com/en-us/azure/templates/microsoft.insights/privatelinkscopes/scopedresources) — use `2023-06-01-preview` unless a newer stable version is documented for list). Merge scoped-resource payloads into the resource set used by `HostedAzureInventoryNetworkAssociationBuilder`. Expand `privateLinkResource` / `linkedResourceId` and scope `privateEndpointConnections` in the property expander when needed.
6. Classify only the exact type `Microsoft.Insights/privateLinkScopes` as `PrivateLinkScope`. Add `Microsoft.Insights/privateLinkScopes/scopedResources` to `AzureInventoryNeverShowArmTypes` (catalog or suffix rule). Do not emit diagram nodes for scoped-resource children.
7. When the linked resource id resolves to a visible graph node, draw one solid **Scopes monitoring for** edge. Duplicate scoped rows for the same linked resource produce one edge.
8. When a private endpoint connection row resolves to a visible private endpoint node, draw **Private access** per NR-24. Do not duplicate NR-24 behavior for non-AMPLS targets.
9. Keep both association types out of `InventoryDiagramDataFlowTraversalHopClassifier`.
10. A scope whose scoped members are only never-show types (for example Log Analytics workspaces) and that has no resolvable private endpoint connection stays **Stands alone**. Do not create a synthetic workspace node. Optional: store a completeness note in manifest warnings when the scope has scoped resources but zero visible diagram targets — only if an existing warning code pattern already exists for relationship completeness; do not invent a new warning taxonomy in this session.

Do not draw a line because the scope name ends in `-pls`. Do not draw a line from resource-group collocation. Do not treat `publicNetworkAccessForQuery` / `publicNetworkAccessForIngestion` on a workspace as scope membership without a stored `linkedResourceId`. Do not collect AMPLS access-mode exclusions or metric-dataplane subscription location in this session unless required to emit the scoped-resource row. Do not change NR-37 NSP edges.

Bump `scriptVersion` and `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch from the version already in those files.

## Tests

1. A scoped resource whose id ends in `/privateLinkScopes/extension-pls/scopedResources/law-connection` and whose `linkedResourceId` is an Application Insights component emits one `monitorPrivateLinkScopeToScopedResource` row from `extension-pls` to that component. A second scoped row to the same component does not emit a second diagram edge.
2. A scoped resource whose `linkedResourceId` is a Log Analytics workspace emits the association row in `network-associations.json` but draws **no** diagram edge when the workspace is never shown.
3. A snapshot with a visible App Insights target draws one solid **Scopes monitoring for** edge. The scope is not Unconnected. The edge is not a data-flow hop.
4. A scope with a stored `privateEndpointConnections` entry pointing at a private endpoint in the snapshot draws **Private access** from that endpoint to the scope when NR-24 rules allow it.
5. A scope with no scoped rows and no PE connections stays Unconnected.
6. A `Microsoft.Insights/privateLinkScopes/scopedResources` resource is not a diagram node.
7. A scope named `extension-pls` with no stored links does not connect to a Databricks workspace or AKS cluster in the same resource group.

Use Resource Graph association Pester tests, one hosted association builder test with fake scoped-resource and scope payloads, one `AzureInventoryNetworkAssociationEdgeMapper` test, and one diagram applier test for **Scopes monitoring for**. Do not call Azure. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-37 or SB-01 through SB-06 as greenfield.

## Done when

After the next collection, `extension-pls` has **Scopes monitoring for** to each **visible** in-snapshot scoped member, and **Private access** from each cited in-snapshot private endpoint when connections are stored. It no longer stands alone when at least one such visible link exists. Scoped Log Analytics workspaces still do not appear as nodes; the scope may remain unconnected when every member is omitted by never-show rules. The current snapshot keeps the old result until that subscription is captured again.
