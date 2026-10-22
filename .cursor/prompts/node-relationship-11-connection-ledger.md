# NR-11 — Say connected, used, orphaned, or unknown

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-05, NR-09, and NR-10. Do not re-run NR-01 through NR-10.

## Goal

Every visible inventory-diagram resource is exactly one of **Connected**, **Used**, **Orphaned**, **Unconnected**, or **Unknown**. Each imported relationship that did not become a painted connector records why it was dropped. Unknown is not orphaned.

## Why

`InventoryDiagramOrphanedStateClassifier` returns Orphaned only when current metadata proves a required attachment is missing, and Unconnected only for the indirect-relationship allowlist (storage, Key Vault, virtual machine, and the other types in `InventoryDiagramIndirectRelationshipClassifier`) plus a Logic App workflow with no actions. Every other lineless resource keeps `ConnectionState` null.

`InfraEvidenceDiagramOutline` ignores that classifier. It puts a node in "Connected nodes" when its id appears on any outline edge, and in "Unconnected nodes" otherwise. A self-loop, a layout-only edge, or resource-group collocation counts as connected. A resource with no painted line and no orphan proof looks the same as a storage account that is valid alone.

ARM inventory cannot prove a data-plane resource is unused. This session does not call that case orphaned, and it does not collect flow logs to close it.

## States

- **Connected.** At least one cited edge to another visible node. Collocation (`inventory-rg-collocation`), `IsLayoutOnly`, and a self-loop do not count.
- **Used.** No Connected edge, and a hidden hop still proves placement or a consumer: NIC owner, `InventoryHiddenSubnetVnetPlacement`, parent attachment, private endpoint, or an effective-control row lifted onto the owner by NR-10. The caption names that hop.
- **Orphaned.** Keep the NR-05 rule. Current Azure metadata or an ARM reference proves a required parent or endpoint is missing. The caption names the missing requirement. Configured and Observed evidence cannot create this state.
- **Unconnected.** Keep the NR-05 allowlist: the resource is valid with no optional relationship. Do not move those types to Unknown.
- **Unknown.** No Connected edge, no Used hop, and not Orphaned or Unconnected. This includes types the classifier used to leave unlabeled. The caption says Unknown. It does not say Orphaned or Unconnected.

The five states are mutually exclusive. Precedence is Orphaned, then Connected, then Used, then Unconnected, then Unknown.

## Drop gate

For each imported relationship that does not become a painted connector, record one reason:

- `below-minimum-weight`
- `endpoint-not-in-snapshot`
- `endpoint-peeled-or-hidden` (subnet, NIC, never-show type)
- `layout-only`
- `collocation`
- `mode-filter`
- `policy-self-loop-suppressed`
- `private-endpoint-target-not-walked`

Do not invent a reason. Do not drop a relationship that the diagram already paints.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramConnectionState.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramOrphanedStateApplier.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramNodeHumanCaptionFactory.cs`
- `ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts`

## What to build

Extend `InventoryDiagramConnectionState` with Connected, Used, and Unknown. Keep Orphaned and Unconnected. Extend the classifier and applier so every visible diagram node receives one state. `DiagramNodeHumanCaptionFactory` already prints Orphaned and Unconnected. Print Used with the hop name, and print Unknown. Do not add a Connected word to every card that already has a painted line.

Carry each drop-gate row on `DiagramAst` (one new type, one file). Emit the rows as mermaid comments the outline parser can read, for example a `%% al-ledger-drop <reason> <from> <to>` line. Teach `parse-infra-evidence-mermaid-outline.ts` to collect them. In `InfraEvidenceDiagramOutline.tsx`, group the existing node tables by the caption state (Connected, Used, Orphaned, Unconnected, Unknown). A node whose only outline edge is collocation, layout-only, or a self-loop is not Connected. Add one disclosure in that same outline for the drop-gate rows. Title it so a reviewer can see the reason and the two endpoints. Do not add a route, a tab, or a page.

Do not collect NSG flow logs, firewall logs, load-balancer logs, or metrics. Do not change VNet packing, NSG promotion, or effective-control weight.

## Tests

Add `InventoryDiagramConnectionLedgerTests` in `ArchLucid.Core.Tests` or `ArchLucid.ArtifactSynthesis.Tests`, next to the existing orphaned-state tests. Add a UI test next to the existing outline parser tests if that suite already exists.

1. A virtual machine with a cited edge to a visible load balancer is Connected. The caption does not also say Unknown or Orphaned.
2. A virtual machine whose only proof is `InventoryHiddenSubnetVnetPlacement` is Used, and the caption names that placement. It is not Orphaned.
3. A restore point collection whose virtual machine id does not resolve stays Orphaned and still names the missing virtual machine.
4. A storage account with no optional relationships stays Unconnected.
5. A resource type outside the orphan and unconnected rules, with no cited edge and no hidden hop, is Unknown. The caption says Unknown.
6. Resource-group collocation alone does not produce Connected.
7. An IaC or log reference to a missing target stays Configured or Observed. It does not become Orphaned.
8. A relationship dropped because the subnet was peeled records `endpoint-peeled-or-hidden`. A relationship with weight `0.5` records `below-minimum-weight`. A painted connector records no drop reason.
9. The outline groups those five states, and the drop-gate disclosure lists the reason and both endpoints.

## Acceptance criteria

- Every visible resource has one of the five states.
- Unknown is never displayed as Orphaned or Unconnected.
- The outline no longer treats "absent from every edge" as Unconnected.
- Each imported relationship is either a painted connector or a drop-gate row with one reason.
- No new Azure collection and no new diagram route in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `InventoryDiagramConnectionLedgerTests` and the existing `InventoryDiagramOrphanedStateClassifierTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A reviewer can point at every visible resource and say Connected, Used, Orphaned, Unconnected, or Unknown, and can see why each imported relationship that is missing from the canvas was left off.
