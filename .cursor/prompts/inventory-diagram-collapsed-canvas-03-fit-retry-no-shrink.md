# IDC-03 — Mermaid fit retry without shrink-to-zero

**Wave:** inventory-diagram-collapsed-canvas (**IDC**). **Status:** Implemented 2026-09-11 on `cursor/inventory-diagram-collapsed-canvas-3da5`.

## Shipped

- Mermaid canvas uses `MAX_INITIAL_FIT_RETRIES` (8) × 120ms like the static SVG path.
- Null ink bbox in viewport fit uses `applyMermaidViewportNullInkFallback` (stable pixel height, not `height: auto`).
- ResizeObserver re-runs contain-fit against the stable budget; viewBox stays locked.

## Verification

`npm run test -- src/components/architecture/ArchitectureDiagramViewer.test.tsx` — “sizes mermaid svg above the overlay-only floor after render”.
