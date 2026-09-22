# IDC-02 — Ink bbox in SVG user space

**Wave:** inventory-diagram-collapsed-canvas (**IDC**). **Status:** Implemented 2026-09-11 on `cursor/inventory-diagram-collapsed-canvas-3da5`.

## Shipped

- `mapLocalBBoxToSvgUserSpace` uses `getScreenCTM()` on both element and svg (not mixed `getCTM`).
- `isLikelyOriginOnlyInkCrop` prefers `g.nodes` bounds when mapped node ink collapses to the origin.
- `ensureMermaidInkViewBox` + WeakMap caches viewBox crop once per SVG element.

## Verification

`npm run test -- src/lib/help/help-mermaid.test.ts` — origin-collapse and viewBox lock tests.
