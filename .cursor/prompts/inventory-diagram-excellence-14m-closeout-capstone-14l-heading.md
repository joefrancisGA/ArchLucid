# IDX-14m — Closeout capstone 14l heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14l (capstone 14k heading sync). **Extend only.**

## Goal

After **IDX-14l**, the capstone subsection and Vitest still title the slice **IDX-14a–14k** even though **IDX-14l** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14l**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14l) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14l-closeout-capstone-14k-heading` in the index.

3. Index row **IDX-14m** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
