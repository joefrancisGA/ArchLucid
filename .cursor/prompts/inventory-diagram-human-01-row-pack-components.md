# IDH-01 — Row-pack disconnected components; delete packing subgraphs

**Wave:** inventory-diagram-human (**IDH**). **Depends on:** none (backend-only). **Do not** implement IDH-02 or IDH-03.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When an inventory diagram has **real visible edges** and more than one connected component, emit layout-only `~~~` links that pack those components into a **viewport-shaped TD grid**. Do **not** wrap components in subgraphs. Real arrows stay visible and counted. The zero-edge IDL-02 grid is unchanged.

## Why

The owner export (`docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd`) is 11 nodes, 6 unlabeled `-->`, 0 subgraphs. Mermaid 11.17.2 already paints that file as a 5-column TD forest (1128×208, all nodes in a 1180 px viewport).

IDS-02 `DiagramSparseComponentPacker` wraps each component in `alpack_*`. Mermaid 11 `extractor` then lays each **edge-free** subgraph out **LR** with hard-coded 50/50 spacing. The same 11/6 graph becomes 2038×304, fitScale 0.73, horizontal scroll. `ResolveColumnCount(5)` is 4, so only one head→head `~~~` is emitted — not a grid.

A human reads this snapshot as **columns of peered VNets**, about three columns, not a single wide rank of sideways pairs.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramSparseComponentPacker.cs` — rewrite; keep `Pack` as the compiler hook
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramPeerGridPlanner.cs` — keep for **zero-edge** IDL-02; do **not** call `BuildGridLinks` on component heads for this forest
- New: `ArchLucid.ArtifactSynthesis/Compilers/DiagramComponentRowPlanner.cs` (own file)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — `Pack` still runs after `EnsureLayoutEdgesWhenEmpty`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstExecutiveLayoutSimplifier.cs` — remove the “do not flatten packing subgraphs” special case once `alpack_*` is gone
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` — remove `style alpack_… fill:transparent`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — **do not** touch in this prompt except if a comment cites `alpack` CSS; leave CSS removal to IDH-02 if that is the only UI line. Prefer **no UI edits** here.
- `ArchLucid.ArtifactSynthesis.Tests/DiagramSparseComponentPackerTests.cs`
- Owner fixture path above. Components and edges in that file are the golden topology.

Mermaid 11 fact (comment in the packer): **do not** use subgraphs to “cluster” components. Subgraphs without external edges flip to LR. Invisible `~~~` between a previous-row **sink** and the next-row **heads** keeps `flowchart TD` and aligns columns.

## What to build

1. `DiagramComponentRowPlanner` (static, own file):
   - `ResolveColumnCount(int componentCount)`: `clamp(ceil(sqrt(componentCount)), 2, 4)` when `componentCount > 1`. **Not** `PeerGridAspectFactor` (that yields 4 columns for 5 components). For the owner forest (5 components) this is **3**.
   - `BuildAlignmentLinks(IReadOnlyList<IReadOnlyList<DiagramNode>> components, IReadOnlyList<DiagramEdge> visibleEdges)`:
     - Sort components: node count descending, then min `OrderKey`, then min `NodeId`.
     - Chunk into rows of `ResolveColumnCount`.
     - **Head** of a component = min `OrderKey` then `NodeId` (same as today).
     - **Sink** of a component = a node with no **outgoing visible** edge inside the component; if several, max `OrderKey` then `NodeId`. The owner triple's sink is `vnet-eastus-1`.
     - For each column `c` and consecutive rows `r`, `r+1`: if both rows have a component at `c`, add `IsLayoutOnly` `~~~` from `sink(row[r][c])` to `head(row[r+1][c])`.
     - If row `r+1` has leftover components (last row shorter), also `~~~` from the last sink of row `r` to each leftover head (keeps them on the next rank, not a new disconnected island).
     - Return those layout edges only. Do not add visible edges.
   - Unit-test the owner 5-component partition: 3 columns, at least two `~~~` from `n_d2ba58cce1311fbe` (eastus-1) or the compiled mermaid id for that node. Do not require that exact sanitized id if the compiler hashes ids — assert via labels after render or via `SeedNodeId`.

2. Rewrite `DiagramSparseComponentPacker.Pack`:
   - No-op when `ast.Nodes.Count <= 1`.
   - No-op when `DiagramEdgeVisibility.CountVisible == 0` (IDL-02 owns that shape).
   - Build undirected components from **visible** edges only. Isolates are 1-node components.
   - No-op when component count `<= 1`.
   - **Never** add packing subgraphs. Do not set `node.SubgraphId` for layout. Do not add `alpack_*` rows.
   - If non-packing subgraphs already exist (region / RG): do not replace those frames. Inside each existing subgraph that contains more than one visible component, run `BuildAlignmentLinks` on that subgraph's members only.
   - Otherwise (flat graph): `ast.Edges.Add` each alignment link.
   - Delete `WrapComponentsInPackingSubgraphs`, `IsPackingSubgraph` (or keep `IsPackingSubgraph` as `return false` / obsolete only if tests still need a symbol — prefer delete + fix call sites).

3. Compiler order stays: flatten → derived VM→VNet → zero-edge grid → sparse-component pack.

4. Tests (fail on master IDS-02 behavior, pass after):
   - **Owner-shape graph** (existing `BuildExecutiveOwnerShapePeeringGraph` or a new builder that matches the fixture's six peerings): after compile+render: `CountVisible == 6`, **0** subgraphs (or only non-packing if the test graph has regions), mermaid contains `~~~` and six visible `-->` (unlabeled or `|"peered"|`), mermaid does **not** contain `subgraph alpack` or `style alpack_`.
   - **Zero-edge 11 nodes:** 0 packing subgraphs, IDL-02 `~~~` grid only, packer no-op.
   - **Single connected graph** (10 real edges): 0 new `~~~` from the row planner.
   - **Region swimlanes:** pack inside a region; do not wrap over `Region ` frames.
   - Renderer: no transparent `alpack` style line.

## Acceptance criteria

- Compiling the owner-shape Executive graph does **not** emit `alpack_*`. Status strip stays `11 nodes · 6 edges` (subgraph count 0 for the flat owner forest).
- Rendered mermaid for that graph, painted with current viewer init, has aspect **≤ 2.5** (the measured row-pack is ~2.0). Do not require a browser in this prompt; a renderer unit test that the `~~~` set matches the planner is enough. IDH-03 owns the browser number.
- Network / Data / Identity forests get the same packer (no mode filter).

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change `flowchart TD` to `LR`. **Do not** drop peering edges. **Do not** reintroduce packing subgraphs with `direction TB`.
- **Do not** add elk. **Do not** touch `archlucid-ui` except deleting `alpack` CSS if you must to compile comments — prefer IDH-02.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramSparseComponentPacker|FullyQualifiedName~DiagramComponentRowPlanner|FullyQualifiedName~MermaidDiagramRenderer'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
