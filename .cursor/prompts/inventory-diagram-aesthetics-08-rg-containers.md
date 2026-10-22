# IDA-08 — Pack by resource group and draw dashed containers

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-04 (content-sized cards). **Do not** implement nested VNet/subnet frames, undo sparse flatten, Graphviz-primary Full subscription, or IDA-09–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On **inventory-forest** canvases, nodes that share a non-empty `ArmResourceGroup` and have **two or more** members on this canvas are **packed together**, then enclosed in a **dashed rounded frame** labeled with that group. Those members **drop the per-node RG caption** (IDR-02 line) because the frame is the caption. Singleton groups keep the IDR card line and get **no** frame.

## Why

IDR printed the group on every card because forest packing is by **connected component**. Frames on that grid would overlap — that is **IDR-HOLD**. This prompt **is** the later layout wave IDR pointed at. Owner Full subscription still looks like a flat card dump; humans sketch Azure as boxes in boxes (subscription optional; **RG is the first frame**).

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` — component grid; ignores RG subgraphs except packing skip
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramComponentRowPlanner.cs` / `DiagramComponentBuilder.cs`
- `DiagramNode.ArmResourceGroup` / IDR caption
- `DiagramAst.Subgraphs` — may already list RGs; **do not** rely on Mermaid subgraphs (empty-box flatten). Pack from `ArmResourceGroup` strings.
- New files (each own file): `DiagramResourceGroupPacker.cs`, `DiagramForestResourceGroupFrameSvgEmitter.cs`
- Tests: forest renderer + new packer tests
- IDR-HOLD / `inventory-diagram-rg-caption-04-hold.md` — still forbids frames **from IDR chats**. This IDA prompt authorizes them.

**Do not** undo `FlattenSparseSubgraphs`. Executive / Network / Data / Identity may have few shared RGs; then this is a no-op (pairs of VNets with distinct RGs stay as today).

**Do not** draw a frame around the whole subscription as a second nested box in this prompt. Subscription node, if present, stays a card.

## What to build

1. Grouping:
   - Key = trimmed `ArmResourceGroup`; empty/null → **ungrouped** (no frame, keep IDR caption if any).
   - Only keys with **count ≥ 2** become groups.
   - Auto-generated / identical placeholder names: still group by string equality; do not invent display names.

2. Packing (forest placement, not Mermaid subgraphs):
   - Treat each RG group as a **super-cell**: run existing interior layout (TD / LR / hub-spoke) on **that group's nodes and the visible edges among them**.
   - Cross-RG visible edges remain; they route after positions exist (IDA-05). Place group cells with `ComponentHorizontalGap` / `ComponentVerticalGap` like today’s component grid. Ungrouped nodes are 1-node cells, same grid.
   - **Do not** draw overlapping frames: a node belongs to at most one RG cell.
   - Order cells: group size descending, then min `OrderKey`, then group name.

3. Frame SVG (`g.rg-frame`):
   - Rectangle around the union of member cards **plus 12 px pad**, `fill="none"` or fill `#f8fafc` at 0% — prefer `fill="#f1f5f9"` fill-opacity 0.5, `stroke="#94a3b8"`, `stroke-dasharray="5 4"`, `rx="8"`, `pointer-events="none"`.
   - Label at top-left **outside** the pad, `font-size="11"`, fill `#475569`, text = group name (wrap once if > max card width).
   - Frames in a layer **under** nodes and **under** edges, or under nodes but above the plate — nodes must remain clickable/selectable if they already are.

4. Captions:
   - `ResourceGroupLines` empty when the node is a member of a drawn frame.
   - Ungrouped / singleton: IDR-02 line remains.
   - `<title>` / `AccessibilityTitle` still includes ` · {rg}` (IDR-01) even inside a frame.

5. Tests:
   - Three nodes, two with `rg-app-prod`, one with `rg-data-prod`: **one** `g.rg-frame` whose title/text is `rg-app-prod`; the singleton has **no** frame and still shows the muted RG line; the pair has **no** muted RG `text` on the cards.
   - Frames do not overlap (AABB test with 0.5 px tolerance).
   - Owner-shape 11 VNets: if the fixture has no `ArmResourceGroup`, **0** frames and existing packing tests still pass.
   - Do **not** emit `subgraph alpack`. Do **not** change FlattenSparseSubgraphs tests.

6. Graphviz clusters: **out of scope**. PNG may lag until a later honesty prompt — mention residual in the session summary. Do not start DOT `subgraph cluster_` here.

## Acceptance criteria

- Full subscription forest with repeated RGs shows dashed labeled frames and no duplicate RG line on those cards.
- Singleton RGs unchanged (caption, no box).
- No overlapping frames. No nested VNet/subnet boxes.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** rewind sparse flatten. **Do not** pack-by-RG inside an IDR session leftover. **Do not** prefer Graphviz clusters for Full subscription.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramResourceGroupPacker|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramForestResourceGroupFrame'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
