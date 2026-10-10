# SN-ED-04 — Edition nav overlay seam

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-ED-01 and SN-MENU-01.

## Goal

An edition can add its own sidebar groups after the generic SecureNow groups and before Administration, without the generic reshape knowing about them. The UHG overlay ships empty.

## Why

The UHG edition will later add groups for topics such as Kubernetes, Snowflake, BI, identity, and ADF. Those must not be hard-coded into `reshapeNavGroupsForSecureNow`, and UHG-specific code should live under its own folder so it can be reviewed and separated on its own.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts`
- `archlucid-ui/src/lib/product-line/filter-nav-groups-for-product-line.ts`
- `archlucid-ui/src/lib/nav-config.types.ts`
- `archlucid-ui/src/lib/product-line/product-line-path-access.ts`
- The SN-ED-01 edition modules

## What to build

- `archlucid-ui/src/lib/editions/securenow-edition-nav-overlay.ts`: the `SecureNowEditionNavOverlay` type, a function that takes the reshaped rows and returns rows with edition groups inserted after `securenow-integrations` and before `operator-admin`, and an exhaustive switch that picks the overlay for an edition.
- `archlucid-ui/src/lib/editions/generic/securenow-generic-nav-overlay.ts`: returns no groups.
- `archlucid-ui/src/lib/editions/uhg/securenow-uhg-nav-overlay.ts`: returns no groups. A one-line comment says edition-only groups are added here.
- Call the overlay from `filterNavGroupsForProductLine` for the security product line, after the reshape and before the Administration merge.

An overlay group's links still go through product-line path access. A link whose href is not assigned to `security` is dropped, the same as any other link.

Do not add placeholder pages, empty groups, or "coming soon" links.

## Tests

1. With both overlays empty, the SecureNow sidebar equals the SN-MENU-01 result for both editions.
2. A test-only overlay with one group lands after Integrations and before Administration.
3. A test-only overlay link whose href is not assigned to `security` is dropped.
4. The Architecture sidebar is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- From `archlucid-ui`, run the product-line and edition Vitest files and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

The UHG edition has a place to add its own sidebar groups, it adds none yet, and nothing visible changed.
