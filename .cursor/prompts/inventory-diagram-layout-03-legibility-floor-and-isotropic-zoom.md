# IDL-03 — Legibility floor, natural-size ceiling, centered canvas, isotropic zoom

**Wave:** inventory-diagram-layout (**IDL**). **Depends on:** none (viewer-only; works with or without IDL-01/02). **Do not** implement IDL-04–06. Owner must answer index questions **1** and **2** first; defaults below apply if unanswered.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On the inventory / architecture **mermaid** path of `ArchitectureDiagramViewer`:

1. Contain-fit never shrinks labels below a legibility floor and never enlarges past natural size. When the graph cannot fit at the floor, the viewport **scrolls** (it is already `overflow-auto`).
2. The fitted SVG is **centered** in the viewport, not hugging the left padding.
3. Zoom is **isotropic**: N% scales both axes by N/100 of the fitted base. Remove the `max-width: 100%` cap that makes 1000% stretch height only.

## Why

Reproduced 2026-09-12. Current chain: fitted SVG 123 × 520 px in a 1166 × 558 viewport, labels ≈ 6 px, chain in the left 10%. At 1000%: `width` attribute 1230 but rendered width capped at 1134 by `svg.style.maxWidth = "100%"` (set in `applyMermaidSvgInkViewBox`), height 5200; `preserveAspectRatio="xMidYMid meet"` then re-centers ink in a tall box, so the user scrolls through blank space — "nodes far apart". Grid fixture: fit **upscaled** nodes to 128% (316 × 75 px) because nothing caps scale at 1.0. Owner: "minimum node width, use scrollbars on the initial presentation, if necessary".

## Context

- `archlucid-ui/src/lib/help/help-mermaid.ts` — `fitMermaidSvgElementToViewport`, `applyMermaidSvgInkViewBox` (`maxWidth = "100%"`), `applyMermaidSvgPixelSize`, `applyMermaidSvgViewportZoom`, `readMermaidViewportFitBudget`, `MermaidViewportFitDimensions`
- `archlucid-ui/src/lib/help/help-mermaid.test.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `MERMAID_SVG_HOST_CLASSNAME` (`inline-block min-w-0`), viewport `relative w-full max-h-[36rem] overflow-auto … p-4`, `applyMermaidViewportCamera`, `fitToView`, `scrollViewportToOrigin`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.test.tsx`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts` — `themeVariables.fontSize: "15px"` (natural label size)
- `archlucid-ui/src/lib/architecture/architecture-diagram-fullscreen-url.ts` — zoom clamp / percent helpers (keep)
- `archlucid-ui/src/components/help/MermaidDiagram.tsx` — help width-fill path, **must not change**

## What to build

1. In `help-mermaid.ts` add exported constants `MERMAID_NATURAL_LABEL_FONT_PX = 15` and `MERMAID_MIN_LEGIBLE_LABEL_FONT_PX = 11` (owner may change to 12–13), and `MERMAID_VIEWPORT_MIN_FIT_SCALE = 11 / 15`, `MERMAID_VIEWPORT_MAX_FIT_SCALE = 1`.
2. `fitMermaidSvgElementToViewport`: compute `rawScale = min(availW / viewW, availH / viewH)` as today, then `scale = clamp(rawScale, MIN_FIT_SCALE, MAX_FIT_SCALE)`. Return `{ baseWidthPx, baseHeightPx, inkMeasured, fitScale: scale, overflows: baseWidthPx > availW || baseHeightPx > availH }`. Extend `MermaidViewportFitDimensions` accordingly.
3. Remove `svg.style.maxWidth = "100%"` from `applyMermaidSvgInkViewBox` for the viewport path (the help path may keep its own max-width in `fitMermaidSvgElementToHost`; split the helper if needed). `applyMermaidSvgPixelSize` must set `style.maxWidth = "none"` so zoom > 100% grows both axes and the viewport scrolls.
4. Center the ink: the SVG host on the mermaid path renders as a block that is at least the viewport's inner width with the SVG centered (`flex justify-center` on a `min-w-full` host, or `mx-auto` on the SVG via a host selector). When `overflows` is true the host must still be scrollable to the SVG's left/top edge (no negative offset hiding the first column).
5. `fitToView` / initial fit: after a fit that `overflows`, scroll the viewport to origin (already done) — do **not** shrink further. When `overflows` is false, no scrollbars appear.
6. Zoom semantics (default = index question 1 answer "keep 100% = fitted base"): `applyMermaidSvgViewportZoom` stays `base × zoom` on both axes; with the cap gone this is now linear. Add a `title`/`aria-description` on the percent input from copy constants: "100% fits the diagram to the frame". If the owner chose "100% = natural size", instead set base = natural (`viewW × 1`, `viewH × 1`) and make **Fit in view** write the computed fit percent into the zoom state; keep `diagZoom` URL semantics consistent and update `architecture-diagram-copy.ts` labels (`Reset to 100%` → keep, meaning natural).
7. Tests (fail on master, pass after) in `help-mermaid.test.ts`:
   - Tall ink 296 × 1250 into 1166 × 558 → `fitScale === MIN_FIT_SCALE` (not 0.42), `overflows === true`, `baseHeightPx ≈ 1250 × 0.733`.
   - Small ink 400 × 120 into 1166 × 558 → `fitScale === 1` (no upscale), `overflows === false`.
   - Medium ink 1100 × 320 into 1166 × 558 → `fitScale ≈ 1`, fits.
   - After `applyMermaidSvgViewportZoom(svg, base, 10)`, `svg.style.maxWidth === "none"` and `width`/`height` attributes are both 10× base.
   - Legacy `fitMermaidSvgElementToHost(svg, 500)` unchanged (help width-fill, min height 280).
8. `ArchitectureDiagramViewer.test.tsx`: assert the mermaid host has the centering class and that a fitted SVG narrower than the viewport is not left-aligned (class assertion is enough; jsdom has no layout).

## Acceptance criteria

- Chain fixture at default zoom: labels ≥ 11 px, vertical scrollbar present, nodes horizontally centered.
- Grid fixture at default zoom: natural 15 px labels, no upscaling, no scrollbars.
- 200% shows nodes exactly 2× the fitted size on both axes; 1000% shows 10× with both scrollbars; ink is not re-centered inside blank space.
- Help-topic mermaid tests untouched and green.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** touch ink-bbox measurement or `mermaidInkViewBoxBySvg` (IDL-04). **Do not** touch backend.
- **Do not** add svg-pan-zoom. **Do not** reintroduce `min-h-[18rem]`.
- Keep IDC-01 stable budget (`readMermaidViewportFitBudget`) and IDC-03 retry loop.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Verification: from `archlucid-ui/`, `npx vitest run src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx`. No full build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
