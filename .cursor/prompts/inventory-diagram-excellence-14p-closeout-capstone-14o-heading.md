# IDX-14p — Closeout capstone 14o heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14o (capstone 14n heading sync). **Extend only.**

## Goal

After **IDX-14o**, the capstone subsection and Vitest still title the slice **IDX-14a–14n** even though **IDX-14o** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14o**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14o) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14o-closeout-capstone-14n-heading` in the index.

3. Index row **IDX-14p** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
