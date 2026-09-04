# RS-13 — Workbench first paint is the instrument, not a tab-only flash

**Do not fork LI-09, PT-11, or PT-12.** Split workbench, user-preferences API, and Working default-on already exist. This file is the leftover: **first paint can still be tab-only until `syncProfessionalWorkbenchFromServer` returns**.

## Goal

On Working review-detail, when the user has not chosen Tab-only, the three-column workbench is the **first painted layout** (architecture + findings + evidence). No visible tab-only → workbench flash after preferences load. Guided stays tab-only. Desktop review tabs stay fully visible (workbench is extra columns, not a More menu).

## Why

All-day review is the three-column loop. `useProfessionalWorkbenchEnabled` initializes from `localStorage`, then `useEffect` syncs from the server. A slow preferences GET or empty cache on a new browser can paint tab-only first. Livelihood failure: the architect starts disposing from a tab strip that then rearranges.

## Context

- `archlucid-ui/src/lib/workspace-mode/use-professional-workbench-enabled.ts`
- `archlucid-ui/src/lib/workspace-mode/professional-workbench-preference.ts`
- `archlucid-ui/src/components/reviews/ReviewWorkbenchLayout.tsx`
- `archlucid-ui/src/components/reviews/ReviewDetailWorkspace.tsx`
- LI-09 selection sync — do not rebuild; keep `selectedFindingId` if already lifted

## What to build

1. Working + no explicit Tab-only (storage and server): `enabled` is true **before** the server round-trip. Do not `useState(false)` then flip true.
2. Explicit Tab-only (`professionalWorkbenchEnabledIsExplicit` false on server **or** storage `"0"`) stays off with no flash to workbench.
3. Guided: workbench stays off even if storage says on.
4. If `mounted` is used to hide layout until known, prefer defaulting Working to workbench rather than defaulting to tab-only.
5. Vitest: Working + empty storage → enabled true without an enabled=false intermediate if the harness can assert it; Guided → off; stored off stays off.

## Acceptance criteria

- Working review-detail shows the three columns without a tab-only flash when the user has not chosen Tab-only.
- Choosing Tab-only still survives sign-in on another browser after preferences load (LI-09 — do not regress).
- Desktop tab strip still lists every review tab (no More).

## Constraints

- **Forbidden:** hiding tabs behind More to “make room” for columns.
- Do not delete `ReviewWorkbenchLayout`.
- Do not require `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`.
