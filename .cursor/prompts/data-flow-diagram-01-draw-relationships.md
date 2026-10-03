# DFV-01 — Draw every counted data-flow relationship

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-02 or DFV-03 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`.

## Goal

On **Data flow — what may connect**, every relationship the outline counts is a visible connector between the two resources. A third card does not sit on that connector.

## Why

Snapshot `Hmd_HI_HAP_Non_Prod` (2026-09-29) renders **127 resources in 88 connected components. 39 visible relationships.** The forest canvas shows the cards and no connectors.

Those 39 edges are mostly `inventory-adf-linked-service-inferred` hops from external linked services (Source column) to Data Factory (Ingestion column). NAT gateways and firewalls occupy the Application column between them, so `columnDelta` is greater than 1.

`DiagramForestDataFlowEdgeRouter.TryRoute` then draws the first segment straight up at the source card's right edge (`fromRightX`). That x is inside the column. A wider card above contains that point, `TryRoute` returns null, and `DiagramForestLayoutSvgRenderer.EmitSvg` hits `if (route is null) continue` and omits the edge. The outline still counts it.

A same-column route uses the column center, which runs through every card in the column, so those edges are omitted too.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowEdgeRouter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`EmitSvg` data-flow branch)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestDataFlowColumnLayout.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestDataFlowEdgeRouterTests.cs`
- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`

## What to build

1. Branch `dfv/01-draw-relationships` from current `master`.
2. Keep the data-flow column layout and the evidence catalog. Do not drop nodes. Do not add diagnostic-setting, NIC, VNet, or private-endpoint attachment edges.
3. Change the router so a vertical run sits in a gutter or the sky lane, outside card bounds:
   - Leave the source card horizontally, at that card's vertical center, and reach the gutter before any vertical segment.
   - For columns that are not neighbors, cross in the sky lane, then come down the gutter beside the target column and enter the target card horizontally.
   - For two cards in one column, use the gutter beside that column, not a line through the card centers.
4. The gutter and sky lane contain no cards. `TryRoute` must return a path for any two placed data-flow cards, including a short card in the middle of a tall Source column and a target two or more columns to the right.
5. In `EmitSvg`, stop discarding a data-flow edge when routing returns null. After the router change, a null route for two placed endpoints is a defect: fail the test rather than publishing a canvas that counts the relationship and hides it.
6. Add a router test and a renderer test:
   - Three Source cards in one column. The middle card is narrower than the cards above and below. An Application column with one firewall sits between Source and Ingestion. An edge runs from the middle Source card to an Ingestion card.
   - `TryRoute` returns a path. No interior point of that path lies inside the other Source cards or the firewall.
   - The rendered data-flow SVG contains one `path.edge-path` whose `data-from` and `data-to` are those two nodes.
   - Keep the existing adjacent-column tests. They must still refuse a path that enters a third card.

## Acceptance criteria

- A data-flow SVG path exists for every visible, non-layout-only edge whose endpoints are both placed.
- That path does not pass through a third card.
- The unequal-width Source → Ingestion fixture draws the connector with a firewall column between them.
- Unconnected resources stay on the canvas.
- Edge labels, dash patterns, and the walkthrough counts stay as they are. This session only makes the counted relationships visible.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change `AzureInventoryDataFlowEvidenceCatalog`, stage names, or icon selection.
- Do not hide isolated resources to make the diagram smaller.
- Working-tree safety. Stage only the router, the renderer null-route change, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~DiagramForestDataFlow
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open **Data flow — what may connect** on a snapshot that has linked services and a firewall or NAT gateway. Each counted relationship should be a line between two cards, including a linked service and its factory when a firewall column sits between them. Lines should run in the gaps, not across unrelated cards. Wait for that look before any commit.
