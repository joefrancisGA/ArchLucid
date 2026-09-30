# VN-26 — Keep overview captions inside the frames they name

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-25. Do not re-run VN-01 through VN-25.

## Goal

Overview captions stay inside the VNet boxes and resource-group frames that are tall enough to hold them. A row that is shorter than the caption keeps its existing ink. Fit in view uses the unclamped contain scale only when that scale is below 45%. Every smaller overflow keeps the existing 11/15 floor.

## Why

VN-25 is on the plate and it reads worse.

`resolveMermaidViewportDefaultZoom` returns `rawScale` for every overflowing plate. `fitScale` still holds the 11/15 floor, and nothing reads it. A plate whose raw scale is 0.5 or 0.6 shrinks below that floor and stays at or above 0.45, so the words get smaller and the overview captions never appear. A large subscription does fall below 0.45. `clampArchitectureDiagramZoom` then stops at 0.1, so the whole plate still may not fit.

`applyDiagramOverviewCaptions` sizes every caption as `14 / zoom` user units and centers it in every `vnet-frame` and `rg-frame`. The host is `w-fit max-w-full`, so the browser can shrink the SVG after that zoom is applied and the type shrinks with it. Where the row does fit, a 14px line is taller than the row. The names paint on top of the next row. Hiding every card label and connector label leaves that pile as the only words.

## Read first

- `archlucid-ui/src/lib/help/help-mermaid.ts` (`rawScale`, `fitScale`, `resolveMermaidViewportDefaultZoom`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-fullscreen-url.ts` (`clampArchitectureDiagramZoom`, minimum 0.1)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`applyMermaidViewportCamera`, `MERMAID_SVG_HOST_CLASSNAME`)
- `archlucid-ui/src/lib/help/help-mermaid.test.ts` (the test `uses the unclamped contain scale for an overview-sized overflow plate`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.test.ts`

## What to build

In `resolveMermaidViewportDefaultZoom`:

1. When the plate overflows and `rawScale` is strictly below `0.45`, return `rawScale`.
2. When the plate overflows and `rawScale` is at least `0.45`, return `fitScale`.
3. When the plate fits, return `1`.

Do not change `MERMAID_VIEWPORT_MIN_FIT_SCALE`. Do not change the zoom clamp.

After `applyMermaidSvgViewportZoom`, read the painted scale from the SVG that is on screen: `getBoundingClientRect().width` divided by the viewBox width. Pass that painted scale into `applyDiagramOverviewCaptions`. Do not pass the zoom argument. When the rect or the viewBox width is not finite, or the width is 0, skip the overview pass.

Inside `applyDiagramOverviewCaptions`:

Overview stays on only when the painted scale is strictly below `0.45`.

A frame gets a caption only when its painted height (`rect.height * paintedScale`) is at least 18. Put that floor in `OVERVIEW_CAPTION_MIN_FRAME_PX`. A shorter frame gets no caption.

Hide detail only for a frame that received a caption:

- That frame's own label and halo (`text.rg-frame-label`, `rect.rg-frame-label-halo`, `g.vnet-frame-caption text`, `rect.vnet-frame-label-halo`).
- `g.node text` whose card center lies inside that frame. Keep the existing half-open center test.

Do not hide `g.edge text.edge-label` or `g.edge-stub text` in this pass. Do not hide text in a frame that did not receive a caption.

The caption stays `{name} · {count}` with the same 32-character trim. Place it in the top of the frame, not the vertical center. `text-anchor` is `start`. The left inset and the baseline offset are `8 / paintedScale` and `14 / paintedScale` user units, so they are 8px and 14px on screen. Font size in user units is `14 / paintedScale`. Weight 700. Fill `#334155`. Add a `clipPath` equal to the frame rect so the words cannot cross into the next box.

Replace `g.overview-captions` on each camera sync. Remove it, and remove `diagram-overview-hidden`, when overview is off or when no frame qualified.

## Tests

Update `architecture-diagram-overview-captions.test.ts`.

1. Painted scale `0.449` is overview. Painted scale `0.45` is not.
2. A frame whose painted height is 17 gets no `text.overview-caption`, and its node text does not have `diagram-overview-hidden`. A frame whose painted height is 18 gets `{name} · {count}`, and its node text does.
3. An edge label keeps its text visible at scale `0.4`.
4. Applying scale `0.5` removes `g.overview-captions` and removes `diagram-overview-hidden`.

Update `uses the unclamped contain scale for an overview-sized overflow plate` in `help-mermaid.test.ts`.

5. Overflow with `rawScale` `0.3` and `fitScale` equal to `MERMAID_VIEWPORT_MIN_FIT_SCALE` returns `0.3`.
6. Overflow with `rawScale` `0.6` returns `fitScale`, not `0.6`. `MERMAID_VIEWPORT_MIN_FIT_SCALE` stays 11/15.

## Acceptance criteria

- Fit in view of a plate whose unclamped contain scale is below 45% uses that scale. Fit in view of every smaller overflow uses `fitScale`.
- A frame that paints at least 18px tall shows one caption inside its own rect. A shorter frame keeps its existing label.
- Connector labels and stub chips stay visible.
- At a painted scale of 45% or more, the overview captions are gone.
- Boxes, lines, stubs, click-focus, gap constants, and the Show cross-group links checkbox stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `architecture-diagram-overview-captions.test.ts` and `help-mermaid.test.ts`. Do not run the full viewer file.
- No C# layout change is required. Skip `agent-compile-check.ps1` unless a C# file changes.
- Do not commit. Do not edit unrelated dirty files.
- Do not change `ComponentHorizontalGap`, `ComponentVerticalGap`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`, or the zoom clamp.
- Do not change the extractor.

## Done when

Fit in view of a large Full subscription no longer stacks a caption on every thin row. The boxes that are tall enough on screen are named inside their own bounds. Zooming to 45% or more restores the card text those captions replaced.
