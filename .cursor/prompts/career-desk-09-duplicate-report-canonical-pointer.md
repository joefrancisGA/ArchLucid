# CD-09 — Duplicate report pages name the canonical surface

**Do not fork WA-23** for evidence trail vs graph vs provenance titles. This file is **overlapping sponsor/reporting routes**: Working nav already drops `/insights/architecture-scorecard` and `/insights/roi-summary` (`filterNavGroupsForWorkingProfessionalMode`). The pages still exist. Deep links, help, and in-page CTAs do not say which surface answers which question.

## Goal

Each remaining overlapping report page (sponsor dashboard, architecture scorecard, ROI summary, value-report trio, governance dashboard if still reachable) shows **one sentence**: what this page is for, and the canonical sibling href for the other question. Do not delete routes. Do not merge dashboards. Do not collapse review tabs.

## Why

All-day tools have one object and few homes. Route accretion is evaluator leftover. Deleting pages is out of scope for a prompt session; an honest pointer is the livelihood mitigation.

## Context

- `archlucid-ui/src/lib/workspace-mode/working-mode-nav-filter.ts`
- Routes historically listed in `docs/architecture/information_architecture_assessment_and_backlog.md` §6 (sponsor/scorecard/value-report overlap) — verify live pages before editing; do not trust the 2026-07 assessment for deleted routes
- Page heading / lead components on those routes
- TB-2097 evidence names stay as WA-23 shipped

## What to build

1. Inventory live overlapping report pages (skip redirect-only). Add a shared one-line “this surface vs canonical” helper (reuse Related-links / vocabulary if one exists).
2. Working: keep nav filter; page-level pointer still helps bookmarks.
3. Vitest: each inventoried page render includes the canonical pointer test id; no desktop tab overflow.

## Acceptance criteria

- A Working user who lands on a secondary scorecard knows which page is canonical without reading an IA doc.
- No route deletion. No new dashboard.
- Guided may keep more nav entries; pointers still help.

## Constraints

- Do not hide review workspace tabs.
- Do not implement GTM cohorts.
- Do not rename Evidence trail vs graph (WA-23).
