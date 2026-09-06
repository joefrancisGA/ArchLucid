# DA-07 — Inventory: showing N of M (Working defaults)

**Do not fork DA-04** except to consume `totalCount`. **Do not** silently raise page size without a remaining-count line. This prompt closes the **first-20 livelihood miss**.

## Goal

Working professional lists cannot imply completeness when they are paged.

1. Reviews hub (`load-runs-page-model.ts`): default page size **50** on Working (keep 20 on Guided/eval if you must; prefer 50 everywhere if cheaper). Max stays 200.
2. Visible **Showing {n} of {total}** (self-describing counts — TB-2152) when `total > n` or `hasMore`.
3. Architecture desk child reviews (DA-04) use the same count contract.
4. Policy-pack dry-run default 20: if the control is a **career** preview of what a pack would do, add showing N of M; do not silently cap. If it is a sample preview, the label must say **sample** (claim discipline).
5. Do not change ADR export here (DA-11).

## Why

Walking into an ARB with twenty rows while forty exist is a career defect. Casual dashboards paginate quietly. Livelihood desks shout incompleteness.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/load-runs-page-model.ts`
- `architecture-runs-list.ts` / `take=20`
- `POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE`
- `useProductionDeskChrome` / `useWorkspaceMode`
- TB-2152 self-describing metric counts

## What to build

1. Shared copy helper for “Showing {loaded} of {total}” (or “Showing first {n}. {more} more”) — one module, sentence case.
2. Wire reviews hub + identity child table.
3. Vitest: total 47, page 50 → no incompleteness shout (all fit); total 47, page 20 → shout. Working default is 50.
4. Do not add infinite scroll as a substitute for the count.

## Acceptance criteria

- Working reviews hub with 21 packages cannot look like a complete inventory.
- Guided may keep 20 **if** the same showing-N-of-M line is present.

## Constraints

- No fake totals. If the API lacks `totalCount`, add it (DA-03 already requires it for identities; runs list may already have `hasMore` — use that honestly).
- Do not implement N-way compare.
