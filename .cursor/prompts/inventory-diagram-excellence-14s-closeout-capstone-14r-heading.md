# IDX-14s — Closeout capstone 14r heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14r (capstone 14q heading sync). **Extend only.**

## Goal

After **IDX-14r**, the capstone subsection and Vitest still title the slice **IDX-14a–14q** even though **IDX-14r** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14r**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14r) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14r-closeout-capstone-14q-heading` in the index.

3. Index row **IDX-14s** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
