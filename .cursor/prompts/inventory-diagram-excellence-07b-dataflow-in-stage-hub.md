# IDX-07b — Data Flow in-stage hub

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07 hub-spoke already on trunk (`DiagramHubSpokeLayerPlanner`, SVG `data-hub-spoke="hub"`). **Extend only.** Do **not** greenfield IDX-01–13. Do **not** restage Data Flow into resource-group role columns.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

On **Data Flow** only, a stage that contains a high-degree node (visible undirected degree ≥ 3, same rule as `DiagramHubSpokeLayerPlanner.ShouldLayoutHubSpoke`) places that node as a **hub inside the stage column**. Spokes stack in one column to the hub’s left, inside that stage. Stages stay **left-to-right**. Other modes keep today’s role-column and hub-spoke behavior.

## Why

IDX-07 says Data Flow must **keep LR stages** and still hub a shared ADF or Key Vault inside a stage. `DiagramForestDataFlowColumnLayout` stacks every stage member top-to-bottom and never calls `LayoutHubSpoke`. A factory with four sinks paints as a tall stack in one stage, not a hub beside its spokes. Role columns stay off while nodes carry `SubgraphId`, which is correct for Data Flow and is **not** the fix.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. In-stage hub when a stage component meets the hub-spoke rule. Stage columns stay LR. `data-role-column` stays absent. |
| DataArchitecture | Do **not** switch type-group columns to hub-spoke in this prompt. Leave type groups as they are. |
| Executive / Architecture / Network / Security / Identity / Data / FullSubscription / ResourceGroup / SelectedResources / DependencyNeighborhood | Do **not** change packing. Existing IDX-07 ratchets stay green. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs` — stage columns. Today every node in a stage shares one x and stacks on y.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramHubSpokeLayerPlanner.cs` — degree ≥ 3, component size ≥ 4, tie-break `OrderKey` then `NodeId`. Hub sits to the **right** of the spoke column (`LayoutHubSpoke` in `DiagramForestLayoutSvgRenderer`).
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `IsDataFlowTitle` plans columns before RG packing. Stamp `data-hub-spoke="hub"` the same way `LayoutHubSpoke` already does.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceIdx07RatchetTests.cs` — Data Flow mixed AST asserts **no** `data-role-column`. Keep that. It does **not** yet require an in-stage hub.
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestRoleColumnLayoutTests.cs` — Data Flow stage with three nodes must still omit role columns.

## What to build

1. Inside one Data Flow stage column, partition nodes into connected components using **visible** edges whose both ends are in that stage.

2. When a component meets `ShouldLayoutHubSpoke`, place it with the existing hub-to-the-right geometry (`LayoutHubSpoke` or a shared helper it calls). Spokes share one x (±1 px). Hub `X` is greater than each spoke’s `X + Width - 0.5`. Isolated extras in that component stay under the spoke stack. Do not invent edges.

3. Stage columns that are chains (max degree &lt; 3) or smaller than four nodes stay the current vertical stack.

4. Multiple stages stay left-to-right. A hub in stage N must not pull nodes out of stage N+1. Do not cross stage boundaries to raise degree.

5. Stamp `data-hub-spoke="hub"` on the hub node group. Do not stamp `data-role-column` on Data Flow nodes.

6. Tests (new class, one type per file):
   - Data Flow AST: one stage subgraph, ADF (or Key Vault) plus four sinks, four edges from the hub. Forest SVG has exactly one `data-hub-spoke="hub"`. Hub center x is greater than each spoke center x. Spokes share an x. Stage subgraph id is still on the AST. Zero `data-role-column`.
   - Same shape with max degree 2 (a chain): zero `data-hub-spoke`.
   - Two stages, hub only in stage 2: stage 1 nodes stay left of stage 2. Hub marker count is 1.
   - ResourceGroup mixed-RG role-column test and `InventoryDiagramExcellenceIdx07RatchetTests` stay green without edits that weaken them.

## Acceptance criteria

- Data Flow still reads left-to-right by stage.
- A four-spoke stage paints as a spoke column plus one hub inside that stage, not a five-high stack.
- No `ComponentHorizontalGap` or `ComponentVerticalGap` change. No Mermaid spacing retune. No new Azure icon.

## Constraints

- **Do not** route Data Flow through `LayoutRoleColumns`.
- **Do not** remove stage subgraphs so RG hub-spoke can run.
- **Do not** reopen IDX-01 capture or IDX-10 PE UI.
- **This is not IDX-HOLD.**

## Done when

A Data Flow forest with one stage, one ADF, and four cited sinks shows the ADF as the hub to the right of those sinks, and a second stage to the right of that column is unchanged.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellenceIdx07|FullyQualifiedName~DiagramForestRoleColumn|FullyQualifiedName~DataFlowInStageHub'
```
