# IDX-14r — Closeout capstone 14q heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14q (capstone 14p heading sync). **Extend only.**

## Goal

After **IDX-14q**, the capstone subsection and Vitest still title the slice **IDX-14a–14p** even though **IDX-14q** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14q**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14q) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14q-closeout-capstone-14p-heading` in the index.

3. Index row **IDX-14r** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
