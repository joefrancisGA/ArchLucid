# IDX-12b — Hop-focus excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-12 (`DiagramHopFocusIdx12CompileTests`) on trunk. **Extend only.**

## Goal

Hop-focus compile behavior (neighborhood, selected resources, resource group + cited VNet) is tested in `DiagramHopFocusIdx12CompileTests`, outside `FullyQualifiedName~InventoryDiagramExcellence`. Add a named fixture and ratchet under the excellence filter.

## What to build

1. `InventoryDiagramExcellenceHopFocusGraphFixture` — vm/nic/subnet/vnet graph shared with IDX-12 scenarios.

2. `InventoryDiagramExcellenceHopFocusRatchetTests` — neighborhood VNet without NIC card; selected resources omit unrelated VMs; resource group includes cited foreign VNet without sibling VMs in that RG.

3. Index row **IDX-12b** shipped — extend only.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceHopFocus'
```
