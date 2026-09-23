# DRR-01 — Data-flow stage labels and column gutters

**Wave:** diagram regression repair (**DRR**). **Depends on:** trunk. **Do not** implement edge-crossing tests (**DRR-02**), ink (**DRR-03**), icons (**DRR-04**), or the outline (**DRR-05**).

Do not implement from the wave index. Implement only *What to build*.

## Goal

`Azure inventory (DataFlow)` stays left-to-right stage columns. Each column has its stage name. A reserved gutter sits between columns so a later prompt can route edges there. Resource-group frames stay off this path. The subscription frame stays off.

## Why

`LayoutDataFlowStageColumns` groups nodes by data-flow subgraph index and stacks them with `NodeVerticalGap` (20) and `ComponentHorizontalGap` (48). It never paints `DiagramSubgraph.Label`. `NodePlacement.FrameCellId` stays null, so `ResolveFrameBounds` draws nothing. A Source → Storage edge then crosses the Application column. Operators cannot tell which column is which stage.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `IsDataFlowTitle`, `LayoutDataFlowStageColumns`, `EmitSvg`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowCompileSupport.cs` — `DiagramDataFlowStageSubgraphPlanner` ids `data-flow-stage-{stage}`
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowStageNames.cs` — `OrderedStages`: Source, Application, Ingestion, Storage, Transform, Consumer
- Title is `Azure inventory (DataFlow)` from `DiagramAstFromGraphCompiler.BuildTitle`. Match remains `title.Contains("(DataFlow)", OrdinalIgnoreCase)`. Do not switch Executive or Data architecture onto this layout.
- `DiagramForestSubscriptionFrameResolver.ShouldDraw` stays `false`.

## What to build

1. Keep stage-column placement **only** when `IsDataFlowTitle` is true. Other modes stay on `BuildResourceGroupCellLayouts`.

2. Column membership stays: subgraph `OrderKey` order, then index. Nodes whose `SubgraphId` is null or missing from `stageOrder` share one trailing column.

3. Paint a stage title above each column, in the SVG, included in the viewBox:
   - Text is the subgraph `Label` (`Source`, `Application`, …).
   - The trailing column, when it has nodes, is titled `Not staged`.
   - Class `data-flow-stage-label`. Fill `#111827`. Font 13px, weight 700, `system-ui, sans-serif`.
   - Do not use a node card for the title.

4. Reserve geometry the edge prompt can trust. Document the constants on `DiagramForestLayoutOptions` (new properties with these defaults):
   - `DataFlowColumnGutter` = 64 (empty width between the right edge of one column’s widest card and the left edge of the next).
   - `DataFlowStageLabelBand` = 28 (title band above the first card).
   - `DataFlowSkyLaneHeight` = 36 (empty band above the title, for skip-edges in **DRR-02**).
   - Node top = `Padding + DataFlowSkyLaneHeight + DataFlowStageLabelBand`.
   - Do not place cards inside the gutter, the label band, or the sky lane.

5. Do **not** set `FrameCellId` on these placements. Data-flow SVG must not contain `class="rg-frame"` or `class="subscription-frame"`. Resource group stays the existing card caption.

6. Tests in `DiagramForestLayoutSvgRendererTests` (new facts, do not weaken `Render_network_inventory_omits_subscription_and_keeps_vnet_frame`):
   - Data-flow AST with Source, Application, and Storage subgraphs and one node each: three `data-flow-stage-label` texts in that order; card X increases left to right; each card’s X is to the right of the previous column’s right edge by at least `DataFlowColumnGutter`.
   - A node with a null `SubgraphId` lands in a column titled `Not staged`, to the right of Storage.
   - Data-flow SVG does not contain `subscription-frame` or `rg-frame`.
   - An Executive (or other non-DataFlow) fixture still takes the resource-group path: it has no `data-flow-stage-label`.

## Acceptance criteria

- A data-flow canvas reads Source → … → Consumer as named columns.
- Cards do not sit in the gutter or the sky lane.
- Inventory diagrams other than Data flow are unchanged by this prompt.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not restore the subscription frame. Do not draw resource-group boxes on the data-flow path. Do not add elk, React Flow, or a new layout library.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
