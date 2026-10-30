# SN-A11Y-03 — jest-axe on the SecureNow accessibility surfaces

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-A11Y prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ACCESSIBILITY_COMPOSER_PROMPTS.md`

## Goal

Component axe checks fail when the SecureNow accessibility page or the Why SecureNow draft has a serious accessibility violation.

## Why

`archlucid-ui/src/accessibility/` already runs jest-axe for the ArchLucid public statement. SecureNow Home and the draft page are not in that folder. A Vitest axe check catches missing names and broken landmarks without a live API.

## Read first

- `archlucid-ui/src/accessibility/marketing-accessibility-public-axe.test.tsx`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx`
- The operator accessibility view added in SN-A11Y-02
- `archlucid-ui/package.json` script `test:axe-components` (do not change the script; put the new file under `src/accessibility/` so the existing glob picks it up)

## What to build

1. Branch `sn-a11y/03-axe` from current `master` after SN-A11Y-02 is present.
2. Add `archlucid-ui/src/accessibility/securenow-accessibility-axe.test.tsx`.
3. Use `jest-axe` the same way as the marketing accessibility axe test: `expect.extend(toHaveNoViolations)` and `expect(await axe(container)).toHaveNoViolations()`.
4. Two cases:
   - Render the SecureNow accessibility view. No axe violations.
   - Render `WhySecureNowDraftView`. No axe violations.
5. Do not start Playwright. Do not add these routes to `live-api-accessibility.spec.ts` in this session.
6. Do not change production copy except to fix a violation the new test reports. If you must change copy, keep the SN-A11Y-02 strings (`WCAG 2.2`, `Report an accessibility barrier`, `This page does not record assistive-technology user testing`).

## Tests

From `archlucid-ui`:

```bash
npx vitest run src/accessibility/securenow-accessibility-axe.test.tsx
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not weaken axe rules or add a blanket `disableRules`.
- Do not claim the axe run is a certification.
- Do not commit.

## Done when

The new Vitest axe file passes for the operator accessibility view and the Why SecureNow draft.
