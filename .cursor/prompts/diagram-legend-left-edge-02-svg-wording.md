# DLE-02 — On-canvas legend says Left edge

**Wave:** diagram-legend-left-edge (**DLE**). **Depends on:** DLE-01 merged is ideal but not required; IDA-09 legend emitter already exists. **Do not** move the legend, add kinds, or change swatch geometry.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The inventory-forest SVG legend (the one that survives **Export PNG**) uses the same words as the HTML Diagram legend: the category intro line reads **Left edge**, not `Eyebrow color = category swatch`.

## Why

IDA-09 already draws a 4 px swatch per used kind inside `g.legend`. The intro line is implementer jargon. A PNG reader and the page reader should see one name for the bar. DLE-01 owns the HTML card; this prompt only renames the SVG line.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs` — row text `Eyebrow color = category swatch` and the `string.Equals` branch that skips a swatch for that row.
- Tests that assert the old sentence: search `Eyebrow color` under `ArchLucid.ArtifactSynthesis.Tests`.

## What to build

1. Replace the intro row string with `Left edge`. Keep it as a text-only row (no swatch, no pictogram), same position: after the `Legend` title, before the per-kind rows.
2. Update the equality check that special-cases that row.
3. Update tests that expect the old sentence so they expect `Left edge`.
4. Do not add, remove, or reorder kind rows. Do not change `FillFor`, swatch size, placement, or viewBox math.

## Acceptance criteria

- Rendered forest SVG contains the text `Left edge` inside `g.legend`.
- It does not contain `Eyebrow color`.
- Kind swatches, Connector, Peering, Resource group, and Private endpoint access rows behave as they do today.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not edit the React legend (DLE-01). Do not add Microsoft icons.
- C#: concrete types over `var`, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLegend'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
