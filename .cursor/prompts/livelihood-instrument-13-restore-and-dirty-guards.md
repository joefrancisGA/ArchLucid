# LI-13 — Restore review context and guard every livelihood editor

**Do not fork PT-14 / PT-18 into separate sessions unless this file is too large.** Reuse `useInAppNavigationGuard`, `useUnsavedChangesGuard`, and `useLivelihoodDocumentGuards`. Roles matrix is already wired.

## Goal

Refresh (or a new tab to the same review URL) restores selected finding and workbench focus column when those ids are in the URL or session store. Dirty SSO, digest schedule, and alert-rule forms hit the same unsaved dialog as architecture drafts. Do not invent a second confirm stack.

## Why

Professionals refresh. Casual SPAs eat selection and unsaved admin forms. PT-18 shipped `use-livelihood-document-guards.ts` but grep shows it mounted only on `SettingsRolesMatrixSection`. Digest schedule already computes `unsavedChanges`. Architecture drafts already guard. Alert-rule and SSO wizards have their own confirms without the in-app router guard. Review-detail selection dies on refresh.

## Context

- `archlucid-ui/src/hooks/use-livelihood-document-guards.ts`
- `archlucid-ui/src/hooks/use-in-app-navigation-guard.ts`
- `archlucid-ui/src/hooks/use-unsaved-changes-guard.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDraftWorkspace.tsx` — exemplar
- `SettingsRolesMatrixSection.tsx` — already wired
- `exec-digest-schedule-page-model.ts` `unsavedChanges` / `ExecDigestScheduleContent.tsx`
- SSO wizard cancel-confirm (`sso-wizard-state.ts`)
- Alert rules forms with `formValid` / dirty state
- Review-detail finding id / workbench column (query or `sessionStorage` keyed by review id + user)

## What to build

1. **Restore:** Persist `findingId` (and workbench column if cheap) on the review URL (`?finding=` or existing param) or a per-review session key. On load, reselect that finding in tab-only and workbench. Invalid/stale ids fail closed (no finding selected), no error toast spam.
2. **Dirty inventory:** Grep `unsavedChanges`, `isDirty`, `hasUnsaved` on operator surfaces. Wire `useLivelihoodDocumentGuards` + `LivelihoodDocumentGuardDialog` on digest schedule, SSO wizard, and alert-rule create/edit at minimum.
3. Where a surface already uses an in-page discard confirm, route the guard through the same dialog — no double prompt.
4. Do not guard when save state is `saved` / `idle` after a successful PATCH. Do not guard URL-only filters.
5. Vitest: restore finding id from query; dirty digest/SSO/alert-rule navigating away opens the guard; after save it does not. Architecture draft behavior unchanged.

## Acceptance criteria

- Refresh on a review with `?finding=` (or equivalent) restores that row’s selection.
- Dirty roles / digest / SSO / alert-rule edits cannot silently lose work via sidebar or Alt+R.
- Tab close still uses `beforeunload` (browser-controlled text).
- No `window.confirm` regressions where tests already forbid it.

## Constraints

- Do not use `window.confirm` for in-app navigation.
- Do not collapse tabs as a “simpler dirty model.”
- Do not persist finding selection in a cross-tenant store.
