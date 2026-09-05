# LD-09 — Keyboard remaining work: Finalize and save, not only triage

**Do not fork LI-07, PT-06, or WD-05** for findings/alerts next/prev, Alt+1–3, palette save-draft/undo, or Shift+? sitemap copy. Those shipped. This file is **Finalize, save-on-review, and Compare this review from the keyboard**.

## Goal

A Working-mode architect on review-detail can **Finalize** (when the scorecard is ready), **save** any dirty livelihood field already guarded, and **Compare this review** without the mouse. Palette rows invoke those actions. Teaching coaches stay off in Working.

## Why

All-day tools bind keys to *work*. LI-07 made findings/alerts a work surface. The career action is still the stamp: Finalize is a mouse CTA. Compare-from-review hrefs shipped in LI-11 but Alt+C from review-detail may still open empty Compare. Save-draft palette action exists on architecture draft routes — review-detail dirty notes/rationale may still lack a chord.

## Context

- `archlucid-ui/src/lib/command-palette-handler-actions.ts`
- `archlucid-ui/src/lib/shortcut-registry.ts` / `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md`
- Finalize CTA + `evaluateFinalizeQualityScorecard` / LD-04 gate
- `buildCompareTwoReviewsHref` (LI-11)
- `use-review-workbench-shortcuts.ts`
- Input guard `isEditableTarget`
- LD-08 owns first Ctrl+K; this prompt adds **actions**, not the host

## What to build

1. Palette **Finalize review** available only when the existing scorecard `ready` flag is true (disabled/hidden otherwise — TB-2005). Invoking it must not bypass skipped MUST.
2. Working review-detail Alt+C (or palette “Compare this review”) uses `buildCompareTwoReviewsHref({ baseRunId })`. Global Alt+C from non-review routes stays unscoped.
3. If review-detail has a dirty guarded field, palette **Save** invokes the same save as the visible control. Do not add a second draft store.
4. Document new combos in Shift+? and `KEYBOARD_SHORTCUTS.md`. Prefer Alt/Ctrl chords (WCAG 2.1.4 — no new bare single-letter shortcuts except existing `/` search).
5. Vitest next to `keyboard-shortcuts-*.test.tsx` plus palette availability tests.

## Acceptance criteria

- Palette can Finalize only when the UI could click Finalize.
- Alt+C on a sealed review opens Compare with that review as base.
- Alt+1–3 / Alt+J / Alt+K still work; input guard unchanged.
- Working mode does not pop teaching overlay on first visit.

## Constraints

- Do not add a new shortcut library.
- Do not use bare letter keys for global actions.
- Do not collapse tabs to “make shortcuts simpler.”
- Do not move the shortcut listener out of the shell wrap.
