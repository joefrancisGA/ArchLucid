# DFV-04 — Paint inferred data-flow links

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-02 or DFV-03 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-01 is already merged (PR 4114). Do not redo the edge router.

## Goal

On **Data flow — what may connect**, every relationship the walkthrough counts is a connector, including inferred linked-service edges, with **Show cross-group links** left off.

On every other diagram type, a `likely ·` or `applies` edge is hidden only when the two resources are in different resource groups.

## Why

PR 4114 made `DiagramForestDataFlowEdgeRouter.TryRoute` return a path, and made the renderer fail when a placed edge still cannot be routed. A later look at `Hmd_HI_HAP_Non_Prod` still shows the cards and no connectors. The walkthrough still says **39 visible relationships**.

Those edges never reach the router.

1. Linked services that do not resolve to an in-snapshot resource id, and linked services matched by hostname, are stored as `ProvenanceKind.DeterministicInference` (`AzureInventoryAdfLinkedServiceEdgeMapper`, `AzureInventoryAdfLinkedServiceTargetResolver`).
2. `DiagramEdgeProvenanceDisplayLabelApplier` rewrites that provenance to a label that starts with `likely ·`.
3. `DiagramForestLayoutSvgRenderer.Render` then runs `DiagramCrossGroupFanOutCanvasExclusion.FilterCanvasEdges` with `IncludeCrossGroupFanOut` false. That is the default for the **Show cross-group links** checkbox.
4. `ShouldExclude` hides the edge when both nodes have a resource group and the label is `applies` or starts with `likely ·`. It reads both groups and never compares them. A same-group edge is hidden too.
5. An external linked service uses arm id `adf-external:{factoryArmId}|{linkedServiceName}`. `DiagramAstGraphNodeClassifier.ReadResourceGroup` parses `/resourceGroups/{name}/` out of that string, so the external card gets the factory's resource group. Both ends match, and the edge is dropped.
6. A hostname match onto storage in another resource group is also `likely ·`, and the filter drops it because the groups differ.

The walkthrough counts Mermaid edges before this filter (`build-diagram-walkthrough.ts`). The outline and the canvas disagree.

`DiagramCrossGroupFanOutCanvasExclusion` says it hides cross-group fan-out. `Render_default_hides_cross_group_likely_applies_but_keeps_same_group_and_connects` is named for keeping the same-group edge. The assertion `NotContain("likely · in")` hides that same-group edge. `FilterCanvasEdges_excludes_only_cross_group_applies_and_likely_prefix` expects `sameGroupLikely` to be removed. Those assertions lock in the bug.

Data flow is the view whose content is these inferred links. Leaving them behind the checkbox leaves the canvas empty. Other diagram types should keep hiding real cross-group `likely ·` and `applies` fan-out until the checkbox is on.

## Read first

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramCrossGroupFanOutCanvasExclusion.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`Render`, `IsDataFlowTitle`)
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` (`EmitVisibleEdges`)
- `ArchLucid.ArtifactSynthesis/DiagramEdgeProvenanceDisplayLabelApplier.cs` — read only
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstGraphNodeClassifier.cs` (`ReadResourceGroup`) — read only
- `ArchLucid.ArtifactSynthesis.Tests/DiagramCrossGroupFanOutCanvasExclusionTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramResourceGroupCellFlowPlannerTests.cs` (`OrderCells_ignores_hidden_cross_group_fan_out_edge_for_seating`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestDataFlowEdgeRouterTests.cs` (`BuildDataFlowRoutingAst`)
- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`

## What to build

1. Branch `dfv/04-paint-inferred-links` from current `master`.
2. In `ShouldExclude`, hide the edge only when both normalized resource groups are present, they differ (ordinal, ignore case), and `IsHiddenFanOutLabel` is true. The same resource group keeps the edge. A missing resource group keeps the edge. `includeCrossGroupFanOut: true` still returns every edge.
3. Do not relabel inferred edges. Leave `DiagramEdgeProvenanceDisplayLabelBuilder` and provenance kinds as they are. A `likely ·` label on Data flow is honest.
4. A data-flow canvas paints those edges with the checkbox off. When `IsDataFlowTitle` is true (`(DataFlow)` in the title), `DiagramForestLayoutSvgRenderer` and `DiagramAstGraphvizDotEmitter` pass `includeCrossGroupFanOut: true` into the filter. `BuildTitle` already emits `Azure inventory (DataFlow)`.
5. Leave the checkbox and `IncludeCrossGroupFanOut` request flag alone. Executive, Full, Network, and the other inventory titles still hide cross-group `likely ·` and `applies` edges until the checkbox is on.
6. Tests:
   - `Render_default_hides_cross_group_likely_applies_but_keeps_same_group_and_connects`: the default SVG contains `likely · in` and `connects`, and does not contain `likely · applies`. With `IncludeCrossGroupFanOut` true, it contains `likely · applies`.
   - `FilterCanvasEdges_excludes_only_cross_group_applies_and_likely_prefix`: default filtering keeps `sameGroupLikely` and `crossGroupConnects`, and drops `crossGroupLikely`. The opt-in keeps all three.
   - `OrderCells_ignores_hidden_cross_group_fan_out_edge_for_seating` stays green. That fan-out edge is cross-group.
   - New renderer test. Reuse the stage subgraphs from `BuildDataFlowRoutingAst`. One edge joins two nodes in resource group `rg-data` with label `likely · reads from`. One edge joins a node in `rg-data` to a node in `rg-store` with label `likely · writes to`. Title `Azure inventory (DataFlow)`, default options: the SVG has a `path.edge-path` for both pairs. The same nodes and edges with title `Azure inventory (FullSubscription)` and default options: the same-group path is present and the cross-group path is absent.

## Acceptance criteria

- Data flow, checkbox off: every non-layout-only edge with both endpoints placed has a connector, including labels that start with `likely ·`.
- Full and the other inventory titles, checkbox off: cross-group `likely ·` and `applies` edges stay off the canvas. Same-group `likely ·` edges are on the canvas.
- Checkbox on: cross-group `likely ·` and `applies` edges paint on those other titles.
- Unconnected resources stay. Diagnostic-setting, NIC, VNet, and private-endpoint attachment edges stay off Data flow.
- Provenance labels stay `likely ·` for deterministic inference. Do not rewrite them as observed.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change the edge router, column layout, evidence catalog, icon catalog, or the caption disclosure.
- Do not hide the **Show cross-group links** checkbox.
- Working-tree safety. Stage only the filter, the two call sites that pass the flag, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramCrossGroupFanOut|FullyQualifiedName~DiagramForestDataFlow|FullyQualifiedName~DiagramResourceGroupCellFlowPlanner"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open **Data flow — what may connect** on `Hmd_HI_HAP_Non_Prod` with **Show cross-group links** off. Each counted relationship should be a line, including an external linked service and its factory, and a linked service and a storage account in another resource group. Then open **Full** on the same snapshot with the checkbox off: cross-group `likely ·` fan-out should still be absent, and a same-group `likely ·` edge should be present. Wait for that look before any commit.
