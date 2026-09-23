# DRR-03 — Light and dark edge ink, including arrowheads

**Wave:** diagram regression repair (**DRR**). **Depends on:** trunk. **Parallel with DRR-01.** Do not edit `LayoutDataFlowStageColumns` or the orthogonal router.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The on-screen forest canvas, the sanitized SVG, and the Mermaid fallback use one edge color per theme. Light mode is near-black `#111827`. Dark mode is slate `#e2e8f0`. Arrowhead fill tracks that same color. Edge-label text stays `#111827` on its white chip in both themes.

## Why

#3587 set `ArchitectureDiagramMermaidPalette.LightEdgeStroke` and `DarkEdgeStroke` to `#111827` and the arrow marker fill to `#111827`. `paintArchitectureDiagramNodePalette` then overwrites `g.edge path.edge-path` with `ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.edge` / `DARK_NODE.edge`, which are still `#94a3b8`. The marker is not in that selector. Dark-mode host CSS restyles Mermaid `.edgePath` and `.edgePaths` only. The live picture is a gray line with a black arrowhead. In dark mode the arrowhead disappears.

## Context

- `ArchLucid.Core/Diagrams/ArchitectureDiagramMermaidPalette.cs` — `LightEdgeStroke`, `DarkEdgeStroke`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts` — `ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.edge`, `ARCHITECTURE_DIAGRAM_MERMAID_DARK_NODE.edge`
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — `paintArchitectureDiagramNodePalette`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeArrowMarkerSvgEmitter.cs` — marker `#al-edge-arrow`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` — path stroke and label fill
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` — edge `color` and `fontcolor` (light export)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `MERMAID_SVG_HOST_CLASSNAME`
- Comment on the palette says keep it in sync with `architecture-diagram-mermaid-config.ts`.

## What to build

1. Tokens, both files, same hex:
   - Light edge `#111827`
   - Dark edge `#e2e8f0`
   - Do not change node fill, node border, or caption tokens in this prompt.

2. Forest emitter may keep emitting the **light** stroke and a light marker fill. `paintArchitectureDiagramNodePalette` is the theme switch:
   - Set `stroke` on `g.edge path.edge-path` (existing selector) to `palette.edge`.
   - Set `fill` on `marker#al-edge-arrow path` to `palette.edge`.
   - Do **not** set edge-label `text` fill to `palette.edge`. Leave those labels `#111827`. Their rect stays `fill="#ffffff"`.

3. Host CSS in `MERMAID_SVG_HOST_CLASSNAME`: add forest `path.edge-path` and `marker#al-edge-arrow path` beside the existing Mermaid edge rules.
   - Light: stroke / marker fill `#111827` (or `var` fed by the light edge token).
   - Dark: stroke / marker fill `#e2e8f0`.
   - Do not restyle `image.azure-icon`.

4. Graphviz DOT edge `color` and `fontcolor` use the light token `#111827`. Graphviz output is the light export.

5. Tests:
   - `architecture-diagram-svg.test.ts`: a forest snippet with `path.edge-path` stroke `#94a3b8` and `marker#al-edge-arrow path` fill `#94a3b8` sanitizes to `#111827` in light mode and `#e2e8f0` in dark mode. An `image.azure-icon` `href` is unchanged. An edge-label `text` fill stays `#111827` in dark mode.
   - A C# assertion already covering palette constants, or a small new test, expects `LightEdgeStroke == "#111827"` and `DarkEdgeStroke == "#e2e8f0"`.
   - Update any test that still expects the edge stroke `#94a3b8` after sanitize.

## Acceptance criteria

- Light canvas: line and arrowhead are `#111827`.
- Dark canvas: line and arrowhead are `#e2e8f0`.
- Edge labels stay dark text on a white chip.
- Azure icon images are not recolored.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not retune Mermaid spacing. Do not change card fills. Do not restore the subscription frame.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'` and from `archlucid-ui`: `npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
