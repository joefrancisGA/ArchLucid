# VN-28 — Make 30% overview a hierarchy-only map

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-27. Do not re-run VN-01 through VN-27.

## Goal

At 30% zoom and below, the forest is a hierarchy map, not a miniature detail diagram. Show one readable identity for each useful neighborhood. Do not paint a second nested-frame identity or tiny edge/card text in the same neighborhood. At more than 30% and below 45%, retain the VN-26 overview behavior. At 45% and above, restore the normal diagram.

## Diagnosis

VN-27 fixed the old frame-name duplicate: the resource-group name had been rewritten to `clusterLabelText`, so VN-26's `rg-frame-label` selector missed it. The current screenshot is a different failure.

At 30%, VN-26 adds an overview caption to every qualifying `g.vnet-frame` and every qualifying `g.rg-frame`. A VNet-primary neighborhood therefore gets both the VNet caption and its containing resource-group caption. They are two different frame names, but they occupy the same small area and read like duplicate labels. The screenshot also still shows small text from connector/stub chips and from cards or frames that did not qualify for a caption. The result is a column of tiny names and colored marks, not a scanable subscription map.

## Read first

- `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (`applyMermaidViewportCamera` and the overview threshold class)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs` (VNet, subnet, and subscription frame kinds)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (frame bounds and forest layer order)
- `archlucid-ui/src/lib/architecture/architecture-diagram-click-focus.ts`

## What to build

Add a second semantic-zoom threshold:

```ts
export const DIAGRAM_OVERVIEW_HIERARCHY_MAX_SCALE = 0.30;
```

Use the painted scale already measured after CSS sizing. The boundary is inclusive: hierarchy mode is on when `paintedScale <= 0.30`. The existing overview mode remains on for `0.30 < paintedScale < 0.45`.

When hierarchy mode is on:

1. Keep the existing `g.overview-captions` layer and the 18px frame-height rule.
2. Keep captions for `g.vnet-frame`.
3. For `g.rg-frame`, add a caption only when that resource-group frame contains no qualifying VNet frame. A VNet-primary neighborhood gets the VNet identity, not a second resource-group identity. A standalone resource group still gets its RG caption.
4. Skip `subscription-frame` and `subnet-frame` as before.
5. Hide all `g.node text`, regardless of whether the node is inside a qualifying frame.
6. Hide all `g.edge text.edge-label` and `g.edge-stub text`. Keep their paths and click targets. Click-focus must still work from a stub's group.
7. Hide every original frame caption, halo, and frame icon for any frame that has a displayed overview caption. A frame without a displayed caption keeps its original name only when it is not hierarchy mode; in hierarchy mode hide all frame-name text and halos so unqualified tiny labels do not leak into the map.
8. Do not hide the SVG paths, node rectangles, frame strokes, arrows, or the existing `Show cross-group links` behavior.

When `0.30 < paintedScale < 0.45`, keep VN-26 behavior: qualifying VNet and RG frames may both show captions, qualifying frame members hide their card text, and connector labels remain visible.

When `paintedScale > 0.30`, remove hierarchy-only classes. At exactly `0.30`, hierarchy mode remains active. At `0.45`, all overview captions and hidden classes are removed.

Do not create a second camera or change the SVG layout. This is a presentation-only semantic-zoom pass.

## Tests

Extend `archlucid-ui/src/lib/architecture/architecture-diagram-overview-captions.test.ts`:

1. Painted scale `0.30` is hierarchy mode; `0.3001` is not.
2. A VNet frame nested inside an RG frame produces one caption in hierarchy mode: the VNet caption. A standalone RG frame still gets one RG caption.
3. In hierarchy mode, node text, an edge label, and a stub chip have `diagram-overview-hidden`, while their paths remain in the SVG.
4. In ordinary overview mode at `0.4`, connector labels remain visible and both qualifying VNet/RG captions are allowed.
5. At `0.45`, captions and all overview/hierarchy classes are removed.

## Acceptance criteria

- At 30% or below, one neighborhood does not show both its VNet and containing RG names.
- At 30% or below, no tiny card, connector, stub, short-frame, or original-frame label text remains to compete with the overview captions.
- At 30% or below, paths, frame strokes, arrows, click-focus, and the Show cross-group links checkbox still work.
- Between 30% and 45%, VN-26 behavior remains unchanged.
- At 45% and above, the normal diagram returns.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `architecture-diagram-overview-captions.test.ts`. Do not run the full viewer file.
- No C# change is required. Skip `agent-compile-check.ps1` unless a C# file changes.
- Do not commit. Do not edit unrelated dirty files.
- Do not change `ComponentHorizontalGap`, `ComponentVerticalGap`, `MERMAID_VIEWPORT_MIN_FIT_SCALE`, or the zoom clamp.
- Do not change the extractor.

## Done when

At 30% zoom, the Full subscription screenshot reads as a clean hierarchy map: one name per useful neighborhood, no tiny detail labels, and the existing lines and click behavior still available. Zooming above 30% brings back the VN-26 overview detail, and 45% restores the normal diagram.
