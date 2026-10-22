# LS-10 — Eight-hour workbench zoom: identity stays on screen

**Do not fork WA-24, FD-09, AD-07, or AD-12.** Shell scrollport, review-detail zoom, reviews-hub sticky title/status, and governance queue sticky identity shipped. This file is the leftover **three-column workbench** at 1280px and 200% zoom: architecture / findings / evidence clip the finding title or diagram so the daily loop requires horizontal scavenger hunts.

## Goal

At `lg` 1280px and at 200% zoom (FD-09 fixture pattern), each workbench column keeps a readable identity: diagram still shows a selected node label or honest empty; findings column shows title + severity; evidence column shows “linked evidence” or the existing no-link line. Horizontal scroll inside a column is allowed; the **selected finding title** must not require scrolling the whole page sideways. Do **not** hide review-detail tabs behind More.

## Why

People work all day, often on laptop zoom. Casual dashboards fail zoom. A livelihood instrument stays Carbon-dense and still scannable.

## Context

- `ReviewWorkbenchLayout.tsx`
- `operator-shell-eight-hour-zoom.test.tsx` (FD-09) — extend or add workbench fixture
- `ARCHITECTURE_FINDINGS_DUAL_PANE_*` empty copy
- `OPERATOR_TYPOGRAPHY` — do not add `text-[10px]`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Workbench columns: min-width + overflow **inside** the column, not a page-wide x-scroll that hides tabs.
2. Selected finding title remains in the findings column header or sticky row.
3. Reduced-motion: no essential selection state only in animation (WA-24).
4. Vitest: 200% / narrow fixture still finds finding title + tab strip; `moreTabIds` empty.

## Acceptance criteria

- A Working architect at 200% zoom can see which finding is selected without hiding tabs.
- All three columns remain reachable (scroll inside column ok).
- No desktop More menu.

## Constraints

- Do not delete evidence or architecture columns to “fit.”
- Do not add pastel fills.
