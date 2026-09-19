# IDA-09 — On-canvas SVG legend that survives PNG

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-02 (kinds) and IDA-06 (edge styles). **Do not** implement outline collapse, camera, or IDA-10–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory-forest SVG includes a **legend** in the lower-left of the viewBox (padding 16) naming: pictogram kinds that **appear on this canvas**, the private-endpoint lock if any node has it, solid vs dashed connectors. The legend is real SVG so **Export PNG** / html2canvas / server raster of `layoutSvg` keeps it. No HTML overlay.

## Why

Owner canvas and PNG have no key. After IDA-02/06, accent colors and dashes are meaningless to a first-time viewer. A DOM legend outside the SVG is lost on download.

## Context

- `DiagramForestLayoutSvgRenderer.EmitSvg` — viewBox from node union + padding
- `DiagramInventoryPictogramKind` + `FillFor` (IDA-02)
- `DiagramForestPrivateEndpointLockSvgEmitter`
- New: `DiagramForestLegendSvgEmitter.cs` (own file)
- Expand viewBox so the legend **does not overlap** nodes (add legend height + 12 px to `maxY` or place in a column to the left and widen `minX`). Prefer **below** the node union if the plate is wide; **left** if the plate is already very tall. Unit-test that legend AABB does not intersect any `g.node` AABB.

Do not list kinds that are unused on this AST. Do not list every Azure ARM type.

## What to build

1. Collect kinds from `metrics.PictogramKind` on placements; sort enum declaration order.
2. Legend group `g.legend` with `aria-label="Diagram legend"`:
   - Title `Legend`, font 11, `#475569`.
   - One row per kind: 4×12 accent swatch + pictogram at 16 px + kind word (`Network`, `Compute`, …) sentence case.
   - If any `HasPrivateEndpointAccess`: lock glyph + `Private endpoint access`.
   - Connector rows: solid line `Connector`; dashed `Peering` **only if** a dashed edge exists on this canvas.
3. Background: white `rect` `rx=4` stroke `#e2e8f0` behind the rows so it reads on the viewport.
4. Tests:
   - Owner-shape VNets: legend contains `Network` and `Peering` (after IDA-06); does not contain `Identity` unless present.
   - No-edge zero-kind-generic graph: still a legend with Generic if used; no Peering row.
   - Legend rect does not intersect node-card rects.
   - `class="legend"` present in SVG string.

5. Mermaid dagre fallback: **out of scope** (no forest emitter). Residual: client-only Mermaid has no legend — acceptable; live inventory is forest.

## Acceptance criteria

- Forest SVG/PNG shows a compact legend of **used** kinds and edge styles.
- Legend does not cover cards.
- Unused kinds omitted.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** add Microsoft icons to the legend. **Do not** use foreignObject.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLegend|FullyQualifiedName~DiagramForestLayoutSvgRendererTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
