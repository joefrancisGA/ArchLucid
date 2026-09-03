# PT-12 — Workbench columns share one selected finding

## Goal

Selecting a finding in the workbench findings column highlights the matching architecture node (when one exists) and scrolls/focuses the related evidence rows in the evidence column. The reverse: selecting a diagram node or evidence row focuses the related finding. One selection, three columns.

## Why

`ReviewWorkbenchLayout` keeps architecture, findings, and evidence **co-visible** but they are three independent panels. `ArchitectureFindingsDualPane` already syncs finding → diagram on the Architecture tab only (`architecture-findings-dual-pane.ts`, TB-2201). The daily loop is read finding → check evidence → look at the diagram → dispose. Unlinked columns are three websites side by side.

## Context

- `archlucid-ui/src/components/reviews/ReviewWorkbenchLayout.tsx`
- `archlucid-ui/src/lib/architecture/architecture-findings-dual-pane.ts` — **reuse** `resolveFindingDiagramSelectionSync` / related node ids
- Findings cards/table on review-detail (`data-finding-id`)
- Evidence tab panel used inside the workbench
- Architecture diagram panel used inside the workbench
- PT-11 if workbench is still hydrating off; this prompt still works when workbench is on

## What to build

1. Lift a single `selectedFindingId` (and optional `highlightedNodeId`) to `ReviewDetailWorkspace` when workbench is visible. Pass it into the three column panels.
2. Reuse dual-pane matching for finding → diagram node. Do not fork a second heuristic.
3. Evidence column: when a finding is selected, scroll the first related evidence row into view and mark it (existing inspect evidence items if already on the payload; otherwise a honest “no linked evidence” line in that column — do not invent citations).
4. Diagram node click / evidence row click updates `selectedFindingId` when a match exists.
5. Finding keyboard triage (Alt+J/K, Alt+1–3) must update the shared selection so dispose still has evidence on screen.
6. Vitest: selecting a finding with `relatedNodeIds` highlights that node; selecting a finding with no match shows the existing dual-pane empty copy; workbench exit (Tab-only) does not leave a stuck global selection.

## Acceptance criteria

- In workbench, focusing a finding updates architecture highlight and evidence context without changing tabs.
- Alt+J / Alt+K move the shared selection.
- No duplicate matching library; dual-pane helpers stay the SoT.
- Tab-only layout behavior unchanged.

## Constraints

- Do not collapse tabs.
- Do not navigate to `/findings/[id]/inspect` as the only way to see evidence (inspect route may remain for deep links).
- Do not add a new finding engine.
