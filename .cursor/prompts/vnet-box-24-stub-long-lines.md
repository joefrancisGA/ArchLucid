# VN-24 — Stub a connector that crosses many rows

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-20 and VN-23. Do not re-run VN-01 through VN-23.

## Goal

On a forest diagram, a connector that would cross more than two rows of boxes becomes two short stubs. Each stub names the other end. Clicking a stub lights that other end with the existing click-focus. A shorter connector stays a full line.

## Why

A Full subscription plate still has thin vertical lines down the left side. Each one runs from a virtual network near the top to a resource group many rows lower and crosses the boxes in between. The reader cannot tell which box the line serves.

VN-23 put the words on the stroke. It does not shorten these runs. Moving the far group would undo neighborhood seating. A stub keeps the connection findable and removes the run.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (the edge loop, `alreadyRouted`, `ResolveEdgeEndpoints`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` (`NodeHorizontalGap`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (the click handler and the dim pass)
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` (`ADD_ATTR`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-click-focus.ts`

## What to build

Do this while painting the forest SVG, after the route for that edge exists. Do not move cards or frames. Do not change which edges are selected for painting.

A row is a set of `vnet-frame` and `rg-frame` rectangles whose Y intervals overlap. The row band is the union of those intervals.

An edge crosses a row when the open Y interval between its two endpoint Y values overlaps that row band, and neither endpoint sits in that row. When the crossed-row count is greater than 2, replace the full route with two stubs. A count of 2 or fewer keeps the full route and the VN-23 label.

Each stub:

1. Starts at that end's existing endpoint.
2. Runs `NodeHorizontalGap` away from its card, along the first step the full route would have taken. Do not change `NodeHorizontalGap`.
3. Uses the same stroke, dash, and arrow as that edge would have used.
4. Carries a chip at the outer end. The chip on the source end reads `→ {partner label}`. The chip on the target end reads `← {partner label}`. The partner label is the other node's `Label`, trimmed. When it is longer than 32 characters, keep the first 32 and add `…`.
5. Puts the relationship label (`used by`, `peering`, `private endpoint × N`, or whatever that edge already uses) in the stub's `<title>`, followed by the chip text.
6. Sets `data-from` and `data-to` as a normal edge does, plus `data-focus-node` set to the sanitized id of the partner node.

Do not add the unpainted full route to `alreadyRouted`. Add the two short stub segments.

In the viewer, a click on `g.edge-stub` focuses `data-focus-node` through the existing click-focus path. A second click on that same stub clears focus. Escape and a click on empty canvas still clear focus. The camera stays put. Allow `data-focus-node` through DOMPurify. During click-focus, a stub stays bright when either of its endpoints is in the kept node set. Otherwise it takes `diagram-click-dim`.

## Tests

Add `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLongEdgeStubTests.cs`.

1. Four row bands, endpoints in the first and the last. The crossed-row count is greater than 2, so the edge becomes stubs.
2. Endpoints with exactly two row bands between them stay a full line.
3. A stubbed edge emits two elements whose class is `edge-stub`. One text starts with `→ `. The other starts with `← `. Neither path's vertical span is greater than `NodeHorizontalGap`.

Extend the existing click-focus viewer test. A click on `g.edge-stub` with `data-focus-node` set to a card id dims the unrelated card and leaves that card bright. A second click clears the focus.

The existing adjacent `used by` edge still has a full path and no `edge-stub`. The six peering labels, the empty private-endpoint edge, and the `private endpoint × 3` title stay as they are.

## Acceptance criteria

- A connector that crosses more than two rows paints as two short stubs, each naming the other end.
- A connector that crosses two rows or fewer stays a full line with its VN-23 label.
- Clicking a stub lights the named partner and does not move the camera.
- Boxes, gap constants, bundle text, and the Show cross-group links checkbox stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestLongEdgeStubTests`, `DiagramForestEdgeLabelSvgEmitterTests`, `DiagramForestLayoutSvgRendererTests`, and `DiagramForestVnetFrameLayoutTests`.
- Run the click-focus viewer test in `archlucid-ui`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- Do not change `ComponentHorizontalGap` or `ComponentVerticalGap`.

## Done when

A Full subscription plate no longer draws a line down the left side through every row. Each of those connections is a short stub at both ends, and clicking a stub lights the partner.
