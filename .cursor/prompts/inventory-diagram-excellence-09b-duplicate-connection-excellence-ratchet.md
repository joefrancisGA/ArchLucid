# IDX-09b — Duplicate connection excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-09 (`DiagramInventoryConnectionRollupApplier`) on trunk. **Extend only.**

## Goal

Connection rollup is covered in `DiagramForestBatchTwoPlannerTests` but not under `FullyQualifiedName~InventoryDiagramExcellence`. Add a named fixture and ratchet for merge + cited-edge retention and forest render.

## What to build

1. `InventoryDiagramExcellenceDuplicateConnectionFixture` — workflow plus duplicate `Microsoft.Web/connections` in one RG.

2. `InventoryDiagramExcellenceDuplicateConnectionRatchetTests` — after rollup: one `Office 365 (2)` card, deduped edges; different API labels stay separate; forest SVG contains merged label.

3. Index row **IDX-09b** shipped — extend only.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceDuplicateConnection'
```
