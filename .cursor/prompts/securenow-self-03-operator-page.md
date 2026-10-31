# SN-SELF-03 — SecureNow stuck-state operator page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

`/administration/securenow-self-service` renders the four stuck states from `SELF_SERVICE.md` for a SecureNow operator. The security product line allows the route. The architecture product line does not. The page does not call the ArchLucid support-bundle API.

## Why

Home links the route. Without a page, the link 404s. Without a catalog assignment, the security shell blocks it.

## Read first

- `docs/securenow/SELF_SERVICE.md`
- `archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx` (pattern)
- `archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts` (pattern)
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts`
- `archlucid-ui/src/lib/product-line/product-line-catalog.test.ts`
- `archlucid-ui/src/lib/governance/governance-route-paths.ts` (`SECURENOW_REMEDIATION_FACTORY_PATH`)
- `archlucid-ui/src/lib/governance/governance-infrastructure-route-paths.ts` (`SECURENOW_REMEDIATION_INSTANCES_PATH`)

## What to build

1. Branch `sn-self/03-operator-page` from current `master` after SN-SELF-02 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-self-service-copy.ts` with:
   - Heading `When you are stuck`.
   - Lead matching the Home lead.
   - Guardrail: `SecureNow does not change Azure. This page is not a support SLA.`
   - Four steps, titles exactly: `Collection missing or stale`, `Connector will not finish`, `No ranked path, or not verified`, `Still stuck`.
   - Hrefs: `/integrations/cloud-connections`, `/administration/connection-status`, `SECURENOW_REMEDIATION_FACTORY_PATH` (mention `SECURENOW_REMEDIATION_INSTANCES_PATH` in that step’s body), and `mailto:support@archlucid.net?subject=SecureNow`.
   - The third step’s body includes `Not verified` and states that a later capture, attestation, completed analysis, or postcondition is missing.
   - The fourth step’s body names tenant, workspace, subscription, collection time, and path id, and says not to paste secrets.
3. Add `archlucid-ui/src/app/(operator)/administration/securenow-self-service/page.tsx` and `SecureNowSelfServicePageView.tsx`. `data-testid="securenow-self-service-page"`. Follow the first-hour page shell: `OperatorPageContainer` and `OperatorPageHeader`. Each step with an in-product href renders `Open in product`. The mailto renders the visible label `Email support`.
4. In `PRODUCT_LINE_EXTRA_ASSIGNMENTS`, set `"/administration/securenow-self-service": "security"`.
5. Extend `product-line-catalog.test.ts`: the path is allowed for `security` and refused for `architecture`. Do not change the assertion that `/administration/support` stays architecture-only.

## Tests

Add `securenow-self-service-copy.test.ts` for the four titles, the mailto, `NO_GO` in the lead, no `$`, and no `Start trial`.

Add `SecureNowSelfServicePageView.test.tsx` that renders the four titles and a link named `Email support` whose href is the mailto.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not import the admin support page, and do not call `POST /v1/admin/support-bundle`.
- Do not add a sidebar or header item.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

A SecureNow operator can open `/administration/securenow-self-service`, read the four checks, and email `support@archlucid.net`. An architecture-review host cannot open that route.
