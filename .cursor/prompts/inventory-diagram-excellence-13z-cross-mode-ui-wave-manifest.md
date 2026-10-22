# IDX-13z — Cross-mode UI wave manifest (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13x (workbench ratchet). **Extend only.**

## Goal

Backend cross-mode slice has manifest guards (**IDX-13v**). The workbench Vitest ratchet (**IDX-13x**) can be deleted without CI noticing. Add a lightweight UI manifest test that locks the required `InventoryDiagramExcellence_*` case names in `inventory-diagram-excellence-workbench.ratchet.test.tsx`.

## What to build

1. `inventory-diagram-excellence-cross-mode-ui-wave-manifest.vitest.test.ts` beside the workbench ratchet file.

2. Index row **IDX-13z** shipped — extend only; filter `inventory-diagram-excellence-cross-mode-ui-wave-manifest`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-cross-mode-ui-wave-manifest
```
