# NR-09 — Hidden NSG attachment on the visible owner

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-10 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-02 and VN-07. Do not re-run NR-01 through NR-08.

## Goal

On Full subscription, and on every other inventory mode that already draws connectors, remove the NSG card when a visible owner of its subnet or NIC is on the diagram. Put the effective protocol, port, direction, and allow or deny on the connectors between those owners. An NSG with no visible owner stays unresolved. It does not attach to a guessed node.

## Why

`InventoryDiagramNodeRelationshipApplier.TryPromoteNsgNode` emits an attachment only when the association target is already a diagram node. A subnet association returns the subnet ARM id. Peel rank 20 removes `Microsoft.Network/virtualNetworks/subnets` before compile, so that id is absent and the NSG stays a card with `IsUnresolvedPolicyOutlineOnly`. A NIC association lifts only through `BuildNicOwnerArmIdMap`, and `DiagramNicCollapseApplier` has already removed the NIC card.

The attachment that does emit is a self-loop (`FromNodeId == ToNodeId`). `BuildNsgAttachmentLabel` prints only the first security rule.

`InventoryDiagramDataFlowNsgAnnotationApplier.Apply` runs only when `DiagramAstFromGraphCompiler` is in `DiagramMode.DataFlow`. Full subscription never receives that protocol and port annotation. NR-08 owns the Data flow reducer. This session reuses it on the other inventory modes. It does not add an NSG hop.

VN-07 already places the same-group owner with `GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement`. That owner is the NSG endpoint when the subnet card is gone.

## Read first

- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramNodeRelationshipApplier.cs` (`TryPromoteNsgNode`, `ResolveNsgAssociationEndpointArmId`, `BuildNsgAttachmentLabel`)
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramDataFlowNsgAnnotationApplier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowNsgEffectiveRuleReducer.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` (the `isDataFlowMode` call around the NSG annotation applier)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramNicOwnerResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstVnetTopologyResolver.cs` (`TryResolveVnetIdFromSubnetArmId`)
- `ArchLucid.ArtifactSynthesis/Mermaid/DiagramHiddenSubnetVnetPlacementProjector.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryNsgAssociationParser.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryNsgSecurityRuleParser.cs`

## What to build

Extend NSG promotion. Do not replace NR-02 route-table promotion.

1. Subnet association whose subnet is not a diagram node: resolve the parent VNet with `TryResolveVnetIdFromSubnetArmId`. The owners are the visible same-group resources placed in that subnet by `InventoryNicSubnet`, `InventoryAppServiceSubnet`, or `InventoryHiddenSubnetVnetPlacement`, including a NIC source already lifted to its compute owner. Do not attach the NSG to the VNet frame. Do not walk a private endpoint to its storage, SQL, or other target.
2. NIC association whose NIC is not a diagram node: lift with `DiagramNicOwnerResolver`. The owner must be a visible diagram node.
3. When at least one visible owner resolves, remove the NSG card. Stop emitting the self-loop whose label is only the first rule. Keep the NR-02 rule payload (protocol, port range, direction, access, priority, prefixes) available to the reducer.
4. Call the existing effective-rule reducer for inventory modes, not only `DiagramMode.DataFlow`. For each proven connector whose source or target is a resolved owner, annotate that connector with the effective protocol, port, direction, and allow or deny. Several rules produce one effective result. A deny on either relevant side marks the connector blocked. Inbound and outbound results that differ stay as two directional annotations. Supporting rule identity stays on the edge detail (`DataFlowNsgSupportingRuleDetails` or the existing equivalent). It is not a node.
5. An owner with no proven connector keeps one on-demand summary on that owner (`UnresolvedRelationshipDetails` or the existing caption detail). That summary is the effective result, or `NSG attached` when the NSG has no security rules. It is not a self-loop and not an NSG card.
6. Zero visible owners: leave `IsUnresolvedPolicyOutlineOnly` set. Do not draw the NSG to an unrelated node. Do not invent allow or deny when no rule applies to a connector.

Do not change `EffectiveControlEdgeWeight`. Do not add a connection ledger. Do not restore subnet cards, NIC cards, or NSG cards. Do not treat an NSG as a data-flow hop.

## Tests

Add `InventoryDiagramHiddenNsgAttachmentTests` in `ArchLucid.ArtifactSynthesis.Tests/`.

1. Full subscription. Subnet type excluded. A virtual machine is placed in that subnet by `InventoryHiddenSubnetVnetPlacement`. An NSG is associated to the subnet and allows TCP 443 inbound. The compiled diagram has no NSG node. The virtual machine's proven connector shows TCP 443 and the direction. The annotation is not a self-loop on the missing subnet.
2. The NIC card is collapsed. The NSG is associated to that NIC. The virtual machine remains. The NSG card is removed and the annotation is on the virtual machine's connector.
3. Two overlapping allow rules produce one effective annotation and keep both supporting rule references.
4. A deny on either side marks the connector blocked. Different inbound and outbound results stay as two directional annotations.
5. An NSG whose subnet and NIC owners are both absent stays outline-only and is not attached to a Key Vault that only shares the resource group.
6. A connector with no applicable NSG gains no protocol annotation and no invented allow or deny.
7. A private-endpoint target in the same subnet is not treated as an NSG owner.
8. Existing `InventoryDiagramNodeRelationshipApplierTests` and `InventoryDiagramDataFlowNsgAnnotationApplierTests` still pass.

## Acceptance criteria

- A peeled subnet or a hidden NIC no longer leaves its NSG as a card when a visible owner is on the diagram.
- Full subscription shows the same effective protocol, port, blocked state, and asymmetric direction that Data flow already shows.
- The first security rule is not the only label.
- An unresolved NSG stays unresolved.
- No new topology inference and no effective-control weight change in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `InventoryDiagramHiddenNsgAttachmentTests`, `InventoryDiagramNodeRelationshipApplierTests`, and `InventoryDiagramDataFlowNsgAnnotationApplierTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full-subscription fixture whose subnet and NIC cards were removed shows the NSG only as protocol, port, direction, and allow or deny on the visible owner's connector.
