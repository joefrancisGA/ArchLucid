# IDX-07c — Data Flow rollup must not erase an in-stage hub

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07b in-stage hub already on trunk (`DiagramForestHubSpokeInteriorLayout`, `data-hub-spoke="hub"` on Data Flow). **Extend only.** Do **not** greenfield IDX-01–13 or re-layout hub geometry. Do **not** restage Data Flow into resource-group role columns.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

On **Data Flow** only, a same-stage star of one hub plus four same-type sinks still paints as hub-and-spoke. `DiagramForestDataFlowRollup` must not collapse those sinks into one card before `DiagramForestDataFlowColumnLayout` runs.

## Why

IDX-07b places a hub when a **visible** stage component has at least four nodes and undirected degree at least 3. Render calls `DiagramForestDataFlowRollup.Apply` **before** that layout. Rollup groups by stage, ARM type, and neighbor set, and collapses a group of four or more (`MinimumMembersToRollUp`). Four storage accounts that all write from one factory share that key, so the stage becomes factory + one rollup card. Hub-spoke never runs. The IDX-07b tests avoid this by using three different sink types. A real factory with four storage sinks still paints as a two-card stack.

Cross-stage rollup must stay. Existing `DiagramForestDataFlowRollupTests` put four same-type members in one stage and the consumer in another stage. Those members are not one in-stage hub component. They must still roll up.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. Exempt an in-stage hub-spoke component from rollup, then keep IDX-07b placement. |
| DataArchitecture | Do **not** change type-group columns or invent a rollup. |
| Executive / Architecture / Network / Security / Identity / Data / FullSubscription / ResourceGroup / SelectedResources / DependencyNeighborhood | Do **not** change packing or rollup. IDX-07 ratchets stay green. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — Data Flow path: rollup, then `DiagramForestDataFlowColumnLayout.Plan`.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowRollup.cs` — `MinimumMembersToRollUp` is 4. Key is subgraph id + type + neighbor set.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramHubSpokeLayerPlanner.cs` — `ShouldLayoutHubSpoke`.
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramComponentBuilder.cs` — connected components. Use **only edges whose both ends are in the same stage** when deciding the exemption. Do not count a neighbor in another stage toward in-stage degree.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowInStageHubLayoutTests.cs` — three distinct sink types already pass. Add the four-same-type case here (or a sibling class, one type per file).
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestDataFlowRollupTests.cs` — cross-stage four-member rollups must stay rolled up.

## What to build

1. Before rollup, partition each stage’s nodes with `DiagramComponentBuilder.BuildConnectedComponents` using edges that stay inside that stage.

2. When `ShouldLayoutHubSpoke` is true for that component, exclude **every** member of that component from rollup. The factory and its four sinks stay separate cards.

3. Leave every other node on the existing rollup path. Four same-type nodes whose only neighbors sit in another stage still become one rollup card. A chain (max degree under 3) still follows today’s rollup rules.

4. Do not change hub x/y geometry, `ComponentHorizontalGap`, `ComponentVerticalGap`, or Mermaid spacing. Do not stamp `data-role-column` on Data Flow.

5. Tests:
   - Data Flow forest: one stage, one factory, four `Microsoft.Storage/storageAccounts`, four edges from the factory. SVG has exactly one `data-hub-spoke="hub"`. Four sink node ids are still present (no `IsDataFlowRollup` card replacing them). Hub center x is greater than each sink center x. Sinks share an x (±1 px). Zero `data-role-column`.
   - Existing cross-stage `DiagramForestDataFlowRollupTests` stay green without weakening assertions.
   - IDX-07b three-type hub test and the degree-2 chain test stay green.

## Acceptance criteria

- A Data Flow stage with one ADF and four storage accounts shows four spoke cards and the ADF as the hub to their right.
- Four storage accounts that only cite a consumer in a **different** stage still collapse to one rollup card.
- Other `DiagramMode` values are unchanged.

## Constraints

- **Do not** lower `MinimumMembersToRollUp`.
- **Do not** disable rollup for all Data Flow nodes.
- **Do not** route Data Flow through `LayoutRoleColumns`.
- **Do not** reopen IDX-01 capture or IDX-10 PE UI.
- **This is not IDX-HOLD.**

## Done when

Forest SVG for one stage, one factory, and four same-type sinks contains one hub marker and four distinct sink nodes, and a cross-stage four-member rollup test still returns one rollup node.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlowInStageHub|FullyQualifiedName~DiagramForestDataFlowRollup|FullyQualifiedName~InventoryDiagramExcellenceIdx07'
```
