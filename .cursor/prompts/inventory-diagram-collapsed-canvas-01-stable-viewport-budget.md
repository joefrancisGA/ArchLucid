# IDC-01 — Stable viewport budget for mermaid contain-fit

**Wave:** inventory-diagram-collapsed-canvas (**IDC**). **Status:** Implemented 2026-09-11 on `cursor/inventory-diagram-collapsed-canvas-3da5`.

## Shipped

- `readMermaidViewportFitBudget()` in `help-mermaid.ts` — height from CSS `max-height` (36rem cap) with floor 240px, not `viewport.clientHeight`.
- `ArchitectureDiagramMermaidCanvas` uses the budget via `applyMermaidViewportCamera`.

## Verification

`npm run test -- src/lib/help/help-mermaid.test.ts` — “keeps a stable fit budget when the viewport client height is collapsed”.
