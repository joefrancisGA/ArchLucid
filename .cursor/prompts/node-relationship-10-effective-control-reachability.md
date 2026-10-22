# NR-10 — Effective NSG and route rows become reachability

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-11 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-09. Do not re-run NR-01 through NR-09.

## Goal

`effective-network-controls.json` rows that already imported reach the diagram as reachability on the visible owner. They are not observed traffic. They do not put the NSG card or the NIC card back.

## Why

`AzureInventoryEffectiveNetworkControlEdgeMapper` writes two relationships from the NIC ARM id: `inventory-effective-nsg` (`appliesTo` to `EffectiveResourceId`) and `inventory-effective-routes` (`routesTo` to `EffectiveResourceId`). `AzureInventorySnapshotGraphResolver.ResolveEdgeWeight` returns `EffectiveControlEdgeWeight` (`0.5`) for both. `DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight` is `0.75`, so the compiler drops them before layout.

The NIC card is collapsed, so a heavier NIC-to-NSG edge would still miss the canvas. NR-09 already removes the NSG card when a visible owner exists. Raising the weight and drawing NIC to NSG would bring that card back.

These rows are `ProvenanceKind.DeterministicInference`. The display label for that kind is "likely". They confirm which NSG and which route table apply to the NIC. They do not prove that packets flowed.

## Read first

- `ArchLucid.Application/InfraEvidence/AzureInventoryEffectiveNetworkControlEdgeMapper.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs` (`ResolveEdgeWeight`, `EffectiveControlEdgeWeight`)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompilerConstants.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramNicOwnerResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramCollapsedAttachmentEdgeLifter.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramNodeRelationshipApplier.cs` (route next hop and NSG promotion from NR-02 and NR-09)
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs` (`InventoryEffectiveNsg`, `InventoryEffectiveRoutes`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryEffectiveNetworkControlRow.cs`

## What to build

1. In `ResolveEdgeWeight`, return `1.0` for `InventoryEffectiveNsg` and `InventoryEffectiveRoutes`. Leave `MinimumEdgeWeight` at `0.75`. Do not raise every other low-weight source.
2. Before NIC collapse deletes the edge, lift the NIC end to the visible compute owner with `DiagramNicOwnerResolver`. Skip the row when the owner does not resolve. Skip a failed or skipped `CollectionStatus` the same way the mapper already does.
3. Effective NSG. When NR-09 removed the NSG card, do not paint a line to that NSG and do not put the card back. Keep the row as cited attachment evidence on the owner (the same on-demand NSG summary NR-09 uses when the owner has no connector). When the NSG card is still visible because NR-09 found no owner, the edge may be drawn from the owner to that NSG. Label it as effective-NSG reachability through the existing Derived / "likely" display. Do not use the words "traffic" or "observed".
4. Effective routes. `EffectiveResourceId` is the route table, not the next hop. When that route table's next hop resolves to a visible firewall, gateway, or network virtual appliance, emit the edge from the owner to that next hop at weight `1.0`, labeled as effective-route reachability ("likely"), not observed traffic. Do not draw the owner to a route-table card that NR-02 already removed. When the next hop does not resolve, keep the route table unresolved the way NR-02 already does. Do not guess a node.
5. Provenance stays `DeterministicInference`. A missing NIC owner or a missing target produces no edge.

Do not collect flow logs, firewall logs, or metrics. Do not change NSG connector annotations from NR-09. Do not add the connection ledger.

## Tests

Add `InventoryDiagramEffectiveControlReachabilityTests` in `ArchLucid.ArtifactSynthesis.Tests/`. Add or extend the existing resolver weight test in `ArchLucid.Application.Tests` if one already covers `ResolveEdgeWeight`.

1. An `inventory-effective-nsg` edge and an `inventory-effective-routes` edge are kept by the compiler weight filter (weight `1.0`).
2. The NIC is collapsed and the NSG card is removed by NR-09. The effective-NSG row does not create an NSG node and does not create a painted line to the missing NSG. The visible virtual machine still carries the NSG attachment evidence.
3. The NSG card is still unresolved. The effective-NSG row draws one edge from the virtual machine to that NSG. The label is reachability ("likely"), not observed traffic.
4. The effective route table's next hop is a visible firewall. The diagram shows one edge from the virtual machine to that firewall at weight `1.0`, labeled as effective-route reachability. The route-table card is absent when NR-02 already promoted it.
5. A next hop that does not resolve creates no edge to an unrelated node.
6. A row whose NIC owner does not resolve creates no edge.
7. Existing effective-network-control mapper tests still pass.

## Acceptance criteria

- Imported effective NSG and effective route rows are no longer discarded for weight.
- The visible endpoint is the compute owner, not the NIC.
- The NSG card stays off the diagram when NR-09 removed it.
- Labels say reachability. They do not say that traffic was observed.
- No new Azure collection in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `InventoryDiagramEffectiveControlReachabilityTests` and the existing effective-network-control mapper tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A fixture with `effective-network-controls.json` shows owner reachability for the effective route next hop, and the effective NSG does not reappear as a card.
