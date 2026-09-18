# IDA-04 — Content-sized cards, icon left, text right

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-03 (palette/paint stable). **Do not** implement orthogonal edges, RG frames, hub-spoke, or IDA-05–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Forest nodes are **no longer 400 px wide**. Width follows the wrapped name (min 160, max 280). Layout is **pictogram left, two-line text right** (bold name, muted RG). Height hugs that row (~40–56 px), not icon-above-text plus empty side padding.

## Why

Owner cards are three times wider than the names. Horizontal scrollbar and empty gold (now slate) flanks are the aesthetic. `DiagramForestLayoutOptions` sets `UniformNodeWidth` = `MinNodeWidth` = `MaxNodeWidth` = 400. `DiagramForestLayoutSvgRendererTests.Render_owner_shape_executive_vnets_use_uniform_node_width` **locks that mistake** — rewrite the test; do not preserve 400.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs` — `Measure` / wrap width
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeMetricsCalculator.cs` — delegates to label context
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` — centered pictogram, centered text
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeMetrics.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryNodeCanvasLabelFormatter.cs`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts` — `ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH = 400` is **Mermaid-only**. Do **not** retune `nodeSpacing`/`rankSpacing`. Optionally lower wrappingWidth to 280 so dagre fallback names wrap similarly — only if a Mermaid unit test already pins 400; then update that test. Do not start an IDT gap pass.
- Tests: `DiagramForestLayoutSvgRendererTests` (400 px, viewBoxHeight < 800)

Accent bar (IDA-02) stays 4 px on the left edge of the **card**, not on the pictogram.

## What to build

1. `DiagramForestLayoutOptions`:
   - `MinNodeWidth` = 160
   - `MaxNodeWidth` = 280
   - `UniformNodeWidth` = 280 (fallback empty component width only — **not** “every node is this wide”)
   - Keep `PictogramSize` 28, `IconToLabelGap` 6, `NodePaddingX` 8, `NodePaddingY` 6, `LineHeight` 16 unless measure requires +2 px padding. Do not increase gaps between **components**.

2. Measure:
   - Text column width = `Max(min, Min(max, longest wrapped name/RG line * CharacterWidth))`.
   - Card width = `NodePaddingX + PictogramSize + IconToLabelGap + textColumnWidth + NodePaddingX` clamped to `[MinNodeWidth, MaxNodeWidth]`.
   - Wrap names to the **text column**, not the full card (leave room for the icon).
   - Height = `NodePaddingY * 2 + Max(PictogramSize, nameLines * LineHeight + rgLines * LineHeight)`.

3. `DiagramForestNodeSvgEmitter`:
   - Pictogram at `(NodePaddingX, vertical center)`.
   - Name `text-anchor="start"`, x = `NodePaddingX + PictogramSize + IconToLabelGap`, dominant baseline for first line; RG line under it, `LightNodeCaption`.
   - Lock glyph (PE) stays top-right inside padding (`DiagramForestPrivateEndpointLockSvgEmitter`) — do not cover the name.
   - `node-card` + `node-accent` full card height.

4. Tests:
   - **Delete** “all widths are 400”. Replace: owner-shape eleven node-card widths each in `[160, 280]`; at least one width **< 400**; max width ≤ 280.
   - A short name (`vm-1`) is narrower than a long name (`vnet-userprovision-hi-nonprod01`) unless both clamp at max.
   - Owner-shape `viewBox` still finite; **width should shrink vs 11×400**. Assert viewBox width **< 3200** (old packing was ~ four 400 px columns + gaps). Keep `viewBoxHeight < 800` unless icon-left row is taller — if so, new ceiling **< 900** with a comment.
   - SVG has pictogram `transform` translating to the left padding, not `(width - 28) / 2`.
   - Name `text-anchor` is `start` for forest cards.

5. No edge reroute (IDA-05). Endpoints still work with new box sizes via existing `ResolveEdgeEndpoints`.

## Acceptance criteria

- Owner Executive 11-VNet forest has no 400 px cards.
- Icon sits left of the name. RG caption remains under the name, not under the icon.
- Horizontal empty flanks are gone for typical resource names.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** retune Mermaid `nodeSpacing` / `rankSpacing` / `padding` (IDG hold). WrappingWidth 280 is the only allowed Mermaid constant change, and only to match max card width.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestCanvasLabelContext|FullyQualifiedName~DiagramForestNode'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
