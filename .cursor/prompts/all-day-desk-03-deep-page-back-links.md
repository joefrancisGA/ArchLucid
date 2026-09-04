# AD-03 — Deep pages keep explicit back links in both shells

**Do not fork TB-2090 and do not restore breadcrumbs.** Owner removed shell/page breadcrumb trails. Wayfinding is left nav + page titles + **explicit back links**. This file is the leftover **inversion**: `FindingDetailWayfinding` returns `null` in buyer-polished shells, while audit still mounts `AuditPageBreadcrumb` only when `buyerPolishedShell` is true.

## Goal

On finding inspect, sealed-record artifact review, and audit (when a run id is in scope), show **one explicit parent link** (Back to review / Back to findings / Open this package) in **Working and buyer-polished**. Do not render `OperatorPageBreadcrumb` trails. Do not gate those parent links on `isBuyerPolishedOperatorShellEnv()`.

## Why

All-day work is nested: package → findings → inspect → audit. Casual eval chrome hides hierarchy for a demo screenshot. A professional who lives on inspect still needs a parent hop without reconstructing it from the sidebar. TB-2090 forbids crumb *trails*, not parent *links*.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/FindingDetailWayfinding.tsx` — hidden when buyer-polished
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/FindingDetailBreadcrumb.tsx` — leftover crumb component; do not revive as a trail
- `archlucid-ui/src/app/(operator)/governance/audit/_sections/AuditPageView.tsx` — `breadcrumb={buyerPolishedShell ? <AuditPageBreadcrumb /> : undefined}`
- `docs/library/UI_DESIGN_SYSTEM.md` — page-header Help; `OPERATOR_LINK.nav`
- CD-04 owns eval chrome leftovers on print/inspect — this prompt is **parent links**, not eval widgets

## What to build

1. Finding inspect: always render `FindingDetailWayfinding` (or equivalent parent links) in both shells. Keep `PageContextualHelpButton` once (do not duplicate headers).
2. Audit: when a run id is in scope, add an explicit “Open this review” / “Back to review” link in the page header actions — **not** a crumb trail. Full operator must get the same parent hop.
3. Do not add crumbs to administration child pages (TB-2094). Do not add a Settings back arrow.
4. Vitest: finding inspect in buyer-polished and operator shells exposes `finding-detail-back-to-review`. Audit with a run id exposes a parent review link in both shells.

## Acceptance criteria

- A Working architect on inspect can return to the package without using the sidebar.
- Buyer-polished does not lose that hop.
- No breadcrumb trail component is reintroduced as the primary wayfinding model.

## Constraints

- **Do not** restore `breadcrumb-map.ts` as a product surface.
- Do not collapse review tabs.
- Do not implement CD-04 eval-widget remounts here.
