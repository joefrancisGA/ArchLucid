# IE-ID-03 — Inventory mermaid viewport must not collapse

**Wave:** inventory-diagram Identity (**IE-ID**). **Depends on:** IDV-01–03 (contain-fit + overlay on trunk). **May run in parallel with IE-ID-01.** **Do not** implement flatten or the snapshot mermaid contract.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When inventory/architecture mermaid SVG ink cannot be measured or fits to a tiny box, the operator must see **in-flow** diagram content or the existing render-failure UI. Zoom / Fit / Fullscreen must not float over the Nodes table on a zero-height canvas.

Successful contain-fit with measurable ink stays **content-sized** (IDV-01). Do **not** restore a forced `min-h-[18rem]` hole around a short Executive chain.

## Why

Owner Identity screenshot: scope line + right-aligned overlay zoom at 130%, then Nodes — **no 36rem frame**. After IDV-03, controls are `position: absolute` inside `architecture-diagram-viewport` (`max-h-[36rem]`, no min-height). `prepareMermaidSvgForResponsiveLayout` sets width 100% and removes height. Nested Identity clusters (or any leftover nested `flowchart TD`) make `readMappedNodeInkBBox` map to a tiny origin rect or return null; contain-fit then sizes the SVG to a few pixels or leaves `height: auto` on an `inline-block min-w-0` host. Overlay is out of flow → collapse.

IE-ID-01 removes the 14-subgraph Identity case. This prompt covers: mermaid.js empty/zero-size SVG, failed `getCTM` crop, Identity with **fewer than 8** RGs (flatten does not fire), and other nested modes.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`ArchitectureDiagramMermaidCanvas`, overlay inside viewport, `onRenderFailure`)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewportControls.tsx` (`layout === 'overlay'` → `absolute right-2 top-2`)
- `archlucid-ui/src/lib/help/help-mermaid.ts` (`fitMermaidSvgElementToViewport`, `readMappedNodeInkBBox`, `prepareMermaidSvgForResponsiveLayout`)
- `archlucid-ui/src/lib/help/help-mermaid.test.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.test.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (`handleRenderFailure` is a no-op; outline still mounts under the viewer)
- IE-ND-05: mermaid.js throw is `architecture-diagram-render-failure`, not “too large”
- Index: `.cursor/prompts/inventory-diagram-identity-00-index.md`

## What to build

1. After mermaid.render + sanitize + contain-fit: if there is no SVG, ink bbox is null, or fitted base height is below a small floor (on the order of 24px — pick one constant, document it), set the **existing** in-flow render-failure path (`architecture-diagram-render-failure` + retry if `onRetry` exists). Do not leave overlay-only. Optional compact copy that the diagram did not paint is fine if it uses `SeverityTag` / existing failure chrome — do not invent a second error system.
2. If `mermaid.render` throws, keep IE-ND-05: failure UI, **not** `INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE`. `DiagramsWorkbenchClient.handleRenderFailure` must not map client paint failure to the oversized guard.
3. Measurable ink: keep IDV contain-fit and overlay. A short Executive chain must **not** sit in a tall empty 18rem/36rem hole.
4. `getByTestId('architecture-diagram-viewport')` still **contains** zoom controls and Fullscreen (IDV-03). When paint fails, the failure UI is **inside** that viewport (in-flow), so the frame is taller than padding + overlay alone.
5. Vitest:
   - Mock mermaid SVG whose nodes cannot produce a mapped bbox (or 0×0 after fit) → `architecture-diagram-render-failure` (or the paint-failure testid you add), zoom controls still inside the viewport, outline not required in this unit test.
   - Mock mermaid `render` reject → same failure UI, not the too-large banner (workbench test if you touch `DiagramsWorkbenchClient`).
   - Existing IDV tests: contain-fit of tall-narrow ink into a bounded viewport; overlay still inside viewport; help-topic `fitMermaidSvgElementToHost` width-fill / min height 280 unchanged.
6. Do not add svg-pan-zoom. Do not change `flowchart TD` emission. Do not flatten Identity here.

## Acceptance criteria

- Overlay-only collapse (toolbar on Nodes, no frame) cannot happen when mermaid returns empty or unmeasurable ink.
- Successful Identity/Executive graphs with measurable ink still contain-fit; IDV overlay stays.
- Help mermaid width-fill tests still pass.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** revert `#3013`, IDV contain-fit, camera zoom, or overlay clustering.
- **Do not** restore CSS `transform: scale` as layout zoom.
- **Do not** flatten subgraphs (IE-ID-01) or change PNG export / outline tables.
- TB-645. Sentence case. Visible-boundary `Button` (no ghost/link).
- Verification from `archlucid-ui/`:
  ```bash
  npm test -- src/components/architecture/ArchitectureDiagramViewer.test.tsx src/lib/help/help-mermaid.test.ts
  ```
  If you touch the workbench: also `src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx`. No `npm ci` unless required. No full-solution build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Done when

- A mermaid canvas with unmeasurable or ~0-height ink shows in-flow render failure inside the viewport, not a floating zoom cluster over Nodes.
- IDV contain-fit tests and overlay-inside-viewport tests still pass.
