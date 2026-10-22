# LS-05 — Insights tools require an open package

**Do not fork WA-05 or RS-08.** Compare-from-review **href** already prefills when a run id is in the **path**. This file is the leftover: sidebar / palette / Alt+A / Alt+C / Alt+Y still navigate to **empty** Ask / Compare / evidence-graph when the architect is on Overview, drafts, or the findings queue — even if last-open package exists (CD-11 / IS-13).

## Goal

In Working, Ask, Compare, and Evidence graph take the **open or last-open package** as the default subject. Empty two-GUID Compare and empty Ask are fallbacks only when no package can be resolved. Guided may keep empty tools as teaching.

## Why

Leaving the desk to re-identify the package is casual-site navigation. Alt+C from Home should not throw away the package the architect was just looking at.

## Context

- `useShortcutNavigation.ts` — `readReviewRunIdFromPathname` only
- `SHORTCUTS` routes for Ask / Compare / graph
- `askReviewQuestionsHref` / `buildCompareTwoReviewsHref` / `evidenceGraphHref`
- `resolveContinueLastReviewPackageTarget` / last-open draft helpers
- Sidebar nav href builders (`pilot-nav-group-builder.ts`)
- Command palette insight actions

## What to build

1. Resolver: `reviewId` from path, else last-open review from IS-13/CD-11 prefs, else null.
2. Working Alt+A / Alt+C / Alt+Y and sidebar links use that resolver. Palette This-review group already scoped — extend global insight rows.
3. When null: keep the tool route but lead with “Open a package first” + link to last draft or reviews hub — do not invent a run id.
4. Vitest: Working on `/` with last-open run → Compare href includes base run; Working with no packages → empty Compare + honest empty; Guided unchanged; path-scoped review still wins over last-open.

## Acceptance criteria

- A Working architect who just left a review does not land on a blank Compare form from Alt+C.
- No hallucinated run ids.
- Desktop tabs unchanged.

## Constraints

- Do not implement the billable what-if execute (LS-06).
- Do not put secrets in the URL.
- Do not implement **M-174** claim language.
