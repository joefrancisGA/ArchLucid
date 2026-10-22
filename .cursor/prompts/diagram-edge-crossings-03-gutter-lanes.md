# DEC-03 — Separate lanes in the gutter and the sky band

**Wave:** diagram edge crossings (**DEC**). **Depends on:** DEC-01 and DEC-02. **Do not** change which orthogonal candidate the forest router picks. **Do not** implement DEC-04 or DEC-05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Data-flow edges that share a gutter, and edges that share the sky lane, each get their own lane while the reserved band can hold them. Past that cap, extra edges share a lane and may cross.

## Why

`DiagramForestDataFlowEdgeRouter` places every adjacent-column edge on one `gutterCenterX`, and every skip edge on one `skyLaneY`. Reordering (DEC-02) removes crossings that are only an order problem. Edges that still must change Y inside that gutter still draw on top of each other.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowEdgeRouter.cs` — adjacent gutter and sky-lane segments
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs` — `DataFlowColumnGutter`, `DataFlowSkyLaneHeight` on options
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` — those two fields
- `ArchLucid.ArtifactSynthesis/Layout/DiagramEdgeCrossingCounter.cs`

## What to build

1. Lane pitch is **8** px. A gutter may hold at most `floor(DataFlowColumnGutter / 8) - 1` distinct X lanes, centered in the gutter, never inside a card (keep the existing obstacle inflation). A sky band may hold at most `floor(DataFlowSkyLaneHeight / 8) - 1` distinct Y lanes. If that count is below 1, keep today’s single center and stop.

2. Assign lanes in router order (the order edges are already emitted). The first edge in a gutter takes the center lane. The next takes the next free lane, alternating above/below or left/right of center. When every lane is taken, reuse the center lane.

3. Same-column routes are unchanged. Node obstacle checks still apply. If a laned path hits a card, fall back to the current single-center route for **that edge only**.

4. Do not grow `DataFlowColumnGutter` or `DataFlowSkyLaneHeight` in this prompt. Wider-or-taller spending belongs to DEC-04 if a lane will not fit. Here, the cap is the acceptance of a crossing.

5. Tests:
   - Two adjacent-column edges whose Y order differs: their vertical gutter segments have different X, and DEC-01 reports `0` crossings, when the gutter can hold two lanes.
   - A gutter forced to one lane (test options with a gutter under 16 px): both edges may share X, and the test allows a crossing.
   - A path still does not enter a third card’s inflated rect.

## Acceptance criteria

- Distinct lanes when the band has room.
- Shared lane, and an allowed crossing, when it does not.
- Stage columns and frames stay where DEC-02 left them.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** retune Mermaid gaps. **Do not** add elk, React Flow, or Graphviz.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForestDataFlowEdgeRouter|FullyQualifiedName~DiagramEdgeCrossingCounter"
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the command runs longer than 15s. No full-solution build.
