# IDX-14j — Closeout wave UI manifest (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14i (capstone closeout). **Extend only.**

## Goal

Per-slice and umbrella closeout Vitest files (**IDX-14a–14i**) can be deleted without CI noticing. Add a lightweight UI manifest test that locks the required `inventory-diagram-excellence-*-wave-closeout.vitest.test.ts` files beside the diagram excellence tests.

## What to build

1. `inventory-diagram-excellence-closeout-wave-ui-manifest.vitest.test.ts` — assert each required closeout Vitest file exists on disk.

2. Index row **IDX-14j** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-ui-manifest`.

3. Index capstone subsection lists this manifest filter alongside the closeout bundle.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-ui-manifest
```
