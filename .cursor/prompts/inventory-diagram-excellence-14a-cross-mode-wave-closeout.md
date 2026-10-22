# IDX-14a — Cross-mode excellence wave closeout

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13z (UI manifest). **Extend only.**

## Goal

Mirror the hub sub-wave closeout (**IDX-13u**): document **08b–13z** as **complete** in the IDX index with explicit cross-mode slice commands, and add a Vitest ratchet so the closeout subsection cannot be deleted without CI failure.

## What to build

1. Index subsection `### Cross-mode excellence wave (IDX-08b–13z) — complete` with dotnet/npm filter commands for manifest, trait guard, fat-graph parity, workbench ratchet, UI manifest, and this closeout test.

2. `inventory-diagram-excellence-cross-mode-wave-closeout.vitest.test.ts` beside the other excellence diagram tests — assert the index markdown contains the complete heading and each listed filter token.

3. Index row **IDX-14a** shipped — extend only; filter `inventory-diagram-excellence-cross-mode-wave-closeout`.

## Tests

```bash
cd archlucid-ui && npm test -- inventory-diagram-excellence-cross-mode-wave-closeout
```
