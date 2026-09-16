# IDLC-03 — Graphviz cluster titles sit above the first member

**Wave:** inventory-diagram-label-collision (**IDLC**). **Depends on:** none (backend DOT). **Do not** implement IDLC-01, 02, or 04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory Graphviz DOT clusters must emit an explicit **top-left title** and **margin** so `fdp` SVG / PNG (fallback canvas and `TryRenderInventoryPngAsync`) do not draw `label=` on the first node. Forest remains the preferred live canvas; this prompt is PNG + Graphviz fallback honesty.

## Why

`DiagramAstGraphvizDotEmitter` writes `subgraph cluster_* { label=…; }` with no `labelloc`, `labeljust`, or `margin`. Graphviz defaults put the title in the cluster header with little inset. Download PNG for `inventory-forest` / `graphviz-fdp` still goes through this DOT. IDLC-01/02 only fix client-sanitized SVG.

## Context

- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` — `EmitSubgraphTree` cluster header
- `ArchLucid.ArtifactSynthesis/Graphviz/GraphvizDotEmitOptions.cs` — add options only if tests need a seam; default must be on
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstGraphvizDotEmitterTests.cs` — `Emit_skips_packing_subgraphs_and_emits_region_clusters`
- Do **not** emit packing `alpack_*` clusters (already skipped)
- Do **not** change HTML node labels (IDR-03 RG line stays)

## What to build

1. For each **renderable** cluster (`cluster_` + sanitized id), after `label=`:
   - `labelloc=t;`
   - `labeljust=l;`
   - `margin="18,12";` (or equivalent Graphviz cluster margin large enough for one 11–12pt title line). If a named constant is clearer, put it on `GraphvizDotEmitOptions` with those defaults.
   - Keep skipping `DiagramSparseComponentPacker.IsPackingSubgraph`.
   - Whitespace-only labels may stay `" "` as today; still emit labelloc/margin so fdp does not collapse the header onto the node.
2. Tests in `DiagramAstGraphvizDotEmitterTests`:
   - `Emit_skips_packing_subgraphs_and_emits_region_clusters` (or a new fact): DOT for `Region eastus` contains `labelloc=t`, `labeljust=l`, and `margin=` with the chosen values; still contains `subgraph cluster_`; still omits `alpack_`.
   - Owner-shape executive emit test still has 11 nodes / 6 peering edges / no `~~~`.
3. No UI. No mermaid config. No forest emitter.

## Acceptance criteria

- Region (or RG) cluster DOT has an explicit top-left title and margin.
- Packing subgraphs remain omitted.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
