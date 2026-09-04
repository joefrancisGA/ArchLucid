# RS-08 — Keyboard does the work on the open package

**Do not fork LI-07, PT-06, WD-05, or LD-09.** LD-09 owns Finalize/save still mouse-only. This file is the leftover: **on-review Ask / evidence graph / Compare can still land on an empty picker**.

## Goal

When a Working user is on a review, Alt+C / Compare palette / Shift+? compare row uses **this package as base** (LI-11/`useShortcutNavigation` already remaps Alt+C when `reviewRunId` is set — keep it). Extend the same “open package is context” rule to Ask, evidence graph, and findings inspect so the architect does not land on an empty picker. Palette work actions (next/prev finding, Alt+1–3, save draft, undo when callout active) stay documented in Shift+?. Teaching coaches stay off in Working.

## Why

All-day tools bind keys to *this document*, not only *places*. `SHORTCUTS` still lists Alt+C → `COMPARE_TWO_REVIEWS_PATH` (empty), Alt+A → Ask, Alt+Y → evidence graph with no run id. Off-review, empty compare is acceptable. On-review, leaving the package is a livelihood throughput failure. LI-07 covered undo-not-dead and findings/alerts palette rows — do not rebuild those; verify they still gate undo, then add **context-preserving navigation**.

## Context

- `archlucid-ui/src/lib/shortcut-registry.ts`
- `archlucid-ui/src/hooks/useShortcutNavigation.ts` — Working Alt+C remap (keep)
- `archlucid-ui/src/lib/compare-two-reviews-route.ts` — `buildCompareTwoReviewsHref`
- `archlucid-ui/src/lib/command-palette-review-actions.ts`
- Ask / evidence-graph query params for run id
- `KEYBOARD_SHORTCUTS.md`
- LI-07 palette handler actions — do not duplicate API calls

## What to build

1. On review-detail (and finding inspect under that review): Alt+C, palette Compare, and any “Compare” related-link use `buildCompareTwoReviewsHref({ baseRunId })`. Off-review Alt+C may stay the empty hub.
2. Alt+A / Alt+Y from an open review pass that run id (existing query contracts — do not invent a second param name).
3. Shift+? descriptions: Working on-review Compare is “compare this package,” not a blank tool. Guided help may stay generic.
4. Confirm palette Undo is still hidden when no reversible callout (LI-07). Fix only if regresssed.
5. Vitest: on-review shortcut/palette href includes baseRunId; off-review compare hub unchanged; undo availability tests still pass.

## Acceptance criteria

- Working user on a review does not land on empty compare/Ask/graph as the default of those chords.
- Alt+1–3 / Alt+J / Alt+K still work; input guard unchanged.
- Working mode does not pop teaching overlay on first visit.
- Desktop tabs stay fully visible.

## Constraints

- Do not add a new shortcut library.
- Do not use bare letter keys for global actions (WCAG 2.1.4).
- Do not collapse tabs to “make shortcuts simpler.”
- Do not move the shortcut listener out of the shell wrap.
