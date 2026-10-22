# VN-29 — One caption for a VNet and the resource group beside it

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-28. Do not re-run VN-01 through VN-28.

## Goal

Below 45% of natural size, a virtual network and the resource group seated with it show one caption, the virtual-network caption. A resource group that is not seated with a virtual network keeps its own caption. A caption that does not fit its frame ends with `…` and still shows the member count. It is not cut through the middle of a letter.

## Why

The same double names and sliced words show at 20%, 30%, and 40%. The 30% hierarchy cutoff is not the cause.

`isRectInside` drops a resource-group caption only when the virtual-network rectangle is completely inside that resource-group rectangle. On a Full subscription the virtual network sits beside the resource group, or crosses its edge, so the test fails and both captions paint. That is true in hierarchy mode and in the 30–45% overview band.

Each caption is then clipped to its frame rectangle. The clip cuts the glyphs. The reader sees fragments such as `vnet-ed` and `databricks-rg-anly-` instead of a name that ends on purpose.

## Read first

- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts` (`isRectInside`, `DIAGRAM_OVERVIEW_CAPTION_MAX_SCALE`, the caption `clip-path`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` (`NodeHorizontalGap`, default 28)
- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.test.ts`

## What to build

Do this for every painted scale strictly below `0.45`. Do not limit it to hierarchy mode. Hierarchy mode still hides card text, connector labels, and stub chips at `0.30` and below. Do not change that.

A resource-group frame is seated with a virtual network when either of these is true:

1. Their rectangles overlap by any positive area.
2. Their Y intervals overlap, and the horizontal gap between the rectangles is at most 28 user units.

28 is the existing `NodeHorizontalGap` default. Do not change `NodeHorizontalGap`.

When a resource-group frame is seated with a qualifying virtual-network frame, do not paint the resource-group overview caption. Paint the virtual-network caption. A resource-group frame that fails both tests still gets its own caption. Subscription frames and subnet frames still get none.

Fit the caption string before painting it. The available width is the frame width minus `16 / paintedScale` user units. Estimate one character as `0.6 * (14 / paintedScale)` user units. When the full `{name} · {count}` is wider than the available width, shorten the name and put `…` immediately after the shortened name, then the space, middle dot, space, and count. The text content itself contains `…`. Keep the clip path so the ink cannot leave the frame, but the clip is not what shortens the word.

## Tests

Extend `architecture-diagram-overview-captions.test.ts`.

1. At painted scale `0.2` and at `0.4`, a virtual-network rectangle that overlaps a resource-group rectangle produces only the virtual-network caption.
2. At painted scale `0.4`, a resource-group rectangle whose Y interval overlaps a virtual network and whose horizontal gap is 28 produces only the virtual-network caption. A gap of 29 produces both captions.
3. A resource group in a separate Y band still gets its own caption.
4. A caption whose name does not fit the frame is the text `{shortened name}… · {count}`, and the shortened name is not empty when the count fits.

## Acceptance criteria

- Below 45%, a virtual network and the resource group seated beside it or overlapping it show the virtual-network caption only.
- A resource group that is not seated with a virtual network still shows its own caption.
- A caption that does not fit ends with `…` before the member count. It is not sliced through a letter.
- At 30% and below, card text, connector labels, and stub chips stay hidden. At 45% and above, the normal diagram returns.
- Boxes, lines, click-focus, gap constants, and the Show cross-group links checkbox stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `architecture-diagram-overview-captions.test.ts`. Do not run the full viewer file.
- No C# change is required. Skip `agent-compile-check.ps1` unless a C# file changes.
- Do not commit. Do not edit unrelated dirty files.
- Do not change `ComponentHorizontalGap`, `ComponentVerticalGap`, `NodeHorizontalGap`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`, or the zoom clamp.
- Do not change the extractor.

## Done when

At 20%, 30%, and 40%, each virtual network on the Full subscription plate has one readable caption, and the resource group seated with it does not add a second name. A long name ends with an ellipsis and still shows its count.
