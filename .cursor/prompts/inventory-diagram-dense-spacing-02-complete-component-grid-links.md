# IDT-02 — Complete invisible grid links between packing components

**Wave:** inventory-diagram-dense-spacing (**IDT**). **Depends on:** IDS-02 on trunk. **Do not** implement IDT-01, IDT-03, IDT-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When `DiagramSparseComponentPacker` wraps disconnected peering components in `alpack_*` subgraphs, **steer dagre with a full viewport-shaped grid** of layout-only `~~~` links between component representatives — not a single vertical link.

## Why

Owner-shape Executive: **11 nodes, 6 edges, 5 packing components**. `DiagramPeerGridPlanner.BuildGridLinks` with `ResolveColumnCount(5) = 4` emits **one** link: `rep[0] ~~~ rep[4]`. The zero-edge 11-node case uses **5 columns** and **six** `~~~` links — a real 2D grid.

One rank-break cannot place five `alpack_*` clusters side by side with short horizontal gaps. Dagre spreads compound subgraphs across the plate; the owner sees "nodes too far apart" even after IDS-01 spacing and node-union crop.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramSparseComponentPacker.cs` — `AppendRepresentativeGridLinks`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramPeerGridPlanner.cs` — `BuildGridLinks`, `ResolveColumnCount`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramSparseComponentPackerTests.cs`
- `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts` — `elevenVnetSparsePeeringMermaid()` golden string must be regenerated from renderer output after this change

## What to build

1. Extend `DiagramPeerGridPlanner` (or a sibling helper in its own file if cleaner) with **`BuildDenseGridLinks`** for component representatives:
   - Keep existing **column** links: `index → index + columns` (vertical in `flowchart TD`).
   - Add **row** links within each row: for each `index` where `(index % columns) < columns - 1` and `index + 1 < count`, add `index → index + 1` as `IsLayoutOnly = true`.
   - Deduplicate edges (same from/to) before adding to AST.
   - Comment: horizontal `~~~` steers same-rank placement; vertical `~~~` steers rank breaks — together they match IDL-02's zero-edge grid density.
2. `DiagramSparseComponentPacker.AppendRepresentativeGridLinks` calls the dense builder instead of `BuildGridLinks` only.
3. For **small component counts** (≤ `PeerGridMaxColumns`), consider capping columns at `min(ResolveColumnCount(n), n)` so a 5-component forest uses **3** columns (2 rows) instead of 4 columns (1 row + orphan) — document the rule in a comment; prefer `ceil(sqrt(n))` clamped to `[PeerGridMinColumns, min(PeerGridMaxColumns, n)]` if it yields more grid links.
4. Tests:
   - Owner-shape: rendered Mermaid contains **≥ 4** `~~~` lines (was 1), still **6** `-->|"peered"|`, still **5** `alpack_` subgraphs, `CountVisible == 6`.
   - Zero-edge 11-node path unchanged (packer no-ops).
   - Single connected graph unchanged.
5. Regenerate `elevenVnetSparsePeeringMermaid()` in the e2e fixture from `MermaidDiagramRenderer.Render` on the owner-shape AST (copy golden snippet in comment). IDT-03 depends on this.

## Acceptance criteria

- Owner-shape Mermaid has a mesh of `~~~` between representatives, not one link.
- No extra visible edges in outline or metrics.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** touch `archlucid-ui` except the e2e fixture golden string (required for IDT-03).
- **Do not** drop peering edges. **Do not** change `flowchart TD` to `LR`.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramSparseComponentPacker|FullyQualifiedName~DiagramPeerGridPlanner'`
