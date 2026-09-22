# IDC-04 — Blank-canvas ratchet

**Wave:** inventory-diagram-collapsed-canvas (**IDC**). **Status:** Implemented 2026-09-11 on `cursor/inventory-diagram-collapsed-canvas-3da5`.

## Shipped

Vitest ratchet in `help-mermaid.test.ts` and `ArchitectureDiagramViewer.test.tsx`:

- Stable budget when `clientHeight` is collapsed.
- Translated ink not cropped to origin-only viewBox.
- ViewBox not re-cropped on second contain-fit pass.
- Null bbox fallback height ≥ 240px.
- Mermaid SVG height ≥ 240 after mock render.
- Overlay controls remain inside viewport (IDV-03 preserved).

## Verification

`npm run test -- src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx`
