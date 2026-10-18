# RF-ERR-03 — Confirm the reload cascade cleared

**Wave:** Remediation factory dev log (**RF-ERR**). **Depends on:** RF-ERR-01. **Branch:** `cursor/rf-err-confirm-cascade`

## Goal

After the path inspect panel id compiles, these log lines are gone on a fresh load of `/security/remediation-factory`. If they remain on a clean compile, stop and report. Do not patch Next.

## Why

The same log, after the missing export, contains:

- `Fast Refresh had to perform a full reload`
- `[browser] Uncaught Error: Internal Next.js error: Router action dispatched before initialization.`
- `[browser] ChunkLoadError: Loading chunk app/global-error failed.` with `timeout: http://localhost:3002/_next/static/chunks/app/global-error.js`

Those follow an invalid client module. Next cannot fast-refresh it, reloads the document, and the app router plus the global-error chunk race that reload. They are not a separate remediation-factory defect while **RF-ERR-01** is still broken.

## Read first

- `docs/architecture/REMEDIATION_FACTORY_DEV_ERROR_COMPOSER_PROMPTS.md`
- The **RF-ERR-01** result: `REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID` exported and passed as `id` on the factory panel.

## What to build

1. Confirm `RemediationFactoryClient.tsx` imports only symbols that `remediation-factory-page-copy.ts` exports. No code change when that is already true.
2. From `archlucid-ui/`, run the Vitest files added or touched by **RF-ERR-01**. Do not start a dev server in this prompt.
3. If the import is still missing, stop and say **RF-ERR-01** is not done. Do not edit `app/global-error`, the Next router, or Fast Refresh config.

## Do not

- Add a `global-error.tsx` workaround for a chunk timeout.
- Guard `useRouter()` for “dispatched before initialization”.
- Clear `.next` as the fix. A clean compile is the fix.

## Done when

The factory client import resolves, the **RF-ERR-01** tests pass, and no application source was changed to catch the router or chunk errors.
