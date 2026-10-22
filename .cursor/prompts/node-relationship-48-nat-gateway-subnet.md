# NR-48 — A NAT gateway with no stored subnet stands alone

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a subnet from the NAT gateway name or from sharing the resource group `anly-edw-dev-hi`.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-05 and NR-11. The owner is looking at `ng-edw-hi-dev`, `ng-edw-hi-ppd`, and `ng-edw-hi-tst`. The outline type is NAT gateways. The problem column says `Connection state was not classified.`

## Goal

A `Microsoft.Network/natGateways` node with a stored subnet association that is a snapshot node stays Connected by that existing edge. A NAT gateway with no stored subnet id is Unconnected. The outline says `No stored subnet for this NAT gateway.` It must not say `Connection state was not classified.`

## Why

`natGatewayToSubnet` is already an association type. When that edge is drawn, the gateway is Connected. When the subnet id was never stored, the orphan classifier has no NAT-gateway rule, so the applier sets Unknown. A missing optional subnet id is not a missing required link. A resource-group neighbor is not a subnet.

## Read first

- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs` (`NatGatewayToSubnet`)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs`
- `.cursor/prompts/node-relationship-17-public-ip-attachment.md`

## What to build

1. When the ARM type is `Microsoft.Network/natGateways` and the node has no cited edge, return Unconnected with unresolved detail `No stored subnet for this NAT gateway.`
2. When a `natGatewayToSubnet` edge already cites a subnet node, the applier's cited-edge path stays Connected. Do not add the sentence. Do not add a second edge path.
3. A stored subnet id that is not in the snapshot does not create a subnet node. Do not mark the gateway Orphaned for an empty subnet id. If a non-empty subnet id is stored and the existing orphan rules already apply to it, keep those rules. Do not invent a new orphan sentence in this session.
4. Do not change public IP attachment. A public IP that cites this NAT gateway stays on its NR-17 path.
5. The outline problem column and the caption show the new sentence when there is no cited edge. They do not show `Connection state was not classified.`
6. Do not query NAT gateway logs. Do not bump `scriptVersion` unless the association row is dropped before it is saved. If the row is already written, only classify it.

## Tests

1. `ng-edw-hi-dev` with no subnet edge is Unconnected. Caption and outline contain `No stored subnet for this NAT gateway.`
2. The same gateway with one `natGatewayToSubnet` edge to an in-snapshot subnet is Connected and does not gain that sentence.
3. A gateway whose name contains `edw` and that shares a resource group with one virtual network does not gain an edge.
4. A public IP that cites the gateway is not reclassified by this session.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-47 as greenfield.

## Done when

A NAT gateway with no stored subnet stands alone and names that gap. A gateway with a stored subnet edge stays connected. No line appears because of a name or a resource group.
