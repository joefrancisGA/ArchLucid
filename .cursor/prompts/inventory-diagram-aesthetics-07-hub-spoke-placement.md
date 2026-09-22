# IDA-07 — Hub-and-spoke placement for high-degree nodes

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-04 (metrics). May start in parallel with IDA-05/06 **if** it only edits the layer planner + tests, not the edge SVG emitters. **Do not** implement RG frames or IDA-08–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When a connected component has a node with **visible undirected degree ≥ 3**, forest interior layout places that node as a **hub** and its neighbors in **one adjacent column** (human hub-and-spoke), instead of a long TD stack or generic longest-path LR ranks.

## Why

Owner Executive screenshot: a left column of VNets all peer into one hub (`vnet-cs-hi-nprd-weus-300` / similar). Straight (now elbow) fans across a TD stack are what you get when the hub sits in the same column as its spokes. `DiagramLeftToRightLayerPlanner.ShouldLayoutLeftToRight` today is **count > 3**, not degree. A 7-spoke star is exactly the owner pain.

Pairs and triples stay **top-down** (`VerticalLayoutMaxNodeCount = 3`). Do not LR those.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramLeftToRightLayerPlanner.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `LayoutComponentInterior` / `LayoutLeftToRight` / `LayoutTopDown`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramLeftToRightLayerPlannerTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`
- Owner-shape graph: `DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph`
- New: `DiagramHubSpokeLayerPlanner.cs` (own file) — keep LR planner for non-star connected graphs with count > 3 and max degree < 3 (chains)

IDA-05/06 should still route whatever positions this produces. If 05 is not merged, tests assert **x coordinates** (hub x + width < neighbor x, or hub to the right — pick **hub in the right column, spokes left**, matching the owner sketch of a stack feeding a hub on its right). Lock that orientation in tests so later agents do not flip it.

## What to build

1. Degree = count of visible undirected edges to other **members of this component** (ignore layout-only `~~~`).

2. `ShouldLayoutHubSpoke(component, visibleEdges)`: max degree ≥ 3 and at least 3 neighbors on that hub. If two nodes tie, pick min `OrderKey` then `NodeId`.

3. Placement:
   - Spokes: one column, y-stack with `NodeVerticalGap`, order by `OrderKey` then `NodeId`.
   - Hub: x = spoke column width + `NodeHorizontalGap`, y = vertical center of the spoke stack minus half hub height (clamp y ≥ 0).
   - Isolated extras in the component (degree 0): keep below the spoke stack in the spoke column (do not invent edges).

4. `LayoutComponentInterior`:
   - If hub-spoke → that placement.
   - Else if `ShouldLayoutLeftToRight` → existing LR layers.
   - Else TD.

5. Tests:
   - Star: 1 hub + 4 spokes, no other edges: hub `X` greater than each spoke’s `X + Width - 0.5`; all spokes share the same `X` (±1 px); hub degree 4.
   - Owner-shape: the node with degree 6 (or the actual max in that fixture) is **not** in the same column as all of its neighbors. If the fixture’s components are pairs/triples only, add a **synthetic** star test and a comment that owner 11/6 may be multiple small components — still implement the planner; do not force-merge components.
   - Pair (degree 1): still TD (same x).
   - Chain of 5 (max degree 2): still LR layers, **not** hub-spoke.

6. Do not change packer / `~~~`. Do not draw a halo around the hub.

## Acceptance criteria

- A 1+4 star paints as a spoke column plus one hub beside it, not a 5-high TD list.
- Pairs/triples/chains unchanged.
- No new visible edges.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** wrap stars in subgraphs (`alpack_*` stay dead).
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramLeftToRightLayerPlannerTests|FullyQualifiedName~DiagramHubSpokeLayerPlanner|FullyQualifiedName~DiagramForestLayoutSvgRendererTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
