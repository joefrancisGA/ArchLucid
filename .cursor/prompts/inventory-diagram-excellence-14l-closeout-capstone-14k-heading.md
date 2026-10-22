# IDX-14l — Closeout capstone 14k heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14k (capstone index sync). **Extend only.**

## Goal

After **IDX-14k**, the capstone subsection and Vitest still title the slice **IDX-14a–14j** even though **IDX-14k** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14k**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14k) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14k-closeout-capstone-index-sync` in the index.

3. Index row **IDX-14l** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
