# IDA-01 — Neutral card palette and readable captions

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** none (palette + forest caption contrast). **Do not** implement accent bars, content-sized cards, edges, RG frames, or IDA-02–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory/architecture diagram **node fill is no longer honey**. Light-mode cards are a white/slate surface with a slate border and WCAG AA caption text. Dark-mode cards stay a dark slate surface. Pictograms must remain their own colors after client paint.

## Why

Owner 2026-09-15 forest canvas is a wall of `#D4A84B`. Carbon / `UI-Enterprise-Design-Standard.mdc` uses amber for attention, not for every node. IDR-02 caption fill `#64748b` on honey is ~2.1:1. Changing only the forest emitter and leaving `ArchitectureDiagramMermaidPalette.LightNodeFill` honey would make PNG/Mermaid liars; changing the palette without excluding `g.pictogram` from `paintArchitectureDiagramNodePalette` would paint icons the card fill (today: honey; after this prompt: white — worse).

## Context

- `ArchLucid.Core/Diagrams/ArchitectureDiagramMermaidPalette.cs` — `LightNodeFill` `#D4A84B`, `LightNodeBorder` `#6B5424`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts` — keep in sync (file header says so)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` — card rect uses the C# palette; RG text is hardcoded `#64748b`
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — `paintArchitectureDiagramNodePalette` selects `g.node rect, g.node polygon, g.node circle` (includes pictogram shapes)
- Tests that assert honey: `DiagramForestLayoutSvgRendererTests` (rect fills), `DiagramAstGraphvizDotEmitterTests`, `ArchitectureDiagramMermaidCliConfigWriterTests`, `architecture-diagram-svg.test.ts` (“honey export palette”)
- `ArchLucid.Application/Diagrams/ArchitectureDiagramMermaidCliConfigWriter.cs`

Do **not** add accent bars. Do **not** change `UniformNodeWidth`. Do **not** retune Mermaid `nodeSpacing`.

## What to build

1. `ArchitectureDiagramMermaidPalette` light tokens:
   - `LightNodeFill` = `#f8fafc`
   - `LightNodeBorder` = `#cbd5e1`
   - `LightNodeText` = `#0f172a` (unchanged)
   - Add `LightNodeCaption` = `#475569` (AA on `#f8fafc`)
   - Add `LightEdgeStroke` = `#94a3b8`
   - Dark: keep `DarkNodeFill` `#334155`, `DarkNodeBorder` `#cbd5e1`, `DarkNodeText` `#f8fafc`. Add `DarkNodeCaption` = `#cbd5e1` and `DarkEdgeStroke` = `#94a3b8`.
   - Comment: honey `#D4A84B` is retired; do not use it as a node fill. Attention/status stays `StatusTag`, not diagram cards.

2. `architecture-diagram-mermaid-config.ts`: same hex values on `ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE` / `DARK_NODE`. Add `caption` (and `edge` if the TS object is the paint source). Update the “rich honey” comment. `themeVariables.primaryColor` / `mainBkg` / `primaryBorderColor` / `lineColor` follow the new tokens. Do **not** change `nodeSpacing`, `rankSpacing`, `padding`, `wrappingWidth`, or `curve`.

3. `DiagramForestNodeSvgEmitter`:
   - Card `rect`: fill/stroke from palette (already), `rx` **6** (was 4), add `class="node-card"` so later paint can target it.
   - RG caption fill: `LightNodeCaption` (`#475569`), not `#64748b`.
   - Name fill stays `LightNodeText`.
   - Do not change pictogram emission.

4. `paintArchitectureDiagramNodePalette`:
   - Paint **card bodies only**: `g.node > rect.node-card`, and Mermaid fallback `g.node > rect` that are **not** inside `g.pictogram`.
   - **Never** set fill/stroke on `g.pictogram rect|circle|ellipse|line|path` or `g.edge-label rect`.
   - Edge paths: use `LightEdgeStroke` / `DarkEdgeStroke` (not the old brown node border).
   - Node label text still uses `palette.text`.

5. Tests (fail on honey, pass after):
   - Forest owner-shape: node-card fills are `#f8fafc`, not `#D4A84B`. Caption fill `#475569` when RG lines exist (use a two-node RG fixture if owner-shape VNets have no RG).
   - `architecture-diagram-svg.test.ts`: rename “honey” cases; expect `#f8fafc` / `#cbd5e1`; add a case where `g.pictogram circle` fill `#0f766e` **survives** paint.
   - Graphviz DOT + CLI config writer: `fillcolor` / `primaryColor` are the new fill.
   - `architecture-diagram-mermaid-config.test.ts` if it snapshots honey.

## Acceptance criteria

- Light forest cards are `#f8fafc` with `#cbd5e1` border. No `#D4A84B` on node-card rects.
- RG caption on a light card is `#475569`.
- After `sanitizeArchitectureDiagramSvg`, network pictogram teal is still teal.
- Mermaid theme and Graphviz `fillcolor` match the new light fill (parity; accent bars are IDA-02/03).

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IDA-02–12. **Do not** retune dagre gaps. **Do not** add Microsoft icons.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'` and `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~ArchitectureDiagramMermaidCliConfigWriterTests'` and `cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts src/lib/architecture/architecture-diagram-mermaid-config.test.ts`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
