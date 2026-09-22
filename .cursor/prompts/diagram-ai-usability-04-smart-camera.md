# DAU-04 — Smart camera: fit the selected subgraph

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-03. **Do not** implement DAU-05–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When the operator (or a view plan) selects a node, finding-linked node, or Ask fit target, the inventory / architecture diagram **camera fits that node plus one-hop visible neighbors**, instead of leaving a 30% whole-graph zoom or a dual-scrollbar plate.

## Why

IDH-02 already resets `diagZoom` to 100% when `mermaidSource` changes. Selection highlight (dual-pane, outline “focus neighborhood”, `diagId`) still does not move the camera. Humans lose the selected box in the hairball.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewportControls.tsx`
- `archlucid-ui/src/lib/architecture/architecture-diagram-fullscreen-url.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-selection-url.ts`
- `archlucid-ui/src/lib/help/help-mermaid.ts` (`fitMermaidSvgElementToViewport`, mapped bbox — IDH-02)
- Dual-pane: `ArchitectureFindingsDualPane.tsx` `onHighlightedNodeIdChange`
- Outline: `InfraEvidenceDiagramOutline.tsx` `onFocusNeighborhood`
- View plan `FitTargetNodeId` from DAU-02

Reuse mapped SVG union (never unmapped `getBBox`). Do not add svg-pan-zoom.

## What to build

1. Pure helper `resolveDiagramCameraFocusNodeIds(seedId, outlineOrModel)` → seed + adjacent visible-edge neighbors. Empty seed → empty set (caller keeps current camera).
2. Viewer API: optional `focusNodeIds: readonly string[]` and `focusNonce` (increment on selection change). When the set is non-empty after paint, fit the **mapped** union of those node groups, clamp zoom to existing min/max, write zoom via the existing URL helper if the viewer already syncs zoom to search.
3. Wire:
   - Inventory outline “focus neighborhood” already changes seed mode in some paths — also pass focus ids into the viewer **without** requiring a re-compile when the node is already on the current AST.
   - Architecture dual-pane highlighted node id.
   - Apply view plan `FitTargetNodeId` after DAU-03 navigation (read from search if you add `diagFit=` **or** reuse `diagId` — prefer reusing `diagId` / seed rather than a third param unless tests prove collision).
4. If Graphviz layout SVG is present (IDG), fit that SVG’s node groups with the same helper family as IDG-04 — do not assume only Mermaid `g.node`.
5. Vitest: neighbor resolution; empty seed does not call fit; mapped bbox used in the test double. Do not add Playwright in this prompt (IDG-05 / IDH-03 own layout ratchets).

## Acceptance criteria

- Selecting a node that has two neighbors fits a bbox containing those three nodes at ≥ existing 11 px floor (IDL-03) when the viewport is the standard workbench size used in unit tests / jsdom mocks.
- Changing mermaid source still resets to 100% first (IDH-02); then focus may re-fit. Do not restore persisted 30% as a feature.
- No layout-engine change.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** retune `nodeSpacing` / `rankSpacing`. **Do not** re-run IDG.
- **Do not** implement walkthrough copy (DAU-05).
- Verification: focused Vitest on viewer + new helper. Heartbeat if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
