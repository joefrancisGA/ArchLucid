# DRR-02 — Data-flow edges stay out of other cards

**Wave:** diagram regression repair (**DRR**). **Depends on:** DRR-01 (gutter, sky lane, stage columns). **Do not** change stage titles, ink, icons, or the outline.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On a `(DataFlow)` forest canvas, no edge segment’s interior intersects a third node’s rectangle. Adjacent stages meet through the column gutter. Stage-skipping edges use the sky lane. The last-resort path that crosses a third card is not used for this layout.

## Why

`DiagramForestOrthogonalEdgeRouter.Route` tries a straight line, an L, then a U. The comment at the fallback says it keeps the connector even when it crosses a third node. Data-flow columns are solid stacks, so a Source → Storage horizontal chord crosses the Application card. That is the unreadable data-flow picture after #3587.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestOrthogonalEdgeRouter.cs` — `Route`, `BuildObstacles`, fallback at the “crosses a third node” return
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `EmitSvg` calls `Route` for every visible edge
- DRR-01 reserves `DataFlowColumnGutter` (64), `DataFlowSkyLaneHeight` (36), and `DataFlowStageLabelBand` (28). Node tops sit below the sky lane and the label band.
- IDA-05 owner-shape peering elbows must keep passing. Do not delete the fallback for non-data-flow diagrams.

## What to build

1. Add a data-flow-specific route used only when `IsDataFlowTitle` is true. Put it in its own file (for example `DiagramForestDataFlowEdgeRouter.cs`). Do not make the inventory fallback stricter in this prompt.

2. Adjacent columns (stage indexes differ by 1), including a hop into `Not staged` when that column is immediately to the right:
   - Leave the source on its right side and enter the target on its left side.
   - Travel vertically only inside the gutter between those columns.
   - One horizontal segment in that gutter is allowed. It must not enter either card’s interior or any other card.

3. Non-adjacent columns (index difference greater than 1):
   - Leave the source on its right side, go up into the sky lane, travel horizontally in the sky lane until the target column’s gutter, then down and into the target’s left side.
   - The sky-lane Y is inside `Padding` … `Padding + DataFlowSkyLaneHeight`. It must not cross a `data-flow-stage-label` or a node rect.
   - Do not route this edge through a middle column’s cards.

4. If a data-flow route would still intersect a third node, do not emit the crossing fallback. Skip that edge’s path and add no `edge-path` for it. Prefer fixing the geometry so the fixture edges route. A skipped edge is a test failure for the fixtures below, not a silent success.

5. Tests:
   - New router tests, plus one renderer test on a three-column data-flow AST (Source node, Application node, Storage node, edge Source → Storage and edge Source → Application).
   - Sample the Source → Storage path. No interior point of a segment lies inside the Application card rect (inflate the card by 1px; the boundary itself is a failure).
   - Source → Application does not enter the Storage card.
   - `Render_network_inventory_omits_subscription_and_keeps_vnet_frame` and the existing orthogonal-router owner-shape tests still pass without requiring the data-flow router.

## Acceptance criteria

- Data-flow skip edges travel in the sky lane and the gutters.
- A third card is not a shortcut.
- Inventory peering elbows stay on the existing router.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not retune Mermaid gaps. Do not switch the live canvas to Graphviz. Do not restore subscription frames.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestOrthogonalEdgeRouter|FullyQualifiedName~DiagramForestDataFlowEdgeRouter'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
