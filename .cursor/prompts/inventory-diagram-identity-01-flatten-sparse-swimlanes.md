# IE-ID-01 — Flatten sparse Identity-mode swimlanes

**Wave:** inventory-diagram Identity (**IE-ID**). **Depends on:** IE-16, IE-UX-02, **IE-ND-03** (Network flatten already on trunk). **Do not** implement IE-ID-02 or IE-ID-03.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Identity mode must flatten sparse resource-group swimlanes the same way Executive, Data, and Network already do. A snapshot like the owner’s (18 managed-identity nodes, ~12 RGs, 14 subgraphs) must compile to a **flat** `flowchart TD` with those node labels — not a subscription cluster whose only children are one-node RG boxes.

## Why

Owner screenshot: Inventory diagrams → **Identity**, Render succeeded, 18 nodes / 17 edges / **14 subgraphs**, outline tables filled, **no painted diagram**.

`DiagramAstExecutiveLayoutSimplifier` comment already states Mermaid emits a canvas of mostly empty boxes when many RGs each hold one node. `ModeFlattensSparseSubgraphs` returns Executive | Data | Network. **IE-ND-03** added Network and said not to expand to Identity. Identity inventory is the same shape (one user-assigned identity per RG across many groups, nested under a subscription subgraph with no direct nodes). Nested `flowchart TD` plus IDV overlay then collapses the client canvas.

Do **not** change `flowchart TD` to LR. Flatten is the AST fix; IE-ID-03 is leftover viewport honesty.

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstExecutiveLayoutSimplifier.cs` (`SparseSubgraphFlattenThreshold = 8`, `ModeFlattensSparseSubgraphs`)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` (`DiagramMode.Identity` → `FilterByCategories(..., GraphTopologyCategories.Identity)`)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramSubgraphPlanner.cs` (subscription + `RG {name}`)
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` (`flowchart TD`, nested `subgraph`)
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs` (`managedidentity` / `authorization` → Identity)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs` (`Compile_network_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node`, `Compile_data_mode_keeps_resource_group_frames_when_few_swimlanes`, `Compile_full_subscription_does_not_flatten_sparse_swimlanes`)
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramReadabilityThresholds.cs` (`MaxSubgraphs = 64`)
- Index: `.cursor/prompts/inventory-diagram-identity-00-index.md`

## What to build

1. Include `DiagramMode.Identity` in `ModeFlattensSparseSubgraphs` (same `SparseSubgraphFlattenThreshold = 8`). Update the simplifier comment so a two-year developer sees Identity in the one-node-per-RG list with Executive / Data / Network. Rename the helper/file only if the type name would still read as “Executive excludes Identity”; a comment is enough if the type stays.
2. Tests modeled on the Data / Network sparse fixtures (must fail on current master, pass after):
   - 12 resource groups × one `Microsoft.ManagedIdentity/userAssignedIdentities` each. Derive category from `arm.type` (empty `GraphNode.Category`) so the test does not pre-stamp Identity.
   - Identity compile: node count 12, **subgraphs empty**, mermaid has **no** `subgraph` keyword, contains the identity labels, `flowchart TD`.
   - Few swimlanes (3 RGs) still keep RG frames (parity with `Compile_data_mode_keeps_resource_group_frames_when_few_swimlanes`).
3. Full Subscription must still **not** flatten (existing test). Do not add Security / Architecture / Resource Group to the flatten set unless you add a fixture that proves the same empty-box shape — default is **do not**.
4. Reuse `BuildSparseSingleNodePerResourceGroupGraph` (or a sibling) with identity ARM types. Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.

## Acceptance criteria

- Identity mode with many one-node RGs is a flat readable flowchart, not 12 empty RG boxes under a subscription cluster.
- `MaxSubgraphs` is not the reason a 12-MI Identity diagram is Partitioned.
- Network / Executive / Data flatten tests stay green.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** change category classification (Identity filter already returns nodes).
- **Do not** change UI viewer, IDV fit/zoom/overlay, or IE-ND-05 copy.
- **Do not** statically import mermaid.
- TB-645. Sentence case.
- Verification:
  ```bash
  dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'
  pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'
  ```
  Heartbeat every 8s if >15s. No full-solution build, no dev server, no `npm ci`.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Done when

- A 12-RG × one user-assigned-identity Identity compile has 12 nodes, 0 subgraphs, mermaid without `subgraph`, and those resource labels.
- Existing Full Subscription sparse test still contains `subgraph`.
