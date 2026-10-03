# VN-30 — A caption that does not fit its frame sits above the frame

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-29. Do not re-run VN-01 through VN-29.

## Goal

Below 45% of natural size, every overview caption shows the whole name and the member count. A caption that fits inside its frame stays inside. A caption that does not fit sits above the frame's top edge, left-aligned to the frame, on a white halo, and is not shortened. Two captions that would overlap stack one line apart.

## Why

VN-29 fitted each caption to its frame width. The caption paints at 14 screen pixels at every zoom, but the frame shrinks with the zoom. At 40% a frame 200 user units wide is 80 screen pixels wide, which holds about nine characters of bold 14px text including ` · 5`. The count is protected, so the name is what gets cut. The plate shows `vnet-a… · 5`, `v… · 2`, and `a… · 1`. At 30% it shows one letter and a number on every box.

No pairing or hierarchy rule fixes this. A 14px caption cannot fit inside an 80px box. It has to be allowed to sit outside the box, the way a map places a label beside a small feature.

## Read first

- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts` (`fitOverviewCaption`, `truncateOverviewName`, the caption `x`, `y`, and `clip-path`, `readDiagramPaintedScale`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.test.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`applyMermaidViewportCamera`, the `.diagram-overview-hidden` host class)

## What to build

Do this for every painted scale strictly below `0.45`, in hierarchy mode and in the 30–45% band alike. Do not change which frames get a caption. VN-28 hierarchy hiding and VN-29 seated-pair suppression stay as they are.

The caption text is `{name} · {count}`. Trim the name to 32 characters as `truncateOverviewName` does today. Do not shorten it further, and do not put `…` in the text for any other reason. Remove the width-fitting branch of `fitOverviewCaption`.

Estimate the caption width in user units as `(text.length * 0.6 * 14) / paintedScale`. Estimate the caption height as `16 / paintedScale`.

**Inside placement.** When the estimated width is at most `frameWidth - 16 / paintedScale`, paint the caption where it paints today: `x = frame.x + 8 / paintedScale`, baseline `y = frame.y + 14 / paintedScale`, clipped to the frame.

**Outside placement.** Otherwise paint the caption above the frame: `x = frame.x`, baseline `y = frame.y - 4 / paintedScale`. No `clip-path`. Behind the text paint one `rect` with class `overview-caption-halo`, fill `#ffffff`, `fill-opacity` `0.85`, `rx` `2 / paintedScale`, covering the estimated text box with `2 / paintedScale` padding on every side. The halo is a sibling that comes before the text in `g.overview-captions`, so the text paints over it.

**Viewport edge.** When the outside baseline minus the caption height would be above the SVG `viewBox` top, use the inside placement for that frame even though it does not fit. The clip then keeps the ink in the frame.

**Stacking.** Process frames in reading order, top to bottom, then left to right. Keep the estimated text box of every caption already placed. When an outside caption's box overlaps a placed box by any positive area, move it down by `16 / paintedScale` and test again, at most three times. A caption that still overlaps after three moves paints at the third position. Inside captions take part in the collision list but are never moved.

## Tests

Extend `architecture-diagram-overview-captions.test.ts`. Replace the VN-29 ellipsis test with these.

1. At painted scale `0.4`, a virtual-network frame 200 units wide named `vnet-avd-hi-nprd` with 5 member nodes produces the caption text `vnet-avd-hi-nprd · 5`, containing no `…`, with a `y` attribute smaller than the frame's `y`, no `clip-path`, and an `overview-caption-halo` rect that precedes it in the captions group.
2. At painted scale `0.4`, a frame 800 units wide with the same name produces the caption inside the frame at baseline `frame.y + 14 / 0.4` with a `clip-path` and no halo.
3. At painted scale `0.4`, two narrow frames whose top edges are 10 units apart in Y and share the same X produce two outside captions, and the second caption's `y` is `16 / 0.4` below the first caption's `y`.
4. At painted scale `0.4`, a narrow frame whose top edge is at the `viewBox` top produces an inside caption with a `clip-path`.
5. At painted scale `0.2`, hierarchy mode still hides `g.node text` and the original frame caption, and a narrow frame still gets an outside caption with the full name.

## Acceptance criteria

- Below 45%, no caption contains `…` unless the name itself is longer than 32 characters.
- A caption that does not fit inside its frame sits above the frame's top edge on a white halo, and the frame's own stroke is not covered by the text.
- A caption that fits inside its frame stays inside it.
- Two captions that would overlap are one line apart.
- A frame at the top of the plate keeps its caption inside.
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

At 20%, 30%, and 40%, each virtual network and standalone resource group on the Full subscription plate shows its whole name and count. Narrow boxes carry that caption above their top edge on a white halo. Wide boxes carry it inside. No caption reads as one letter and a number.
