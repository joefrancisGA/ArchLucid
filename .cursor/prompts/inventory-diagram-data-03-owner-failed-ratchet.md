# IE-DD-03 — Owner Failed ratchet (emitter, validator, repairer)

**Wave:** inventory-diagram Data (**IE-DD**). **Depends on:** **IE-DD-01**. **May parallel IE-DD-02.** **Do not** implement Failed UX (04). Do **not** re-implement sparse flatten from scratch.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory Data mode for an owner-shaped graph (≈38 data-plane nodes, ~70 `CONTAINS` / `CONNECTS_TO` edges, many one-node RGs) must return **Succeeded** (or Partitioned only for true IE-17 size) with **non-empty mermaid**. Pipeline Failed withholds mermaid and is what the owner saw.

## Why

Owner screenshot: **Render failed · 38 nodes · 70 edges · 38 subgraphs**. Yellow **Diagram render failed for the selected mode.** Exports disabled. No outline.

Locked from the prompt-set diagnosis (2026-09-12, this checkout):

- Data flatten **already includes Data**. A 37-RG storage graph with 70 `CONNECTS_TO` edges compiles to **0 subgraphs** and pipeline **Succeeded**.
- An **unflattened** FullSubscription proxy of that graph is **37 / 70 / 38 and Succeeded**. Nested RG mermaid is not automatically invalid.
- Owner Failed is therefore a **live-specific emitted line** our validator rejected, and/or `MermaidDiagramDeterministicRepairer` dropping `IsLayoutOnly` so `~~~` never round-trips (IDL-01 leftover). Data with 70 **real** edges does not add layout links, but empty-relationship Data can.
- `MermaidDiagramStructuralValidator` accepts only flowchart / `subgraph` / `end` / `-->` / `[]` / `%%`. `~~~` is unrecognized. There is no validator test.
- Region exemption in `FlattenSparseSubgraphs` skips flatten for **any** mode if a subgraph label starts with `"Region "`. Data must not call `ApplyRegionSubgraphs`. Do not skip Data flatten because an RG name contains the word “region”.

Do **not** change `flowchart TD` to LR. Do not lower `MaxSubgraphs`.

## Context

- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramStructuralValidator.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramDeterministicRepairer.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramRenderPipeline.cs`
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstExecutiveLayoutSimplifier.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs` (`AddObservedParentChild` → `GraphEdgeTypes.Contains`)
- `ArchLucid.ArtifactSynthesis.Tests/MermaidDiagramRenderPipelineTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs`
- Index: `.cursor/prompts/inventory-diagram-data-00-index.md`

## What to build

1. Flatten ratchet: 37 resource groups × `Microsoft.Storage/storageAccounts` (empty Category). Data compile: 37 nodes, subgraphs empty, mermaid has **no** `subgraph` keyword. Few swimlanes (3 RGs) still keep RG frames. Region exemption must not fire on Data.
2. Pipeline ratchet matching owner counts as closely as practical:
   - GUID `CloudResourceId` node ids.
   - `%% al-type` / `al-rg` / `al-seed` comments.
   - `GraphEdgeTypes.Contains` parent-child between storage account and nested `blobServices` / container rows.
   - Enough extra `CONNECTS_TO` to approach ~70 visible edges.
   - Assert `RenderAsync` / `TryGetMermaidAsync` `mode=data` is **Succeeded**, mermaid non-empty, `NodeCount` matches, status is **not Failed**.
   - If this already passes on master, **keep the test** (regression).
3. Then add the case that currently fails:
   - Renderer output with `IsLayoutOnly` `~~~` must `TryValidate` **true**.
   - Repairer **must copy `IsLayoutOnly`** so `~~~` is not rewritten to `-->`.
   - Mixed AST: one labeled `CONTAINS` edge stays `-->`, layout links stay `~~~`, complexity `edgeCount` counts only visible edges.
4. If you can construct mermaid the Data path actually emits that `TryValidate` currently rejects, fix the validator to accept that **emitted** syntax (do not loosen it to accept garbage). Put the first unrecognized line in the test failure message.
5. Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. No `ConfigureAwait(false)` in tests.

## Acceptance criteria

- Owner-shaped Data compile is a flat readable flowchart (0 subgraphs) and pipeline Succeeded with mermaid.
- `~~~` inventory mermaid validates; repairer preserves `IsLayoutOnly`.
- Data cannot return Failed solely because the validator does not understand a line the renderer emits.
- Existing Data / Network / Identity flatten tests stay green.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** change UI Failed copy (IE-DD-04).
- **Do not** re-implement flatten as a new helper if `ModeFlattensSparseSubgraphs` already includes Data — assert and fix only if a fixture proves it skipped.
- **Do not** statically import mermaid.
- TB-645. Sentence case.
- Verification:
  ```bash
  dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~MermaidDiagramRenderPipelineTests|FullyQualifiedName~MermaidDiagramStructuralValidator'
  dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'
  pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'
  ```
  Heartbeat every 8s if >15s. No full-solution build, no `npm ci`.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Done when

- A 37-RG storage Data compile has 37 nodes, 0 subgraphs, mermaid without `subgraph`, and pipeline Succeeded.
- Layout-only `~~~` survives repair and validates.
- Owner Failed 38/70/38 cannot recur from “validator does not understand renderer output.”
