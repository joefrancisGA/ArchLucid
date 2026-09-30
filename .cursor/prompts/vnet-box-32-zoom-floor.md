# VN-32 — The plate stops at 60% and the overview caption layer goes away

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-31. Do not re-run VN-01 through VN-31. VN-33 is the C# half and may run before or after this prompt.

## Goal

The architecture diagram viewer does not zoom below 60% of natural size. Fit in view and the default zoom after paint stop at that floor and fill the viewport width when the plate is larger than the viewport. The overview caption layer from VN-25 through VN-31 is removed, because nothing below 45% can be reached any more.

## Why

VN-25 through VN-31 tried to keep 14px screen text on frames that shrink with the zoom. At 20% a frame is 15–30 screen pixels tall and the caption is 14px tall and five to ten times wider than the frame. The result reads as a list with decorations, not as a diagram. The owner accepted a zoom floor instead.

At 60% the natural 14px frame caption paints at 8.4px and the plate is still a plate. Below that, nothing on the canvas is legible, so the viewer should not go there.

With a 60% floor the overview code never runs. Leaving it in place is dead weight in the viewer and in the test suite.

## Read first

- `archlucid-ui/src/lib/architecture/architecture-diagram-fullscreen-url.ts` (`MIN_ARCHITECTURE_DIAGRAM_ZOOM`, `MIN_ARCHITECTURE_DIAGRAM_ZOOM_PERCENT`, `clampArchitectureDiagramZoom`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-zoom.test.ts`
- `archlucid-ui/src/lib/help/help-mermaid.ts` (`MermaidViewportFitDimensions`, `fitMermaidSvgElementToViewport`, `fitInventoryDiagramSvgElementToFocusNodeIds`, `resolveMermaidViewportDefaultZoom`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`)
- `archlucid-ui/src/lib/help/help-mermaid.test.ts` (the `resolveMermaidViewportDefaultZoom` cases near the `0.3` and `0.6` rawScale fixtures)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`applyMermaidViewportCamera`, `applyInitialViewportZoom`, `onFitInView`, the `diagram-overview-hidden` host class)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewportControls.tsx` (`minZoomPercent`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts` and its test

## What to build

### Floor

Set `MIN_ARCHITECTURE_DIAGRAM_ZOOM` to `0.6` and `MIN_ARCHITECTURE_DIAGRAM_ZOOM_PERCENT` to `60`. `clampArchitectureDiagramZoom`, the percent input, the `-` key, Ctrl+scroll, and the `diagZoom` URL parameter all go through that clamp already. Confirm each one does. Do not add a second clamp.

Do not change `MERMAID_VIEWPORT_MIN_FIT_SCALE`. That constant also serves the help-center Mermaid path.

### Width fit

Add `widthScale` to `MermaidViewportFitDimensions`: the available viewport width divided by the ink viewBox width, before any floor. Populate it in `fitMermaidSvgElementToViewport`, `fitInventoryDiagramSvgElementToFocusNodeIds`, and the null-ink fallback (use `1` there).

Give `resolveMermaidViewportDefaultZoom` a second parameter, `minZoom`, defaulting to `MERMAID_VIEWPORT_MIN_FIT_SCALE` so the help path is unchanged. The rule becomes:

- Ink does not overflow: `1`.
- Ink overflows and the contain scale (`rawScale`) is at least `minZoom`: `min(1, rawScale)`.
- Ink overflows and `rawScale` is below `minZoom`: `min(1, max(minZoom, widthScale))`.

The third case fills the viewport width so the reader scrolls in one direction. Remove the `rawScale < 0.45` branch.

The architecture viewer passes `MIN_ARCHITECTURE_DIAGRAM_ZOOM` as `minZoom` in `applyInitialViewportZoom` and wherever Fit in view computes its target. Fit in view and the default zoom after paint must agree.

### Remove the overview layer

Delete `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts` and `architecture-diagram-overview-captions.test.ts`.

In `ArchitectureDiagramViewer.tsx`, remove the import, the `applyDiagramOverviewCaptions` call and `readDiagramPaintedScale` call in `applyMermaidViewportCamera`, and the `[&_svg_.diagram-overview-hidden]:invisible` host class. Search the UI tree for `overview-caption`, `diagram-overview`, `DIAGRAM_OVERVIEW`, and `applyDiagramOverviewCaptions` and leave no reference behind.

Do not touch the VN-17 frame caption band, the VN-23 on-line labels, the VN-24 stubs, the VN-20 click focus, or the C# renderer.

## Tests

`architecture-diagram-zoom.test.ts`:

1. `clampArchitectureDiagramZoom(0.2)` returns `0.6`. `architectureDiagramPercentToZoom(20)` returns `0.6`. `architectureDiagramPercentToZoom(60)` returns `0.6`. `clampArchitectureDiagramZoom(0.61)` returns `0.61`.

`help-mermaid.test.ts`, replacing the two `0.45` cases:

2. `resolveMermaidViewportDefaultZoom({ rawScale: 0.3, widthScale: 0.5, overflows: true, ... }, 0.6)` returns `0.6`.
3. `resolveMermaidViewportDefaultZoom({ rawScale: 0.3, widthScale: 0.8, overflows: true, ... }, 0.6)` returns `0.8`.
4. `resolveMermaidViewportDefaultZoom({ rawScale: 0.7, widthScale: 0.9, overflows: true, ... }, 0.6)` returns `0.7`.
5. `resolveMermaidViewportDefaultZoom({ rawScale: 0.3, widthScale: 0.5, overflows: true, ... })` with no second argument returns `MERMAID_VIEWPORT_MIN_FIT_SCALE`, so the help path is unchanged.
6. `fitMermaidSvgElementToViewport` on a 1000 × 2000 ink box in a 600 × 400 viewport with the default 12px padding reports `widthScale` close to `576 / 1000` and `rawScale` close to `376 / 2000`. Assert with `toBeCloseTo`.

Viewer:

7. The existing viewer tests must pass. If one asserts a default zoom below 0.6 for an overflow plate, update it to the new rule and say so in the summary.

## Acceptance criteria

- The percent input does not accept a value below 60. Zoom out, `-`, and Ctrl+scroll stop at 60%. A `diagZoom=20` URL opens at 60%.
- A plate larger than the viewport opens at 60% or higher, fills the viewport width, and scrolls vertically.
- A plate that fits opens at 100%.
- No overview caption paints at any zoom. Frame names, card text, connector labels, and stubs are the C# renderer's own ink at every zoom.
- `rg overview-caption archlucid-ui/src` returns nothing.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `architecture-diagram-zoom.test.ts`, `help-mermaid.test.ts`, and the `ArchitectureDiagramViewer` test file if one exists. Do not run the whole suite.
- Run `npm run typecheck` in `archlucid-ui`.
- No C# change. Skip `agent-compile-check.ps1`.
- Do not commit. Do not edit unrelated dirty files.
- Do not change `MERMAID_VIEWPORT_MIN_FIT_SCALE`, `MAX_ARCHITECTURE_DIAGRAM_ZOOM`, or the C# renderer.

## Done when

On the Full subscription plate for `Hmd_HI_HAP_Non_Prod`, Fit in view lands at 60% or higher with the plate filling the viewport width. The percent box refuses 59. No caption from VN-25 through VN-31 exists in the tree.
