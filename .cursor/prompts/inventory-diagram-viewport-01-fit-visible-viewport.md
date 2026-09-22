# IDV-01 — Fit executive mermaid to the visible viewport

**Wave:** inventory-diagram-viewport (**IDV**). **Depends on:** none. **Do not** implement IDV-02–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On the **mermaid** `ArchitectureDiagramViewer` path (Inventory diagrams Executive, and architecture-review diagrams that pass `mermaidSource`), size the SVG so the **ink fits inside the visible viewport** (contain / meet). Stop width-stretching a tall `flowchart TD` chain to the full content column.

Help-topic `MermaidDiagram` must keep today’s **width-fill** behavior. Split or overload `fitMermaidSvgElementToHost` if inventory fit would change help.

## Why

Owner screenshot: Executive, 11 nodes / 10 edges / 0 subgraphs. Renderer emits `flowchart TD` (`ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs`). After `#2951` flatten, this is a tall narrow VNet chain. `fitMermaidSvgElementToHost` sets width = host width and `height = max(280, width × aspectRatio)`, so a 250×900 chain on a ~1000px column becomes ~3600px tall. The canvas then clips with `max-h-[36rem]` and a scrollbar. Zoom/Fit cannot pull the graph to the toolbar until this fit is honest.

Do **not** change mermaid emission to `flowchart LR`.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `ArchitectureDiagramMermaidCanvas` (`fitMermaidSvgElementToHost` on host `clientWidth` only; viewport `min-h-[18rem] max-h-[36rem]`)
- `archlucid-ui/src/lib/help/help-mermaid.ts` — `fitMermaidSvgElementToHost`, `MERMAID_FIT_MIN_HEIGHT_PX = 280`, ink viewBox crop
- `archlucid-ui/src/lib/help/help-mermaid.test.ts`
- `archlucid-ui/src/components/help/MermaidDiagram.tsx` — must still fill help frame width
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` — mermaid viewer call site

## What to build

1. Add (or extend) a fit helper used by the **architecture/inventory mermaid canvas** that takes **visible width and visible height** and applies SVG `width` / `height` / `viewBox` / `preserveAspectRatio="xMidYMid meet"` so the ink **contains** in that box. Keep the existing ink-based viewBox crop (do not revert `#2951` bbox mapping).
2. Default / help path: existing `fitMermaidSvgElementToHost(svg, hostWidthPx)` behavior unchanged (width-fill, min height 280). Inventory/architecture mermaid canvas must pass the viewport’s client box, not “width only.”
3. Visible viewport for this prompt: a bounded frame whose used height is the **content-sized** box after contain-fit, not a forced `min-h-[18rem]` empty hole around a small graph. A short executive chain should not sit in a tall empty frame. A tall graph may still scroll **inside** the max height; it must not be pre-stretched to column width.
4. Vitest in `help-mermaid.test.ts` (or a sibling test):
   - Tall-narrow ink (e.g. 200×900) fitted into 1000×360: result height ≤ 360, width ≤ 1000, aspect preserved.
   - Wide-short ink still uses width when that is the limiting side.
   - Legacy `fitMermaidSvgElementToHost(svg, 500)` still yields height 280 for the existing 120×60 fixture.
5. Do not overlay toolbar. Do not change zoom `transform` (IDV-02).

## Acceptance criteria

- An 11-node TD executive graph at default zoom is **fully in the visible frame** (or scrolled only if it still exceeds max height **after** contain-fit), not a thumbnail in a 36rem empty box.
- Help mermaid tests that assert width-fill / min-height 280 still pass.
- No change to `flowchart TD` compiler output.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** revert `#3013` mermaid compile or `#2951` subgraph flatten / ink crop.
- **Do not** add svg-pan-zoom or a new dependency.
- **Do not** change PNG export APIs or outline tables.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` (`help-mermaid.test.ts` and any new fit tests). No full-solution build, no dev server unless this file says so.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
