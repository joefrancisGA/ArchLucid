# IDX-14n — Closeout capstone 14m heading sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14m (capstone 14l heading sync). **Extend only.**

## Goal

After **IDX-14m**, the capstone subsection and Vitest still title the slice **IDX-14a–14l** even though **IDX-14m** is shipped on trunk. Align the capstone heading and closeout Vitest token list with **14a–14m**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14m) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-14m-closeout-capstone-14l-heading` in the index.

3. Index row **IDX-14n** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
