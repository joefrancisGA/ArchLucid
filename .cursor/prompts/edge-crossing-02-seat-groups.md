# XC-02 — Seat connected resource groups beside each other

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not add a gutter or a new router in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_EDGE_CROSSING_LUNA_PROMPTS.md`

**Depends on:** XC-01, so the edges passed into the orderer are the edges that will be painted.

## Goal

When a painted edge joins two resource groups, those two frames sit in neighboring left-to-right positions. A third group does not sit between them.

## Why

`DiagramResourceGroupCellFlowPlanner.OrderCells` already ranks cells from visible `From → To` edges. On the Full subscription screenshot the left group still talks to the right group with the middle group in between, so the remaining connectors cross a column of unrelated cards. Rank from the edges XC-01 left on the canvas. A hidden fan-out edge must not push a group into a distant layer.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupCellFlowPlanner.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (the call to `DiagramResourceGroupCellFlowPlanner.OrderCells`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs`

## What to build

`OrderCells` receives the edges that `EmitSvg` will draw after XC-01's filter.

For every painted edge whose ends are in two different resource groups, the two cells are adjacent in the left-to-right order: their indexes differ by 1, or they share a layer only when the planner already stacks a layer vertically and the next layer is the other cell with no stranger between them on the horizontal run.

Break ties by the existing layer order. Do not sort by resource-group name. Do not pull a group that has no painted cross-group edge out of the unranked tail.

Do not change node placement inside a cell. Do not change `ComponentHorizontalGap` or `ComponentVerticalGap`.

## Tests

Extend `ArchLucid.ArtifactSynthesis.Tests`.

1. Groups A, B, and C. The only painted cross-group edge is A → C. After `OrderCells`, A and C are neighbors. B is not between them.
2. The same three groups, plus a painted edge A → B and B → C. Order is A, B, C or C, B, A.
3. An edge that XC-01 would hide is not in the list passed to `OrderCells`, and it does not change the order.

## Acceptance criteria

- A painted cross-group edge does not span a third resource-group frame.
- Groups with no painted cross-group edge stay in the unranked tail.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the cell-flow tests and `DiagramForestLayoutSvgRendererTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

Two resource groups that share a painted edge are side by side, and a third group is not standing between them.
