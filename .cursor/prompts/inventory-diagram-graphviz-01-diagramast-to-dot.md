# IDG-01 — Emit Graphviz DOT from DiagramAst (fdp, not dot)

**Wave:** inventory-diagram-graphviz (**IDG**). **Depends on:** none (backend-only). **Do not** implement IDG-02–05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`DiagramAst` must serialize to valid Graphviz DOT that **`fdp`** can lay out: one node per `DiagramNode`, visible edges only as directed edges, subgraphs as clusters, layout-only edges omitted. Azure labels must be quoted/escaped. This prompt does **not** install Graphviz or change the UI.

## Why

Owner Executive snapshot: **11 nodes · 6 edges · 0 subgraphs**. Mermaid source has no spacing; dagre still paints a white sea. Graphviz `dot` is a layered ranker like dagre — **do not use `dot` as the default**. `fdp` packs disconnected peering pairs.

The PowerShell extractor is out of scope. DOT comes from `DiagramAst`, the same AST Mermaid already uses.

## Context

- `ArchLucid.ArtifactSynthesis/Models/DiagramAst.cs`
- `ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs` / `DiagramEdge.cs` / `DiagramSubgraph.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeVisibility.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramSparseComponentPacker.cs` — packing subgraphs may be present; Graphviz clusters from **real** region/RG subgraphs only. `alpack_*` is Mermaid-dagre chrome — **omit** packing subgraphs from DOT (fdp does not need them).
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` — label escape patterns to mirror, not copy Mermaid syntax
- `docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd` — locked 11/6 unlabeled export
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramSparseComponentPackerTests.cs` — do **not** restore `alpack_*` as required Graphviz input

## What to build

1. New types in **their own files** under `ArchLucid.ArtifactSynthesis/` (Graphviz folder, parallel to `Mermaid/`):
   - `IDiagramAstGraphvizDotEmitter` + `DiagramAstGraphvizDotEmitter`
   - `GraphvizDotEmitOptions` with `LayoutEngine` default `"fdp"`, `RankDir` unused for fdp (still emit `overlap=false`, `splines=true`, `outputorder=edgesfirst` as graph attributes).
2. `string Emit(DiagramAst ast, GraphvizDotEmitOptions? options = null)`:
   - `digraph Inventory {` (stable name).
   - Graph attrs: `layout=fdp;` (or document that the **process** chooses `-Kfdp` and omit `layout=` if both would conflict — pick one, comment why, test `fdp` accepts the file).
   - `node [shape=box, style=filled, fontname="DejaVu Sans"];` — no Azure icon pack in this prompt.
   - Each `DiagramNode`: `"{escapedId}" [label="{escapedLabel}"];` Use a dedicated `GraphvizIdEscaper` (own file) for IDs and labels (`"`, `\`, newlines). Never interpolate raw ARM names.
   - Visible edges only (`DiagramEdgeVisibility.VisibleEdges`). `IsLayoutOnly` / Mermaid `~~~` **must not** appear in DOT.
   - Edge labels: Graphviz `label="peered"` from `DiagramEdge.Label` when non-empty.
   - Subgraphs: only those **not** `DiagramSparseComponentPacker.IsPackingSubgraph`. Cluster id `cluster_{sanitized}` (Graphviz requires `cluster_` prefix for boxes). Nested `ParentSubgraphId` preserved. Empty label → a single space.
3. Do **not** invent ARM `dependsOn` edges. Do **not** call Azure. Do **not** read `.ps1` extractor output.
4. Tests (fail on master, pass after) in `ArchLucid.ArtifactSynthesis.Tests`:
   - Owner-shape: 11 VNet nodes, 6 visible edges (unlabeled **or** `peered`), 0 or N packing subgraphs → DOT contains 11 node statements, **6** `->` lines, **zero** `alpack_`, **zero** layout-only pairs.
   - Quote/escape: node id or label containing `"`, `/`, spaces, and a hyphenated VNet name.
   - Packing subgraphs on the AST are skipped; a `Region ` subgraph is emitted as `subgraph cluster_…`.
   - Empty AST / single node still valid DOT (`digraph` + one node, no edges).
   - Golden: an AST with the owner fixture’s 11 labels + 6 unlabeled edges produces 6 `->` lines and 11 `label=` node stmts.
5. No Docker, no `fdp` invocation, no OpenAPI, no UI.

## Acceptance criteria

- Unit tests prove DOT is a pure function of `DiagramAst` + options.
- Owner-shape DOT is a forest of 6 peering edges, not an n−1 chain and not ARM `dependsOn`.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** change `MermaidDiagramRenderer` output. **Do not** retune `architecture-diagram-mermaid-config.ts`.
- **Do not** add NuGet Graphviz wrappers — string emit only.
- C#: concrete types, LINQ, blank line before `if`/`foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~GraphvizDot'`
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the test run exceeds 15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
