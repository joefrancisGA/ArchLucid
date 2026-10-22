# IDX-13h — Data Flow hub service inventory-forest layout ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13f on trunk (service Mermaid on hub graph). **Extend only.**

## Goal

`InfraEvidenceSnapshotMermaidService.TryGetMermaidAsync` (`dataFlow`) must return **inventory-forest** `LayoutSvg` with exactly one in-stage hub marker on the same twelve-spoke hub graph.

IDX-13f ratchets Mermaid text only. The workbench canvas uses `LayoutSvg`; an agent can break forest hub layout on the service path while Mermaid and compile ratchets stay green.

## What to build

Extend `InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests` (same stub resolver, no Azure):

- `LayoutEngine` is `inventory-forest`.
- `LayoutSvg` is non-empty.
- Parsed SVG has exactly one `data-hub-spoke="hub"`.

Do **not** change forest layout algorithms unless this test fails.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet'
```
