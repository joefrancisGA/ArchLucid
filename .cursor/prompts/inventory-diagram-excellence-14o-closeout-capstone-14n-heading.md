# IDX-14o — Closeout capstone 14n heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14n (capstone 14m heading sync). **Extend only.**

## Goal

After **IDX-14n**, the capstone subsection and Vitest still title the slice **IDX-14a–14m** even though **IDX-14n** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14n**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14n) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14n-closeout-capstone-14m-heading` in the index.

3. Index row **IDX-14o** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
