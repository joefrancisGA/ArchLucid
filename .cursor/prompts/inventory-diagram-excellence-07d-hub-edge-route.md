# IDX-07d — Route Data Flow edges into an in-stage hub

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07b hub geometry and IDX-07c rollup exemption already on trunk. **Extend only.** Do **not** move hub or spoke cards. Do **not** greenfield IDX-01–13.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

A Data Flow forest that draws an in-stage hub still **renders** when a cited edge enters that hub from the previous stage (or leaves it toward the next stage). The path reaches the hub without crossing a spoke card. Render must not throw.

## Why

IDX-07b places the hub to the **right** of its spokes inside the stage column. `DiagramForestDataFlowEdgeRouter` still finishes an adjacent-column route with one horizontal segment from the column gutter to the target’s **left** edge at the target center Y (`columnDelta == 1` in `TryRoute`). That line crosses the spoke whose vertical span contains the hub center. `ValidateAndBuild` returns null. `DiagramForestLayoutSvgRenderer` then throws `InvalidOperationException`: `Data-flow edge could not be routed between placed nodes`.

Same-stage hub-to-spoke edges already leave via the gutter on the **right** of the column, so they miss the spoke stack. The failure is the cross-stage approach into the hub’s left side. A two-stage diagram (source card, then factory plus sinks) fails the whole SVG instead of drawing the flow.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. Route into and out of an in-stage hub without crossing spokes, and without failing the render. |
| DataArchitecture | Do **not** change type-group edge routing. |
| Executive / Architecture / Network / Security / Identity / Data / FullSubscription / ResourceGroup / SelectedResources / DependencyNeighborhood | Do **not** change orthogonal routing. Existing Data Flow gutter tests stay green. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowEdgeRouter.cs` — gutter route; `TryRoute` returns null when a segment hits an obstacle.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — throws when `TryRoute` returns null for a Data Flow edge between placed nodes.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs` — `NodePlacement.IsHubSpokeHub`. Hub `X` is spoke column width plus `NodeHorizontalGap`.
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestDataFlowEdgeRouterTests.cs` — adjacent gutter and sky-lane cases must stay green.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowInStageHubLayoutTests.cs` — hub geometry tests. The two-stage case today has **no** edge from stage 1 into the hub, because that edge throws.

## What to build

1. When the forward target (`columnDelta >= 1`) has `IsHubSpokeHub`, do not draw the last horizontal through the spoke column. Approach the hub through the open gap immediately to its left (the existing `NodeHorizontalGap` between spoke column and hub): vertical travel in that gap, then a short horizontal into the hub’s left edge at the hub center Y.

2. The reverse case (edge from the hub toward an earlier stage) uses the same approach, because `TryRoute` already swaps endpoints and reverses the path. An edge from the hub to a **later** stage should keep leaving from the hub’s right edge into the following gutter, and must not cross spokes.

3. If that gap route still hits an obstacle, do not throw from the renderer for this case. Fall back to a sky-lane route that stays clear of every card except the two endpoints, using the existing sky-lane Y (`Padding + DataFlowSkyLaneHeight / 2`). Prefer the gap route when it validates.

4. Do not change node X/Y, hub-spoke thresholds, rollup exemption, `DataFlowColumnGutter`, or Mermaid spacing. Do not drop the edge.

5. Tests:
   - Forest render of two stages: stage 1 has one storage node; stage 2 has one factory plus four storage spokes and four edges from the factory. Add one edge from the stage-1 node to the factory. `Render` succeeds. SVG has one `data-hub-spoke="hub"`. An edge path exists for the cross-stage label. Sampled points on that path do not lie in any spoke card interior (inflate obstacles by 1 px, same idea as `DiagramForestDataFlowEdgeRouterTests`).
   - Existing `DiagramForestDataFlowEdgeRouterTests` stay green without weakened assertions.
   - Existing in-stage hub geometry tests stay green.

## Acceptance criteria

- A source stage plus a hub stage with a cited edge between them produces SVG instead of an exception.
- The cross-stage path does not paint through a spoke card.
- Hub and spoke positions are unchanged from IDX-07b.

## Constraints

- **Do not** move the hub back into the spoke stack to make the old horizontal legal.
- **Do not** delete spokes to clear the route.
- **Do not** catch the exception and omit the edge with no replacement path.
- **Do not** reopen IDX-01 capture or IDX-10 PE UI.
- **This is not IDX-HOLD.**

## Done when

Forest render of stage 1 → factory hub with four storage spokes succeeds, the cross-stage edge is drawn, and it does not enter a spoke card.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlowEdgeRouter|FullyQualifiedName~DataFlowInStageHub'
```
