# NR-45 — A Logic App connection is connected only when a workflow cites it

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a connection target from a display name such as `azureblob` or `azureautomation`.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-01, NR-05, and NR-41. The owner is looking at `Microsoft.Web/connections` rows such as `azureautomation` and `azureblob-1`. The outline type is Logic App Connection. The problem column says `Connection state was not classified.`

## Goal

A Logic App connection node that a stored `logic-app-connections.json` row already cites, whose workflow is a snapshot node, is Connected by that existing edge. A connection node that no stored row cites is Unconnected. The outline says `No workflow in this snapshot cites this connection.` It must not say `Connection state was not classified.`

## Why

`Microsoft.Web/connections` is a connection ARM type. Orphan classification runs only when endpoint ids are present and evidence is current. These API connections usually have no network endpoint ids, so `TryClassifyOrphanedConnection` returns nothing. They are not shared services and they are not on the unconnected catalog. The applier sets Unknown.

NR-41 already draws one edge from a workflow to an in-snapshot `connectionResourceId`. When that edge is drawn, the connection is Connected because it has a cited edge. Rows that remain unclassified were not cited. Calling them Unknown hides that fact. A blank endpoint list is not a missing required link.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyOrphanedConnection`)
- `ArchLucid.Application/InfraEvidence/AzureInventoryLogicAppConnectionEdgeMapper.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryLogicAppConnectionRow.cs`
- `.cursor/prompts/node-relationship-41-logic-app-connections.md`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`

## What to build

1. Keep the NR-41 edge. When `connectionResourceId` is this connection and the workflow is a snapshot node, one solid edge is enough for Connected. Do not add a second edge path. Do not draw from the connection display name.
2. When the connection node has no cited edge, set Unconnected with unresolved detail `No workflow in this snapshot cites this connection.`
3. Do not set Orphaned because endpoint 1 and endpoint 2 are empty. Orphaned stays reserved for a current endpoint id that names a resource that is not in the snapshot.
4. If the parent workflow already has `logic-app-connections-not-collected:*`, keep that completeness warning. Still classify this connection node with the sentence in step 2 when no row cites it. Do not pretend a failed workflow GET produced a target.
5. The outline problem column and the node caption show that sentence. They do not show `Connection state was not classified.`
6. Do not change `Microsoft.Network/connections` (VPN) orphan rules in this session.
7. Do not read connection secrets, access keys, or callback URLs.

Do not bump `scriptVersion`. This session classifies rows the package already writes.

## Tests

1. A `Microsoft.Web/connections` node with no logic-app connection row is Unconnected. Caption and outline contain `No workflow in this snapshot cites this connection.`
2. A row whose `connectionResourceId` is that node, and whose workflow is in the snapshot, draws one edge and the connection is Connected. It does not gain the unconnected sentence.
3. A connection with empty endpoint ids is not Orphaned.
4. A `Microsoft.Network/connections` resource with a current endpoint id that is missing from the snapshot stays Orphaned under the existing rule.
5. A failed workflow GET warning remains on the snapshot when the fixture includes it.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-44 as greenfield.

## Done when

A Logic App connection a workflow already cites is Connected. One that nothing cites stands alone with that sentence. Empty API-connection endpoints are not a missing required link, and the outline no longer says the state was not classified.
