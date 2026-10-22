# IDX-13x — Workbench cross-mode excellence ratchet (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-10 (PE toggle), IDX-11 (completeness strip), IDX-13 cross-mode backend ratchets. **Extend only.**

## Goal

IDX-13 still requires Vitest coverage: inventory diagrams workbench keeps **private endpoints off by default** and surfaces **mode-aware `missingClasses`** from the render payload. Backend `FullyQualifiedName~InventoryDiagramExcellence` does not exercise those controls.

## What to build

1. `archlucid-ui/.../inventory-diagram-excellence-workbench.ratchet.test.tsx` — `describe("InventoryDiagramExcellence workbench ratchet")` with:
   - PE toggle unchecked when `includePrivateEndpoints` is absent from the URL.
   - Completeness banner shows `missingClasses` from `renderResult.completenessSummary`.

2. Index row **IDX-13x** shipped — extend only.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-workbench.ratchet
```
