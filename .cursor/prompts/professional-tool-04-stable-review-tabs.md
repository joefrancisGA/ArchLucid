# PT-04 — Stable review workspace tabs and labels (no lifecycle re-ranking)

## Goal

Desktop review workspace tabs keep a **fixed order, fixed labels, and full visibility** across create-home → draft → analysis → complete → sealed. Lifecycle may change the **default** tab, not which tabs exist, how they are ranked, or what they are called. Do not put desktop tabs behind **More**.

## Why

Professionals live in the review workspace. Review-detail resolution already returns all tabs with empty `moreTabIds` (`resolve-review-detail-visible-tabs.ts`). Create-home still calls `splitReviewWorkspaceTabsByStage("draft", …)` (`resolve-review-workspace-visible-tabs.ts`), which puts leftover ids in `moreTabIds`. `ReviewWorkspaceTabStrip.tsx` still renders an **Additional** divider when `moreTabIds` is non-empty. Tests in `ReviewWorkspaceTabStrip.test.tsx` and `usability-consolidation.test.ts` still encode primary-vs-more and “promote Activity during analysis.” `resolveReviewWorkspaceTabLabel` switches copy between create-home and committed. Muscle memory is the point of all-day software. Product direction already rejects collapsing rare tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).

## Context

- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts` — canonical tab ids/labels
- `archlucid-ui/src/lib/resolve-review-detail-visible-tabs.ts` — already stable for committed review-detail
- `archlucid-ui/src/lib/resolve-review-workspace-visible-tabs.ts` — create-home still splits
- `archlucid-ui/src/lib/resolve-review-workspace-tab-label.ts`
- `archlucid-ui/src/lib/usability/usability-consolidation.ts` — `REVIEW_WORKSPACE_PRIMARY_TABS_BY_STAGE`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceTabStrip.tsx`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceMoreTabsMenu.tsx` (unused on desktop; do not wire it back)

## What to build

1. Create-home: render **all** authorized tabs in a **single stable order** (prefer `CREATE_HOME_REVIEW_WORKSPACE_TAB_IDS` / `REVIEW_DETAIL_TAB_IDS`). `moreTabIds` empty on desktop resolution.
2. Remove the desktop **Additional** grouping/divider. Keep the mobile `<select>` (viewport constraint). If you keep optgroups on mobile, do not imply second-class sections — one flat list is better.
3. Keep stage-based **default landing tab** (e.g. Activity while analysis runs) — that is a focus choice, not a visibility or label choice.
4. Use one label per tab id across create-home and committed unless the tab *meaning* actually differs. Prefer `REVIEW_DETAIL_TAB_LABELS`. If create-home must keep architecture-workspace wording, document the two-id mapping; do not silently rename Findings ↔ something else as the package moves.
5. Update `usability-consolidation` tests so they no longer require a primary/more split for md+. `splitReviewWorkspaceTabsByStage` may remain as a library helper if create-home stops calling it for visibility.
6. Do **not** introduce a **More sections** menu on desktop.
7. Vitest: every lifecycle (including create-home) exposes the same tab ids in the same order; labels do not flip for the same `reviewTab`; mobile select still lists all sections.

## Acceptance criteria

- An architect who memorizes tab positions on a draft sees the same positions after finalize.
- Desktop never uses `ReviewWorkspaceMoreTabsMenu` and does not show the Additional divider on create-home.
- Deep links `?reviewTab=` still resolve.
- Keyboard/focus order unchanged except for the removed Additional chrome.

## Constraints

- **Forbidden:** hiding “rare” tabs behind More/overflow to save chrome.
- Do not reduce tab count; clarify labels only if a current label is wrong (sentence case, vocabulary).
