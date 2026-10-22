# DEC-01 — Count edge–edge crossings

**Wave:** diagram edge crossings (**DEC**). **Depends on:** nothing. **Do not** reorder nodes, assign lanes, or change routes. **Do not** implement DEC-02–05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A pure function counts how many times routed connector segments cross. Shared endpoints do not count. No SVG or placement change in this prompt.

## Why

Later prompts need a number they can lower. Today the routers only know whether a segment hits a **card**. Two elbows can cross in open space and the renderer still emits both paths.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestOrthogonalEdgeRouter.cs` — `RouteResult.Segments` is the polyline
- New file: `ArchLucid.ArtifactSynthesis/Layout/DiagramEdgeCrossingCounter.cs`
- New tests: `ArchLucid.ArtifactSynthesis.Tests/DiagramEdgeCrossingCounterTests.cs`

## What to build

1. `Count(IReadOnlyList<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> routes)` returns the number of proper intersections between segments that belong to **different** routes.

2. Two segments do not cross when they only meet at an endpoint (a fan out of one card). They do cross when interiors intersect, including a horizontal segment crossing a vertical segment at a T that is not an endpoint of both.

3. Ignore a segment whose length is below the router’s existing axis epsilon. Use invariant culture only if you format anything; the counter itself returns an `int`.

4. Tests:
   - Two diagonals that cross at their midpoints → `1`. (Construct them as an H and a V that cross, since live routes are orthogonal.)
   - Two segments that share an endpoint and otherwise miss → `0`.
   - Three mutually crossing orthogonals → `3`.
   - An empty list and a single route → `0`.

## Acceptance criteria

- The counter is deterministic and does not read the SVG.
- Existing forest and data-flow renderer tests still pass without edits, unless a compile break forces a call-site that you did not add. You should not add a call site.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~DiagramEdgeCrossingCounterTests
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the command runs longer than 15s. No full-solution build.
