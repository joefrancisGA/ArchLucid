# LS-01 — Architecture dual-pane shares workbench selection

**Do not fork PT-12 or LI-09.** Workbench already has `ReviewWorkbenchSelectionContext` + `WorkbenchSelectionCoordinator`. This file is the leftover: **`ArchitectureFindingsDualPane` still owns a local `selectedFindingId`** and a separate `diagramFindingId` query param. Tab-only Architecture and the three-column workbench are two instruments.

## Goal

Selecting a finding on the Architecture dual-pane updates the shared workbench selection (and the reverse) when the workbench is visible. URL restore uses one param (`findingId` already used by review-detail). Do not keep a second `diagramFindingId` as a competing source of truth. Tab-only layout (workbench off) still highlights the diagram from the dual-pane list.

## Why

The daily loop is read finding → check evidence → look at the diagram → dispose. Unlinked columns are three websites. Dual-pane local state makes the Architecture tab a fourth website.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureFindingsDualPane.tsx` — local `useState` / `urlFindingId` from `diagramFindingId`
- `archlucid-ui/src/lib/architecture/architecture-findings-dual-pane.ts` — **reuse** `resolveFindingDiagramSelectionSync`
- `ReviewWorkbenchSelectionContext.tsx` / `WorkbenchSelectionCoordinator.tsx`
- `REVIEW_DETAIL_FINDING_PARAM` (WA-15)
- `architecture-findings-dual-pane-url.ts`

## What to build

1. When `useReviewWorkbenchSelection()` is non-null, dual-pane reads/writes that context instead of a parallel `useState`.
2. Diagram node click and finding click go through the same setter. Coordinator already maps finding → node; do not fork a second heuristic.
3. Prefer `findingId` in the URL. If `diagramFindingId` remains for bookmarks, treat it as an alias that hydrates `findingId` once, then stop writing the alias.
4. Workbench off: dual-pane may keep local selection; do not require workbench to highlight a node.
5. Vitest: workbench on + dual-pane click sets context `selectedFindingId`; workbench off still highlights a node; no second matching library.

## Acceptance criteria

- In workbench, Architecture-tab finding focus and findings-column focus are the same id.
- Refresh with `findingId` restores both diagram highlight and findings column.
- Desktop review tabs stay a full strip.

## Constraints

- Do not navigate to `/findings/[id]/inspect` as the only way to see evidence.
- Do not add a new finding engine.
- Do not collapse tabs.
