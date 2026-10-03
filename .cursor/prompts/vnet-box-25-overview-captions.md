# VN-25 — Overview captions when the plate is small

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-24. Do not re-run VN-01 through VN-24.

## Goal

When a forest plate is drawn below 45% of its natural size, each VNet box and each resource-group frame shows one caption that stays readable on screen, such as `vnet-hub-prod · 14`. Card text and connector labels hide at that scale. At 45% and above, those captions go away and the normal cards, VN-23 labels, and VN-24 stubs return.

## Why

A Full subscription fit on screen turns every name into a gray dash. The boxes and the short stubs are still there. The reader cannot tell which virtual network or resource group a row is.

The camera already refuses to shrink a fitted plate below `MERMAID_VIEWPORT_MIN_FIT_SCALE` (11/15). Fit in view therefore scrolls a large subscription instead of showing the whole plate. This task lets that whole-plate fit through when the unclamped contain scale is itself below 45%, and paints captions sized in screen pixels.

## Read first

- `archlucid-ui/src/lib/help/help-mermaid.ts` (`fitMermaidSvgElementToViewport`, `resolveMermaidViewportDefaultZoom`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`, `applyMermaidSvgViewportZoom`)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`applyMermaidViewportCamera`, the initial fit effect)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs` (`g.vnet-frame`, caption in `<title>`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs` (`g.rg-frame`, `rect.rg-frame-plate`, `text.rg-frame-label`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` (`g.node`, `transform="translate(…)"`, `rect.node-card`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` (`text.edge-label`)

## What to build

Do this in the viewer after the camera has set the SVG's pixel size. Do not move cards or frames. Do not change which edges are painted. Do not change the server layout SVG.

Add `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts`.

The drawn scale is CSS pixels per SVG user unit. After `applyMermaidSvgViewportZoom`, that number is the zoom that was just applied, because the pixel width is the viewBox width times the zoom.

Overview is on when the drawn scale is strictly below `0.45`. Put that threshold in `DIAGRAM_OVERVIEW_CAPTION_MAX_SCALE`. At `0.45` and above, overview is off.

On `MermaidViewportFitDimensions`, keep today's clamped `fitScale`. Also keep the unclamped contain scale as `rawScale` (`min(availableWidth / viewWidth, availableHeight / viewHeight)` before the 11/15 floor). `resolveMermaidViewportDefaultZoom` returns `rawScale` when the plate overflows and `rawScale` is below `0.45`. Otherwise it stays as it is: `fitScale` when the plate overflows, and `1` when it fits. Do not change `MERMAID_VIEWPORT_MIN_FIT_SCALE`. The zoom clamp (`0.1` through the existing maximum) stays.

Call the overview pass from both the inline camera and the fullscreen camera, after the pixel size is applied, using that same zoom as the drawn scale.

Each overview caption:

1. Applies to `g.vnet-frame` and `g.rg-frame` only. Skip `subscription-frame` and `subnet-frame`.
2. Reads the name from that frame's `<title>`, trimmed. When the name is longer than 32 characters, keep the first 32 and add `…`.
3. Counts member cards. A card is a `g.node`. Its center is the center of `rect.node-card` after the node's `translate`. The card counts when that center lies inside the frame plate: `rect.rg-frame-plate` for a resource group, and the frame's own `rect` for a VNet. The test is half-open: `x >= left && x < right` and the same for `y`. A card inside both a VNet and a resource group counts for both.
4. Reads `{name} · {count}` with a middle dot, for example `vnet-hub-prod · 14`.
5. Is a `text.overview-caption` inside one `g.overview-captions` group, centered on the frame. Its font size in user units is `14 / drawnScale`, so it paints at 14 CSS pixels. Weight 700. Fill `#334155`.

Replace `g.overview-captions` on each camera sync. Remove it when overview is off.

While overview is on, add the class `diagram-overview-hidden` to:

- `g.node text`
- `text.rg-frame-label` and `rect.rg-frame-label-halo`
- `g.vnet-frame-caption text` and `rect.vnet-frame-label-halo`
- `g.edge text.edge-label`
- `g.edge-stub text`

That class sets `visibility: hidden`. Remove the class when overview is off. Do not delete the elements. Paths, frame strokes, stub paths, and card rectangles stay. Click-focus still uses the same nodes and stubs.

## Tests

Add `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.test.ts`.

1. Scale `0.449` is overview. Scale `0.45` is not.
2. The caption for name `vnet-hub-prod` and count `14` is `vnet-hub-prod · 14`. A name of 33 characters keeps 32 characters plus `…`.
3. Two node centers inside a VNet plate and one center outside produce a count of 2.
4. Applying overview at scale `0.4` adds `text.overview-caption` reading `alpha · 1` and puts `diagram-overview-hidden` on the node text. Applying it at scale `0.5` removes `g.overview-captions` and removes that class.

Extend the existing contain-zoom coverage in `help-mermaid` or the viewer test that already measures an overflowing plate:

5. When the unclamped raw scale is below `0.45`, the default zoom equals that raw scale.
6. When the unclamped raw scale is at least `0.45`, the default zoom is still today's clamped `fitScale`. `MERMAID_VIEWPORT_MIN_FIT_SCALE` is unchanged.

## Acceptance criteria

- Below 45% of natural size, each VNet box and each resource-group frame shows one caption of the form `{name} · {count}` at 14 CSS pixels, and card text plus connector labels are hidden.
- At 45% and above, those captions are gone and the cards, VN-23 labels, and VN-24 stub chips are visible again.
- Fit in view of a plate whose unclamped contain scale is below 45% uses that scale, so the whole plate is on screen with the captions.
- Fit in view of every smaller overflow still uses the existing 11/15 floor.
- Boxes, lines, stubs, click-focus, gap constants, and the Show cross-group links checkbox stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run the new overview-caption test and the existing contain-zoom test. Do not run the full viewer file; it has unrelated zoom failures in jsdom.
- No C# layout change is required. Skip `agent-compile-check.ps1` unless a C# file changes.
- Do not commit. Do not edit unrelated dirty files.
- Do not change `ComponentHorizontalGap`, `ComponentVerticalGap`, or `MERMAID_VIEWPORT_MIN_FIT_SCALE`.
- Do not change the extractor.

## Done when

Fit in view of a large Full subscription shows the whole plate, and each VNet box and resource-group frame is named in type the reader can read. Zooming to 45% or more restores the cards and the connector labels.
