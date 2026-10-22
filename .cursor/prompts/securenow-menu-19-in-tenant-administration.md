# SN-DEP-03 — Administration for in-tenant SecureNow

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-DEP-01 (**Accepted**) and SN-ED-01.

## Goal

When SecureNow runs in the customer's tenant, Administration shows what the customer's own team needs to run it and hides what only makes sense when ArchLucid hosts it.

## Why

Administration today includes Billing, trial and cost settings inside Workspace settings, and vendor Internal links merged in by `mergeInternalNavUnderAdministration`. In a customer-hosted install there is no ArchLucid bill, no trial, and no vendor operator.

## Read first

- The accepted SN-DEP-01 ADR, hosting mode section. It overrides this prompt wherever they differ.
- `archlucid-ui/src/lib/operator/operator-admin-nav-group-builder.ts` and its test
- `archlucid-ui/src/lib/operator/operator-system-admin-nav-group-builder.ts`
- `archlucid-ui/src/lib/product-line/filter-nav-groups-for-product-line.ts` (`mergeInternalNavUnderAdministration`)
- `archlucid-ui/src/app/(operator)/administration/` pages for billing, workspace settings, system health, and identity providers
- The SN-ED-01 edition modules

## What to build

- Read the hosting mode setting from SN-DEP-01 in the UI the same way SN-ED-01 reads the edition: deployment config only, no cookie or header.
- In the SecureNow shell with hosting mode `InTenant`:
  - Remove `Billing` and any other link the ADR lists as hosted-only.
  - Hide trial and plan fields inside Workspace settings. Keep the rest of that page.
  - Do not merge vendor Internal links, even for a user with internal authority.
  - Put `System health` and `Identity providers` first in Administration, then the remaining links in their current order.
  - Change the Administration caption to `Users, identity, notifications, AI models, and system health.`
- The routes for removed links return the existing product-line blocked page when visited directly.
- Hosting mode `ArchLucidHosted` and the Architecture shell are unchanged.

## Tests

1. In-tenant SecureNow Administration has no Billing link, starts with System health and Identity providers, and has the new caption.
2. In-tenant SecureNow never merges Internal links.
3. Visiting `/administration/billing` in-tenant shows the blocked page.
4. Workspace settings in-tenant hides trial fields and keeps the rest.
5. ArchLucid-hosted SecureNow and the Architecture shell are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- If the API also needs the hosting mode to reject hosted-only calls, list those endpoints in the session summary. Do not change them here.
- Do not commit.

## Done when

An in-tenant SecureNow Administration shows system health and identity first, has no billing, trial, or vendor-internal pages, and hosted installs are unchanged.
