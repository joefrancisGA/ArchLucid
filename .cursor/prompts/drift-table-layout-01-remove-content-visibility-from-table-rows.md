# IE-DT-01 — Remove `content-visibility` from EnterpriseTable rows

**Wave:** drift-table-layout (**IE-DT**). **Depends on:** none (token + CSS). **Do not** implement IE-DT-02–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`EnterpriseTable` rows must participate in the CSS table layout algorithm again. Chromium must measure cells so columns have real widths and rows do not overlap. This is a shared-token fix: every inventory table, not a drift-only fork.

## Why

Owner screenshot 2026-09-13: Drift & snapshots (`/governance/infrastructure/drift`). Snapshot pickers readable. The change table is a wall of overlapping microscopic text.

Perf wave 8 added `.content-visibility-auto` (`content-visibility: auto; contain-intrinsic-size: auto 48px`) and put that class on `DESIGN_TOKENS.table.row`. `EnterpriseTableRow` applies it to `<tr>`. `content-visibility` / CSS containment is not a valid optimization for `display: table-row`: skipped cells are not measured, column widths collapse, paint still happens, text wraps to ~1 character and overlaps. `contain-intrinsic-size: auto 48px` does not repair table-row.

Do not “fix” by tuning the intrinsic size, adding `contain: inline-size`, or applying the class only when `rowCount > N`. Those still skip table measure.

## Context

- `archlucid-ui/src/lib/design-tokens-shell-chrome.ts` — `DESIGN_TOKENS.table.row`
- `archlucid-ui/src/app/globals.css` — `.content-visibility-auto` in `@layer utilities` (comment: “Skip offscreen paint/layout for dense EnterpriseTable rows (perf wave 8).”)
- `archlucid-ui/src/components/ui/enterprise-table.tsx` — `EnterpriseTableRow` uses `DESIGN_TOKENS.table.row`
- `archlucid-ui/src/components/ui/enterprise-table.test.tsx`
- `docs/library/UI_DESIGN_SYSTEM.md` § Operator populated lists — keep `EnterpriseTable`; do not invent a dialect
- Chromium: `content-visibility` on table-row / table-cell is a known broken combination (layout skipped, paint not)

## What to build

1. Remove `content-visibility-auto` from `DESIGN_TOKENS.table.row`. Keep `outline-none transition-colors hover:bg-[var(--al-layer-hover)] dark:hover:bg-neutral-800/80`. Do not add `flex`, `grid`, `block`, `absolute`, `h-0`, `leading-none`, or `text-[10px]` on the row.
2. Two-year-developer comment on `table.row` (or immediately above it): `content-visibility` on `<tr>` skips cell measure, collapses columns, and overlaps paint — never put it back on table-row.
3. In `globals.css`, either:
   - **Preferred:** delete `.content-visibility-auto` entirely if nothing else references it after step 1 (grep `content-visibility-auto` and `content-visibility:` under `archlucid-ui/`). Or
   - If some **non-table** list still needs it, keep the utility but change the comment to: not for `table`, `thead`, `tbody`, `tr`, `td`, `th`. Do not apply it from `DESIGN_TOKENS.table.*`.
4. Grep `archlucid-ui/` for `content-visibility` on table parts. If any page-local `className` re-adds it on `EnterpriseTableRow`, remove those too in this prompt.
5. Tests (fail on master, pass after) in `enterprise-table.test.tsx` or a sibling `enterprise-table-content-visibility.test.ts`:
   - `DESIGN_TOKENS.table.row` (and `headRow`, `cell`, `headCell`, `body`, `table`, `shell`) must **not** contain `content-visibility`.
   - Rendered `<tr>` from `EnterpriseTableRow` must not have class `content-visibility-auto`.
   - Existing “exposes grid semantics and column headers” test still passes.
6. Do **not** change `DriftWorkbenchClient` data fetching, paging, or copy. Do not touch `next.config.ts` React compiler memoization.

## Acceptance criteria

- `content-visibility` does not appear in `DESIGN_TOKENS.table.*`.
- A six-column `EnterpriseTable` with 20 body rows still exposes `role="table"` and 20 `role="row"` in the body (plus header row).
- No new table component. No virtualizer.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** implement IE-DT-02 sticky header, IE-DT-03 extra ratchets beyond the tests in *What to build*, or IE-DT-04 Playwright.
- **Do not** hide desktop review workspace tabs.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case.
- Verification: from `archlucid-ui/`, `npx vitest run src/components/ui/enterprise-table.test.tsx` plus any new sibling test file this prompt adds. No full UI build, no dev server.
