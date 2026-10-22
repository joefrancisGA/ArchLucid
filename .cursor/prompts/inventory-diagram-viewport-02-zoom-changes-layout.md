# IDV-02 — Zoom and Fit in view must move the camera, not leave empty layout

**Wave:** inventory-diagram-viewport (**IDV**). **Depends on:** IDV-01. **Do not** overlay the toolbar (IDV-03).

Do not implement from the wave index. Implement only *What to build*.

## Goal

On `ArchitectureDiagramMermaidCanvas`, zoom and **Fit in view** must change what is **visible in the viewport**, not paint a CSS-scaled thumbnail inside an unchanged (huge) layout box.

- **Fit in view** = contain ink in the current visible viewport (IDV-01 contain-fit) and set the zoom readout to the fitted scale (100% means “fits this viewport,” or document the percent honestly in the readout).
- **Zoom in / out / percent / Reset to 100%** = camera on that viewport. Zooming to 10% must **not** leave a tall empty scrollport with a speck in the corner.
- **Ctrl+scroll** (and the existing `+` / `−` / `0` keys when the viewport is focused) must actually zoom this mermaid canvas. Today `onWheel` exists only on the **static** SVG path; the mermaid path has no wheel handler while the hint still says “Ctrl+scroll to zoom.”

## Why

Owner screenshot is at **10%** (min zoom). CSS `transform: scale(zoom)` on the SVG host does not shrink layout, so Zoom out makes the graph unreadably small without bringing more of it into view. Fit in view currently calls width-fit + `setZoom(1)`, which re-inflates a TD chain. Operators cannot use the controls.

## Context

- `ArchitectureDiagramViewer.tsx` — mermaid canvas `style={{ transform: \`scale(${zoom.zoom})\`, transformOrigin: 'top left' }}`; `fitToView`; no `onWheel` on mermaid viewport
- `ArchitectureDiagramViewportControls.tsx` — percent input, Fit in view
- `architecture-diagram-fullscreen-url.ts` — `diagZoom` clamp 0.1–10
- `architecture-diagram-copy.ts` — `ARCHITECTURE_DIAGRAM_VIEWPORT_HINT`
- `ArchitectureDiagramViewer.test.tsx` — zoom percent / Fit URL tests (static path); extend **mermaid** path after IDV-01

Prefer **no new pan library**. Options that are in-bounds:

- Keep a **fixed viewport box** (`overflow: hidden` or `auto` on the camera) and apply scale **inside** it so layout of the scrollport stays the camera size; or
- Apply zoom by changing fitted SVG **css/pixel width and height** (layout-affecting), not a transform that leaves the pre-zoom box.

Fullscreen dialog (`diagFullscreen`) must **not** share a single `svgHostRef` with the inline canvas (today `diagramBody` is rendered twice). Fit fullscreen to the **dialog** client box.

## What to build

1. Replace mermaid-canvas CSS-only scale-as-layout with a camera (or layout-affecting zoom) as above.
2. Wire Ctrl/Meta+wheel zoom on the mermaid viewport (prevent default when modifier is held so the page does not pinch-zoom). Match static-path behavior.
3. Fit in view uses IDV-01 contain-fit against the **visible** box, then resets camera origin (scroll to origin / centered ink — pick one and test it).
4. `diagZoom` URL still round-trips. 100% after Fit should show a usable executive chain, not a 36rem empty hole.
5. Vitest:
   - Fit in view does **not** leave `diagZoom=0.10` as the “fitted” state for a small TD graph.
   - After Fit, host/SVG layout height is ≤ the viewport max (not thousands of px with scale 0.1 painted on top).
   - Wheel with ctrlKey calls zoom in/out on the mermaid canvas (mock mermaid render if needed; reuse `#3013` mermaid tests).
6. Do not move Fullscreen onto the canvas (IDV-03). Do not restyle help mermaid.

## Acceptance criteria

- At 10% zoom the graph is smaller **inside the same camera**, not a thumbnail lost in leftover layout.
- Fit in view on an 11-node Executive TD chain shows the chain in the frame without the operator having to zoom to the floor.
- Hint’s Ctrl+scroll clause becomes true on this path (copy edit can wait for IDV-04 if you only wire the handler here).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** revert `#3013` or IDV-01 contain-fit.
- **Do not** add svg-pan-zoom / react-zoom-pan-pinch unless the camera cannot land with CSS + the existing fit helper — if you add a dependency, say so in the PR and justify cost.
- **Do not** change PNG export or `flowchart TD` emission.
- TB-645. Sentence case. Visible-boundary `Button`.
- Verification: focused Vitest from `archlucid-ui/` (`ArchitectureDiagramViewer.test.tsx` and fit helper tests). No full-solution build, no dev server unless this file says so.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
