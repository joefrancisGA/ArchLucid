# IDA-06 — Collapse duplicate edge labels; style peering

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-05 (elbows exist). **Do not** implement hub-spoke, RG frames, legend SVG (beyond relying on it later), or IDA-07–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When every visible edge in a **connected component** has the **same non-empty label** (owner: six `"peering"`), **draw zero on-path pills** for that label. Encode the meaning as a **stroke style** instead (`stroke-dasharray` for peering). Distinct leftover labels still get a pill, anchored on the longest elbow segment, offset so two labels never share the same center.

## Why

Owner screenshot: six white “peering” chips stacked in the gap. `DiagramForestEdgeLabelSvgEmitter.ResolveLabelAnchor` uses one midpoint + 8 px offset, so co-linear fans occupy one pixel. Repeating the same word is not information. IDA-09 will name the dash in the legend; this prompt must still be readable **without** the legend via `aria`/`<title>` on the edge group (`peering`).

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — edge loop
- Compiler peering label `"peering"` / `GraphEdgeTypes.PeersWith` (see `DiagramAstFromGraphCompilerTests`)
- `DiagramComponentBuilder` / same undirected components as forest packing
- New: `DiagramForestEdgeLabelCollapse.cs` (own file)

Unlabeled visible edges (IDH honesty residual) stay unlabeled; do not invent `"peering"` text on the path. If the AST already labels them `peering`, collapse that.

## What to build

1. Collapse predicate (unit-tested):
   - Partition visible edges by undirected component membership.
   - If the component has ≥ 2 visible edges and **all** non-whitespace labels are equal (ordinal ignore case), mark those edges `SuppressOnPathLabel = true` (compute a side structure; do not mutate `DiagramEdge` unless a non-serialized layout field already exists — prefer a `HashSet` of edge ids passed to the emitter).
   - Mixed labels: do not suppress any in that component.
   - Single-edge component: keep the on-path label if present (nothing to collapse).

2. Peering style: if label is `peering` (ignore case) **or** edge type is peers-with, set `stroke-dasharray="6 4"` on the path. Other edges stay solid. Suppressed or not, peering is dashed.

3. Remaining pills:
   - Skip emit when suppressed.
   - Else place at midpoint of the longest path segment, offset 10 px perpendicular, then if that center is within 12 px of another label center already placed, nudge along the segment by 14 px and retry (max 5). Chip fill `#ffffff`, border `#cbd5e1`, text `#334155` (unchanged, now AA on white).

4. Each `g.edge` gets `<title>` equal to the label or `"connector"` if blank.

5. Tests:
   - Owner-shape: 6 dashed edge paths, **0** `g.edge-label` (or 0 text `"peering"` on the canvas except titles).
   - Component with 2 `peering` + 1 `contains`: all three **keep** on-path labels (mixed → no collapse).
   - Two different labels on two edges: both pills; centers at least 12 px apart in a stacked-fan fixture.
   - Unlabeled six-edge owner-like graph: 0 pills, still 6 paths (do not dash unless type is peers-with — if owner-shape compiler always stamps `peering`, use that fixture for dash).

6. No legend drawing (IDA-09). No Mermaid `-->` style (export stays topology).

## Acceptance criteria

- Owner 11/6 forest: no stacked peering pills; peerings are dashed elbows.
- Mixed-relationship components still show distinct words on the paths.
- Screen reader / tooltip still says peering.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** drop peering edges. **Do not** hide arrows by deleting paths.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestEdgeLabel|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestEdgeLabelCollapse'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
