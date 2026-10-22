# DEC-04 — Pick the node-clear route that crosses fewer edges

**Wave:** diagram edge crossings (**DEC**). **Depends on:** DEC-01. DEC-02 and DEC-03 should already be in the tree. **Do not** implement DEC-05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When the forest orthogonal router has more than one candidate that misses other cards, choose the candidate that crosses fewer **already routed** edges. If every candidate crosses, keep the one with the smallest count. The canvas may grow by one extra channel beside a rank. Do not hunt for a zero-crossing route past that.

## Why

`DiagramForestOrthogonalEdgeRouter.Route` returns the first candidate that misses cards: straight, horizontal-first, vertical-first, then a U. It never looks at other connectors. Inventory diagrams that are not `(DataFlow)` still use this router.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestOrthogonalEdgeRouter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — the non-data-flow branch around `ResolveEdgeEndpoints` / `Route`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramEdgeCrossingCounter.cs`
- Data-flow edges stay on DEC-03. Do not run this chooser on a route `DiagramForestDataFlowEdgeRouter` already returned.

## What to build

1. Add an overload `Route(..., IReadOnlyList<IReadOnlyList<segment>> alreadyRouted)`. The existing `Route` keeps its signature and behaves as today when the caller passes no prior routes (tests that call `Route` directly stay valid).

2. Build the same candidate list the router already tries (axis-aligned straight, horizontal-first, vertical-first, three-segment U). Drop any candidate that hits a card. Among the rest, pick the minimum DEC-01 count against `alreadyRouted`. Tie-break by the existing try order, so a clear straight line still wins over an elbow with the same crossing count.

3. If every candidate hits a card, keep today’s fallback (`UsedFallback: true`), even if it crosses edges and cards. Do not add a fourth bend.

4. One growth allowance, forest only: if the winning candidate still crosses and a single extra vertical channel **one node-gap to the right of the source rank** is free of cards, try that channel as one more candidate. If it reduces the count, take it and let the viewBox grow. If it does not, discard it. Do not try a second channel.

5. The renderer passes the segments already emitted in this diagram, in the same `visibleEdges` order it already uses. First edge sees an empty list.

6. Tests:
   - Two edges where horizontal-first crosses the first edge and vertical-first does not, and both miss cards: the second edge uses vertical-first.
   - A case where both L-bends cross: the chosen path is the smaller count, and the test does not require zero.
   - The one-channel growth is used only when it strictly reduces the count; a second channel is never present in the path.
   - Owner-shape peering paths still miss third-card interiors (existing renderer assertion).

## Acceptance criteria

- Node bodies stay clear whenever a clear candidate exists.
- A leftover crossing remains in the SVG when every cheap candidate crosses.
- Data-flow lane assignment from DEC-03 is unchanged.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** retune Mermaid gaps. **Do not** add elk, React Flow, or Graphviz.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForestOrthogonalEdgeRouter|FullyQualifiedName~DiagramForestLayoutSvgRenderer|FullyQualifiedName~DiagramEdgeCrossingCounter"
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the command runs longer than 15s. No full-solution build.
