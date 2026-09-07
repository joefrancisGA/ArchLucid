# PL-04 — Route gate honesty after a shuffle

**Do not** hide `/help`, `/account`, `/auth`, `/403`. **Do not** collapse desktop review tabs. **Do not** treat this as a permissions/entitlements rewrite (authority policies stay). **Do not** “fix” pre-existing Command Palette Ctrl+K listener tests or `NODE_ENV=test` system-admin emptying as product-line work.

## Goal

After destinations move in the catalog (PL-03), deep links and settings leftovers must match the shell:

1. `ProductLineRouteGate` sends Architecture-only paths in the Security shell to Security home (or a short “not in this product” state — reuse existing gate; do not add a marketing interstitial).
2. Settings hub / command palette / shortcut navigation already filter via the catalog — grep for leftover hardcoded Architecture hrefs that still render in Security.
3. Nested resource routes under `/governance/infrastructure` stay allowed in Security.
4. Recycle bin (`/administration/...` recycle path in the catalog) stays blocked in Security if still assigned `architecture`.

## Why

A shuffle that hides a sidebar row but leaves the page reachable (or worse: leaves a Settings card that  bounce-loops) makes the two windows feel buggy rather than productized.

## Context

- `archlucid-ui/src/components/product-line/ProductLineRouteGate.tsx` + `.test.tsx`
- `archlucid-ui/src/lib/product-line/product-line-path-access.ts`
- `archlucid-ui/src/app/(operator)/administration/_sections/SettingsPageView.tsx`
- `archlucid-ui/src/app/(operator)/administration/_sections/settings-master-page-model.ts`
- Command palette + `useShortcutNavigation` + `useOperatorShellNavRows`
- `archlucid-ui/src/lib/nav-shell-visibility.ts` — Security **skips** committed-review gate; do not reintroduce that gate for Infrastructure.

## What to build

1. Inventory leftover Architecture CTAs visible in Security (settings cards, empty-state links, home switch bar). Fix by catalog assignment or product-line filter — do not clone pages.
2. Vitest for any path you change: allowed nested prefix, exact architecture-only bounce, always-allowed help/account.
3. If a settings section becomes empty in Security, hide the section header (no empty “AI usage” slab).

## Acceptance criteria

- Security window: Infrastructure deep link works; Architecture review deep link does not stay on an Architecture page.
- Architecture window unchanged for those same deep links.
- No new authority policies. No desktop tab overflow menu.

## Constraints

- One component per file. Check nulls. Sentence case.
- Commit on the named product-line branch. Do not stage unrelated failing nav tests.
