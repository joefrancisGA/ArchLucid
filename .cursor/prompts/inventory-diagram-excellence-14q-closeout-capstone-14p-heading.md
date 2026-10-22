# IDX-14q — Closeout capstone 14p heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14p (capstone 14o heading sync). **Extend only.**

## Goal

After **IDX-14p**, the capstone subsection and Vitest still title the slice **IDX-14a–14o** even though **IDX-14p** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14p**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14p) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14p-closeout-capstone-14o-heading` in the index.

3. Index row **IDX-14q** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
