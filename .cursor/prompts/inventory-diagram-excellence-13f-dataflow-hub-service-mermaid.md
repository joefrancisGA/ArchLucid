# IDX-13f — Data Flow hub pipeline service Mermaid ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13e on trunk (`InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture` and `DiagramAstFromGraphCompiler` Data Flow hub compile). **Extend only.** Do **not** greenfield IDX-01–13e. Do **not** copy the graph builder into a second fixture.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

`InfraEvidenceSnapshotMermaidService.TryGetMermaidAsync` for mode `dataFlow` must succeed on the **same** twelve-spoke hub `GraphSnapshot` that IDX-13e compiles, and the returned Mermaid must keep every cited node and the cited movement edges.

IDX-13c ratchets `MermaidDiagramRenderPipeline` on a **hand-built AST**. IDX-13e ratchets **compile** in `ArchLucid.ArtifactSynthesis.Tests`. The workbench calls `InfraEvidenceSnapshotMermaidService`, which resolves a graph, compiles, and renders. An agent can drop spokes or the cross-stage hop in that service path while both excellence filters stay green.

## Why

Buyers never call `DiagramAstFromGraphCompiler` from a unit test. They open Data Flow on a snapshot. The hub star (landing storage, one Data Factory, twelve storage sinks) is the shape that previously collapsed under rollup and stage assignment. It has to fail in the Application service test when that path breaks.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. Service Mermaid only. `includePrivateEndpointNodes` stays **false**. |
| Network / FullSubscription / other modes | Unchanged. Do not add a second mode assertion to “cover” the enum. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.cs` — canonical graph (`landing`, `adf`, `st0`–`st11`). **Move, do not copy.**
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests.cs` — compile contract this service test must not weaken.
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` — `TryGetMermaidAsync`; mode key `dataFlow`.
- `ArchLucid.Application/InfraEvidence/Mermaid/IAzureInventorySnapshotGraphResolver.cs` — stub this in the test so the service receives the shared graph.
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs` — `CreateService`, `Data_flow_mode_probable_evidence_contract`. Copy the sealed-manifest doubles (`NoOpArchitectureDiagramReconciliationRepository`, authority and manifest-hash mocks). **Do not** add the new fact to that file.
- `ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj` — already `InternalsVisibleTo` `ArchLucid.ArtifactSynthesis.Tests` and `ArchLucid.Application`. Application.Tests cannot see `internal` types until you add it.

## What to build

1. **Share the graph fixture.** Move `InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture` into `ArchLucid.ArtifactSynthesis` as `internal` (same `Build()` and node-id constants). Add `InternalsVisibleTo` for `ArchLucid.Application.Tests`. Update the ArtifactSynthesis.Tests usings. Do **not** add a project reference from `ArchLucid.Application.Tests` to `ArchLucid.ArtifactSynthesis.Tests`. Do **not** put the fixture in `ArchLucid.TestSupport`.

2. **New test class** `InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests` in `ArchLucid.Application.Tests` (own file).

3. **Service wiring** (no Azure HTTP, no hosted snapshot package):
   - `IAzureInventorySnapshotGraphResolver` returns `Succeeded` with `InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build()`.
   - Real compile and Mermaid render (same orchestrator / compiler / renderer stack as `CreateService`). A null PNG renderer is fine. Do **not** call `TryExportPngAsync`.
   - Sealed-manifest guard must pass the same way existing service tests pass. Do not weaken the production guard.

4. **Minimum assertions** on `TryGetMermaidAsync(..., mode: "dataFlow", includePrivateEndpointNodes: false)`:
   - `Succeeded` is true.
   - Mermaid text contains the sanitized ids for `landing`, `adf`, `st0`, and `st11` (same sanitizer the compile ratchet uses).
   - A directed Mermaid edge exists for `landing` → `adf`, `adf` → `st0`, and `adf` → `st11` (`-->` or `-.->` on one line, same style as the compile ratchet).
   - Mermaid still contains `st0` and `st11` as separate nodes (rollup must not replace the twelve sinks with one card).
   - Mermaid does not contain a private-endpoint card id. The fixture has none; the default PE flag must stay off.

5. **If the service drops nodes or edges**, fix the service / inventory render orchestrator / Data Flow compile options that this call actually uses. Do **not** change forest hub layout. Do **not** retune Mermaid `nodeSpacing`. Do **not** edit the hand-built AST fixture.

6. **Out of scope for this prompt:**
   - `AssertCrossStageRouteAvoidsSpokeCards` and SVG edge-title alignment (`writes` vs compiled labels).
   - Renaming stage labels between the hand AST (`Source` / `Transform`) and compile (`Source` / `Ingestion`).
   - A new hosted snapshot or live Azure calls.

## Acceptance criteria

- `dotnet test ArchLucid.Application.Tests --filter FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet` passes.
- `FullyQualifiedName~InventoryDiagramExcellence` still passes after the fixture move.
- Existing `InfraEvidenceSnapshotMermaidService` Data Flow probable-evidence test stays green.

## Constraints

- **Do not** reopen IDX-01 capture or IDX-10 PE UI.
- **Do not** merge this with **IDX-13b** fat-graph nested-frame work.
- **This is not IDX-HOLD.**

## Done when

Breaking Data Flow Mermaid inside `InfraEvidenceSnapshotMermaidService` for this hub graph fails the new Application test even when the ArtifactSynthesis compile ratchet still passes.

## Tests

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~Data_flow_mode_probable_evidence_contract'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellence'
```
