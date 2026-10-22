# IDS-02 — Pack disconnected components when real edges exist

**Wave:** inventory-diagram-spacing (**IDS**). **Depends on:** none (backend-only; works with or without IDS-01). **Do not** implement IDS-01, IDS-03, or IDS-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When an inventory diagram has **real edges** but more than one connected component (peering pairs, a triple, isolates), those components must pack into a **viewport-shaped grid**. Real arrows stay visible and listed. Layout-only `~~~` links steer dagre between components. The zero-edge IDL-02 grid path stays unchanged.

## Why

Owner snapshot `bebca1ae-…`, Executive: **11 nodes · 6 edges · 0 subgraphs**. The six Edges-table rows are real `PEERS_WITH` / `peered` links (IDL-05). They are **not** the old n−1 chain.

`EnsureLayoutEdgesWhenEmpty` returns as soon as `CountVisible > 0`. Dagre then lays out a forest of small trees. Mermaid 11 `tight-tree` (until IDS-01) plus 48/56 spacing places those trees far apart — "resources and their connectors are too far apart."

Zero-edge snapshots already wrap via `DiagramPeerGridPlanner`. This prompt is the leftover for **sparse real topology**.

Owner-shape arithmetic (do not require this exact partition, but tests must use 11 nodes / 6 visible edges / 0 pre-existing subgraphs):

- 11 vertices, 6 edges ⇒ a forest (or a unicyclic graph). Typical: several 2-node peering pairs, one 3-node component, isolates.
- Component count > 1 ⇒ pack. Component count == 1 ⇒ leave dagre + IDS-01 spacing alone.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstLayoutEdgeBuilder.cs` — `EnsureLayoutEdgesWhenEmpty` (do not weaken its `CountVisible == 0` grid; add a **sibling** call)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramPeerGridPlanner.cs` — reuse `ResolveColumnCount` / `BuildGridLinks` on **component representatives**, not every node
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — call packer after `EnsureLayoutEdgesWhenEmpty`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstExecutiveLayoutSimplifier.cs` — flatten runs **before** packing; packing subgraphs must not be flattened later. Exempt `alpack-` / `Pack ` the same way `Region ` is exempt, in case flatten is invoked again
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` — subgraph + `~~~` emission
- `ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs` — `IsLayoutOnly`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramPeerGridPlannerTests.cs`

Mermaid compound-graph fact (comment in code): wrapping each component in a subgraph lets dagre treat the pair as one cluster; `~~~` between cluster representatives places clusters on a grid **without** colliding with the intra-component `-->` ranks.

## What to build

1. New static class `DiagramSparseComponentPacker` (own file):
   - `void Pack(DiagramAst ast)` — no-op when `ast.Nodes.Count <= 1`.
   - Build undirected adjacency from **visible** edges only (`DiagramEdgeVisibility.VisibleEdges`). Isolated nodes are 1-node components.
   - If the number of components is `<= 1`, return (IDL-02 already gridded the zero-edge case; a single connected graph should not be sliced).
   - If `ast.Subgraphs` already contains a **non-packing** subgraph (region / RG / subscription — anything whose id does not start `alpack-`), do **not** replace those frames. Instead, pack **inside each existing subgraph** the same way IDL-02 grids intra-subgraph peers: components computed from members + intra-subgraph visible edges; skip a subgraph that is already a single component.
   - Otherwise (flat graph, 0 subgraphs): wrap each component in a packing subgraph:
     - `SubgraphId` = `alpack-{index}` (sanitized, stable: sort components by min `OrderKey`, then min `NodeId`)
     - `Label` = a single space `" "` (Mermaid rejects empty labels; chrome is hidden)
     - Set `DiagramNode.SubgraphId` on members
   - Grid **representatives**: representative = the member with min `OrderKey` then `NodeId`. Call `DiagramPeerGridPlanner.BuildGridLinks` on a synthetic node list of representatives (or equivalent: `~~~` from `rep[i]` to `rep[i + columns]`). Every such edge `IsLayoutOnly = true`.
2. Call `DiagramSparseComponentPacker.Pack(ast)` from `DiagramAstFromGraphCompiler` **after** `EnsureLayoutEdgesWhenEmpty`. Comment the order: flatten → derived VM→VNet → zero-edge grid → sparse-component pack.
3. `FlattenSparseSubgraphs`: if every remaining subgraph id starts with `alpack-` **or** label starts with `"Pack "`, do not flatten packing chrome. Region exemption stays. Do not let a future flatten pass wipe `alpack-*` just because count ≥ 8.
4. `MermaidDiagramRenderer`: for subgraphs whose id starts with `alpack-`, after `subgraph …` / `end`, emit a Mermaid style line that removes cluster chrome (`fill:transparent,stroke:none` on that subgraph id — use the documented Mermaid `style` / `classDef` form that 11.17 actually paints; prove with a renderer unit test on the emitted text). Invisible `~~~` already exists (IDL-01).
5. Complexity / outline: packing `~~~` stays excluded (`IsLayoutOnly`). Visible `edgeCount` remains 6 for the owner-shape fixture. Outline Edges table still lists only `-->` / `peered` rows.
6. Tests (fail on master, pass after):
   - **Owner-shape:** 11 VNet nodes, 6 `PeersWith` edges, 0 region subgraphs. After compile: `CountVisible == 6`, packing subgraphs == component count (> 1), rendered Mermaid contains `~~~` **and** `-->|"peered"|` (or `-->|"PEERS_WITH"|` before normalize — assert the post-normalize `peered` label), `alpack-` subgraph ids, **no** extra visible edges.
   - **Zero-edge 11 nodes:** still IDL-02 5-column grid, **0** packing subgraphs (packer no-ops because `EnsureLayoutEdgesWhenEmpty` already added layout links and `CountVisible == 0` with one "component" of layout-only links — packer must use **visible** edges only, so 11 isolates ⇒ 11 components. **Do not double-pack.** Rule: if `CountVisible == 0`, packer returns immediately; IDL-02 owns that shape.
   - **Single connected graph** (11 nodes, 10 real edges in one component): 0 packing subgraphs, 0 new `~~~`.
   - **Region swimlanes:** 2 regions, 2 peering pairs in region A and 1 isolate in region B → pack inside A only; do not wrap over region frames; do not flatten `Region ` subgraphs.
   - Renderer: `alpack-0` emission includes transparent cluster style; outline parser test already ignores `~~~` (do not regress).

## Acceptance criteria

- Executive owner-shape: status strip still `11 nodes · 6 edges` (plus subgraph count reflecting packing clusters). Edges table still has the six peering rows. Canvas (once IDS-01/03 land) is a compact grid of small components, not a white sea.
- Network / Data / Identity forest-of-pairs get the same packer (no mode filter). Full Subscription with a large connected graph is unchanged.
- `MermaidDiagramComplexityAnalyzer` thresholds unchanged (layout links excluded).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change `flowchart TD` to `LR`. **Do not** drop peering edges. **Do not** touch `archlucid-ui` (cluster CSS is IDS-01; crop is IDS-03).
- **Do not** add elk or another layout engine.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, comments for the compound-graph / visible-vs-layout-only distinction. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramSparseComponentPacker|FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~MermaidDiagramRenderer'`. No full-solution build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
