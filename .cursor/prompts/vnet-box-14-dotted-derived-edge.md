# VN-14 — Accept dotted derived connectors in Mermaid validation

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new VN in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-13 is already in the tree. Do not re-run VN-01 through VN-13. Do not edit the customer extractor or the hosted collector. Do not change placement membership, backbone keep, the repairer, or the forest renderer.

## Goal

A Full subscription diagram that contains a derived NIC connector validates and reaches forest layout. The connector stays a dotted Mermaid arrow.

## Why

`Hmd_HI_HAP_Non_Prod` snapshot `9/29/2026, 13:33 UTC`, diagram type Full subscription, returned status `Failed`. VN-13 printed the reason. The reason is a run of lines like:

`n_f83ba737c36b8cdb -.->|"Derived · via NIC: vm-bam-dev-01-nic-01 (NIC vm-bam-dev-01-nic-01)"| n_676a3a32ced429b2`

The same shape appears for `vm-bam-ppd-01-nic-01`, `vm-bam-test-01-nic-01`, and an AVD derived connector. The structural validator reports each one as `Unrecognized Mermaid line`.

`MermaidDiagramRenderer.ResolveVisibleEdgeArrowToken` writes `-.->` for a `DerivedFact` edge. `MermaidDiagramStructuralValidator.IsDirectedEdge` returns true only when the line contains `-->`. The character sequence `-.->` does not contain `-->`, so a labeled dotted arrow fails validation. `MermaidDiagramRenderPipeline` then returns `Failed` and `TryRenderInventoryLayoutAsync` does not call the forest renderer.

The forest renderer is already the picture. This session lets that picture run. It does not replace the renderer and it does not turn derived connectors into solid arrows.

## Read first

- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramStructuralValidator.cs`
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` (`AppendEdges`, `ResolveVisibleEdgeArrowToken`)
- `ArchLucid.ArtifactSynthesis/DiagramEdgeVisualKindResolver.cs`
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramRenderPipeline.cs` (structural failure returns `Failed`)
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` (`TryRenderInventoryLayoutAsync` runs for `Succeeded` and `Partitioned`)
- `ArchLucid.ArtifactSynthesis.Tests/MermaidDiagramStructuralValidatorTests.cs`

## What to build

Teach `IsDirectedEdge` to accept a dotted arrow.

- A line that contains `-->` stays valid.
- A line that contains `-.->` is valid, including `from -.->|"Derived · via NIC: vm-bam-dev-01-nic-01 (NIC vm-bam-dev-01-nic-01)"| to`.
- `~~~` stays valid.
- A line that is not a node, a subgraph, a comment, a solid arrow, a dotted arrow, or an invisible link stays unrecognized.
- Leave `ResolveVisibleEdgeArrowToken` on `-.->` for Declared, Probable, AiInferred, and Inferred edges.
- Do not change forest layout, VNet membership, peel thresholds, or `failureReason`.

## Tests

Extend `MermaidDiagramStructuralValidatorTests`.

1. This flowchart validates with no errors:

```text
flowchart TD
    n_vm["vm-bam-dev-01"]
    n_nic["vm-bam-dev-01-nic-01"]
    n_vm -.->|"Derived · via NIC: vm-bam-dev-01-nic-01 (NIC vm-bam-dev-01-nic-01)"| n_nic
```

2. `TryValidate_accepts_invisible_layout_links` still passes.
3. A flowchart whose only edge line is `n_a ??? n_b` is invalid, and the error still says `Unrecognized Mermaid line`.

## Acceptance criteria

- A derived NIC connector written as `-.->|"label"|` passes structural validation.
- Solid arrows and invisible layout links still pass.
- An unknown line still fails.
- The forest renderer, the extractor, and the arrow token for derived edges stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `MermaidDiagramStructuralValidatorTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

The Full subscription Mermaid that contains `vm-bam-dev-01-nic-01` as a dotted derived connector is structurally valid, so forest layout is allowed to draw that diagram.
