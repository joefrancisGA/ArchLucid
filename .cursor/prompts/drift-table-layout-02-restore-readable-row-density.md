# IE-DT-02 — Restore readable drift-table row density after layout works

**Wave:** drift-table-layout (**IE-DT**). **Depends on:** IE-DT-01 on the branch or trunk. **Do not** implement IE-DT-03–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Once table-row layout is restored, the Drift & snapshots change table must look like a Carbon inventory: one resource per row, 13px type, Change/Risk tags fully inside their cells, header visible while scrolling. Do not re-introduce `content-visibility` to “help” 100 rows.

## Why

IE-DT-01 stops overlapping paint. Residual risk after 01: long ARM-derived names still wrap character-by-character if cells have `max-w-xs` without `min-w-0` / `break-words`, `StatusTag` overflows, and a 100-row table loses its header as soon as the operator scrolls. Owner screenshot 2026-09-13 was unreadable; after 01 it must be **usable**, not merely non-overlapping.

`DriftChangeResourceCells` already uses `max-w-xs` on the name cell. That is fine if the table algorithm assigns real column widths. Confirm wrap is `break-words` / `overflow-wrap`, not `break-all` that recreates 1-character columns.

## Context

- `archlucid-ui/src/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx` — `EnterpriseTable ariaLabel="Inventory drift changes"`; `CHANGES_PAGE_SIZE = 100`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/drift/DriftChangeResourceCell.tsx`
- `archlucid-ui/src/lib/design-tokens-shell-chrome.ts` — `DESIGN_TOKENS.table.cell` (`px-3 py-3 align-top text-[13px] leading-snug`)
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` — column labels (Resource, Resource group, Resource type, …)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.test.tsx`
- `docs/library/UI_DESIGN_SYSTEM.md` — inventory kind; sticky header is allowed on scale-table **without** a new dialect if implemented on `DESIGN_TOKENS.table`

## What to build

1. Confirm IE-DT-01 landed (`DESIGN_TOKENS.table.row` has no `content-visibility`). If not, stop and say IE-DT-01 is missing — do not duplicate 01 here.
2. Table header: make `EnterpriseTableHead` / `headRow` **sticky** at `top-0` **inside** `DESIGN_TOKENS.table.shell` (`overflow-x-auto`) with a solid `bg-neutral-100` (already on `headRow`) and `z-10` so 100 drift rows can scroll under a visible Resource / Change / Risk header. Prefer a token-level sticky on `headRow` or `thead` so Reviews / findings inherit it — that is Carbon-normal. If sticky on the shared token breaks a nested table, scope a `className` on the drift table head only and document why in a two-year-developer comment.
3. Cells: keep `text-[13px] leading-snug`. On the resource name cell, replace any `break-all` with `break-words`. Do not set `text-[10px]` or `leading-none` on cells. Status/severity tags stay `StatusTag` / `SeverityTag` — no wrap that clips the label.
4. Do not drop `CHANGES_PAGE_SIZE` below 100 to fake density. Load more stays. Empty states stay `EnterpriseCompactEmptyState`.
5. Tests in `DriftWorkbenchClient.test.tsx` (extend, do not rewrite):
   - With mocked snapshots + diffs + ≥3 changes, the table has `role="table"` named “Inventory drift changes”.
   - Column headers Resource, Resource group, Resource type, Change, Property, Risk are present (`getByRole('columnheader')` or the sort buttons already asserted).
   - Change type still renders via `StatusTag` (existing test around “Resource type” / change labels).
   - If you add sticky classes on the drift head or shared `headRow`, assert the class string includes `sticky`.
6. Do **not** add `content-visibility` anywhere in this prompt.

## Acceptance criteria

- Drift table with several mocked rows shows one discrete row per `changeId`.
- Type stays 13px. Tags are not clipped to a single letter.
- Header remains the first visual row of the table chrome when the body is long (sticky or equivalent documented).

## Constraints

- Working-tree safety before tracked edits.
- **Do not** implement IE-DT-03 source grep ratchet or IE-DT-04 Playwright (except you may add Vitest here).
- **Do not** hide columns, collapse desktop review tabs, or fork a `DriftTable` component.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Verification: from `archlucid-ui/`, `npx vitest run src/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.test.tsx src/components/ui/enterprise-table.test.tsx`.
