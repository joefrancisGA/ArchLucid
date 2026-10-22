# NR-35 — A firewall with a stored subnet is in use

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not query Azure Firewall logs or firewall policy. Do not draw the firewall subnet as a data-flow arrow.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-05, NR-07, and NR-23. The owner is looking at `fw_hi_nprd_wvd` (`Microsoft.Network/azureFirewalls`) on the data-flow diagram. The outline says it stands alone. The firewall subnet is already in the snapshot. Do not recollect.

## Goal

A firewall whose stored subnet is in the snapshot is **In use off the diagram**. The outline names that subnet. It does not say the firewall stands alone. The firewall-to-subnet relationship stays off the data-flow arrows.

## Why

Data flow keeps every `Microsoft.Network/azureFirewalls` node because `InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopArmType` treats a firewall as a hop. `AzureInventoryDataFlowEvidenceCatalog` excludes `firewallToSubnet`, and a subnet is not a data-flow node, so that stored `PROTECTS` relationship is not painted.

`InventoryDiagramOrphanedStateClassifier` then sees no visible data-flow edge. The subnet is present, so the firewall is not orphaned. `InventoryDiagramIndirectRelationshipClassifier` still classifies the firewall as Unconnected. The outline renders Unconnected as `Stands alone`.

`InventoryDiagramDefaultRouteRelationshipApplier` already draws `Routed through` when a stored default route resolves to the firewall. That visible line stays Connected. This session covers the firewall whose only stored proof is its own subnet.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyOrphanedSubnetDependentResource`)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramConnectionStateResult.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowCompileSupport.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`

## What to build

1. When `Microsoft.Network/azureFirewalls` has no visible diagram edge, and its stored subnet resolves in the snapshot, return `InventoryDiagramConnectionState.Used`. The connection-state message is `Protects {subnetName}.` Use the data subnet name when both the firewall subnet and the management subnet are stored. Use the management subnet name only when that is the only stored subnet.
2. A subnet resolves when the firewall has a `firewallToSubnet` graph edge to a subnet node, the subnet id is a graph node, or the subnet id is listed on a virtual network in the snapshot. Read the subnet name from that stored id.
3. Add `InventoryDiagramConnectionStateResult.Used(string message)` if the existing orphaned message field would otherwise carry this sentence. `InventoryDiagramOrphanedStateApplier` must copy that message onto a Used node. The caption then reads `In use off the diagram: Protects {subnetName}.`
4. Keep `firewallToSubnet` excluded from `AzureInventoryDataFlowEvidenceCatalog`. Do not add a data-flow arrow from the firewall to its subnet. Do not add the subnet as a data-flow node.
5. A firewall that already has a visible diagram edge, including `Routed through`, stays Connected. Do not replace that edge.
6. A firewall with a subnet id that does not resolve stays Orphaned. Keep the current missing-subnet sentence. A firewall with no stored subnet id keeps `required subnet is not in this inventory snapshot`. Do not change Developer SKU Bastion behavior.

Do not infer the subnet from the name `fw_hi_nprd_wvd`. Do not query firewall logs, rules, or policy. Do not change NAT gateways, route tables, or container registries in this session.

## Tests

1. A data-flow diagram whose firewall has a stored `firewallToSubnet` edge to `AzureFirewallSubnet`, and whose subnet is not a data-flow node, marks the firewall Used. The message is `Protects AzureFirewallSubnet.` There is no edge between the firewall and the subnet. The caption does not contain `Stands alone`.
2. The same firewall with a visible `Routed through` edge stays Connected.
3. A firewall with no stored subnet id stays Orphaned. The message remains `required subnet is not in this inventory snapshot`.
4. A storage account with no stored link still says `No stored storage link yet.`

Use the orphaned-state classifier tests and one focused data-flow compiler test. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Keep uncommitted Developer SKU Bastion, NR-32, NR-33, and NR-34 edits if they are present. Do not restore those files.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-34 or SB-01 through SB-06 as greenfield.

## Done when

On the current snapshot, `fw_hi_nprd_wvd` is **In use off the diagram** and the outline says which stored subnet it protects. It no longer stands alone. No new collection is required when that subnet association is already stored.
