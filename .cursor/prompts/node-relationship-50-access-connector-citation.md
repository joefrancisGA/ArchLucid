# NR-50 — An access connector is connected only when a workspace cites it

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a Databricks workspace from the name `unity-catalog-access-connector`.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-03, NR-05, and NR-11. The owner is looking at `unity-catalog-access-connector`. The outline type is Access connectors. The problem column says `Connection state was not classified.`

## Goal

A `Microsoft.Databricks/accessConnectors` node that already has a cited parent or target edge stays Connected. A connector with no stored workspace or target id is Unconnected. The outline says `No stored Databricks workspace cites this access connector.` It must not say `Connection state was not classified.`

## Why

NR-03 already draws an edge when an access connector stores an explicit target. `TryClassifyOrphanedParentAttachmentChild` returns nothing when that id is absent, so the applier sets Unknown. An empty target is not a missing required link, and it is not the same as a type whose posture is not modeled. The stored id is simply not there.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramParentAttachmentClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyOrphanedParentAttachmentChild`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryDatabricksAccessConnector.cs`
- `.cursor/prompts/node-relationship-03-parent-properties.md`

## What to build

1. When the ARM type is `Microsoft.Databricks/accessConnectors` and the node has no cited edge, return Unconnected with unresolved detail `No stored Databricks workspace cites this access connector.`
2. When a stored parent or target id already produced a cited edge, stay Connected. Do not add a second edge path. Do not draw from the connector display name.
3. Do not set Orphaned because the parent id is empty. Orphaned stays reserved for a stored parent id that names a resource that is not in the snapshot.
4. Do not add the connector to the NR-46 not-modeled catalog.
5. The outline problem column and the caption show the new sentence. They do not show `Connection state was not classified.`
6. Do not change Purview, Data Factory integration runtimes, or managed private endpoints that share the access-connector parent category.

Do not call Azure. Do not bump `scriptVersion`.

## Tests

1. `unity-catalog-access-connector` with no parent id and no edge is Unconnected. Caption and outline contain `No stored Databricks workspace cites this access connector.`
2. The same connector with a cited edge to an in-snapshot Databricks workspace is Connected and does not gain that sentence.
3. A connector with a stored parent id that is missing from the snapshot stays Orphaned under the existing parent rule.
4. A connector whose name contains `unity-catalog` and that shares a resource group with one workspace does not gain an edge.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-49 as greenfield.

## Done when

An access connector a workspace already cites stays connected. One with no stored workspace stands alone with that sentence. The outline no longer says the state was not classified, and no line appears because of the name.
