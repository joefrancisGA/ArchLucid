# IDX-07f — Data Flow hub pipeline excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07b–07e on trunk (in-stage hub, rollup exemption, hub edge routing, component-safe subcolumns). **Extend only.** Do **not** change layout, rollup, or routing behavior unless a test proves a regression. Do **not** greenfield IDX-01–13.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

The Data Flow hub pipeline is covered by the **same** regression filter agents run for the rest of IDX (`FullyQualifiedName~InventoryDiagramExcellence`). One canonical fixture plus a small ratchet class fail if hub layout, rollup, subcolumn packing, or cross-stage routing regresses.

## Why

IDX-07b–07e shipped as focused tests under `DataFlowInStageHub` and `DiagramForestDataFlowEdgeRouter`. `InventoryDiagramExcellenceIdx07RatchetTests` only checks that Data Flow omits `data-role-column` on a mixed-RG AST forced into one stage. `InventoryDiagramExcellenceIdx13RatchetTests` only asserts stage subgraphs survive compile on the fat graph. An agent can break the thirteen-node hub star or `landing → adf` routing while `dotnet test --filter FullyQualifiedName~InventoryDiagramExcellence` stays green.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. New ratchet tests run only for Data Flow forest render on the canonical hub fixture. |
| All other modes | Unchanged. Do not weaken existing `InventoryDiagramExcellence*` assertions. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowInStageHubLayoutTests.cs` — copy **behavior**, do not delete; ratchet reuses or shares a fixture builder.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceRatchetAssertions.cs` — add optional helpers (e.g. `AssertDataFlowHubPipeline`) if it reduces duplication.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceIdx07RatchetTests.cs` — keep existing Data Flow role-column fact; may call shared assertion from 07f.
- `.cursor/prompts/inventory-diagram-excellence-00-index.md` — regression guard names `FullyQualifiedName~InventoryDiagramExcellence`.

## What to build

1. **Canonical fixture** (own file, one public static builder class): Data Flow title, two stages — stage 1 one storage landing node; stage 2 one factory plus **twelve** `Microsoft.Storage/storageAccounts` sinks, twelve edges from factory, one edge `landing → adf`. Use Mermaid-safe node ids (letters, digits, underscore only).

2. **New test class** named `InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests` (one type per file). Class or test names must include `InventoryDiagramExcellence` so the excellence filter picks them up.

3. **Minimum assertions** on forest `Render` of the canonical fixture:
   - `Succeeded` is true.
   - Exactly one `data-hub-spoke="hub"`.
   - Zero `data-role-column`.
   - All fourteen node ids present in SVG (`landing`, `adf`, `st0`…`st11`).
   - `DiagramForestDataFlowRollup.Apply` on the same nodes/edges returns **no** `IsDataFlowRollup` nodes (rollup exemption for the hub component).
   - Cross-stage edge route: reuse the spoke-avoidance check from `InventoryDiagramExcellenceDataFlowInStageHubLayoutTests` or extract a shared helper (one file per helper class if new).

4. **Optional thin fact** in `InventoryDiagramExcellenceIdx07RatchetTests` that calls the shared assertion for `DiagramMode.DataFlow` only — only if it does not duplicate three full renders per CI run; prefer one render per test method.

5. Do **not** remove or narrow `DataFlowInStageHub` tests. Do **not** change production code unless a test fails on trunk.

## Acceptance criteria

- `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellence` executes the new Data Flow hub pipeline ratchet.
- Existing `DataFlowInStageHub`, `DiagramForestDataFlowRollup`, and `DiagramForestDataFlowEdgeRouter` tests stay green.

## Constraints

- **Do not** add new visuals or change `MaxCardsPerDataFlowSubcolumn`.
- **Do not** require live Azure or a new snapshot graph for this prompt.
- **This is not IDX-HOLD.**

## Done when

The excellence filter fails if any of 07b–07e behaviors break on the canonical two-stage hub fixture, without agents having to remember a separate `DataFlowInStageHub` filter.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellence'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlowInStageHub|FullyQualifiedName~DiagramForestDataFlowRollup|FullyQualifiedName~DiagramForestDataFlowEdgeRouter'
```
