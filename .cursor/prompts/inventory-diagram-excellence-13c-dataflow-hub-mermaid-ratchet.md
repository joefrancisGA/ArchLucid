# IDX-13c — Data Flow hub pipeline Mermaid export ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07f on trunk (`InventoryDiagramExcellenceDataFlowHubPipelineFixture` + forest hub pipeline ratchet). **Extend only.** Do **not** greenfield IDX-01–13. Do **not** reimplement forest hub layout (IDX-07b–07e).

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Export **Mermaid** for the canonical Data Flow hub pipeline fixture must stay honest and structurally valid: every cited node and the cross-stage `landing → adf` edge survive `MermaidDiagramDeterministicRepairer` and `MermaidDiagramRenderPipeline`, with stage subgraphs still present in the AST.

IDX-13 promises forest, Mermaid, and PNG stay aligned. IDX-07f ratchets **forest SVG only**. An agent can break Mermaid export (drop spokes, partition away the hub stage, or strip the cross-stage edge) while `FullyQualifiedName~InventoryDiagramExcellence` stays green.

## Why

Workbench **Export Mermaid** and hosted `TryGetMermaidAsync(..., "dataFlow", ...)` use the Mermaid pipeline, not `DiagramForestLayoutSvgRenderer`. Hub-spoke geometry is forest-specific, but **node cardinality and cited edges are not**. Buyers still expect fourteen storage/factory cards and a visible landing-to-factory hop in exported diagrams.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. Mermaid ratchet on the canonical hub fixture only. |
| DataArchitecture | Unchanged. Do not replace type-group subgraphs to satisfy Mermaid. |
| Executive / Architecture / Network / Security / Identity / Data / FullSubscription / ResourceGroup / SelectedResources / DependencyNeighborhood | Unchanged. Do not weaken existing `InventoryDiagramExcellence*` or `MermaidDiagramRenderPipeline` tests. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineFixture.cs` — canonical AST; **reuse**, do not fork a second graph.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests.cs` — forest ratchet; keep green; do not duplicate full forest assertions in 13c unless extracting a shared helper reduces duplication.
- `ArchLucid.ArtifactSynthesis.Tests/MermaidDiagramRenderPipelineTests.cs` — pipeline construction pattern (`MermaidDiagramRenderPipeline` + repairer + validator).
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceRatchetAssertions.cs` — `AssertDataFlowRetainsStageSubgraphs`.
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramDeterministicRepairer.cs` — first place to inspect if nodes or edges disappear.
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs` — reference for Data Flow Mermaid expectations; **do not** require a new snapshot graph for this prompt unless you extend an existing in-memory builder without Azure HTTP.

## What to build

1. **New test class** (one type per file) named `InventoryDiagramExcellenceDataFlowHubPipelineMermaidRatchetTests`. Class or test names must include `InventoryDiagramExcellence` so the excellence filter picks them up.

2. **Minimum assertions** on `MermaidDiagramRenderPipeline.RenderAsync` for `InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build()`:
   - `Status` is `MermaidDiagramRenderStatus.Succeeded` (not `Partitioned` for this fourteen-node fixture unless you document why and fix partition thresholds — prefer success without retuning global `MaxNodes`).
   - `PrimaryMermaid` is non-empty and contains Mermaid node tokens for `landing`, `adf`, and `st0`…`st11` (match how `MermaidDiagramRenderer` quotes node ids today).
   - `PrimaryMermaid` contains a cross-stage link `landing` → `adf` (same cited edge as the forest ratchet).
   - `PrimaryMermaid` contains factory → spoke links for at least `st0` and `st11` (spot-check both ends of the spoke range).
   - Call `InventoryDiagramExcellenceRatchetAssertions.AssertDataFlowRetainsStageSubgraphs(ast)` on the fixture AST before render.
   - Optional shared helper in `InventoryDiagramExcellenceRatchetAssertions` (e.g. `AssertDataFlowHubPipelineMermaid`) if forest and Mermaid tests would otherwise duplicate string checks.

3. **If tests fail on trunk**, fix **Mermaid compile** only (repairer, renderer, validator, or Data Flow–specific coercion). Do **not** change `DiagramForestDataFlowColumnLayout`, rollup exemption, or edge router unless the forest ratchet also fails.

4. **Graphviz DOT (optional, same PR only if trivial):** emit DOT from the same AST and assert cited edges appear as `landing` → `adf` in the dot text. Skip nested-frame parity — that is **IDX-13b**. Do not add hub-spoke attributes to DOT unless forest already emits an equivalent.

5. Do **not** retune Mermaid `nodeSpacing`. Do **not** add Microsoft Azure product icons. Do **not** add default PE or NIC cards.

## Acceptance criteria

- `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellence` includes the new Mermaid ratchet.
- `InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests` and existing `MermaidDiagramRenderPipeline` tests stay green.
- No production change when trunk already passes — tests-only PR is valid.

## Constraints

- **Do not** reopen IDX-01 capture or IDX-10 PE UI.
- **Do not** require live Azure or a new hosted snapshot for the canonical fixture.
- **This is not IDX-HOLD.**

## Done when

Breaking Mermaid export for the canonical two-stage hub fixture fails `FullyQualifiedName~InventoryDiagramExcellence`, even when forest SVG still renders.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellence'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~MermaidDiagramRenderPipeline'
```
