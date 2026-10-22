# WA-23 — Evidence trail vs evidence graph vs provenance stay distinct

**Do not fork LD-14** for Insights graph list-first. That is canvas vs list. This file is **TB-2097 leftover names** on remaining Working surfaces: page titles, breadcrumbs, palette, and help still mix Evidence trail (concept), Evidence graph (surface `/insights/evidence-graph`), and provenance.

## Goal

Working chrome uses the split in `UI_DESIGN_SYSTEM.md`: **Evidence trail** only for the diligence concept; **Evidence graph** for the graph route; provenance for the review-scoped provenance view. Palette and breadcrumbs agree. Do not rename the concept. Do not title the graph “Evidence trail.”

## Why

Four names for one idea waste a professional’s scan. Casual products are poetic. Livelihood tools have one noun per surface. TB-2097 closed the decision; leftovers remain in palette/help/breadcrumbs.

## Context

- `docs/library/UI_DESIGN_SYSTEM.md` — Evidence trail vs Evidence graph (TB-2097)
- `breadcrumb-map.ts` / command palette destinations
- Help topics Evidence trail vs graph
- `/insights/evidence-graph` vs review provenance route
- LD-14 list-first on Insights — do not re-do outline; fix **labels**

## What to build

1. Grep operator chrome for “Evidence trail” used as a graph title/CTA, “Graph” as a default breadcrumb, “Provenance graph” in palette.
2. Align labels with TB-2097. Keep glossary “Evidence trail” for the concept.
3. Vitest/copy guard: evidence-graph page title is not “Evidence trail.”

## Acceptance criteria

- Working nav, palette, and graph H1 agree on “Evidence graph.”
- Help glossary may still explain the trail concept.
- No TB-645 manifest jargon.

## Constraints

- Do not merge graph and provenance into one route in this prompt.
- Do not collapse review tabs.
- Do not implement a new graph engine.
