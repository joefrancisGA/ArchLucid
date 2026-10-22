# SN-MENU-01 — Regroup the generic SecureNow sidebar

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** nothing.

## Goal

The SecureNow sidebar follows the security architect's workflow. Home stands alone at the top. Findings are one group. Setup chores sit together under Data sources near the bottom.

## Why

Today `reshapeNavGroupsForSecureNow` builds **Security** (Home plus four remediation links), **ARC-AMPE Compliance** (packs, rules, all findings, audit evidence), **Infrastructure** (eight links mixing setup and exploration), and **Integration** (Azure connections plus ticketing). `Assigned to Me` and `Findings` are in different groups. `Connection status` is under Administration. Home reads as one remediation tool among five.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts`
- `archlucid-ui/src/lib/product-line/filter-nav-groups-for-product-line.ts` and its test
- `archlucid-ui/src/lib/product-line/securenow-home-nav-order.test.ts`
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts`, `securenow-compliance-home-copy.ts`, `securenow-infrastructure-home-copy.ts`, `securenow-home-destination-rows.ts`
- `archlucid-ui/src/lib/nav-shell-visibility.ts` (`listNavGroupsVisibleInOperatorShell`)
- `archlucid-ui/src/lib/sidebar-nav-active-group-expansion.test.ts`
- `archlucid-ui/src/lib/resolve-nav-link-for-pathname.ts`
- `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`
- `scripts/ci/data/route_tier_policy_nav_registry.json`

## What to build

Replace the four SecureNow clusters with these groups, in this order. Hrefs are the SecureNow hrefs the reshape already remaps to.

| Order | Group id | Group label | Links in order |
|-------|----------|-------------|----------------|
| 1 | `securenow-home` | *(no visible group label; render as a single top link)* | `/` |
| 2 | `securenow-findings` | Findings | `/security/assigned-to-me`, `/compliance/findings` |
| 3 | `securenow-environment` | Environment | `/infrastructure/resources`, `/infrastructure/diagrams`, `/infrastructure/diagram-reconcile`, `/infrastructure/snapshots-drift`, `/infrastructure/ask`, `/infrastructure/terraform` |
| 4 | `securenow-remediation` | Remediation | `/security/remediation-factory`, `/security/remediation-patterns`, `/security/remediation-instances` |
| 5 | `securenow-compliance` | Compliance | `/compliance/policy-packs`, `/compliance/standards-and-rules`, `/compliance/audit-evidence` |
| 6 | `securenow-data-sources` | Data sources | `/integrations/cloud-connections`, `/infrastructure/declared-connections`, `/administration/connection-status`, `/infrastructure/extract-upload` |
| 7 | `securenow-integrations` | Integrations | `/integrations/jira`, `/integrations/servicenow`, `/integrations/teams` |
| 8 | `operator-admin` | Administration | Existing links, minus `/administration/connection-status` in the SecureNow shell only |

If the shell has no pattern for a group with a single link and no heading, keep Home as the first link of a group labelled `Overview` and say so in the session summary. Do not invent a new sidebar component for it.

Keep link labels as they are in this session. SN-MENU-02 renames them. Keep `Azure connections` as the label for `/integrations/cloud-connections`.

Keep exporting href lists in display order, one constant per group, replacing `SECURENOW_SECURITY_NAV_HREFS`, `SECURENOW_COMPLIANCE_NAV_HREFS`, `SECURENOW_INFRASTRUCTURE_NAV_HREFS`, and `SECURENOW_INTEGRATION_NAV_HREFS`. Update every import. Keep the group-id constants exported so other modules do not hard-code strings.

Reorder the SecureNow Home destination rows so `securenow-home-nav-order.test.ts` still holds: Home rows appear in the same order as the matching sidebar links. Do not change Home copy beyond order in this session. SN-MENU-04 rebuilds Home.

Active-group expansion and `resolveNavLinkForPathname` must still highlight the right link for every SecureNow route, including the moved `Connection status` link.

The Architecture shell is unchanged. `/administration/connection-status` stays under Administration there.

## Tests

1. Update `filter-nav-groups-for-product-line.test.ts` so the security product line returns the eight groups above, in order, with the hrefs above, in order.
2. The Architecture product line returns the same groups and hrefs as before this session.
3. `Connection status` appears under Data sources and not under Administration in the SecureNow shell, and under Administration in the Architecture shell.
4. Sidebar icon uniqueness tests in the same file still pass.
5. `securenow-home-nav-order.test.ts` passes with the reordered Home rows.
6. Active-group expansion picks Data sources for `/administration/connection-status` in the SecureNow shell.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One exported component or class per file. Keep functions small.
- From `archlucid-ui`, run the product-line and sidebar Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not move or rename any route.
- Do not hide a review workspace tab behind More.
- Do not commit.

## Done when

The SecureNow sidebar shows Home, then Findings, Environment, Remediation, Compliance, Data sources, Integrations, and Administration, with the links above. The Architecture sidebar is unchanged.
