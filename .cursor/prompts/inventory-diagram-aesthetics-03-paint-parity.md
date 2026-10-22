# IDA-03 — Mermaid, Graphviz, and PNG use the same card language

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-01 + IDA-02. **Do not** implement content-sized cards, orthogonal edges, RG frames, or IDA-04–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Workbench canvas, client Mermaid fallback, Graphviz DOT/`-Tpng`, and CLI Mermaid config all show **neutral cards** (IDA-01). Graphviz HTML labels used for inventory PNG get a **kind color cell** so Download PNG is not a liar relative to forest accent bars. Paint never clobbers pictogram, accent, or edge-label chips.

## Why

`TryRenderInventoryPngAsync` still renders Graphviz HTML for `inventory-forest` PNGs. IDA-01/02 can make the SVG honest and the PNG a honey-or-plain-white liar. `paintArchitectureDiagramNodePalette` is the other liar if any remaining selector hits `g.node circle`.

## Context

- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` — `fillcolor` / `color` / `fontcolor` from palette (should already be IDA-01)
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramGraphvizHtmlNodeLabel.cs` — `<B>name</B><BR/>(type)<BR/>rg`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryPictogramKindResolver.cs` — ARM type → kind
- `ArchLucid.Application/Diagrams/ArchitectureDiagramMermaidCliConfigWriter.cs`
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts`
- Tests: `DiagramGraphvizHtmlNodeLabelTests`, `DiagramAstGraphvizDotEmitterTests`, `architecture-diagram-svg.test.ts`

Mermaid flowcharts cannot grow a true 4 px SVG bar without HTML labels (forbidden: `htmlLabels: false` stays). Mermaid fallback = **neutral card + slate border only**. Do not re-enable `htmlLabels`. Honesty: forest/PNG have accents; client-dagre Mermaid does not. Document that in a one-line comment on the paint helper.

## What to build

1. Confirm DOT `fillcolor`/`color`/`fontcolor`/`pencolor` (edges) use IDA-01 tokens. If still honey, fix here and add a test. Edge color = `LightEdgeStroke`.

2. Graphviz HTML label: wrap in a `TABLE` with no border, two columns:
   - Left cell: width ~8, `BGCOLOR` = `FillFor(kind)` resolved from the node’s ARM type via `DiagramInventoryPictogramKindResolver` (pass `DiagramNode` into `Format` if not already).
   - Right cell: existing name / type / RG lines, `ALIGN="LEFT"`, `BALIGN="LEFT"`.
   - Nodes with unknown type: generic slate cell, not empty.
   - Keep `Escape`. Do not use Microsoft icon images (`IMG SRC`).
   - Unit-test exact HTML for a VM (`Compute` blue) and a VNet (`Network` teal) with and without RG.

3. Paint function (TS):
   - Allow-list: `g.node > rect.node-card`, Mermaid `g.node > rect` **without** class `node-accent` and **not** inside `g.pictogram`.
   - Deny: `g.pictogram *`, `rect.node-accent`, `g.edge-label rect`, lock glyph strokes.
   - Labels: `g.node text` still palette text; do not recolor pictogram-less edge labels incorrectly.
   - Tests: honey-gone; pictogram fill survives; accent survives; mermaid unlabeled `rect` still gets `#f8fafc` so Export PNG from dagre is not `#ececec`.

4. CLI config writer tests already updated in IDA-01 — extend only if a token was missed (`lineColor` = edge stroke).

5. No forest layout/metrics. No legend SVG (IDA-09). No `htmlLabels: true`.

## Acceptance criteria

- `fdp` DOT for owner-shape VNets uses `#f8fafc` fill and `#cbd5e1` border.
- Graphviz HTML for a VNet includes teal `BGCOLOR` in a side cell; VM includes compute blue.
- `sanitizeArchitectureDiagramSvg` on a mixed forest snippet does not recolor pictogram or accent.
- Mermaid dagre fallback nodes are neutral cards, not honey.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** set Mermaid `htmlLabels: true`. **Do not** fetch Azure icon CDNs.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramGraphvizHtmlNodeLabelTests|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'` and `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~ArchitectureDiagramMermaidCliConfigWriterTests'` and `cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
