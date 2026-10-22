# PT-11 — Working-mode workbench is the default layout, not a post-hydrate opt-in

## Goal

On **Working** review-detail, architecture + findings + evidence render together on the first painted layout. “Tab-only layout” remains an explicit exit, persisted to the signed-in account — not a first-paint flash and not a `localStorage`-only preference. Guided stays tab-only. Desktop tabs stay fully visible.

## Why

`ReviewWorkbenchLayout` already exists and `readProfessionalWorkbenchEnabledFromStorage()` defaults true when Working and the key is unset. `useProfessionalWorkbenchEnabled` still starts `useState(false)` and flips true after an effect, so the first paint is tab-only. Preference is `localStorage` (`archlucid.professional-workbench.v1.enabled`), so docking-station vs home laptop diverges. All-day work is the three-column loop; exclusive tabs are the fallback, not the instrument.

## Context

- `archlucid-ui/src/lib/workspace-mode/use-professional-workbench-enabled.ts` — `useState(false)` then storage
- `archlucid-ui/src/lib/workspace-mode/professional-workbench-preference.ts`
- `archlucid-ui/src/components/reviews/ReviewDetailWorkspace.tsx` — `workbenchVisible`
- `archlucid-ui/src/components/reviews/ReviewWorkbenchLayout.tsx`
- `archlucid-ui/src/lib/api/user-preferences.ts` / `GET /v1/user/preferences` (workspace mode already lives here)
- PT-04 owns tab *identity* (order/labels/More). This prompt owns *layout*. Do not re-split tabs into Additional.

## What to build

1. Initialize workbench enabled from Working mode **without** a false first frame. Prefer: default `enabled` to `isWorkingMode` once workspace mode is mounted; only apply stored `false` after the preference is known. Avoid a visible tab-only → workbench swap.
2. Persist the Tab-only / workbench choice on the **user preferences API** (same account as workspace mode), with `localStorage` as a cache. Cross-device: last write wins.
3. Guided: workbench stays off. Do not auto-enable it.
4. Keep the eight review tabs in the strip. Workbench is extra columns for architecture/findings/evidence, not a replacement that hides other tabs.
5. Vitest: Working + no stored preference → workbench on after mount with no enabled=false intermediate if you can assert via a test harness; Guided → off; stored `0` stays off; preference write hits the user-preferences client (mock).

## Acceptance criteria

- Working review-detail shows the three workbench columns without a tab-only flash when the user has not chosen Tab-only.
- Choosing Tab-only survives sign-in on another browser after preferences load.
- Guided review-detail is tab-only.
- Desktop tab strip still lists every review tab (no More).

## Constraints

- **Forbidden:** hiding tabs behind More to “make room” for columns.
- Do not delete `ReviewWorkbenchLayout`; reuse it.
- Do not require `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`.
- Mobile may stack columns; do not invent a desktop overflow menu.
