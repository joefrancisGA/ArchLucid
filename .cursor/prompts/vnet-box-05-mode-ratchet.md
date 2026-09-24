# VN-05 — Mode ratchet for VNet boxes

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not add a new visual in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-02. Prefer VN-03 and VN-04 first.

## Goal

Tests fail if a diagram mode draws a VNet box it should not draw, or drops a VNet box it should draw. Fix only a failure of those tests.

## Why

The box is a shared packer. Identity has no network nodes and must not grow an empty frame. Data flow keeps stage columns. Neighborhood must not import the rest of the subscription just to fill a box.

## Read first

- `ArchLucid.ArtifactSynthesis/Models/DiagramMode.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- Existing mode fixtures under `ArchLucid.ArtifactSynthesis.Tests/` (`DiagramMode.Identity`, `DiagramMode.DataFlow`, `DiagramMode.Data`, `DiagramMode.DependencyNeighborhood`, `DiagramMode.Network`, `DiagramMode.FullSubscription`)

## What to build

Add `DiagramForestVnetFrameModeTests`. Compile a small graph per mode through `DiagramAstFromGraphCompiler` (or a hand-built `DiagramAst` when the compiler needs a snapshot you cannot build in this session — say which, and keep the node filter obvious).

Assert:

| Mode | Assert |
|------|--------|
| `Network`, `FullSubscription`, `ResourceGroup` | A VNet with a cited same-group VM produces one `vnet-frame` |
| `Identity` | Identity-only nodes produce zero `vnet-frame` |
| `Data` | A VNet with only compute members produces zero `vnet-frame`. A VNet with a cited storage or data member produces one |
| `DataFlow` | Stage subgraph ids in the AST are unchanged. A VNet box may appear inside a stage. The canvas is not repacked as resource-group-first |
| `DependencyNeighborhood` | A VNet outside the hop-focus set is absent. The visible VNet, if it has a visible member, may have a box |

If a test fails, fix the packer or the mode filter so the row holds. Do not invent subnet frames, new icons, or a second layout engine. Do not change copy on the Diagrams page.

## Acceptance criteria

- One test class covers the rows above.
- A failure names the mode.
- No production change beyond what a failing row required.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameModeTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

Identity renders no VNet box, Data flow still has its stage ids, and Network still boxes a VNet that has a cited member.
