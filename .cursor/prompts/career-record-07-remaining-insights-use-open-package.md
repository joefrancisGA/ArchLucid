# CR-07 — Remaining insights shortcuts use the open package

**Do not fork LS-05** (resolver: path run id, else last-open). **Do not fork WA-05 / RS-08** (compare href when run id is already in the path). **Do not fork LS-06** (what-if execute). This file is leftover **call sites** that still navigate to empty Ask / Compare / evidence-graph after `resolveOpenPackageRunId` exists.

## Goal

Every Working shortcut, palette row, and sidebar insights link uses `resolveOpenPackageRunId` (or `resolve-working-insights-nav-href`). Empty two-GUID Compare and empty Ask are fallbacks only when no package can be resolved. Guided may keep empty tools as teaching.

## Why

LS-05 can land the helper while Alt+A from the findings queue still opens a blank Ask. Leaving the desk to re-identify the package is casual-site navigation.

## Context

- `archlucid-ui/src/lib/resolve-open-package-run-id.ts` (already exists — reuse)
- `resolve-working-insights-nav-href.ts` / tests
- `useShortcutNavigation.ts` — remaining branches that still use bare `/insights/...`
- Command palette global insight rows (`command-palette-actions.ts`)
- Sidebar nav href builders (`pilot-nav-group-builder.ts`)
- `SHORTCUTS` Ask / Compare / graph

## What to build

1. Grep Working nav/shortcut/palette for `/insights/ask-review-questions`, `/insights/compare-two-reviews`, `/insights/evidence-graph` without the resolver.
2. Wire remaining call sites. Path-scoped review still wins over last-open.
3. When null: keep the tool route but lead with “Open a package first” — do not invent a run id.
4. Vitest: one remaining call site per surface (shortcut, palette, sidebar). Guided unchanged.

## Acceptance criteria

- Working Alt+C from Home with last-open run includes the base run in the href.
- No hallucinated run ids.
- Desktop tabs unchanged.

## Constraints

- Do not put secrets in the URL.
- Do not implement **M-174** claim language.
- Do not fork LS-06.
