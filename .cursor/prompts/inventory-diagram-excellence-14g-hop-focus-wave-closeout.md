# IDX-14g — Hop-focus deepening wave closeout

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-12b (hop-focus excellence ratchet). **Extend only.**

## Goal

Mirror **IDX-14f**: document the **12b** hop-focus compile excellence slice as **complete** in the IDX index with explicit dotnet commands, and add a Vitest ratchet so the closeout subsection cannot be deleted without CI failure.

## What to build

1. Index subsection `### Hop-focus deepening (IDX-12b) — complete` with dotnet filter for the hop-focus excellence ratchet and this closeout Vitest.

2. `inventory-diagram-excellence-hop-focus-wave-closeout.vitest.test.ts` — assert the index contains the complete heading and filter tokens.

3. Index row **IDX-14g** shipped — extend only; filter `inventory-diagram-excellence-hop-focus-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-hop-focus-wave-closeout
```
