# DRS-03 — Data flow stage columns only

**Wave:** Diagram restore (**DRS**). **Depends on:** DRS-02 looked at and accepted, or the owner explicitly skipping DRS-02. **Do not** implement DRS-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Diagrams whose title contains `(DataFlow)` lay out as stage columns, with edges in the column gutters or a sky lane, and a stage label above each column. Every other diagram, including Full subscription, keeps today’s packer and today’s subscription frame.

## Why

#3587 added a column stack with no gutter, so edges crossed cards. #3592 (`bfc0ca30e7`) moved that into `DiagramForestDataFlowColumnLayout`, `DiagramForestDataFlowEdgeRouter`, and `DiagramForestDataFlowStageLabelSvgEmitter`. That router is the piece worth keeping. The same commit’s renderer also left the subscription frame off, because #3587 had already removed it. Do not copy the renderer wholesale.

## Context

Recover these files with `git show bfc0ca30e7:<path>` and re-apply them onto the current branch. Do not cherry-pick the commit.

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowEdgeRouter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowStageLabelSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestDataFlowEdgeRouterTests.cs`
- The `(DataFlow)` branch and layout-option fields inside `DiagramForestLayoutSvgRenderer.cs` and `DiagramForestLayoutOptions.cs` from that same commit. Read the diff. Port the data-flow branch only.

Current files that must keep their present behavior:

- `DiagramForestSubscriptionFrameResolver.ShouldDraw` stays true for a full Azure inventory title, and false for `(ResourceGroup)`, `(SelectedResources)`, and `(DependencyNeighborhood)`.
- `Render_network_inventory_adds_subscription_and_vnet_frames` must keep asserting `class="subscription-frame"`.

## What to build

1. Branch `drs/03-data-flow-layout` from the accepted DRS-02 branch, or from `revert/diagram-icon-layout-3585-3592` if earlier slices were skipped.
2. Restore the three data-flow types and their router tests.
3. In the renderer, when `IsDataFlowTitle` (title contains `(DataFlow)`), place nodes with the column layout and route edges with `DiagramForestDataFlowEdgeRouter`. Otherwise keep the existing resource-group cell placement, including the subscription frame.
4. Emit stage labels only on the data-flow path.
5. Do not change outline files, edge palette (leave DRS-02 colors if that slice landed; leave `#94a3b8` if it did not), icon catalog, or pictograms.

## Acceptance criteria

- A `(DataFlow)` fixture renders stage labels and does not draw edges across a third card when the router tests say the gutter or sky lane applies.
- A non-data-flow Azure inventory fixture still contains `class="subscription-frame"` and `class="vnet-frame"`.
- No `data:image/png` and no `azure-icon` in rendered SVG.

## Constraints

- Working-tree safety. Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**
- Do not `git checkout bfc0ca30e7 -- ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs`. That file in that commit has the frame removal mixed in.

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~DiagramForest
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj
```

Heartbeat every 8s on the compile.

## Done when

Tests pass. Stop. Tell the owner to restart the API, open a **Data flow** diagram, then open **Full subscription** on the same snapshot. Data flow should show stage columns. Full subscription should match the demo, including the subscription frame. Wait for that look before DRS-04.
