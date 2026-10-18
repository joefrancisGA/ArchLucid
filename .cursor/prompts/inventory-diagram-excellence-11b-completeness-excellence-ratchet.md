# IDX-11b — Completeness summary excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-11 (`InfraEvidenceMermaidCompletenessSummaryBuilder`) on trunk. **Extend only.**

## Goal

Mode-aware completeness lives in `InfraEvidenceMermaidCompletenessSummaryBuilderTests` under `InfraEvidenceMermaidCompleteness`, not `FullyQualifiedName~InventoryDiagramExcellence`. Add a named excellence ratchet so IDX agents run completeness with the rest of the wave.

## What to build

1. `InventoryDiagramExcellenceCompletenessGraphFixture` — shared vm/nic/subnet graph for completeness scenarios.

2. `InventoryDiagramExcellenceCompletenessSummaryRatchetTests` — mirror IDX-11 builder contracts (network vs identity missing classes, hidden hops, dataFlow logicAppConnections).

3. Index regression guard mentions `FullyQualifiedName~InventoryDiagramExcellenceCompleteness`.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceCompleteness'
```
