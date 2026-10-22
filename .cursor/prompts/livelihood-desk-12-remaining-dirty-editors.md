# LD-12 — Remaining livelihood editors use the same dirty guard

**Do not fork LI-13, PT-14, or PT-18.** Architecture drafts, roles matrix, SAML, alert-rule create, and digest schedule already use `useLivelihoodDocumentGuards`. Review-detail `?finding=` restore shipped. This file is **the remaining dirty operator forms**.

## Goal

Every Working-mode operator form that can lose typed work on sidebar navigation uses `useLivelihoodDocumentGuards` + `LivelihoodDocumentGuardDialog`. Policy-pack authoring, pilot baseline wizard, remaining SSO steps, and other `unsavedChanges` / `isDirty` / `hasUnsaved` surfaces are in scope. Do not invent a second confirm stack. Do not guard URL-only filters.

## Why

Professionals refresh and click the sidebar. Casual SPAs eat unsaved admin forms. LI-13 wired five surfaces. Grep still finds dirty state on policy-pack editors, baseline wizards, and other administration forms that only `window.confirm` or toast. A livelihood desk cannot silently drop a pack edit via Alt+R.

## Context

- `archlucid-ui/src/hooks/use-livelihood-document-guards.tsx` — note `.tsx` (LI shipped)
- `archlucid-ui/src/hooks/use-in-app-navigation-guard.ts`
- `archlucid-ui/src/hooks/use-unsaved-changes-guard.ts`
- Already wired: `ArchitectureDraftWorkspace`, `SettingsRolesMatrixSection`, `IdentityProvidersSamlPageClient`, `ExecDigestScheduleContent`, `AlertRulesContent`
- Grep `unsavedChanges`, `isDirty`, `hasUnsaved`, `formDirty` under `archlucid-ui/src/app/(operator)` and `archlucid-ui/src/components`
- Policy pack edit / publish forms; baseline wizard; remaining identity-provider steps

## What to build

1. Inventory dirty operator surfaces. Wire `useLivelihoodDocumentGuards` + `LivelihoodDocumentGuardDialog` on each mutating form that is not already listed above.
2. Where a surface already uses an in-page discard confirm, route the guard through the same dialog — no double prompt.
3. Do not guard when save state is `saved` / `idle` after a successful PATCH. Do not guard URL-only filters.
4. Do not use `window.confirm` for in-app navigation.
5. Vitest: dirty policy-pack (or baseline) navigating away opens the guard; after save it does not. Existing five surfaces unchanged.

## Acceptance criteria

- Dirty remaining livelihood editors cannot silently lose work via sidebar or Alt+R.
- Tab close still uses `beforeunload` (browser-controlled text).
- No `window.confirm` regressions where tests already forbid it.
- Review `?finding=` restore still works (LI-13 — do not regress).

## Constraints

- Do not collapse tabs as a “simpler dirty model.”
- Do not persist form drafts in a cross-tenant store.
- Do not add a second navigation-guard library.
