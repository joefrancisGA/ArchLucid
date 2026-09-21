# IDA-05 — Orthogonal edges and directed markers

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-04 (new card sizes). **Do not** implement label collapse, hub-spoke, RG frames, or IDA-06–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Forest visible edges are **elbow (orthogonal) paths** that leave and enter node **sides**, never as a straight line through another node’s body. Directed AST edges get a `marker-end` arrowhead. Stroke is IDA-01 `LightEdgeStroke` (`#94a3b8`), width 1.5. No fill.

## Why

Owner screenshot: six peerings from a left stack slash diagonally across cards; labels sit on those chords. `ResolveEdgeEndpoints` already picks a side; `DiagramForestEdgeLabelSvgEmitter` then draws `<line x1 y1 x2 y2>`. Humans sketch Azure with elbows. Crossing a third node is a layout bug, not an aesthetic preference.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `ResolveEdgeEndpoints`, `EmitSvg` edge layer under nodes
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` — `<line>` + midpoint pill
- `ArchLucid.ArtifactSynthesis.Models` `DiagramEdge` — directed `From`/`To`; peering is still a directed row in the AST
- Keep labels working: midpoint of the **longest elbow segment**, not of the chord. IDA-06 will collapse duplicate pills; this prompt must not stack them worse. If several edges share the same elbow, offset later in IDA-06 — here, place each label on its own path’s mid segment.
- New helpers in **own files**: e.g. `DiagramForestOrthogonalEdgeRouter.cs`, `DiagramForestEdgeArrowMarkerSvgEmitter.cs`

Do **not** add a JS layout library. Do **not** switch to Graphviz `splines=ortho` as the live canvas (forest remains live).

## What to build

1. Router: given from/to placements (x, y, w, h) and **all** node rects in the diagram:
   - Prefer horizontal-then-vertical or vertical-then-horizontal so the path has at most **two** segments (one bend) when that path’s segments do not intersect another node rect (inflate rects by 4 px).
   - If both L-bends hit a node, try a 3-segment U around the nearer side of the obstacle.
   - If routing still hits, fall back to the current side-to-side chord (comment: last resort). Test that the owner-shape hub fan does **not** need the fallback for the six peerings.
   - Emit SVG `path` (`M … H … V …` or `L`), `fill="none"`, `stroke={LightEdgeStroke}`, `stroke-width="1.5"`, `stroke-linejoin="round"`, class `edge-path`.
   - Delete the straight `<line>` for routed edges.

2. Arrowhead: SVG `<defs><marker id="al-edge-arrow">` once on the root. `marker-end` on **directed** visible edges. Peering (`label` equals `peering` or `EdgeType` peers-with — use the same predicate the compiler uses for peering) is **symmetric**: **no** arrowhead (or arrows both ends — pick **none**; IDA-06 will dash them). Other dependency edges: arrow at `To`.

3. Keep edges in the under-nodes layer so cards occlude the path at the attachment, but the path must **not** run through a **third** card’s interior. Attachment points stay on the rectangle border (existing side picker is OK as the start/end).

4. Tests (`DiagramForestLayoutSvgRendererTests` and new router tests):
   - Owner-shape: 6 `path.edge-path` (or `g.edge path`), 0 straight `g.edge > line` for those peerings (label rects are not edges).
   - Synthetic: node A left of C left of B, edge A→B: path `d` does not have a single line segment whose interior point lies inside C’s rect.
   - Marker exists; a non-peering directed edge references `marker-end`; peering edges do not.
   - Label still present for `"peering"` (IDA-06 may remove duplicates later; this prompt keeps one per edge).

5. No dash style yet (IDA-06). No hub re-placement (IDA-07).

## Acceptance criteria

- Owner 11/6 forest: peering connectors are elbows; they do not cut through intermediate VNet cards.
- Directed non-peer edges show an arrow at the target.
- Stroke is `#94a3b8`, not brown/honey.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** introduce elk, React Flow, or svg-pan-zoom. **Do not** retune Mermaid gaps.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestOrthogonalEdgeRouter|FullyQualifiedName~DiagramForestEdge'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
