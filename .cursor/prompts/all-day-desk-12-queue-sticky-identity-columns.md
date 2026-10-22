# AD-12 — Virtualized queues keep identity columns visible at working width

**Do not fork AD-07** (reviews hub layout) if that session already sticky-pinned title+status. This file is the leftover **findings queue + audit table**: `GovernanceFindingsQueueDesktopTable` virtualizes in `max-h-[min(32rem,70vh)]`; keyboard j/k exists; grouped-by-resource **drops** row keyboard nav. Identity (title / severity) can clip while the virtual body scrolls.

## Goal

On governance findings (tenant and assigned-to-me) and audit events tables, pin or min-width **title + severity** (findings) and **when + event** (audit) so an eight-hour scan at 1280px does not lose the finding name. Keep virtualization thresholds. Do not restore keyboard nav in group-by-resource without a documented alternative (the helper already explains the trade). Do **not** collapse review-detail tabs.

## Why

Professionals live in queues. Virtualization was built for scale. Scale without sticky identity is a spreadsheet that hides the row you are on. Group-by-resource already warns that j/k is off — leave that honesty.

## Context

- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable.tsx`
- `GovernanceFindingsQueueVirtualizedTableBody.tsx`
- `archlucid-ui/src/app/(operator)/governance/audit/_sections/AuditEventsOperatorTable.tsx`
- `use-enterprise-table-keyboard-nav.ts`
- `GOVERNANCE_FINDINGS_QUEUE_KEYBOARD_HINT_AT`

## What to build

1. Sticky or min-width identity cells in virtualized findings and audit tables (CSS `sticky` on first data columns, matching pin column on reviews if AD-07 already did that pattern).
2. Keep j/k + Enter activation. When `groupByResource`, keep the existing honesty line — do not silently re-enable broken keyboard.
3. Vitest: virtualized table still exposes title/severity headers; a layout test or class assertion covers sticky/min-width. Keyboard region test still passes.

## Acceptance criteria

- At 1280px, a focused findings row still shows severity + title without relying only on horizontal scroll.
- Group-by-resource warning remains when keyboard nav is off.
- Virtualization thresholds unchanged unless you must for sticky math — document if you raise `max-h`.

## Constraints

- Do not hide desktop review-detail tabs.
- Do not remove bulk select.
- Do not add live presence to the queue (AD-06).
