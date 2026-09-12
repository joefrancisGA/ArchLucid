# IDL-01 — Layout-only links are invisible and never counted as edges

**Wave:** inventory-diagram-layout (**IDL**). **Depends on:** none. **Do not** implement IDL-02–06.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When an inventory diagram mode has **zero real relationships**, the AST must not fabricate arrows. Any edge the compiler adds purely to steer dagre layout must be emitted as a Mermaid **invisible link** (`A ~~~ B`), excluded from the **Edges** outline table, and excluded from `edgeCount` in complexity metrics and the status strip.

## Why

Owner snapshot `bebca1ae-…`, Executive: "11 nodes · 10 edges". The snapshot has no VNet-to-VNet relationships. `DiagramAstLayoutEdgeBuilder.EnsureLayoutEdgesWhenEmpty` chains nodes in `OrderKey` order (ARM-id sort), the renderer emits `-->`, the client outline lists them as `From → To`, and the status strip counts them. A governance reviewer reads "vnet-eastus → vnet-edw-hi-dev" as connectivity that does not exist. Reproduced 2026-09-12 with a mocked API: the chain is exactly the ARM-id order.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstLayoutEdgeBuilder.cs` — `EnsureLayoutEdgesWhenEmpty`
- `ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs` — edge model (add a layout-only marker)
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` — `AppendEdges` (`-->` / `-->|label|`)
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramComplexityAnalyzer.cs` — `edgeCount`, `maxDegree`, `layoutEstimate`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramFallbackSetBuilder.cs` — fallback `edgeCount` summaries
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs` — existing `EnsureLayoutEdgesWhenEmpty` coverage
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts` — edge regex for the Edges table
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.test.ts`
- `archlucid-ui/src/lib/mermaid/strip-inline-mermaid-flowchart-comments.ts` — must not touch `~~~`

## What to build

1. Add `bool IsLayoutOnly` (init-only, default `false`) to `DiagramEdge`. `EnsureLayoutEdgesWhenEmpty` sets it `true` on every edge it creates. Keep the chain shape for this prompt (IDL-02 changes the shape); only the *kind* changes here.
2. `MermaidDiagramRenderer.AppendEdges`: layout-only edges emit `    {from} ~~~ {to}` (no label, no arrow). Real edges unchanged. Add a one-line comment for a two-year developer explaining that `~~~` is Mermaid's invisible link used only to steer dagre ranks.
3. `MermaidDiagramComplexityAnalyzer` (and anywhere else `ast.Edges.Count` feeds `edgeCount`, `maxDegree`, `crossSubgraphEdgeCount`, or fallback summaries): count only `!IsLayoutOnly`. Extract one static helper (e.g. `DiagramEdgeVisibility.CountVisible(IReadOnlyList<DiagramEdge>)`) in its own file and reuse it everywhere instead of repeating the filter.
4. Client outline parser: the edge regex must **not** match `~~~`. Add a test with a fixture containing both `-->` and `~~~` lines; only the `-->` edge appears in `outline.edges`.
5. Tests (must fail on current master, pass after):
   - Compiler: 11 unrelated topology nodes → `ast.Edges` all `IsLayoutOnly`, rendered Mermaid contains `~~~` and **no** `-->`.
   - Renderer: a mixed AST renders one `-->|"label"|` and one `~~~`.
   - Complexity analyzer: mixed AST reports `edgeCount == 1`.
   - Existing `EnsureLayoutEdgesWhenEmpty` tests updated to assert `IsLayoutOnly` rather than `-->`.
6. `MermaidDiagramStructuralValidator` / `MermaidDiagramDeterministicRepairer`: confirm neither rejects or rewrites `~~~` (add a passing test if there is any doubt).

## Acceptance criteria

- Executive render for a zero-relationship snapshot: status strip reads `11 nodes · 0 edges`, Edges table is empty, canvas shows nodes without arrows, dagre still stacks them (chain shape until IDL-02).
- Server PNG export and `.mmd` export contain `~~~`, not `-->`, for those links.
- No change to real-edge rendering, labels, or `%% al-*` metadata comments.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** change column/grid math (IDL-02) or any viewer code beyond the outline parser.
- **Do not** add a new NuGet or npm dependency.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, comments where a two-year developer would need them. No `ConfigureAwait(false)` in tests.
- TB-645 vocabulary. Sentence case.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~MermaidDiagramRenderer|FullyQualifiedName~MermaidDiagramComplexityAnalyzer'` and, from `archlucid-ui/`, `npx vitest run src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.test.ts`. No full-solution build, no dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
