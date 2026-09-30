# VN-22 — Hide same-group likely lines until the checkbox is on

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** XC-01. Do not re-run VN-01 through VN-21 or XC-01 through XC-03.

## Goal

A same-group `likely · in` line stays off the inventory canvas until the reader turns on the existing "Show cross-group links" checkbox. Turning that checkbox on paints it again.

## Why

`DiagramCrossGroupFanOutCanvasExclusion.ShouldExclude` returns before the label check when both ends share a resource group. Cross-group `likely · applies` and `applies` stay off unless `IncludeCrossGroupFanOut` is true. A same-group `likely · in` still paints. Those guesses are the thin strokes through the VNet plate.

XC-01 kept the same-group guess on the canvas. This follow-on hides that canvas edge behind the same flag.

## Read first

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramCrossGroupFanOutCanvasExclusion.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (the `FilterCanvasEdges` call)
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` (`EmitVisibleEdges`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramCrossGroupFanOutCanvasExclusionTests.cs`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the checkbox labeled "Show cross-group links")

## What to build

Change the canvas filter only. Do not rewrite the diagram AST, the Mermaid text, or the extractor.

When `IncludeCrossGroupFanOut` is false, exclude an edge whose trimmed label `IsHiddenFanOutLabel` already matches (`applies`, or a label that starts with `likely ·`) and whose both ends have a resource group. Exclude it when the groups match and when they differ. An edge with a missing resource group on either end stays, as it does today.

When `IncludeCrossGroupFanOut` is true, paint those edges, including same-group `likely · in`.

Leave `private endpoint`, `used by`, peering, `connects`, and a bare `in` on the canvas. Leave the checkbox label, its test id, and the `includeCrossGroupFanOut` URL parameter as they are. Do not add a second checkbox.

The forest SVG and the Graphviz DOT emitter both call `FilterCanvasEdges`, so both canvases follow this rule. Seating already uses that filtered list. A guess no longer seats a resource group. A `private endpoint` edge and every other label that is not a hidden fan-out label still seat a group. Do not change VNet membership. `likely · in` stays outside membership.

Do not change neighborhood wrap, private-endpoint bundling, or click-focus.

## Tests

Update `DiagramCrossGroupFanOutCanvasExclusionTests`.

1. Default render of the two-resource-group fixture: the SVG contains `connects`. It contains neither `likely · in` nor `likely · applies`.
2. The same fixture rendered with `IncludeCrossGroupFanOut` true: the SVG contains `likely · in` and `likely · applies`.
3. `FilterCanvasEdges` with the flag false excludes the same-group `likely · in` edge and the cross-group `likely · applies` edge, and keeps the cross-group `connects` edge. With the flag true, all three edges remain.

Run `DiagramForestVnetFrameLayoutTests` as well. A cited `private endpoint` still seats its resource group beside the VNet.

## Acceptance criteria

- Same-group `likely · in` is absent from the default forest SVG.
- The existing checkbox paints that line again.
- `connects`, `private endpoint`, `used by`, peering, and a bare `in` stay on the default canvas.
- The checkbox label and the URL parameter stay as they are.
- Membership and the extractor stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramCrossGroupFanOutCanvasExclusionTests` and `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A default Full subscription plate no longer paints same-group `likely · in`, and checking "Show cross-group links" paints that line again.
