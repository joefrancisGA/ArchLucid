# IDX-14t — Closeout capstone 14s heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14s (capstone 14r heading sync). **Extend only.**

## Goal

After **IDX-14s**, the capstone subsection and Vitest still title the slice **IDX-14a–14r** even though **IDX-14s** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14s**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14s) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14s-closeout-capstone-14r-heading` in the index.

3. Index row **IDX-14t** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
