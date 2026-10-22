# VN-31 — A caption that does not fit its frame sits to the right of the frame

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-30. Do not re-run VN-01 through VN-30.

## Goal

Below 45% of natural size, a caption that does not fit inside its frame sits to the right of that frame, in the empty canvas, on a white halo. The caption and its halo do not cover any frame. A frame at the top of the plate keeps its whole name. Above-the-frame placement remains only for a caption whose right-side box would cover another frame.

## Why

VN-30 put every non-fitting caption above its frame. At 20% the frames are about 15–25 screen pixels tall, so the caption of frame N, plus its white halo, paints across the lower half of frame N-1. The plate reads as a column of names with slivers of boxes between them.

The first frame sits on the viewBox top, so `canPlaceOutside` is false and that caption is clipped inside the frame. The reader sees `vnet` instead of `vnet-edw-hi-nprd-wus-001 · 4`.

The plate has the room on the right of the column. A map puts the name beside the feature when the feature is shorter than the type.

## Read first

- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts` (`estimateOverviewCaptionWidth`, `canPlaceOutside`, the outside `x` and `baselineY`, `overview-caption-halo`, `placedCaptionBounds`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.test.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`applyMermaidViewportCamera`)

## What to build

Do this for every painted scale strictly below `0.45`. Do not change which frames get a caption. Hierarchy hiding at `0.30` and below, and seated-pair suppression, stay as they are. Caption text stays `formatOverviewCaption`. Do not add a new ellipsis.

Remove the viewBox-top gate. `canPlaceOutside` is no longer the reason to put a caption inside.

Estimate the caption width with `estimateOverviewCaptionWidth`. Estimate the caption height as `14 / paintedScale`. Halo padding stays `2 / paintedScale`. The padded box is the caption bounds expanded by that padding on every side. A padded box intersects a rectangle when the overlap has positive area. Shared edges do not count.

**Inside.** When the estimated width is at most `frameWidth - 16 / paintedScale`, paint the caption where it paints today: `x = frame.x + 8 / paintedScale`, baseline `y = frame.y + 14 / paintedScale`, clipped to the frame, no halo.

**Right.** Otherwise try the right side first.

- `x = frame.x + frame.width + 6 / paintedScale`
- baseline `y = frame.y + 16 / paintedScale`
- no `clip-path`
- halo as VN-30 paints it, behind the text

The `16 / paintedScale` offset keeps the padded halo inside the frame's vertical span, so a flush frame above is not nicked.

Accept the right side when the padded box misses every `g.vnet-frame` and `g.rg-frame` rectangle, including frames that did not get a caption, and misses every caption already placed. Process frames top to bottom, then left to right. When the right-side box hits a placed caption, move the baseline down by `16 / paintedScale` and test again, at most three times. A move that makes the padded box hit a frame stops the walk.

**Above.** Use the VN-30 above placement only when the right side is not accepted.

- `x = frame.x`
- baseline `y = frame.y - 4 / paintedScale`
- no `clip-path`
- the same halo

Walk that box down by `16 / paintedScale`, at most three times, while it intersects a placed caption or a frame rectangle. Stop the walk before the padded box enters the owning frame. If the above box still intersects a frame after that walk, paint the first right-side position anyway, full text, no clip. The gutter is the smaller cover.

Record every painted caption's unpadded bounds in the collision list. Inside captions stay in that list and are not moved.

## Tests

Extend `architecture-diagram-overview-captions.test.ts`. Keep the VN-30 wide-frame inside test. Replace the VN-30 above-placement, stacking, and top-edge tests with these.

1. At painted scale `0.2`, a virtual-network frame at `x = 0`, `y = 0`, width `200`, height `120`, named `vnet-edw-hi-nprd-wus-001`, produces `vnet-edw-hi-nprd-wus-001 · 0`. The caption `x` is `200 + 6 / 0.2`. The caption `y` is `16 / 0.2`. It has no `clip-path`. An `overview-caption-halo` rect precedes it.
2. At painted scale `0.2`, two frames stacked with no gap (`y = 0` height `120`, and `y = 120` height `120`, both `x = 0` width `200`) produce two right-side captions. Neither padded halo intersects either frame rectangle.
3. At painted scale `0.4`, a narrow frame at `x = 0`, `y = 200`, width `200`, with a second frame at `x = 210`, `y = 200`, width `400`, so the right-side caption would cover that second frame, paints the first caption above the first frame: caption `x` equals `0` and caption `y` is less than `200`.
4. At painted scale `0.4`, a frame 800 units wide named `vnet-avd-hi-nprd` keeps the caption inside at baseline `frame.y + 14 / 0.4`, with a `clip-path` and no halo.
5. At painted scale `0.2`, hierarchy mode still hides `g.node text`, and a narrow frame at `y = 0` still gets a right-side caption with the full name and no `clip-path`.

## Acceptance criteria

- At 20%, each overview caption sits to the right of its frame. The frame above it stays visible. The top frame shows its whole name, not a clipped `vnet`.
- A caption and its halo do not cover a frame when the right side or the above fallback can avoid that cover.
- A caption that fits inside its frame stays inside it.
- At 30% and below, card text, connector labels, and stub chips stay hidden. At 45% and above, the normal diagram returns.
- Boxes, lines, click-focus, gap constants, seated-pair suppression, and the Show cross-group links checkbox stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `architecture-diagram-overview-captions.test.ts`. Do not run the full viewer file.
- No C# change is required. Skip `agent-compile-check.ps1` unless a C# file changes.
- Do not commit. Do not edit unrelated dirty files.
- Do not change `DIAGRAM_OVERVIEW_CAPTION_MAX_SCALE`, `DIAGRAM_OVERVIEW_HIERARCHY_MAX_SCALE`, `OVERVIEW_CAPTION_MIN_FRAME_PX`, `OVERVIEW_SEATED_PAIR_GAP`, `NodeHorizontalGap`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`, or the zoom clamp.
- Do not change the extractor.

## Done when

At 20%, the Full subscription plate reads as a column of boxes with each whole name and count in the canvas to the right of its box. The top box is named. A caption covers a box only when both the right side and the space above the frame are already taken.
