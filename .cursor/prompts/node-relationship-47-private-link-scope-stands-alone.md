# NR-47 — A private link scope with no stored member stands alone

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a Log Analytics workspace or Application Insights component from the scope name `extension-pls`.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-05, NR-11, and NR-38. The owner is looking at `extension-pls`. The outline type is Private link scopes. The problem column still says `Connection state was not classified.`

## Goal

A `Microsoft.Insights/privateLinkScopes` node with no cited edge is Unconnected. The outline says `No stored scoped resource for this private link scope.` It must not say `Connection state was not classified.` A scope that already has a **Scopes monitoring for** or **Private access** edge stays Connected. Do not collect new scope members in this session.

## Why

NR-38 stores scoped resources and private endpoint connections and draws those edges when the ids are in the snapshot. A scope with none of those edges is a known empty membership, not an unclassified type. The outline is still using the Unknown sentence for `extension-pls`.

`InventoryDiagramIndirectRelationshipClassifier` can already mark the exact scope type unconnected, which renders as bare `Stands alone`. That is the wrong sentence when the reader needs to know membership was not stored. Unknown is also the wrong sentence.

## Read first

- `ArchLucid.Core/AzureExtractor/AzureInventoryMonitorPrivateLinkScopeResourceTypes.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramConnectionPostureCatalog.cs`
- `.cursor/prompts/node-relationship-38-monitor-private-link-scope.md`

## What to build

1. When the ARM type is exactly `Microsoft.Insights/privateLinkScopes`, the node has no cited edge, and the classifier does not return Orphaned, return Unconnected with unresolved detail `No stored scoped resource for this private link scope.`
2. A cited scoped-resource or private-endpoint edge keeps the node Connected. Do not add the sentence.
3. Do not add the scope to the NR-46 not-modeled catalog. Do not draw a new edge. Do not treat a name match as membership.
4. Do not create diagram nodes for `Microsoft.Insights/privateLinkScopes/scopedResources`.
5. The outline problem column and the caption show the new sentence. They do not show `Connection state was not classified.`
6. Do not change Application Insights components, API Management, Grafana, galleries, NAT gateways, or access connectors in this session.

Do not call Azure. Do not bump `scriptVersion`.

## Tests

1. `extension-pls` with no edges is Unconnected. Caption and outline contain `No stored scoped resource for this private link scope.` They do not contain `Connection state was not classified.`
2. The same scope with one stored scoped-resource edge to an in-snapshot component stays Connected and does not gain that sentence.
3. A scoped-resource child is still not a diagram node.
4. An Application Insights component with no edge still uses the NR-46 not-modeled sentence.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-46 as greenfield.

## Done when

`extension-pls` with no stored member stands alone and names the missing scoped resource. A scope that already has a stored member stays connected. No line appears because of the name.
