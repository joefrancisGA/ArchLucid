# IDX-07e — Data Flow subcolumns must not split a hub component

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07b in-stage hub, IDX-07c rollup exemption, and IDX-07d hub edge routing on trunk (or landing together). **Extend only.** Do **not** change hub geometry, rollup rules, or edge gap routing. Do **not** greenfield IDX-01–13.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

On **Data Flow** only, `MaxCardsPerDataFlowSubcolumn` wrapping must **never** put part of a connected component in one subcolumn and the rest in the next. A hub-and-spoke component (factory plus many sinks) stays in **one** stage subcolumn even when the stage has more than twelve cards.

## Why

`DiagramForestDataFlowColumnLayout` slices each stage with `Skip(offset).Take(12)` on the ordered node list, then runs `BuildConnectedComponents` **inside that slice only**. A stage with thirteen or more nodes in one star can place the hub in the first slice and one or more spokes in the second. Neither slice meets `ShouldLayoutHubSpoke` on the full component. IDX-07b hub layout and IDX-07c rollup exemption both assume the **whole** component is co-located. IDX-07d edge routing into the hub assumes the hub and spokes share one column’s placement bounds.

Large ADF stages with many sinks are realistic. The existing `Plan_wraps_large_stage_into_subcolumns` test only stacks homogeneous storage cards without a hub.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. Subcolumn batching respects connected components (stage-local edges). |
| DataArchitecture | Do **not** change type-group column packing. |
| Executive / Architecture / Network / Security / Identity / Data / FullSubscription / ResourceGroup / SelectedResources / DependencyNeighborhood | Unchanged. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs` — `MaxCardsPerDataFlowSubcolumn = 12`; per-batch component layout and hub interior.
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramComponentBuilder.cs` — connected components for a node set and edge list.
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestDataFlowEdgeRouterTests.cs` — `Plan_wraps_large_stage_into_subcolumns_before_next_stage` (30 storage cards, no hub).
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowInStageHubLayoutTests.cs` — hub markers and geometry (≤5 nodes today).

## What to build

1. For each stage, build connected components once using **all** stage-local edges (same rule as IDX-07c exemption).

2. Pack components into subcolumns:
   - A component is **atomic**: all its nodes share one subcolumn batch.
   - Greedily add whole components to the current batch while `currentBatchNodeCount + component.Count <= MaxCardsPerDataFlowSubcolumn`.
   - When the next component does not fit, start a new subcolumn batch.
   - When a **single** component has more than twelve nodes, place the entire component in one subcolumn anyway (one-time exception; do not raise the global constant).

3. Preserve existing within-stage ordering intent: keep `OrderByDescending(connected)` when ordering nodes inside a component and when ordering components within a batch (document the sort key in code if non-obvious). Do not change `ApplyColumnCrossingOrder` inputs beyond what batch membership requires.

4. Do not change `DiagramForestDataFlowRollup`, hub interior layout, or `DiagramForestDataFlowEdgeRouter`.

5. Tests (new class or extend `InventoryDiagramExcellenceDataFlowInStageHubLayoutTests`, one type per file):
   - One stage, one factory, twelve storage sinks, twelve edges from factory (thirteen nodes). Forest render succeeds. Exactly one `data-hub-spoke="hub"`. All thirteen node ids appear in SVG (no rollup card replacing sinks).
   - `Plan_wraps_large_stage_into_subcolumns_before_next_stage` still passes (thirty storage nodes without hub still wrap into three subcolumns).
   - Existing `DataFlowInStageHub` and `DiagramForestDataFlowRollup` tests stay green.

## Acceptance criteria

- A thirteen-node in-stage star paints as one hub with twelve spokes, not a hub column plus a orphaned spoke column.
- Stages without a hub still respect the twelve-card subcolumn cap at the **component** level.

## Constraints

- **Do not** remove `MaxCardsPerDataFlowSubcolumn` or retune `DataFlowColumnGutter`.
- **Do not** merge disconnected components to fill a batch.
- **Do not** stamp `data-role-column` on Data Flow.
- **This is not IDX-HOLD.**

## Done when

A Data Flow stage with one ADF and twelve cited storage sinks in one connected component shows a single hub marker and thirteen distinct node groups in one hub subcolumn layout.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlowInStageHub|FullyQualifiedName~DiagramForestDataFlowEdgeRouter|FullyQualifiedName~DiagramForestDataFlowRollup'
```
