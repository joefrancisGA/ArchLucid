# IDF-01 — Frame per packed cell, not per resource-group name

**Wave:** inventory-diagram-frames (**IDF**). **Depends on:** trunk (IDA-08 frames already on inventory-forest). **Do not** implement label-inside, stroke-width, fill, crop, Graphviz clusters, or IDF-02–07.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Each **packed resource-group cell** (IDA-08 `PartitionCells`: same trimmed `ArmResourceGroup`, **count ≥ 2**, inside **one** connected component) gets **its own** `g.rg-frame` whose AABB is the union of **that cell's** node cards plus today's 12 px pad. Frames of different cells **do not overlap** (AABB test, 0.5 px tolerance). The same group name **may** appear on more than one frame when that RG is split across disconnected components.

## Why

Owner 2026-09-16 Executive forest: several dashed boxes share one top-left corner and stretch across other groups. `PartitionCells` already packs per component. `ResolveFrameBounds` then re-groups **every** placement by name and takes one canvas-wide union — that is the overlap. IDA-08 required the AABB test; it was never written. There is no `DiagramResourceGroupPackerTests.cs`. Doubling stroke (IDF-03) on these unions would make the lie louder.

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs` — `PartitionCells`, `ResolveFrameBounds` (name union, `const double pad = 12.0d`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — `LayoutComponentInterior` iterates cells then `PlaceNodes`; `EmitSvg` calls `ResolveFrameBounds` on **all** placements
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs` — paint only; do not restyle
- Tests today: `DiagramForestLayoutSvgRendererTests.Render_frames_shared_resource_groups_and_suppresses_duplicate_captions` counts **one** frame for the pair and asserts caption suppression — keep that. Add packer tests this prompt asked for in IDA-08.
- IDA-08 / `.cursor/prompts/inventory-diagram-aesthetics-08-rg-containers.md` — pack-first, singleton = no frame

**Do not** merge disconnected components so a split RG becomes one island. Multiple frames with the same label are honest. **Do not** change `ComponentHorizontalGap` / `ComponentVerticalGap`. **Do not** add `stroke-width`.

## What to build

1. Carry **cell identity** through placement. Each framed cell needs a stable key that is **not** the RG name alone (component index + cell index, or a synthetic id). Put the key on a small record (own file if new type) used by both packer and renderer. A node belongs to at most one framed cell.

2. Replace name-wide `ResolveFrameBounds` with **per-cell** bounds:
   - Input: placements tagged with cell key + `GroupName`.
   - Skip cells with `GroupName` null/empty or member count < 2 (singletons stay IDR caption, no frame).
   - Pad remains **12 px** on all sides (named constant on the packer or `DiagramForestLayoutOptions` — IDF-04 will reuse it; do not invent a second pad).
   - Output: one `ResourceGroupFrameBounds` per framed cell, `GroupName` still the display label.

3. `EmitSvg` still paints `g.rg-frame` under nodes and edges. Label/stroke/fill stay IDA-08 (`5 4`, no `stroke-width`, label at `y - 4`).

4. Tests — **new** `ArchLucid.ArtifactSynthesis.Tests/DiagramResourceGroupPackerTests.cs` (own file):
   - **Split RG:** four nodes, two connected in `rg-app` (component A) and two connected in `rg-app` (component B), no edges between A and B → **two** frames, both labeled `rg-app`, AABBs **do not overlap** (0.5 px).
   - **Adjacent different RGs:** two framed cells in one component (`rg-a` pair + `rg-b` pair) → two frames, no overlap.
   - **IDA-08 triple:** two `rg-app-prod` + one `rg-data-prod` → **one** frame (`rg-app-prod`); singleton has no frame.
   - Helper: AABB overlap predicate used by the tests (own file if it is more than a one-liner).

5. Forest renderer test: keep existing caption-suppression case. Add a case that the split-RG fixture emits **two** `g.rg-frame` elements. Owner-shape 11 VNets with no `ArmResourceGroup` still emit **0** frames.

6. Do **not** emit `subgraph alpack`. Do **not** change FlattenSparseSubgraphs tests. Do **not** start DOT `cluster_`.

## Acceptance criteria

- Same `ArmResourceGroup` in two disconnected components → two non-overlapping frames, same label.
- Adjacent framed cells do not overlap.
- Singleton RGs unchanged.
- Paint style unchanged (IDF-03 owns ink).

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDF-02–07. **Do not** bump global component gaps. **Do not** nest VNet/subnet frames.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
