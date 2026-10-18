# IDX-14c — Singleton-RG tail deepening wave closeout

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-08b and IDX-08c on trunk. **Extend only.**

## Goal

Mirror **IDX-14b**: document the **08b–08c** singleton-tail deepening slice as **complete** in the IDX index with explicit dotnet commands, and add a Vitest ratchet so the closeout subsection cannot be deleted without CI failure.

## What to build

1. Index subsection `### Singleton-RG tail deepening (IDX-08b–08c) — complete` with dotnet filters for tail forest ratchet, collapsed-tail label ratchet, and this closeout Vitest.

2. `inventory-diagram-excellence-singleton-tail-wave-closeout.vitest.test.ts` — assert the index contains the complete heading and filter tokens.

3. Index row **IDX-14c** shipped — extend only; filter `inventory-diagram-excellence-singleton-tail-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-singleton-tail-wave-closeout
```
