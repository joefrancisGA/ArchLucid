# PT-18 — Dirty-document guard on every livelihood editor

## Goal

In-app navigation and tab close warn when the user would lose **unsaved** edits on the same classes of forms already treated as dirty on architecture drafts: SSO wizard, roles matrix, digest schedule, alert-rule create/edit, and any other operator form that already tracks `unsavedChanges` / `isDirty` in page state. Reuse `useInAppNavigationGuard` + `useUnsavedChangesGuard`. Do not invent a second confirm stack.

## Why

DD-04 shipped guards on `ArchitectureDraftWorkspace` only (`use-in-app-navigation-guard.ts`, `use-unsaved-changes-guard.ts`). Roles matrix already has unsaved notices (`SettingsRolesMatrixSection.tsx`) without the in-app router guard. Digest schedule and SSO cancel have their own confirms. A professional who Alt+R mid-edit should hit the same unsaved dialog as leaving a draft. Casual sites let the SPA eat the form.

## Context

- `archlucid-ui/src/hooks/use-in-app-navigation-guard.ts`
- `archlucid-ui/src/hooks/use-unsaved-changes-guard.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDraftWorkspace.tsx` — exemplar
- `SettingsRolesMatrixSection.tsx` (unsaved notice exists)
- SSO wizard cancel-confirm tests (`sso-wizard-state.ts`)
- `exec-digest-schedule-page-model.ts` `unsavedChanges`
- Alert rules forms with `formValid` / dirty state
- ConfirmationDialog vs `window.confirm` — prefer existing `ConfirmationDialog` (already used for unsafe dismiss)

## What to build

1. Inventory operator surfaces that already compute dirty/unsaved (grep `unsavedChanges`, `isDirty`, `hasUnsaved`). Do not boil the ocean of every input.
2. Wire `useInAppNavigationGuard` + `useUnsavedChangesGuard` on those surfaces with one shared message helper (sentence case). Architecture draft copy stays draft-specific.
3. Where a surface already uses an in-page discard confirm (roles matrix, SSO), route the guard through the same dialog — no double prompt.
4. Do not guard when save state is `saved` / `idle` after a successful PATCH.
5. Vitest: one representative form per surface family (roles, SSO, digest, alert rule) — navigating away while dirty opens the guard; after save it does not.

## Acceptance criteria

- Dirty roles / digest / SSO / alert-rule edits cannot silently lose work via sidebar or Alt+R.
- Tab close still uses `beforeunload` (browser-controlled text).
- Architecture draft behavior is unchanged.
- No `window.confirm` regressions where tests already forbid it.

## Constraints

- Do not use `window.confirm` for in-app navigation.
- Do not block navigation for filters that are URL-only (those are restored by the URL).
- Do not collapse tabs as a “simpler dirty model.”
