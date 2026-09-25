# XC-01 — Hide cross-group fan-out edges by default

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not add gutters or a new router in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_EDGE_CROSSING_LUNA_PROMPTS.md`

## Goal

On the inventory forest canvas, edges that leave their resource group and are labeled `applies` or `likely · …` stay off the drawing until the operator asks for them. Edges whose two ends sit in the same resource group still draw. A checkbox on the Diagrams page turns the hidden set back on.

## Why

Full subscription on `Hmd_HI_HAP_Non_Prod` draws 134 edges across 244 cards. The lines that cut through unrelated cards are the long ones: `likely · applies` and `likely · connected to` from one resource group to another. `DiagramForestOrthogonalEdgeRouter` already treats other cards as obstacles, then draws the first elbow anyway when no short path is clear. Removing those edges is the shrink. The router stays as it is.

## Read first

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs` (`applies`, `connects`)
- `ArchLucid.ArtifactSynthesis/DiagramEdgeProvenanceDisplayLabelBuilder.cs` (`likely ·`)
- `ArchLucid.ArtifactSynthesis/Models/DiagramAstCompileOptions.cs` (`IncludeRecoveryServices`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`EmitSvg`, the loop that calls `DiagramForestOrthogonalEdgeRouter.Route`)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (Display options, `includePrivateEndpointNodes`, `includeRecoveryServices`)

## What to build

Add `IncludeCrossGroupFanOut` on `DiagramAstCompileOptions`, default `false`. Thread it the same way `IncludeRecoveryServices` is threaded from the Diagrams workbench into the compile request.

When the flag is false, drop an edge from the forest edge list when both are true:

- The two ends have different `ArmResourceGroup` values.
- The display label is `applies`, or it starts with `likely ·`.

Keep every other edge, including same-group `likely · in`, same-group `connects`, and peering. Do not drop the edge from the AST stored for Ask. Drop it only from the edges the forest paints and that Graphviz PNG exports. Mermaid export uses the same filtered list when a fixture already asserts forest and Mermaid together.

Diagrams page, Display options, beside **Show private endpoints** and **Include backup and recovery**:

- Checkbox label: `Show cross-group links`
- `aria-label` and `data-testid`: `infra-diagrams-show-cross-group-links`
- Unchecked by default.
- Helper line stays one sentence and names the new default: private endpoints, backup/recovery, and cross-group `applies` / `likely` links are hidden until the operator includes them.

Do not change `DiagramForestOrthogonalEdgeRouter`. Do not reorder resource groups. Do not add a gutter.

## Tests

Extend `ArchLucid.ArtifactSynthesis.Tests`.

1. Two resource groups. A same-group `likely · in` edge is in the SVG. A cross-group edge labeled `likely · applies` is absent. A cross-group edge labeled `connects` with no `likely ·` prefix is still present.
2. The same fixture with `IncludeCrossGroupFanOut` true paints the `likely · applies` edge.
3. Workbench test: the checkbox is unchecked on first render, and checking it sends the flag.

## Acceptance criteria

- Default Full subscription SVG has no cross-group `applies` or `likely ·` edge.
- Same-group edges still render.
- The checkbox is the only new control.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new tests and the existing forest renderer tests that cover edge paint.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

The default canvas keeps in-group links and omits the cross-group `applies` / `likely` lines that were cutting through other cards.
