# DFV-18 — Scroll a data-flow canvas that is wider than the frame

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-14, DFV-15, or DFV-16 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master` after DFV-13. Do not change column wrap, stage labels, or card content.

## Goal

On **Data flow — what may connect**, a canvas wider than the diagram frame can be scrolled left and right inside the existing camera. A canvas taller than the frame still scrolls up and down. Fit in view still shrinks the whole picture into the frame. Zoom and Fit stay pinned to the visible frame.

## Why

DFV-13 wraps a tall stage into side-by-side sub-columns, so `Hmd_HI_HAP_Non_Prod` is now wider than the workbench frame. The owner can scroll vertically and cannot scroll horizontally, so the right-hand stages are cut off.

`ArchitectureDiagramMermaidViewportFrame` puts `overflow-auto` on the camera and keeps the zoom controls outside that camera. The child ink clip (`data-testid="architecture-diagram-ink-clip"`) is a block box with `overflow-hidden`. A block box uses the camera's client width, so a wider SVG is clipped there and never increases the camera's `scrollWidth`.

`MERMAID_SVG_HOST_CLASSNAME` in `ArchitectureDiagramViewer` also sets `max-w-full` and `min-w-0` on the host. Those classes cap the host at the camera width even after `applyMermaidSvgViewportZoom` assigns the SVG a pixel width of `baseWidthPx * zoom`.

`resolveMermaidViewportDefaultZoom` already stops shrinking at `MIN_ARCHITECTURE_DIAGRAM_ZOOM` (60%). Below that floor the picture is supposed to scroll. Fit in view still uses the contain scale.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramMermaidViewportFrame.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`MERMAID_SVG_HOST_CLASSNAME`, `applyMermaidViewportCamera`)
- `archlucid-ui/src/lib/help/help-mermaid.ts` (`resolveMermaidViewportDefaultZoom`, `applyMermaidSvgViewportZoom`)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramMermaidViewportFrame.test.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.test.tsx`

## What to build

1. Branch `dfv/18-scroll-wide-canvas` from current `master`.
2. Keep the camera as the only `overflow-auto` scroller. Keep the zoom and Fit controls outside the camera, on the frame. The frame itself stays free of `overflow-auto`.
3. Let the ink clip's border box grow to the SVG. Add `w-max min-w-full` (or the equivalent that makes the used width the SVG's max-content width, and at least the camera width). A diagram narrower than the frame still fills the frame. A diagram wider than the frame widens the camera's scroll width.
4. On the mermaid host inside that camera, remove `max-w-full` and `min-w-0`. Use `w-max max-w-none` so the host's border box follows the pixel width and height set on the SVG. `[&_svg]:overflow-visible` stays. The fullscreen camera uses the same host, so one change covers both.
5. Leave the zoom floor and Fit in view alone. At the 60% floor, a picture wider than the frame scrolls horizontally. Fit in view still fits the whole picture, including a wide data-flow canvas, into the frame.
6. Wheel without Ctrl or Cmd still scrolls the camera. Ctrl or Cmd plus wheel still zooms. Arrow keys are not a new mode.
7. Full subscription, Network, and Data architecture use this same viewer. A picture that fits gains no extra scrollbar. Do not change `DiagramForestDataFlowColumnLayout`.
8. Tests:
    - The camera class list contains `overflow-auto`. The frame class list does not.
    - The zoom control element is outside the camera.
    - The ink clip class list contains `w-max` and `min-w-full`, and does not contain `max-w-full`.
    - The mermaid SVG host class list contains `w-max` and `max-w-none`, and does not contain `max-w-full` or `min-w-0`.
    - Update the existing assertions that only checked `overflow-hidden` on the ink clip. `overflow-hidden` may remain once the clip box is as large as the SVG.

## Acceptance criteria

- A data-flow canvas wider than the frame shows a horizontal scrollbar on the camera, and scrolling reveals the right-hand stages.
- A canvas taller than the frame still scrolls vertically.
- Fit in view still shows the whole picture inside the frame.
- Zoom and Fit stay visible on the frame while the picture scrolls.
- Other diagram types use the same camera and do not gain a layout change.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not roll up cards. That is DFV-14.
- Do not add a second diagram mode, a minimap, or a workspace tab.
- Do not lower the 60% zoom floor to force the picture to fit.
- Working-tree safety. Stage only the viewport frame, the mermaid host classes, and the viewer tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/architecture/ArchitectureDiagramMermaidViewportFrame.test.tsx src/components/architecture/ArchitectureDiagramViewer.test.tsx
```

Heartbeat every 8s on that Vitest run. One run, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the UI and open Data flow on `Hmd_HI_HAP_Non_Prod`. The frame should show a horizontal scrollbar. Scrolling right should reveal Transform and Consumer without shrinking the cards. Fit in view should still draw the whole canvas inside the frame. Wait for that look before any commit.
