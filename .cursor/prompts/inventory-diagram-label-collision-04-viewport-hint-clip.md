# IDLC-04 — Keep cluster title ink out of the stacked zoom hint

**Wave:** inventory-diagram-label-collision (**IDLC**). **Depends on:** none (viewport chrome). **Do not** implement IDLC-01–03.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On inventory diagrams with `viewportControlsLayout="stacked"`, the hint `Focus the diagram, then Ctrl+scroll to zoom…` must not be overwritten by SVG cluster titles. Keep the hint **visible and true** (IDV-04 honesty). Clip or pad the camera so `overflow: visible` on the SVG cannot paint into that `<p>`.

## Why

Owner red circle includes the hint and the top-left card. `ArchitectureDiagramMermaidViewportFrame` camera is `overflow-auto p-4`. `prepareMermaidSvgForResponsiveLayout` and `sanitizeArchitectureDiagramSvg` set SVG `overflow="visible"`. Stacked controls render **above** the frame (`DiagramsWorkbenchClient` passes `viewportControlsLayout="stacked"`). Title ink with y near 0 paints through the SVG box toward the hint.

Overlay layout already sets the hint `sr-only` — do not change overlay to hide a problem that stacked layout shows.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDiagramMermaidViewportFrame.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewportControls.tsx` — hint `sr-only` only when `layout === 'overlay'`
- `archlucid-ui/src/lib/architecture/architecture-diagram-copy.ts` — `ARCHITECTURE_DIAGRAM_VIEWPORT_HINT`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.test.tsx`
- `archlucid-ui/src/lib/help/help-mermaid.ts` — `prepareMermaidSvgForResponsiveLayout` overflow visible (needed so titles are not clipped mid-glyph **inside** the camera). Prefer camera/host clip over deleting overflow on the SVG.

## What to build

1. Keep stacked hint visible (not `sr-only`).
2. Stop SVG ink from painting outside the **camera** into the hint:
   - Preferred: camera (or an inner ink host) `overflow-auto` **and** clip descendants (`overflow-x-auto overflow-y-auto` is already there — add a wrapping ink host with `overflow-hidden` **inside** the padded camera, or `isolation` + clip, so padding stays but titles cannot escape the frame). Zoom/pan/scroll must still work (wheel on the frame, scroll on the camera).
   - If an inner clip host would break `getBBox` fit, add **top padding on the camera** ≥ one title line (16px already in `p-4` — increase top padding only if tests show hint overlap) **and** keep the SVG fully inside the camera content box.
   - Do **not** set the viewport frame to `overflow: visible` in a way that lets ink leave the bordered canvas.
3. Do not change hint copy unless a test proves it is false (IDV-04). Do not move stacked controls into overlay in this prompt.
4. Tests in `ArchitectureDiagramViewer.test.tsx` (or a focused viewport-frame test):
   - Stacked layout: hint text is in the document and **not** `sr-only`.
   - Viewport camera / ink host clips overflow (assert class or a `data-testid` on the clip host). If you add `data-testid="architecture-diagram-ink-clip"`, use it.
   - Overlay layout: hint remains `sr-only`; zoom cluster still overlays the canvas.
5. No sanitizer / DOT / mermaid gap constant edits.

## Acceptance criteria

- Stacked Executive inventory: hint is readable; top-left cluster title does not overwrite those letters.
- Overlay architecture diagrams unchanged in control placement.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** use `ghost` / `link` `Button` variants. **Do not** hide desktop review workspace tabs behind **More**.
- Verification from `archlucid-ui/`: `npx vitest run src/components/architecture/ArchitectureDiagramViewer.test.tsx src/components/architecture/ArchitectureDiagramMermaidViewportFrame.test.tsx`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
