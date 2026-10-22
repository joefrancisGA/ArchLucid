# IDX-08b — Singleton-RG tail excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-08 (`DiagramForestSingletonTailPlanner`) on trunk. **Extend only.**

## Goal

`DiagramForestBatchTwoPlannerTests` covers the planner in isolation. Agents can break the forest render integration while `FullyQualifiedName~InventoryDiagramExcellence` stays green. Add a named fixture and ratchet under the excellence filter.

## What to build

1. `InventoryDiagramExcellenceSingletonTailFixture` — one multi-node RG plus ≥ `SingletonThreshold` isolated singleton RGs for subscription-scoped titles.

2. `InventoryDiagramExcellenceSingletonTailRatchetTests` — forest render asserts `Other resource groups (N)` for FullSubscription; ResourceGroup / neighborhood modes skip collapse; cited cross-RG singleton stays visible.

3. Index row **IDX-08b** shipped — extend only.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceSingletonTail'
```
