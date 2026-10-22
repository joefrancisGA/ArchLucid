# DEC-02 — Reorder nodes inside a column or rank

**Wave:** diagram edge crossings (**DEC**). **Depends on:** DEC-01. **Do not** assign gutter lanes or change the orthogonal router. **Do not** implement DEC-03–05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inside one data-flow stage column, and inside one left-to-right forest rank, reorder nodes so edges to the neighboring column cross less often. The column may grow taller. Nodes stay in their stage, rank, and resource group.

## Why

A shared gutter still crosses when the left column’s order does not match the right column’s order. `DiagramForestDataFlowColumnLayout` and `DiagramLeftToRightLayerPlanner` both stack by `OrderKey` then `NodeId`. That order ignores who connects to whom.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs` — per-column `OrderBy(node => node.OrderKey)`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramLeftToRightLayerPlanner.cs` — rank membership; order inside a rank is `OrderKey`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramHubSpokeLayerPlanner.cs` — spoke stack order. Apply the same sweep to spokes when the hub has edges into that stack. Do not move the hub out of its column.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramEdgeCrossingCounter.cs` — from DEC-01
- New file: `ArchLucid.ArtifactSynthesis/Layout/DiagramLayerCrossingOrder.cs`

## What to build

1. `DiagramLayerCrossingOrder.OrderLayer` takes the nodes already assigned to one layer, the edges whose both ends are in this layer **or** the previous and next layer, and returns a new order. Do not drop or add nodes.

2. Sweep at most **four** times. Each pass sets a node’s barycenter to the mean index of its neighbors in the adjacent layer (undirected). Nodes with no such neighbor keep their current index. Tie-break with `OrderKey`, then `NodeId`.

3. After each pass, build the straight center-to-center segments those edges would have **if** the layer used that order and the adjacent layer kept its current order. Count crossings with DEC-01. Keep the pass only when the count is strictly lower. If it is not, restore the previous order and stop.

4. Call this from the data-flow column planner after the column groups exist, sweeping left to right then right to left once (still inside the four-pass cap per layer). Call it from the left-to-right rank planner for each rank after `AssignLayers`. Hub-spoke spoke order uses the same helper against the hub as a one-node adjacent layer.

5. Tests:
   - Two left nodes A,B and two right nodes C,D. Edges A–D and B–C. After ordering, those two segments do not cross. The diagram is taller only if the swapped nodes have different heights; width of the stage does not change.
   - A layer whose edges already have zero crossings stays in `OrderKey` order.
   - A node is never emitted in a different data-flow stage index than `Plan` assigned before the sweep.

## Acceptance criteria

- The synthetic swap fixture goes from one crossing to zero by reordering only.
- Resource-group membership and stage labels are unchanged.
- No new layout library.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** retune Mermaid gaps. **Do not** add elk, React Flow, or Graphviz.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramLayerCrossingOrder|FullyQualifiedName~DiagramForestDataFlow|FullyQualifiedName~DiagramLeftToRightLayerPlanner|FullyQualifiedName~DiagramHubSpoke"
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the command runs longer than 15s. No full-solution build.
