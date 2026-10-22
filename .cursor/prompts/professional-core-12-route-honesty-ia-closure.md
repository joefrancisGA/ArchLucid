# PC-12 — Route honesty: sealed index, evidence names, palette ⊆ nav

**Do not fork IA assessment wholesale** — implement IA-006 + IA-011 + signed-records P0. **Do not fork CD-08** Guided palette dual map — Working only here. **Do not restore** system breadcrumbs (TB-2090).

## Goal

**Working mode only:**

1. **`/signed-records` list** — index page exists (or honest redirect to architectures desk sealed children); no customer 404.
2. **Evidence naming** — one customer noun **Evidence graph** on nav, breadcrumbs, palette, and default page title; “Evidence trail” reserved for prose/help (TB-2097).
3. **Command palette** — navigation rows match `useOperatorShellNavRows` visibility (SD-11); no hidden Insights route the sidebar omits at current unlock phase.
4. Demote duplicate sponsor/reporting **nav** entries where permanent redirect already exists — do not delete marketing routes.

## Why

Route sprawl trains evaluators to hunt URLs. A desk has one map; muscle memory (Ctrl+K) must match the sidebar.

## Context

- `docs/architecture/information_architecture_assessment_and_backlog.md` IA-006, IA-011, finding #1
- `breadcrumb-map.ts`, `i18n.ts`, command palette registry
- `sealed-desk-11-palette-matches-working-nav.md`
- `manifests/page.tsx` or new index

## What to build

1. Sealed records index or documented redirect with list UI.
2. Grep four evidence names; unify to TB-2097 split.
3. Palette filter test: Working Overview palette ⊆ sidebar href set (+ explicit Search / Report Problem exceptions).
4. Vitest inventory files.

## Acceptance criteria

- Trim URL from sealed detail does not 404.
- Ctrl+K does not offer destinations Working nav hides.

## Constraints

- Desktop review tabs full strip. Guided may keep teaching destinations in palette.
