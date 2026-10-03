# SB-01 — Analysis keeps inventory subnets

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SB-02 or SB-03 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_SUBNET_DISPLAY_LUNA_PROMPTS.md`

## Goal

A subnet that is present in the Azure inventory remains a real subnet for diagram analysis after the diagram peels its card. An Azure Bastion whose subnet is in that inventory is not reported as having a subnet that no longer exists.

## Why

`InventoryDiagramGraphPeelFilter` removes `Microsoft.Network/virtualNetworks/subnets` at peel rank 20, then deletes every edge that touched those nodes. `InventoryDiagramPeelBudgetApplier` compiles the filtered graph. `InventoryDiagramOrphanedStateApplier` then calls `InventoryDiagramOrphanedStateClassifier.Classify` with that filtered graph.

`IsArmIdResolvable` returns true only when the subnet ARM id is still a node in the graph it was given. After the peel, the Bastion's `subnet.id` or IP-configuration subnet id fails that check. `TryClassifyOrphanedSubnetDependentResource` returns Orphaned with `required subnet {name} no longer exists`. When the Bastion has no subnet id left on the filtered node, the same method returns `required subnet no longer exists`.

`DiagramNodeHumanCaptionFactory` prints that sentence as `Missing a required link: …`. The outline Problem column shows the same sentence. The owner sees several Bastions reported this way. The subnet was hidden, not deleted.

Hiding a card is a display choice. It is not evidence that the Azure object is gone.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyOrphanedSubnetDependentResource`, `IsArmIdResolvable`, `TryReadSubnetArmId`)
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramGraphPeelFilter.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/InventoryDiagramPeelBudgetApplier.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowQuestionDispositions/SecureNowQuestionCompiler.cs`

## What to build

Give orphan classification an analysis graph that still contains every subnet node and subnet edge from the inventory graph, taken before peel. The display graph may omit those nodes.

Resolve these checks against the analysis graph, not the peeled display graph:

- Bastion, Azure Firewall, and virtual network gateway: `TryClassifyOrphanedSubnetDependentResource`
- Route table: `associated subnet {name} no longer exists`
- Any other classifier branch whose missing object is a subnet ARM id

Before calling a Bastion or firewall "required subnet no longer exists" because `subnet.id` is blank, look for a pre-peel edge from that resource to a subnet node, and for a subnet id in its IP configuration. A subnet found that way is present.

When the subnet is in the analysis graph:

- Do not set `ConnectionState` to Orphaned for that reason.
- Do not set `ConnectionStateMessage` to either `required subnet … no longer exists` sentence.
- Leave an existing cited display edge as Connected. Leave a hidden-subnet placement hop as Used, with the message it already uses (`hidden subnet placement`).
- Do not emit a SecureNow question whose problem text is that the subnet no longer exists. A question that was only that false orphan does not enter the queue.

When the subnet ARM id is absent from the analysis graph as well, keep today's Orphaned result and the existing sentence. That subnet is actually missing.

Do not draw subnet cards in this session. Do not change peel rank, the peel catalog, or `DiagramHiddenSubnetVnetPlacementProjector`.

## Tests

Extend `InventoryDiagramOrphanedStateClassifierTests` and `InventoryDiagramOrphanedStateApplierTests`.

1. A Bastion has `subnet.id` for `AzureBastionSubnet`. The analysis graph contains that subnet node. The display graph does not. The Bastion is not Orphaned. Its caption and connection-state message do not contain `no longer exists`.
2. The same Bastion has no `subnet.id`, and the analysis graph has an edge from the Bastion to `AzureBastionSubnet`. Same result as test 1.
3. The analysis graph has no such subnet node and no such edge. The Bastion stays Orphaned and the message still says the subnet no longer exists.
4. A route table associated with a subnet that exists only in the analysis graph does not say `associated subnet … no longer exists`.
5. A Bastion fixture compiled through the peel budget does not produce an orphan question whose text says the subnet no longer exists.

## Acceptance criteria

- Several Bastions that sit on inventory subnets no longer show `required subnet … no longer exists` or `Missing a required link` for that reason.
- The outline Problem column does not list that false subnet problem.
- A subnet that is absent from inventory is still reported as missing.
- Subnet cards stay off the plate in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the classifier tests, the applier tests, and `SecureNowQuestionCompilerTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A peeled display graph can omit every subnet card, and a Bastion whose subnet is still in inventory is no longer reported as having a subnet that no longer exists.
