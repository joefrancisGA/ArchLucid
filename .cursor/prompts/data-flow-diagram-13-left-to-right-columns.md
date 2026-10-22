# DFV-13 — Make the data-flow canvas read left to right

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-12, DFV-14, or DFV-15 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. Do not redo `DiagramForestDataFlowEdgeRouter` obstacle checks. Do not change Full subscription or Network layout.

## Goal

On **Data flow — what may connect**, a stage with many cards wraps into side-by-side sub-columns inside that stage, so the canvas is wider than it is tall. Connected cards sit above the unconnected cards in the same stage. An edge still leaves a card on the right and enters the next card on the left.

## Why

`DiagramForestDataFlowColumnLayout.Plan` stacks every node in a stage into one column. Storage on `Hmd_HI_HAP_Non_Prod` is about sixty cards tall, so the eye travels down the page. The stage order is already Source, then Application, Ingestion, Storage, Transform, and Consumer. The router in `DiagramForestDataFlowEdgeRouter` already draws the short hop through the gutter and the long hop through the sky lane, and `DiagramForestEdgeArrowMarkerSvgEmitter` already puts an arrowhead on the path.

This session changes how many cards sit in one vertical stack. It keeps the stage order and the router.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowEdgeRouter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowStageLabelSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`IsDataFlowTitle`)
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowStageNames.cs`

## What to build

1. Branch `dfv/13-left-to-right-columns` from current `master`.
2. Add `MaxCardsPerDataFlowSubcolumn = 12` on the data-flow column layout. After the existing crossing-order sort, split a stage wider than 12 cards into consecutive sub-columns of at most 12. Preserve that sort order across the wrap.
3. Sub-columns of one stage sit left to right, and the whole stage stays left of the next stage. The stage label spans the sub-columns of that stage.
4. In each stage, cards with a visible data-flow edge come first. Cards with no such edge come last. When a stage has both, paint a small SVG label `Not connected` above the first unconnected card. Do not add a new stage.
5. The router keeps sending an edge out of the source card's right side and into the target card's left side. Same-stage sub-columns use the gutter path that `columnDelta == 0` already builds. Arrowheads stay.
6. Full subscription, Network, and Data architecture layouts keep one code path. The wrap runs only when the title is Data flow.
7. Tests:
    - 30 storage nodes in one stage produce three sub-columns, each of at most 12, and the stage label is one label spanning them.
    - The next stage's leftmost card is to the right of the last storage sub-column.
    - A storage node with an edge sits above a storage node with no edge, and the SVG contains `Not connected` once for that stage.
    - A source-to-ingestion edge's first segment starts at the source card's right edge.
    - A Full subscription fixture does not gain `Not connected` and does not wrap.

## Acceptance criteria

- A tall data-flow stage wraps instead of growing one endless column.
- Connected cards are above unconnected cards in that stage.
- Edges still run left to right with arrowheads.
- Other diagram types are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not hide cards and do not roll up repeated types. That is DFV-14.
- Do not collapse workspace tabs.
- Working-tree safety. Stage only the data-flow column layout, the stage label span, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForest|FullyQualifiedName~DataFlowColumn"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. Storage should break into side-by-side groups under one Storage label, with connected accounts above a `Not connected` group. The factories should still sit to the left of storage, and the arrowheads should still point along the edges. Wait for that look before any commit.
