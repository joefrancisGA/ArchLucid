# VN-23 — Seat each connector label on its own line

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-19. Do not re-run VN-01 through VN-22.

## Goal

On a forest diagram, each painted connector label sits on the middle of its own line. When two labels would overlap, the later one stacks beside that midpoint, still on its own line.

## Why

`DiagramForestEdgeLabelSvgEmitter.ResolveLabelAnchor` takes the midpoint of the longest segment, then shifts the chip 10px off the stroke (`LabelOffset`). A horizontal line puts the words in the gutter above the stroke. A vertical line puts them to the right. At subscription zoom those chips read as ticks in the gaps.

Overlap uses a 12px center radius (`LabelCollisionRadius`). A `private endpoint × 3` chip is much wider than 12px, so two chips can cover each other and still count as clear. On a hit, the anchor walks 14px along the segment (`LabelNudge`), up to five times, which carries the words off the middle of the line.

The lines that stay are the real ones: `private endpoint`, `private endpoint × N`, `used by`, and `peering`. This session only moves those labels. It does not draw new lines.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` (`EmitEdgeGroup`, `ResolveLabelAnchor`, `EstimateLabelWidth`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (the `placedLabelCenters` list passed into `EmitEdgeGroup`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelCollapse.cs` (`ShouldSuppressOnPathLabel`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

Change label placement in `DiagramForestEdgeLabelSvgEmitter` only. `EmitSvg` already calls that emitter. Do not change which edges are painted, which labels are suppressed, the bundle text, the stroke, the dash, or the arrow.

The chip keeps the current size. Width stays `(label.Length * 6.4) + (LabelPaddingX * 2)`. Height stays `LabelFontSize + (LabelPaddingY * 2)`. Font size stays 11. The text stays lowercase. The text `x` and `y` are the chip center.

1. The first label on an edge is centered on the midpoint of that edge's longest segment. Do not add the 10px perpendicular offset.
2. Two chips collide when their rectangles overlap or touch. Use those rectangles. Do not use a 12px center radius.
3. When the midpoint collides with a chip already placed, keep the same position along the segment and step perpendicular to the segment. The step is the chip height plus 2px. On a horizontal segment, the first step is up (smaller Y), the next is down (larger Y), then one step further up, then one step further down. On a vertical segment, the first step is to the right (larger X), the next is to the left (smaller X), then further right, then further left. Stop at the first free slot. Eight steps is enough.
4. Do not slide the label along the segment.

Remove `LabelOffset`, `LabelCollisionRadius`, and `LabelNudge` when nothing reads them.

Leave `ShouldSuppressOnPathLabel` as it is. A suppressed edge still has no on-path chip. An empty label still has no chip. A bundled line still reads `private endpoint × N`.

## Tests

Add `ArchLucid.ArtifactSynthesis.Tests/DiagramForestEdgeLabelSvgEmitterTests.cs`. Call `DiagramForestEdgeLabelSvgEmitter.EmitEdgeGroup` with a `DiagramForestOrthogonalEdgeRouter.RouteResult`. Read the `text` element inside `g.edge-label`. Its `x` and `y` are the chip center.

1. One horizontal segment from `(0, 100)` to `(200, 100)`, label `used by`. The chip center is `(100, 100)`.
2. The same horizontal segment for two edges, labels `used by` and `peering`. Both centers have x `100`. The second center's y is `100` minus the chip height minus 2. The chip rectangles do not overlap.
3. One vertical segment from `(40, 0)` to `(40, 180)` for two edges, labels `used by` and `peering`. Both centers have y `90`. The second center's x is `40` plus the chip height plus 2. The chip rectangles do not overlap.
4. Through `DiagramForestLayoutSvgRenderer`, two topology cards and one edge labelled `used by`. Parse that edge path `d` (`M`, then `H` or `V`) into segments. The label center matches the longest segment's midpoint. It is not 10px off that midpoint.

The existing six-peering label count, the empty private-endpoint edge with no `edge-label`, and the `private endpoint × 3` bundle title stay as they are.

## Acceptance criteria

- A lone label is centered on the longest segment of its line.
- A second label that would cover the first stacks off that midpoint, perpendicular to the segment, and stays on the same along-segment coordinate.
- Suppressed labels, empty labels, bundle text, strokes, boxes, and the Show cross-group links checkbox stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestEdgeLabelSvgEmitterTests`, `DiagramForestLayoutSvgRendererTests`, and `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- Do not hide edges in this session. Do not change `ComponentHorizontalGap` or `ComponentVerticalGap`.

## Done when

A forest SVG shows `used by`, `peering`, and `private endpoint × N` centered on their own lines, and a second label that would land on the first sits stacked beside that midpoint.
