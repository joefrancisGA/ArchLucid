# IDF-02 — Resource-group label inside the frame

**Wave:** inventory-diagram-frames (**IDF**). **Depends on:** IDF-01 (per-cell frames). **Do not** implement stroke-width / solid / fill-opacity, global gap bumps, crop, Graphviz, or IDF-03–07.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The resource-group name is painted **inside** the frame at top-left, 12 px semibold, with a small white halo so a crossing edge cannot strike through it. A **top label band** is reserved in the frame geometry so the name does not sit on the cards. Labels of adjacent frames no longer share a 16 px gutter.

## Why

IDA-08 parked the label at `frame.Y - 4` (outside). Vertical gutter between frames is 16 px (40 − 12 − 12). An 11 px name plus the box above it cannot fit. Owner 2026-09-16 screenshot: three names overprint at one corner; `anly-aep-ppd-hi` is cut by the border of the frame above. Edge-label pills already use a white `rect` halo (`DiagramForestEdgeLabelSvgEmitter`) — reuse that idea, do not invent a second halo language.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs` — `text` at `y = frame.Y - 4`, `font-size="11"`, fill `LightNodeCaption`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs` — pad 12 on all sides (IDF-01 named it)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` — halo `fill="#ffffff"` `stroke="#cbd5e1"` `stroke-width="1"` `rx="3"`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` — add named band/pad here if IDF-01 left pad on the packer only; one source of truth
- Tests from IDF-01: AABB still holds after the top band grows the frame

**Do not** change stroke/dash/fill-opacity (IDF-03). **Do not** charge the band to **cell** size yet (IDF-04) — this prompt only grows the **frame rect** upward/inward so the label fits inside the existing painted box. If the taller frame would overlap a neighbor, **stop and do not clip the label**; note it as residual for IDF-04 rather than overlapping (IDF-01 AABB must still pass — prefer growing **inward** by placing nodes with a top inset inside the cell so the outer AABB stays the IDF-01 pad, **or** grow the frame up by the band and add the band to measured cell height in this prompt if that is the only way to keep AABB). Prefer: **inward top inset** on member cards relative to the frame (cards start below the label band) without changing `ComponentVerticalGap`. That inset is the start of IDF-04 chrome — if you must touch cell height to keep AABB, that is allowed here as a **label-band-only** addition, not a global gap bump.

## What to build

1. Named constants (options or a small `DiagramForestResourceGroupFrameStyle` file — IDF-03 will add stroke there):
   - `ResourceGroupFramePad` = 12 (sides/bottom; keep IDA-08).
   - `ResourceGroupFrameLabelBand` = 18 (top inside the frame: 12 px type + ~6 px padding).
   - Label `font-size` **12**, `font-weight` **600**, fill `#334155` (or `LightNodeText` if that is already `#0f172a` — use **`#334155`** so it is quieter than the card name but stronger than `#475569` at 73% zoom).

2. Frame SVG:
   - `text` at top-left **inside** the rect (e.g. `x = frame.X + 8`, baseline inside the label band).
   - White halo `rect` behind the text, same recipe as edge labels (`fill="#ffffff"`, `stroke="#cbd5e1"`, `stroke-width="1"`, `rx="3"`), `pointer-events="none"`.
   - Wrap once if wider than `frame.Width - 16`; second line stays in the band (grow band to 32 only when wrapped; test that case).
   - `aria` / `<title>` on `g.rg-frame` = group name if missing.

3. Geometry: member cards must not overlap the label band. Either offset framed-cell node Y by the band inside the cell, or increase the top pad to `Pad + LabelBand` when emitting bounds. Pick **one**. AABB non-overlap from IDF-01 still passes.

4. Tests:
   - Frame `text` `y` is **greater than** `rect.y` (inside).
   - Halo `rect` exists as a sibling under `g.rg-frame`.
   - Split-RG fixture (IDF-01): two labels, both readable as separate `text` nodes, no identical `x,y`.
   - Long name wraps once; cards still below the band.
   - Singleton: still no frame; IDR caption unchanged.

5. Do **not** retune Mermaid gaps. Do **not** edit `help-mermaid.ts` (IDF-05).

## Acceptance criteria

- Group names sit inside their own box and do not collide with the neighbor's border.
- Cards do not sit under the label.
- IDF-01 overlap tests still pass.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDF-03–07. **Do not** bump `ComponentHorizontalGap` / `ComponentVerticalGap`.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
