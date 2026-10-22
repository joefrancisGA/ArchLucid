# IDV-03 — Cluster zoom and Fullscreen on the canvas

**Wave:** inventory-diagram-viewport (**IDV**). **Depends on:** IDV-01, IDV-02. **Do not** change fit math or zoom semantics.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Put **Zoom out / percent / Zoom in / Reset / Fit in view / Fullscreen** in one control cluster **on the diagram canvas**, close enough to use while looking at the ink.

Do **not** keep Fullscreen on a separate row under a hint, then a 36rem empty-looking frame. Provenance overlay (`ProvenanceGraphViewportChrome`: `absolute right-2 top-2`) is the spatial pattern to copy, not the icon-only styling if labeled buttons stay more accessible.

## Why

Owner: “controls that are too far apart to be useful.” After `#3013` the tools exist, but they sit in three bands (zoom row, hint, Fullscreen) **above** the camera. The operator travels from Zoom out to Fit to Fullscreen to the graph. Inventory diagrams are an all-day SecureNow surface; provenance already clusters zoom + expand **on** the graph.

## Context

- `ArchitectureDiagramMermaidCanvas` — `renderDiagramViewportControls` then a separate Fullscreen row (`ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION`) then the viewport
- `ArchitectureDiagramViewportControls.tsx` — `flex flex-wrap gap-2` toolbar + hint
- `archlucid-ui/src/components/provenance/ProvenanceGraphViewportChrome.tsx` — overlay cluster (do **not** import that chrome onto inventory; reuse the idea)
- `.cursor/rules/UI-Accessibility-Baseline.mdc` — labeled buttons; no clickable divs
- `.cursor/rules/UI-Enterprise-Design-Standard.mdc` — outline buttons, `CTA_WIDTH.content`, no ghost/link
- `no-collapse-workspace-tabs.mdc` — unrelated; do not touch review tabs

## What to build

1. Make the mermaid viewport `relative`. Position the zoom + Fullscreen cluster **inside** that frame (top-start or top-end; pick one and keep it at `lg` 1280px and wrapping). Hint may sit in the cluster, as a `title`/sr-only, or as a single line **inside** the frame under the buttons — not a third page-level row that adds dead space.
2. Keep visible names: Zoom out, Zoom in, Reset to 100%, Fit in view, Fullscreen (or icon + `aria-label` matching those strings). Percent input stays. Disabled Zoom out at min zoom stays.
3. Do not stretch the cluster with `justify-between` / `w-full` on the percent `Input` (`Input` base is `w-full`; keep `w-[4.75rem]` winning via `cn` / twMerge). The cluster must stay **grouped**, not spread across the canvas width.
4. Fullscreen dialog: own fitted host (IDV-02 leftover if still sharing `diagramBody` / `svgHostRef`). Overlay chrome in the dialog too, or the same clustered toolbar above the dialog camera — still grouped, not a 36rem hole.
5. Vitest: `getByTestId('architecture-diagram-viewport')` **contains** the zoom controls and the Fullscreen button (or a `architecture-diagram-viewport-controls` that is inside the viewport). Assert Fullscreen is not a sibling **above** the viewport any more.
6. Do not change contain-fit or camera zoom.

## Acceptance criteria

- On Inventory diagrams Executive, the operator can hit Zoom / Fit / Fullscreen without leaving the diagram frame.
- Controls stay adjacent (`gap-2`), not justified to opposite edges of the page.
- Review-detail mermaid viewer that shares this canvas gets the same clustering (one component).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** use `ghost` / `link` `Button` variants.
- **Do not** restyle Nodes/Edges outline (`InfraEvidenceDiagramOutline`) into the canvas.
- **Do not** add a floating “minimap.”
- TB-645. Sentence case. **TB-2005** N/A (no new form submit).
- Verification: focused Vitest from `archlucid-ui/` (`ArchitectureDiagramViewer.test.tsx`). No full-solution build, no dev server unless this file says so.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
