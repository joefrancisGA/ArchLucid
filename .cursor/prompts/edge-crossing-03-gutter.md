# XC-03 — Route remaining edges in a gutter

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not replace the orthogonal router.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_EDGE_CROSSING_LUNA_PROMPTS.md`

**Depends on:** XC-01 and XC-02.

## Goal

A painted edge that still joins two cards travels in the padding between resource-group frames, or in the gap between columns inside one frame. It does not pass through a third card.

## Why

`DiagramForestOrthogonalEdgeRouter.Route` tries one straight segment, two L-shapes, and a few three-segment elbows. `BuildObstacles` inflates every other card by 4px. When none of those candidates are clear, the method returns the first candidate with `UsedFallback: true` and the comment that the connector may cross a third node. The one extra vertical channel sits `NodeHorizontalGap` away from the source, inside the card pack. The padding that already belongs to the resource-group frame (`DiagramForestResourceGroupFrameStyle.Pad`, 12) is the lane that exists and is unused.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestOrthogonalEdgeRouter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`EmitSvg` obstacle build and `extraVerticalChannelX`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameStyle.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramEdgeCrossingCounter.cs`

## What to build

Keep the candidate list and the obstacle rectangles. Add gutter candidates, and prefer a clear gutter candidate over a fallback that intersects a card.

1. Between two resource-group frames, the vertical lane is the gap already produced by `ComponentHorizontalGap` after XC-02 seats the groups. Pass that lane's x to `Route` as a channel, the way `extraVerticalChannelX` is passed today. A segment on that x must sit outside both frame rects.
2. Inside one frame, the vertical lane is the gap between two columns of cards. Use the existing column gap. Do not invent a new gap constant and do not change `ComponentHorizontalGap` or `ComponentVerticalGap`.
3. `SelectBestClearRoute` may return a gutter candidate that is clear of every obstacle. When every candidate hits a card, still prefer the gutter segment that intersects the fewest card interiors. Set `UsedFallback` only when the chosen path intersects a card.
4. Do not add an A* search, a visibility graph, or a new layout engine.

## Tests

Extend `ArchLucid.ArtifactSynthesis.Tests`.

1. Three cards in a row. An edge from the left card to the right card. The path's segments do not intersect the middle card's rect. `UsedFallback` is false.
2. Two resource-group frames, one card in each, a painted edge between them, and a third card in a frame that is not between them. The path uses the inter-frame gap and does not enter the third card.
3. A case with no clear lane still returns a path (`UsedFallback` true) so the edge is not dropped.

## Acceptance criteria

- A clear gutter path never reports `UsedFallback`.
- Card bodies stay obstacles.
- Frame stroke, fill, and VNet stroke are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the router tests and `DiagramForestLayoutSvgRendererTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

An edge between two cards uses the gap beside them, and the fallback that cuts through a third card remains only when no gap is clear.
