# DCU-01 — Click a connector to open connection evidence

**Wave:** diagram consumption UX (**DCU**). **Depends on:** AX-DC outline inspector already on master. **Do not** implement DCU-02–05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Clicking a painted connector opens the connection-evidence panel that already exists, highlights that connector, and leaves the other connectors dim. Keyboard users reach the same panel from the outline, including **observed** rows.

## Why

`ArchitectureDiagramViewer` focuses `g.node` and `g.edge-stub`. A click whose target is inside `g.edge` falls through to `clearFocus()`. `InfraEvidenceDiagramOutline` opens `InfraEvidenceInventoryEdgeDetailPanel` only when the operator presses the source button on a **probable** or **inferred** row. **Observed** rows render the source as text, so a private-endpoint or service-connector line has no “why does this line exist?” control.

## Read first

- `.cursor/prompts/diagram-consumption-ux-00-index.md`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — click handler around `g.edge` / `g.node`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx` — `selectedInventoryEdge`, edges disclosure
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceInventoryEdgeDetailPanel.tsx` — reuse; do not fork
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` — where the viewer and outline sit together

## What to build

1. Add an optional `onSelectConnector` callback on `ArchitectureDiagramViewer`. When the click target is inside `g.edge`, read `data-from`, `data-to`, and the edge `<title>` (label). Call the callback with those three values. Do not clear node focus in a way that hides the connector. A second click on the same connector clears the connector selection.
2. Match the click to an `InfraEvidenceMermaidOutlineEdge` by normalized from/to. If several edges share the pair, prefer the one whose label equals the SVG title.
3. Lift connector selection to `DiagramsWorkbenchClient` (or a small hook in its own file) and pass it into `InfraEvidenceDiagramOutline` as the selected inventory edge. Opening a connector expands the edges disclosure if it was closed, scrolls the detail panel into view, and moves focus to the panel (`tabIndex={-1}`).
4. Give **observed** outline rows the same outline `Button` pattern that probable and inferred rows already use, so keyboard users can open `InfraEvidenceInventoryEdgeDetailPanel`. Keep the declared-connection panel on declared rows.
5. While a connector is selected, add the existing `diagram-click-dim` class to every other `g.edge`. The selected edge stays undimmed. Clearing the panel removes the dim.
6. Do not add a second inspector. Do not change hop provenance copy inside `InfraEvidenceInventoryEdgeDetailPanel`.

## Acceptance criteria

- A test clicks a `g.edge` with `data-from` / `data-to` and the inventory detail panel’s authorization or hostname hint is visible when that edge is probable or inferred.
- An observed edge opens the same panel and shows its source as Observed.
- A declared edge still opens the declared-connection panel.
- Escape or the panel Close control clears the highlight.

## Constraints

- Working-tree safety before tracked edits.
- Sentence case. Visible-boundary buttons.
- No new Azure call. No collector. No Mermaid regeneration.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
cd archlucid-ui && npx vitest run \
  src/components/architecture/ArchitectureDiagramViewer.test.tsx \
  src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx
```

Heartbeat every 8s if the run exceeds 15s.

## Done when

Clicking a **May access** line on the canvas opens **Connection evidence** and leaves that line undimmed. The outline button does the same for an observed line.
