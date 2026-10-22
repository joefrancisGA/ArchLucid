# IDF-03 — Obvious frame stroke and plate

**Wave:** inventory-diagram-frames (**IDF**). **Depends on:** IDF-02 (label inside). **Do not** implement cell-gap chrome, crop, Graphviz clusters, or IDF-04–07.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory-forest resource-group frames read as **containers**, not as peering wires: **2 px solid `#64748b`**, opaque `#f1f5f9` plate, `rx="8"`. The on-canvas legend gains a **Resource group** row when any frame exists.

## Why

Owner asked to double the line width and add space (space is IDF-04). Today `DiagramForestResourceGroupFrameSvgEmitter` omits `stroke-width` (SVG default 1 px), uses `LightEdgeStroke` `#94a3b8` and `stroke-dasharray="5 4"`. Peering edges are 1.5 px dashed `#94a3b8` `6 4`. Declared edges (IDP-02) use `4 3`. A third dash language would still look like a wire. Fill opacity 0.5 over white matches `LightNodeFill` `#f8fafc`, so there is no plate. Darker + thicker + **solid** is what makes a doubled line parse as a box.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs`
- `ArchLucid.Core/Diagrams/ArchitectureDiagramMermaidPalette.cs` — do **not** reuse `LightEdgeStroke` for frames. Add `LightResourceGroupFrameStroke = "#64748b"` (and dark twin if the emitter is ever dark; forest is light-only today).
- Style constants file started in IDF-02 (`DiagramForestResourceGroupFrameStyle` or options) — add stroke/fill here.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs` — `LegendInput` currently `(UsedKinds, HasPrivateEndpointAccess, HasDashedPeeringEdges)`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` — peering stays `6 4` / 1.5 px / `#94a3b8`
- IDP-02 declared dash `4 3` — do not touch

**Do not** restyle peering or declared edges. **Do not** use teal. **Do not** restore `5 4` on frames.

## What to build

1. Frame rect attributes (locked):
   - `stroke-width="2"`
   - `stroke="#64748b"` (palette constant)
   - **no** `stroke-dasharray` (solid)
   - `fill="#f1f5f9"`
   - `fill-opacity="1"`
   - `rx="8"` unchanged
   - `pointer-events="none"` unchanged
   - Label halo unchanged from IDF-02

2. Legend: when `frameBounds.Count > 0`, add a row **Resource group** with a 16×10 rounded-rect swatch using the same stroke/fill (2 px solid `#64748b`, fill `#f1f5f9`). Omit the row when the canvas has no frames. Extend `LegendInput` with `HasResourceGroupFrames` (or pass the count). Do not list every RG name in the legend.

3. Tests:
   - Framed fixture SVG contains `stroke-width="2"` on `g.rg-frame rect` and does **not** contain `stroke-dasharray="5 4"` on that rect.
   - Frame `stroke` is `#64748b`; peering `path.edge-path` with dash remains `#94a3b8` / `6 4` on a fixture that has both.
   - `fill-opacity="1"` (or omitted equivalent of 1) and `fill="#f1f5f9"`.
   - Legend text `Resource group` present iff frames exist; owner-shape 11 VNets with no RG still omit it.

4. Graphviz DOT: **out of scope** (IDF-06). Mention residual in the session summary.

## Acceptance criteria

- A framed Full-subscription forest box is a 2 px solid slate rectangle on an opaque slate-50 plate.
- Peering chords stay dashed and lighter.
- Legend names the container when it appears.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDF-04–07. **Do not** bump global component gaps. **Do not** dash the frame to “match IDA-08.”
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestResourceGroupFrame|FullyQualifiedName~DiagramForestLegend|FullyQualifiedName~DiagramForestLayoutSvgRendererTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
