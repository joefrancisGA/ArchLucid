# IDX-14k — Closeout capstone index sync (Vitest)

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-14j (UI manifest). **Extend only.**

## Goal

After **IDX-14j**, the capstone index bundle lists `inventory-diagram-excellence-closeout-wave-ui-manifest`, but **IDX-14i** Vitest and the capstone heading still stop at **14h**. Align heading and capstone Vitest tokens with **14a–14j**.

## What to build

1. Rename capstone subsection to `### Excellence index closeout wave (IDX-14a–14j) — complete`.

2. Extend `inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts` to require `inventory-diagram-excellence-closeout-wave-ui-manifest` in the index.

3. Index row **IDX-14k** shipped — extend only; filter `inventory-diagram-excellence-closeout-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout
```
