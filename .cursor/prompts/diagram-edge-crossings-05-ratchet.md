# DEC-05 — Lock the crossing ratchet

**Wave:** diagram edge crossings (**DEC**). **Depends on:** DEC-01 through DEC-04. **Do not** add another routing strategy.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Tests lock two outcomes: a pair that can be uncrossed by reordering is uncrossed, and a pair that cannot be uncrossed without a long detour is allowed to cross. The ratchet fails if the easy pair regresses. It does not fail because the hard pair is still crossed.

## Why

DEC-02–04 can be “fixed” later by restoring `OrderKey` order or by always taking the first elbow. A single assertion on the easy fixture and a ceiling on the hard fixture keeps the policy: fewer crossings, growth allowed, zero not required.

## Context

- `DiagramEdgeCrossingCounter`
- `DiagramForestDataFlowColumnLayout` / `DiagramForestDataFlowEdgeRouter`
- `DiagramForestOrthogonalEdgeRouter` and `DiagramForestLayoutSvgRenderer`
- New tests beside the existing forest renderer tests: `ArchLucid.ArtifactSynthesis.Tests/DiagramEdgeCrossingRatchetTests.cs`

## What to build

1. Easy fixture: four nodes, two stages or two ranks, edges that cross under `OrderKey` order and do not cross after DEC-02. Render or plan the layout, collect segment lists, assert `DiagramEdgeCrossingCounter.Count` is `0`. Assert the viewBox is at least as tall as the pre-reorder stack (taller is fine).

2. Hard fixture: three edges that form one unavoidable interior crossing once nodes are fixed in a square (two opposite corners already ordered, the third edge must cross one of them). Assert the count is **at most 1**, and that no segment’s interior lies inside a third card. Do not assert `0`.

3. Do not snapshot the full owner subscription SVG. Do not add a pixel test.

4. If either fixture’s count is higher than the ceiling, fix the call order in the renderer so DEC-02 runs before routing and DEC-04 sees prior segments. Do not raise the ceilings to make the test pass.

## Acceptance criteria

- Easy fixture: `0` crossings.
- Hard fixture: `≤ 1` crossing, no card interior hit.
- No new production type beyond what DEC-01–04 already added, unless a test helper is required. Prefer arranging fixtures in the test file.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** retune Mermaid gaps. **Do not** add elk, React Flow, or Graphviz.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramEdgeCrossing"
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the command runs longer than 15s. No full-solution build.
