# PT-04 — Stable review workspace tabs (no lifecycle re-ranking)

## Goal

Desktop review workspace tabs keep a **fixed order and full visibility** across draft → analysis → complete → sealed. Lifecycle may change the **default** tab, not which tabs exist or how they are ranked. Do not put desktop tabs behind **More**.

## Why

Professionals live in the review workspace. `splitReviewWorkspaceTabsByStage` in `archlucid-ui/src/lib/usability/usability-consolidation.ts` still splits tabs into primary vs “more” by stage. `ReviewWorkspaceTabStrip.tsx` renders “primary” then an **Additional** divider then the rest. Labels and rank jump as the package moves. Muscle memory is the point of all-day software. Product direction already rejects collapsing rare tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).

## Context

- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts` — canonical tab ids/labels
- `archlucid-ui/src/lib/resolve-review-detail-visible-tabs.ts`
- `archlucid-ui/src/lib/usability/usability-consolidation.ts` — `REVIEW_WORKSPACE_PRIMARY_TABS_BY_STAGE`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceTabStrip.tsx`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceMoreTabsMenu.tsx` (unused on desktop; do not wire it back)

## What to build

1. Desktop strip: render **all** authorized tabs in a **single stable order** (the `REVIEW_DETAIL_TAB_IDS` order unless you have a documented reason to pick a different *fixed* order). Same order in draft, in-progress, and sealed.
2. Remove the desktop **Additional** grouping/divider that implies second-class tabs. Keep the mobile `<select>` (viewport constraint).
3. Keep stage-based **default landing tab** if it helps (e.g. Activity while analysis runs) — that is a focus choice, not a visibility choice.
4. `moreTabIds` should be empty on desktop resolution. Update `usability-consolidation` / resolvers / tests so they no longer encode a primary/more split for md+.
5. Do **not** introduce a **More sections** menu on desktop.
6. Vitest: every lifecycle stage exposes the same tab ids in the same order; mobile select still lists all sections.

## Acceptance criteria

- An architect who memorizes tab positions on a draft sees the same positions after finalize.
- Desktop never uses `ReviewWorkspaceMoreTabsMenu`.
- Deep links `?reviewTab=` still resolve.
- Keyboard/focus order unchanged except for the removed Additional chrome.

## Constraints

- **Forbidden:** hiding “rare” tabs behind More/overflow to save chrome.
- Do not reduce tab count; clarify labels only if a current label is wrong (sentence case, vocabulary).
