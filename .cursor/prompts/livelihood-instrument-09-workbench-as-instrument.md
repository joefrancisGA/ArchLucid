# LI-09 — Workbench is the Working-mode instrument (layout + one selection)

**Do not fork PT-11 / PT-12 into two sessions unless this file is too large — this prompt is both residuals.** Reuse `ReviewWorkbenchLayout`. Desktop tabs stay fully visible.

## Goal

On Working review-detail, architecture + findings + evidence render together on the first painted layout. Choosing Tab-only persists on the **signed-in account**. The three columns share one selected finding. Guided stays tab-only.

## Why

All-day review is the three-column loop: read finding → check evidence → look at the diagram → dispose. Exclusive tabs are the fallback. `useProfessionalWorkbenchEnabled` still has a mount/`preferenceMounted` dance and `syncProfessionalWorkbenchFromServer` after first paint. Preference must not live only in `localStorage` (`archlucid.professional-workbench.v1.enabled`) so dock vs home laptop diverges. `ReviewWorkbenchLayout` can keep three independent panels; `ArchitectureFindingsDualPane` already syncs finding → diagram on the Architecture tab only.

## Context

- `archlucid-ui/src/lib/workspace-mode/use-professional-workbench-enabled.ts`
- `archlucid-ui/src/lib/workspace-mode/professional-workbench-preference.ts`
- `archlucid-ui/src/components/reviews/ReviewDetailWorkspace.tsx`
- `archlucid-ui/src/components/reviews/ReviewWorkbenchLayout.tsx`
- `archlucid-ui/src/lib/architecture/architecture-findings-dual-pane.ts` — **reuse**
- `archlucid-ui/src/lib/api/user-preferences.ts` / `GET /v1/user/preferences`
- Finding keyboard triage (Alt+J/K, Alt+1–3)

## What to build

1. Initialize workbench enabled from Working mode **without** a visible tab-only → workbench flash when the user has not chosen Tab-only.
2. Persist Tab-only / workbench on the **user preferences API** (same account as workspace mode), `localStorage` as cache. Last write wins.
3. Guided: workbench stays off.
4. Lift a single `selectedFindingId` (and optional `highlightedNodeId`) when workbench is visible. Finding → diagram reuses dual-pane helpers. Evidence column scrolls the first related evidence row or shows honest “no linked evidence.” Diagram/evidence click updates the shared finding when a match exists.
5. Alt+J / Alt+K / Alt+1–3 update the shared selection so dispose still has evidence on screen.
6. Keep the eight review tabs in the strip. Workbench is extra columns, not a replacement that hides tabs.
7. Vitest: Working + no stored preference → workbench on without enabled=false intermediate if the harness can assert it; Guided → off; stored off stays off; preference write hits user-preferences client; selecting a finding with `relatedNodeIds` highlights that node.

## Acceptance criteria

- Working review-detail shows the three columns without a tab-only flash when the user has not chosen Tab-only.
- Choosing Tab-only survives sign-in on another browser after preferences load.
- Focusing a finding updates architecture highlight and evidence context without changing tabs.
- Desktop tab strip still lists every review tab (no More).

## Constraints

- **Forbidden:** hiding tabs behind More to “make room” for columns.
- Do not delete `ReviewWorkbenchLayout`.
- Do not require `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`.
- Do not navigate to `/findings/[id]/inspect` as the only way to see evidence.
