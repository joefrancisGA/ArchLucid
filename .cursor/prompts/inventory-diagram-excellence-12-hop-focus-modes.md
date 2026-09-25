# IDX-12 — Hop-focus for neighborhood, selected, and resource group

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-02, IDX-03. **Do not** paint the rest of the subscription.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

`DependencyNeighborhood`, `SelectedResources`, and `ResourceGroup` compile from the **shared visible projection** as hop-focus graphs: include cited attachments needed to explain the seed / selection / RG (VNet parent of a subnet, target of a hidden PE, Logic App connection), still hide NIC/PE cards unless IDX-10 is on, and **do not** pack unrelated subscription nodes. Add `selectedResources` parser + workbench path if missing.

## Why

Neighborhood today is a BFS on stored edges. If those edges were VM→NIC and NIC is NeverShow, the neighborhood is a lonely VM. Selected resources similarly drop the VNet that would explain placement. ResourceGroup mode should still nest VNets **inside that RG** (IDX-05) and may include a **cited** cross-RG VNet as a dashed neighbor — not the whole sub.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DependencyNeighborhood | BFS on **composed** edges (depth default 2); include visible endpoints of hidden hops; exclude PE/NIC cards by default |
| SelectedResources | Union of selected ids + one-hop cited attachments (not collocation); parser requires ids |
| ResourceGroup | All nodes in the RG + cited ancestors (VNet) required to place them; no other RGs unless cited hop |
| Executive / Architecture / Network / Security / Identity / Data / DataFlow / DataArchitecture / FullSubscription | **Unchanged packing scope**; add a regression test that neighborhood node count << Full subscription on the same snapshot |

## Context

- `DiagramAstFromGraphCompiler.FilterByNeighborhood` / `FilterBySelectedNodes` / `FilterByResourceGroup`
- `infra-evidence-diagrams-dependency-seed.ts`
- `InfraEvidenceMermaidModeParser`

## What to build

1. Neighborhood walk uses composed snapshot edges from IDX-02, not raw NIC hops. Depth stays `NeighborhoodDepth` default 2.

2. When a hidden PE hop explains a selected/neighborhood node, include the **target** and **VNet/subnet** visible nodes, not the PE card.

3. ResourceGroup: if a VM in the RG is composed `in` a VNet in another RG, include that VNet node (cited) and draw it **outside** the RG frame (already the Visio inter-RG pattern) — still no other VMs in that foreign RG.

4. Parser + UI: `selectedResources` mode with selected node ids (existing outline selection if present). Do not add a new primary desktop tab; reuse outline selection.

5. Tests:
   - VM seed, hidden NIC→subnet→VNet → neighborhood includes VM + VNet, excludes NIC, excludes unrelated VMs in other RGs.
   - Selected two storage accounts with PE hops → accounts + VNet, no full sub.
   - ResourceGroup `rg-app` with VNet in `rg-net` → both nodes, not all of `rg-net`.
   - FullSubscription compile of same fixture has more nodes than neighborhood (assert).
   - All twelve modes still compile (member data).

## Acceptance criteria

- IDX-06: no subscription outer on these three modes.
- IDX-08: no singleton-RG tail collapse on these three modes.

## Constraints

- **Do not** invent VNets without a cited hop.
- **Do not** use complete-graph neighbors.

## Done when

Focus neighborhood on a HAP VM shows the VNet it sits in (via hidden NIC/PE analysis) without opening Full subscription, and the other nine modes still render the whole filtered canvas.
