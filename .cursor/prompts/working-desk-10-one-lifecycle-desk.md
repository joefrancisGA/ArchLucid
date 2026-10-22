# WD-10 — One lifecycle desk: find drafts, sealed records, stable places

**Do not fork PT-03 / PT-04 / PT-10** for Alt+N, tab ids, or Overview queue. This file is the residual: **drafts in Working nav**, sealed-record list that is not a 404, dual-path cards as one lifecycle.

## Goal

Working mode presents **one lifecycle** (draft → analysis → sealed record), not two peer products. Drafts are reachable from nav and Overview without deep-link archaeology. Sealed records have a list that is not a 404. Desktop review tabs keep **fixed order and labels** across create-home and committed. Do not put desktop tabs behind More.

## Why

IA assessment: home dual-path cards (“Create an architecture” / “Review an existing architecture”) contradict one `Run`; `/architecture/architectures` is not in the sidebar (`pilot-nav-group-builder.test.ts` expects the href **absent**); sealed-record list has a history of 404/orphan. Muscle memory is the point of all-day software. `resolveReviewWorkspaceVisibleTabs` already returns empty `moreTabIds` for create-home; `ReviewWorkspaceTabStrip` still renders Additional/optgroups when `moreTabIds` is non-empty; usability tests still encode primary-vs-more splits.

## Context

- `archlucid-ui/src/components/operator-home/OperatorHomeDualPathCards.tsx` + `buyer-polish-copy.ts`
- `archlucid-ui/src/lib/architecture/architecture-routes.ts` (`ARCHITECTURES_LIST_PATH`)
- `archlucid-ui/src/lib/pilot-nav-group-builder.ts` (and Working nav builders)
- Sealed list: `/governance/sealed-records` (SI traffic row); `docs/architecture/information_architecture_assessment_and_backlog.md` IA-001
- `resolve-review-workspace-visible-tabs.ts`, `resolve-review-workspace-tab-label.ts`
- `ReviewWorkspaceTabStrip.tsx`, `usability-consolidation.ts` `splitReviewWorkspaceTabsByStage`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`
- PT-03 / PT-04 / PT-10: this prompt is **IA + findability**, not Alt+N (already Working→draft)

## What to build

1. Working Overview: one primary CTA (resume last draft/review, else New review into the draft editor). Dual-path peer heroes only on Guided/empty-eval, and even there copy must say **one lifecycle, two doors**.
2. Working nav: **Drafts** (or “Architectures”) linking to `ARCHITECTURES_LIST_PATH` so Save-and-exit is not a trap. Guided may keep drafts out of the main strip if Overview resume exists — Working must not.
3. Sealed records: list route renders an index (title, version, committed date, link to review + sealed record). Trimming a detail URL must not 404. Put it in Governance; do not duplicate six sponsor dashboards.
4. Desktop tab strip: all authorized tabs, one order, empty `moreTabIds`. Remove Additional divider when empty. Mobile `<select>` may stay; prefer a flat list over Primary/Additional optgroups.
5. Stage may change **default** landing tab (Activity while analysis runs) — not visibility, rank, or label. Keep `REVIEW_DETAIL_TAB_LABELS`.
6. Vitest: nav includes drafts in Working; sealed list page exists; every lifecycle exposes the same tab ids in the same order.

## Acceptance criteria

- Working user who saved a draft and signed out can resume from nav or Overview without creating a new draft by mistake.
- Sealed-record list URL is a real page.
- Architect who memorizes tab positions on a draft sees the same positions after finalize.
- Desktop never uses `ReviewWorkspaceMoreTabsMenu`.

## Constraints

- **Forbidden:** hiding “rare” tabs behind More to save chrome.
- Do not manufacture an Evidence hub inventory the backend cannot support.
- Do not implement GTM cohorts.
