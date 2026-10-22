# DRS-02 — Edge ink only

**Wave:** Diagram restore (**DRS**). **Depends on:** DRS-01 looked at and accepted, or the owner explicitly skipping DRS-01. **Do not** implement DRS-03–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Inventory and data-flow edges use near-black ink on a light canvas and light ink on a dark canvas. Nothing else about the diagram moves.

## Why

#3587 set both `LightEdgeStroke` and `DarkEdgeStroke` to `#111827`. On a dark canvas that ink disappears. #3592 corrected the viewer and the light arrow, and set the dark viewer stroke to `#e2e8f0`, but it also shipped the layout damage. Take the colors only.

Locked values:

| Surface | Light | Dark |
|---------|-------|------|
| Edge stroke and arrow | `#111827` | `#e2e8f0` |
| Edge label | `#111827` | `#e2e8f0` |

## Context

- `ArchLucid.Core/Diagrams/ArchitectureDiagramMermaidPalette.cs` (`LightEdgeStroke`, `DarkEdgeStroke`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeArrowMarkerSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` (edge and marker CSS only)
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` (arrow marker paint only, if markers are recolored there)

## What to build

1. Branch `drs/02-edge-ink` from the accepted DRS-01 branch, or from `revert/diagram-icon-layout-3585-3592` if DRS-01 was skipped.
2. Apply the locked colors in the palette, the forest arrow marker, the forest edge label, the Mermaid theme, and the viewer CSS.
3. Dark mode must not use `#111827` for edges.
4. Do not change `DiagramForestSubscriptionFrameResolver`, node placement, data-flow routing, outline structure, or icons.
5. A test that renders a network inventory must still find `class="subscription-frame"`.

## Acceptance criteria

- Light edge, arrow, and label are `#111827`.
- Dark edge, arrow, and label are `#e2e8f0`.
- Subscription frame test still expects the frame to be present.

## Constraints

- Working-tree safety. Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~DiagramForestLayoutSvgRendererTests
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj
npx vitest run src/components/architecture/ArchitectureDiagramViewer.test.tsx src/lib/architecture/architecture-diagram-svg.test.ts
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on the compile.

## Done when

Tests pass. Stop. Tell the owner to restart the API (forest SVG is built on the server), then look at Full subscription in light mode and dark mode. Edges should be readable on both. Card positions and the subscription frame should match the demo. Wait for that look before DRS-03.
