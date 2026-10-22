# IDX-10b — Private endpoint opt-in excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-10 + `InventoryDiagramExcellenceForestRatchetTests` on trunk. **Extend only.**

## Goal

Default-off PE behavior is partially covered in `InventoryDiagramExcellenceForestRatchetTests`, but **DataFlow** / **DataArchitecture** are excluded from the member-data theory and Mermaid export is not asserted under a dedicated excellence ratchet. Close that gap.

## What to build

1. `InventoryDiagramExcellencePrivateEndpointOptInRatchetTests` on `BuildFatGraph()`:
   - DataFlow + DataArchitecture default compile → zero `Microsoft.Network/privateEndpoints` nodes.
   - FullSubscription Mermaid export with flag off → no PE arm type in primary Mermaid.
   - Network compile with flag on → PE node present.

2. Index row **IDX-10b** shipped — extend only.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellencePrivateEndpoint'
```
