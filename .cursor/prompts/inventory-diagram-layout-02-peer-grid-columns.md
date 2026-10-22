# IDL-02 — Wrap unrelated peers into a viewport-shaped grid

**Wave:** inventory-diagram-layout (**IDL**). **Depends on:** IDL-01 (layout-only links exist and are invisible). **Do not** implement IDL-03–06.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A set of nodes with no relationships must lay out as a **grid** of roughly the viewport's aspect (about 2:1), not as one column (chain) or one row (no edges). Stay in `flowchart TD`; steer dagre with the invisible links from IDL-01.

## Why

Measured 2026-09-12 (mocked API, 11 VNets):

| Layout | viewBox | Fitted into 1166 × 558 | Label size |
|---|---|---|---|
| Chain (current) | 296 × 1250 | 123 × 520 | ~6 px |
| No links (dagre default) | 2772 × 105 | 1110 × 42 | ~7 px |
| 4-column grid via `~~~` | ≈1100 × 320 | 1110 × ~320 | ≥ 15 px natural |

The grid is the only shape whose aspect matches the canvas. Owner: "nodes are all stacked on one another … have a minimum node width".

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstLayoutEdgeBuilder.cs` — `EnsureLayoutEdgesWhenEmpty` (chain today)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompilerConstants.cs`
- `ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs` — `IsLayoutOnly` (IDL-01)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs`
- Mermaid semantics: in `flowchart TD` an edge `A ~~~ B` puts `B` one rank **below** `A`; nodes sharing a rank sit side by side. A grid with `c` columns is therefore links `node[i] ~~~ node[i + c]` for every `i` where `i + c < n`.

## What to build

1. New static class `DiagramPeerGridPlanner` (own file) with:
   - `int ResolveColumnCount(int nodeCount)` — `clamp(ceil(sqrt(nodeCount × 2)), 2, 6)`. Examples: 4 → 3, 11 → 5, 18 → 6, 40 → 6. Document the intent (target ~2:1 aspect; cap so labels stay ≥ natural size on a ~1100 px canvas). Constants live in `DiagramAstFromGraphCompilerConstants` (`PeerGridMinColumns = 2`, `PeerGridMaxColumns = 6`, `PeerGridAspectFactor = 2`).
   - `IReadOnlyList<DiagramEdge> BuildGridLinks(IReadOnlyList<DiagramNode> orderedNodes)` — layout-only edges `node[i] → node[i + columns]`. Order by `OrderKey`, then `NodeId` ordinal (same as today).
2. `EnsureLayoutEdgesWhenEmpty` delegates to `DiagramPeerGridPlanner.BuildGridLinks` instead of building a chain. Keep the guard (`Edges.Count > 0 || Nodes.Count <= 1` → return).
3. Apply the same planner **inside each subgraph** that contains ≥ `PeerGridMinColumns × 2` nodes and no intra-subgraph edges (Data / Network / Resource Group modes hit this shape). Add `EnsureLayoutEdgesWhenEmpty` overload or sibling `EnsureSubgraphGridLinks(DiagramAst)` called from the compiler after `FlattenSparseSubgraphs`. Skip subgraphs with any real edge touching a member node.
4. Tests (fail on master, pass after):
   - 11 unrelated nodes → 5 columns; links are exactly `{0→5, 1→6, 2→7, 3→8, 4→9, 5→10}`; all `IsLayoutOnly`; rendered Mermaid has 6 `~~~` lines and no `-->`.
   - 4 nodes → 3 columns, 1 link. 2 nodes → 2 columns, 0 links (no stacking of two peers).
   - Column-count table test for `{1,2,3,4,8,11,18,40}`.
   - Subgraph case: one RG subgraph with 6 unrelated nodes gets grid links; a subgraph with one real edge gets none.
5. Update the `DiagramAstLayoutEdgeBuilder` XML comment to say grid, not chain.

## Acceptance criteria

- Executive render for the owner-shape fixture (11 VNets, no relationships) compiles to 5 × 3 grid links; no arrows; `edgeCount` still 0 (IDL-01).
- Network / Data fixtures with intra-RG peers no longer produce a per-RG vertical stack.
- `MermaidDiagramComplexityAnalyzer` thresholds unchanged (layout links are excluded by IDL-01).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change `flowchart TD` to `LR`. **Do not** touch any `archlucid-ui` file.
- **Do not** add elk or another layout engine.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, comments for non-obvious dagre rank behavior. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramPeerGridPlanner|FullyQualifiedName~DiagramAstFromGraphCompilerTests'`. No full-solution build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
