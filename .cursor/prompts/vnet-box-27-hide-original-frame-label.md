# VN-27 — Hide the original frame name when the overview caption is on

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-26. Do not re-run VN-01 through VN-26.

## Goal

At 30% zoom and below, a bounding box that has an overview caption shows that caption only. The original frame name is hidden. Zooming back to 45% or more restores the original name and removes the overview caption.

## Why

VN-26 looks right above 45%. At 30% the same box shows two names.

`enhanceInventoryClusterLabels` rewrites `g.rg-frame > text`. It replaces `class="rg-frame-label"` with `class="clusterLabelText"`. VN-26 hides `text.rg-frame-label`. After that rewrite the selector matches nothing, so the original name stays. The overview caption is a second line, `{name} · {count}`, about 14px inside the same box. The original name sits on the top stroke. Resource-group boxes are most of the plate, so most boxes show both.

## Read first

- `archlucid-ui/src/lib/architecture/enhance-inventory-cluster-labels.ts` (`boldResourceGroupLabelText` sets `clusterLabelText`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts` (the hide selector)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs` (`text.rg-frame-label`, `g.azure-icon`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs` (`g.vnet-frame-caption`)

## What to build

Do this only for a frame that receives an overview caption. A frame that does not qualify stays as it is.

Hide the frame's own caption by structure, not by the class sanitize removes:

1. Every direct child `text` of that `g.rg-frame` or `g.vnet-frame`. That is the element whose class is `clusterLabelText` after sanitize, and `rg-frame-label` before it.
2. `rect.rg-frame-label-halo` and `rect.vnet-frame-label-halo` inside that frame.
3. The whole `g.vnet-frame-caption` inside that frame.
4. A direct child `g.azure-icon` of that frame. Do not hide `g.azure-icon` inside a `g.node`.

Add `diagram-overview-hidden` to those elements. Do not delete them. Removing the class when overview turns off must bring the original name back.

Do not hide `g.edge text.edge-label` or `g.edge-stub text`. Do not hide text in a frame that did not get a caption. Do not move boxes. Do not change the 18px frame floor, the 45% scale test, or the zoom floor.

## Tests

Extend `architecture-diagram-overview-captions.test.ts`.

1. A qualifying resource-group frame whose direct child text has class `clusterLabelText` gets `diagram-overview-hidden` on that text, and one `text.overview-caption`.
2. A frame under the 18px floor keeps `clusterLabelText` visible and has no overview caption.
3. An edge label stays visible.
4. Applying a painted scale of `0.5` removes the overview caption and removes `diagram-overview-hidden` from `clusterLabelText`.

## Acceptance criteria

- At a painted scale below 45%, a box tall enough for an overview caption shows `{name} · {count}` and does not also show its original frame name.
- A shorter box still shows its original name and no overview caption.
- At 45% and above, the overview captions are gone and the original frame names are back.
- Connector labels, stub chips, boxes, lines, click-focus, and the Show cross-group links checkbox stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `architecture-diagram-overview-captions.test.ts`. Do not run the full viewer file.
- No C# change is required. Skip `agent-compile-check.ps1` unless a C# file changes.
- Do not commit. Do not edit unrelated dirty files.
- Do not change `ComponentHorizontalGap`, `ComponentVerticalGap`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`, or the zoom clamp.
- Do not change the extractor.

## Done when

Zooming the Full subscription plate to 30% shows one name on each tall box. The name on the top stroke is gone. Zooming back to 45% or more restores that original name.
