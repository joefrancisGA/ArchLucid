# IDA-02 — Category accent bar on forest cards

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** IDA-01 merged (`node-card` class + pictogram paint exclusion). **Do not** implement Graphviz HTML accents, content-sized cards, edges, or IDA-03–12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Each inventory-forest card shows a **4 px left accent** whose color is the existing pictogram-kind color (compute blue, network teal, data purple, storage amber, identity pink, generic slate). The rest of the card stays the IDA-01 neutral fill. Type is scannable without reading the name.

## Why

Owner screenshot: every card is the same fill. Pictograms are 28 px on a busy fill; category is not a gestalt. `DiagramInventoryPictogramSvgEmitter` already has a kind palette. Reuse it. Do **not** invent a second color table and do **not** use Microsoft product icons (IDA-HOLD).

## Context

- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryPictogramKind.cs` — Generic, Compute, Network, Data, Storage, Identity
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryPictogramSvgEmitter.cs` — kind colors (compute `#2563eb`, network `#0f766e`, data `#7c3aed`, storage `#d97706`, identity `#db2777`, generic `#475569`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` — card `rect.node-card` then pictogram
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — after IDA-01 skips `g.pictogram`; must also skip the accent rect
- New file: `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryPictogramKindColors.cs` (own file) **or** a static helper on the emitter — prefer one shared method `FillFor(kind)` used by pictogram + accent so they cannot drift
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`

Storage amber as a **4 px bar** is allowed. Do not fill the whole card with `#d97706`.

## What to build

1. Shared kind → fill helper (new class, own file). Pictogram emitter calls it instead of inlined hex where a single fill represents the kind. Lines/secondary shades inside a pictogram may stay local.

2. `DiagramForestNodeSvgEmitter.Emit`: after the card rect, add `rect.node-accent`:
   - `x=0`, `y=0`, `width=4`, `height={card height}`, `fill={FillFor(metrics.PictogramKind)}`, no stroke (or `stroke="none"`), `pointer-events="none"`, `rx` left-only is optional — a straight bar is fine (full-height rectangle). Do not cover the pictogram.
   - Keep `node-card` behind the accent (draw card first).

3. `paintArchitectureDiagramNodePalette`: never paint `rect.node-accent`. Selector allow-list remains `rect.node-card` + Mermaid body rects.

4. Tests:
   - A Network node SVG contains `rect` with `class` containing `node-accent` and fill `#0f766e`.
   - A Compute node accent is `#2563eb`.
   - Owner-shape eleven VNets: every node-card still `#f8fafc`; each has one accent (network teal).
   - Client paint fixture: accent fill unchanged after `replaceMermaidForeignObjectLabelsWithSvgText` / sanitize (add a forest-like snippet with `node-card` + `node-accent` + pictogram to the Vitest file **or** cover paint skip in C# if paint is TS-only — then Vitest).

5. No Graphviz HTML table. No width/layout option changes. No legend (IDA-09).

## Acceptance criteria

- Forest cards are still neutral. Category is a 4 px left bar using pictogram-kind color.
- Client SVG sanitize does not recolor the bar.
- Pictograms unchanged besides any shared `FillFor` refactor.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** add Microsoft Azure icons. **Do not** color the whole card by kind.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~DiagramInventoryPictogram'` and `cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
