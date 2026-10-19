# IDX-05b — Nested subnet excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-05 compile-path subnet frames on trunk (`InventoryDiagramNetworkSubnetCompileTests`, `InventoryDiagramPeeledSubnetVnetFrameCompileTests`). **Extend only.**

## Goal

Network dual-subnet compile and peeled-subnet VNet frame behavior are guarded outside `FullyQualifiedName~InventoryDiagramExcellence`. Add named excellence ratchet classes so subnet regressions fail the cross-mode slice filter.

## What to build

1. `InventoryDiagramExcellenceNestedSubnetNetworkCompileRatchetTests` — Network compile retains VM→subnet placement, draws `subnet-frame` layers, and keeps forest↔DOT nested cluster parity on the dual-subnet fixture.

2. `InventoryDiagramExcellencePeeledSubnetVnetFrameRatchetTests` — Full subscription compile after subnet peel draws a single `vnet-frame`, omits `subnet-frame` cards, and keeps forest↔DOT parity.

3. Index row **IDX-05b** shipped — extend only; filters `FullyQualifiedName~InventoryDiagramExcellenceNestedSubnetNetworkCompileRatchet` and `FullyQualifiedName~InventoryDiagramExcellencePeeledSubnetVnetFrameRatchet`.

4. Add both types to **IDX-13v** cross-mode wave manifest and **IDX-13w** trait guard lists.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceNestedSubnetNetworkCompileRatchet|FullyQualifiedName~InventoryDiagramExcellencePeeledSubnetVnetFrameRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~CrossModeWaveManifest'
```
