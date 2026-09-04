# RS-07 — Dirty-guard is a platform, not an inventory you remember

**Do not fork LI-13, PT-18, or LD-12.** LD-12 owns wiring remaining dirty forms (policy-pack, baseline, SSO steps). This file is the leftover **platform**: **nothing fails CI when a new form forgets the guard**. Wire SSO only if LD-12 has not already.

## Goal

Every operator surface that has `unsavedChanges` / `isDirty` / `hasUnsaved` / in-page cancel-confirm for a **document** (not URL filters) uses `useLivelihoodDocumentGuards` + the shared dialog. SSO wizard `pendingCancelConfirm` routes through that dialog — no `window.confirm`, no silent Alt+R. Add a Vitest inventory so a new dirty form without the helper fails.

## Why

Professionals navigate with the sidebar and Alt+R. Casual SPAs drop admin forms. LI-13 named SSO wizard and alert-rule; alerts are wired, **SSO wizard is not** (`SsoWizardPageClient` / `use-sso-wizard-page` still uses `pendingCancelConfirm` only). Digest **create** vs schedule — grep and close gaps. A livelihood tool cannot rely on the next author remembering the hook.

## Context

- `archlucid-ui/src/hooks/use-livelihood-document-guards.tsx`
- `archlucid-ui/src/hooks/use-in-app-navigation-guard.ts`
- `archlucid-ui/src/hooks/use-unsaved-changes-guard.ts`
- `archlucid-ui/src/app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx`
- Already wired: `ArchitectureDraftWorkspace`, `SettingsRolesMatrixSection`, `ExecDigestScheduleContent`, `AlertRulesContent`, `IdentityProvidersSamlPageClient`
- Grep `unsavedChanges`, `isDirty`, `hasUnsaved`, `pendingCancelConfirm`

## What to build

1. **Inventory test (this session’s job):** files that compute dirty document state must import `useLivelihoodDocumentGuards` (allowlist for URL-only filters, saved/idle after PATCH, and surfaces LD-12 already lists). Follow other UI inventory guards in `archlucid-ui`. A new dirty form without the helper fails Vitest.
2. If SSO wizard is still ungarded after LD-12, wire it through the helper and reuse the existing cancel dialog — no double prompt. If LD-12 already wired it, do not duplicate.
3. Do not guard when save state is `saved` / `idle` after success. Do not persist finding selection in a cross-tenant store (LI-13 restore stays).
4. Vitest: inventory allowlist is explicit; adding a dirty file without the helper fails; existing five LI-13 surfaces still import the helper.

## Acceptance criteria

- A Vitest inventory fails when a new dirty operator document omits `useLivelihoodDocumentGuards` (except the documented allowlist).
- Tab close still uses `beforeunload` (browser-controlled text).
- No `window.confirm` regressions where tests already forbid it.
- LD-12 remaining-form wiring is not duplicated; SSO is wired here only if still ungarded.

## Constraints

- Do not use `window.confirm` for in-app navigation.
- Do not collapse tabs as a “simpler dirty model.”
- Do not persist finding selection in a cross-tenant store.
