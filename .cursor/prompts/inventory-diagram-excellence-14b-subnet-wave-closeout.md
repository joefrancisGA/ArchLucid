# IDX-14b — Subnet nested-frame deepening wave closeout

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-05b (subnet excellence ratchets). **Extend only.**

## Goal

Mirror **IDX-14a**: document the **05b** subnet deepening slice as **complete** in the IDX index with explicit dotnet commands, and add a Vitest ratchet so the closeout subsection cannot be deleted without CI failure.

## What to build

1. Index subsection `### Subnet nested-frame deepening (IDX-05b) — complete` with dotnet filters for both 05b ratchet classes and this closeout Vitest.

2. `inventory-diagram-excellence-subnet-wave-closeout.vitest.test.ts` — assert the index contains the complete heading and filter tokens.

3. Index row **IDX-14b** shipped — extend only; filter `inventory-diagram-excellence-subnet-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-subnet-wave-closeout
```
