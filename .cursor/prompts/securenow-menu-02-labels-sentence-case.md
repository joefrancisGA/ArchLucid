# SN-MENU-02 — SecureNow labels in sentence case

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-MENU-01. The eight SecureNow groups already exist. Do not rebuild them.

## Goal

Every SecureNow sidebar label says what the user gets, in sentence case. The page title, breadcrumb, and help page title for each route use the same words.

## Why

`secureNowTitleCase` turns `Assigned to me` into `Assigned to Me` and `Policy packs` into `Policy Packs`, while Administration stays `Users & roles`. The design standard asks for sentence case. `Remediation factory` and `Remediation instances` describe implementation, not outcomes.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts`
- `archlucid-ui/src/lib/product-line/securenow-title-case.ts` and its test
- `archlucid-ui/src/lib/i18n.ts` (`OPERATOR_NAV_LINK_LABELS`, `OPERATOR_NAV_GROUP_LABELS`)
- `archlucid-ui/src/lib/product-line/securenow-infrastructure-home-copy.ts` (`SECURENOW_INFRASTRUCTURE_DRIFT_LABEL`)
- `archlucid-ui/src/lib/route-static-titles.ts` and `route-titles.test.ts`
- `archlucid-ui/src/lib/help/help-operator-page-title-parity-contract.ts`
- `archlucid-ui/src/lib/operator/operator-nav-labels.ts`
- `archlucid-ui/src/lib/shell-header-search-label.ts`
- `archlucid-ui/src/lib/command-palette-buyer-curated-tasks.ts`
- `docs/library/UI_DESIGN_SYSTEM.md` § Capitalization

## What to build

Add one SecureNow label map, keyed by SecureNow href, in its own module under `archlucid-ui/src/lib/product-line/`. The reshape applies it to SecureNow links only.

| Href | SecureNow label |
|------|-----------------|
| `/` | Home |
| `/security/assigned-to-me` | My findings |
| `/compliance/findings` | All findings |
| `/infrastructure/resources` | Resources |
| `/infrastructure/diagrams` | Diagrams |
| `/infrastructure/diagram-reconcile` | Diagram reconciliation |
| `/infrastructure/snapshots-drift` | Changes & drift |
| `/infrastructure/ask` | Ask about your environment |
| `/infrastructure/terraform` | Terraform mapping |
| `/security/remediation-factory` | Priorities & waves |
| `/security/remediation-patterns` | Fix playbooks |
| `/security/remediation-instances` | Remediation tracker |
| `/compliance/policy-packs` | Frameworks |
| `/compliance/standards-and-rules` | Effective rules |
| `/compliance/audit-evidence` | Audit evidence |
| `/integrations/cloud-connections` | Azure connections |
| `/infrastructure/declared-connections` | Declared connections |
| `/administration/connection-status` | Connection status |
| `/infrastructure/extract-upload` | Manual upload |
| `/integrations/jira` | Jira |
| `/integrations/servicenow` | ServiceNow |
| `/integrations/teams` | Microsoft Teams |

Stop applying `secureNowTitleCase` to SecureNow group labels and link labels. If nothing else imports it after this change, delete the module and its test. If something else still imports it, leave it and list the callers in the session summary.

Replace `SECURENOW_INFRASTRUCTURE_DRIFT_LABEL` (`Snapshots & Drift`) with `Changes & drift`, and update its test.

The page `<h1>`, document title, breadcrumb, and in-app help page title for each SecureNow route above use the SecureNow label when the security product line is active. Use the existing product-line-aware title path. If a route has no product-line-aware title path, add the SecureNow title through the same mechanism other SecureNow routes already use. Do not fork page components to change a title.

The command palette and header search use the SecureNow label for these routes in the SecureNow shell.

The Architecture shell keeps every current label.

## Tests

1. Every SecureNow sidebar link label equals the table value.
2. No SecureNow sidebar label contains an uppercase letter after the first word, except proper nouns: `Azure`, `Jira`, `ServiceNow`, `Microsoft Teams`, `Terraform`.
3. Route title tests return the SecureNow label for each route in the security product line and the old label in the architecture product line.
4. The help title parity contract passes for both product lines.
5. The command palette lists `My findings` in the SecureNow shell and `Assigned to me` in the Architecture shell.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not change `OPERATOR_NAV_LINK_LABELS` values. The Architecture shell owns them.
- Do not re-case vocabulary with CSS or string transforms.
- From `archlucid-ui`, run the Vitest files you touched, the route title tests, and `npx tsc --noEmit -p tsconfig.json`.
- Do not move or rename any route.
- Do not commit.

## Done when

The SecureNow sidebar, page titles, breadcrumbs, help titles, and palette entries read `My findings`, `Priorities & waves`, `Frameworks`, `Manual upload`, and the rest of the table, in sentence case. The Architecture shell reads as before.
