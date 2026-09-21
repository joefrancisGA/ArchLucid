# IDF-06 — Graphviz PNG resource-group cluster parity

**Wave:** inventory-diagram-frames (**IDF**). **Depends on:** IDF-03 (stroke/fill constants). **Do not** implement nested VNet clusters, `dot` as default, or IDF-07 beyond tests that land with this prompt.

Do not implement from the wave index. Implement only *What to build*.

## Goal

**Export PNG** (Graphviz `fdp` from `DiagramAstGraphvizDotEmitter`) draws resource-group containers with the **same packing rule and the same ink** as inventory-forest: one cluster per packed cell (count ≥ 2, `ArmResourceGroup`), 2 px solid `#64748b`, fill `#f1f5f9`, rounded. Forest remains the live canvas.

## Why

IDA-08 §6 left Graphviz out of scope. PNG is still `fdp -Tpng` from DOT. `ast.Subgraphs` are often **flattened** on Executive (`FlattenSparseSubgraphs`), so “emit existing `cluster_`” is a no-op. Packing must use `ArmResourceGroup` strings like `DiagramResourceGroupPacker.PartitionCells`, not leftover Mermaid subgraphs.

## Context

- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` — nested `subgraph cluster_*` from `ast.Subgraphs`; packing subgraphs already omitted
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` — PNG path emits DOT even when `layoutEngine` is `inventory-forest`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs` — reuse `PartitionCells` (global list is OK for DOT **if** you also split by connected component the same way the forest does — **must match IDF-01**: do not one-cluster a split RG)
- Style: `LightResourceGroupFrameStroke` / fill from IDF-03
- Tests: `DiagramAstGraphvizDotEmitterTests.cs`
- IDG-HOLD: no extractor DOT; `fdp` stays default

**Do not** switch the live canvas to Graphviz. **Do not** restore `alpack_*`. **Do not** emit a subscription outer cluster.

## What to build

1. When emitting DOT for inventory:
   - Compute framed cells with the **same** rules as forest (IDF-01 cell identity / component split).
   - For each framed cell, emit `subgraph cluster_<sanitized>` wrapping those node ids.
   - Cluster attrs: `style="rounded,filled"`, `color="#64748b"`, `penwidth=2`, `fillcolor="#f1f5f9"`, `fontcolor="#334155"`, `label=<group name>` (quote via existing `GraphvizIdEscaper`).
   - No `style=dashed` (solid, IDF-03).
   - Singleton / ungrouped nodes stay outside these clusters (IDR caption on the Graphviz HTML label is IDR-03 — do not remove).

2. If `ast.Subgraphs` still contains RG swimlanes **and** forest cells would duplicate them, **prefer ArmResourceGroup cells** for Full/Executive inventory PNG so flatten vs not-flatten cannot diverge. Do not emit empty clusters.

3. Tests:
   - Two nodes same RG → DOT contains `cluster_` and `penwidth=2` and `fillcolor="#f1f5f9"` and the group name as label; **no** `style=dashed` on that cluster.
   - Split-RG fixture (two components, same name) → **two** clusters, not one.
   - Singleton RG → **no** cluster for that name.
   - `NotContain cluster_alpack` still holds.
   - Owner-shape without `ArmResourceGroup` → no new clusters.

4. Residual: Graphviz `fdp` may place a cluster differently from forest. Honesty is **presence + ink**, not pixel-identical layout. Say so in the session summary.

## Acceptance criteria

- Download PNG of a multi-node RG shows a labeled rounded slate container.
- Split RGs do not become one PNG box around unrelated islands.
- Live canvas still `inventory-forest`.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDF-07 visuals. **Do not** default `dot`. **Do not** emit ARM `dependsOn`.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstGraphvizDotEmitterTests|FullyQualifiedName~DiagramResourceGroupPacker'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
