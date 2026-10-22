# AD-07 — Reviews hub scan layout: sticky identity, not fewer tabs

**Do not fork WA-14 hide-generic / findings density.** This is the leftover **reviews inventory table**: `ReviewsHubInventoryTable` has eleven columns (pin, review, architecture, status, approval, stage, owner, updated, findings, risks, actions). Virtualization exists. Horizontal clip at a working laptop width is the all-day failure.

## Goal

On `/architecture/reviews`, keep every column available (no hidden “More columns” that buries Status). Make **Review** (title) + **Status** sticky or otherwise visible at `lg` without horizontal scavenger hunts. Optional seat-scoped column **order** / compact density is allowed if it reuses WA-14 prefs — default must still show Status + title. Do **not** collapse review-detail workspace tabs.

## Why

Professionals scan a queue for hours. Casual dashboards dump every field. Carbon tables pin identity. Eleven equal columns with `overflow-x-auto` and a 32rem virtual viewport trains wrist-scroll, not judgment.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/ReviewsHubInventoryTable.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/ReviewsHubInventoryRow.tsx`
- Virtualization: `reviews-list-virtualization.ts` — keep it
- `EnterpriseTable` sticky header already used on findings virtualization (`sticky={useVirtualization}`)
- `.cursor/rules/no-collapse-workspace-tabs.mdc` — does **not** forbid column layout; it forbids hiding **review-detail tabs**

## What to build

1. Pin or min-width the title + status so they remain readable while other columns scroll, **or** a compact density that still shows those two without a menu.
2. If you add column prefs, reuse WA-14 storage; default layout must include Review + Status + Actions.
3. Empty/filter-empty states stay (`reviews-hub-inventory-empty`).
4. Vitest: table still lists Status header; a compact/sticky mode test does not drop the title link. No **More sections** on review-detail.

## Acceptance criteria

- A Working architect at 1280px can see which package and whether it is blocked without horizontal-only hunting for the title.
- All eleven data fields remain reachable (scroll or density), not deleted.
- Virtualization still applies above the existing row threshold.

## Constraints

- Do not hide desktop review-detail tabs.
- Do not remove Findings/Risks counts from the product — they may scroll.
- Do not add pastel status fills; keep `StatusTag`.
