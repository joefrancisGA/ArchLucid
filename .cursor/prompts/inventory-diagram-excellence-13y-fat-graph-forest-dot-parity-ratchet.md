# IDX-13y — Fat-graph forest / DOT parity excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13b + IDX-13 cross-mode compile on trunk. **Extend only.**

## Goal

`BuildFatGraph()` already flows through `InventoryDiagramExcellenceIdx13RatchetTests`, but **IDX-13b** hero modes (Network, FullSubscription, ResourceGroup) deserve a named ratchet class so forest SVG and Graphviz DOT nested-frame counts cannot diverge on the shared excellence graph without failing a dedicated filter.

## What to build

1. `InventoryDiagramExcellenceFatGraphForestDotParityRatchetTests` — for **Network**, **FullSubscription**, and **ResourceGroup**, compile the fat fixture, render forest SVG, emit DOT, call `AssertForestAndDotNestedFrameParity`. Network must keep `subnet-frame` count &gt; 0.

2. Add the class to **IDX-13v** manifest and **IDX-13w** trait guard lists.

3. Index row **IDX-13y** shipped — extend only.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~FatGraphForestDotParityRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramNetworkSubnet'
```
