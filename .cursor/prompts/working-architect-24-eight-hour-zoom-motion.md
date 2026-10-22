# WA-24 — Review-detail survives 200% zoom and reduced motion

**Do not fork LD-14 or WD-12** for Insights list-first or teaching-chrome inventory. This file is **eight-hour visual a11y on review-detail**: 200% zoom must not clip Finalize or findings work; `prefers-reduced-motion` must not leave essential state only in animation.

## Goal

Working-mode review-detail (tabs, findings table, Finalize, workbench) remains operable at 200% zoom in a desktop viewport without horizontal-only traps on primary actions. Reduced motion: no essential status that exists only as a motion cue. Do not collapse desktop tabs into More. Do not claim VPAT “Supports” upgrades without evidence.

## Why

People work all day, often on laptop zoom, often with motion sensitivity. Casual dashboards fail zoom. Livelihood tools are Carbon-dense and still readable. WD-12 named eight-hour a11y; graph outline shipped; review-detail zoom/motion did not.

## Context

- `docs/quality/MANUAL_QA_CHECKLIST.md` § A.9 / `ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md` — do not fake a full AT program
- Review workspace tabs resolver — keep full strip
- `ReviewWorkbenchLayout.tsx`
- Motion: toasts, in-flight pulses, tour (should already be off in Working)
- Playwright zoom is optional; prefer Vitest on class names / `motion-reduce:` and a documented manual check in the PR

## What to build

1. Fix review-detail primary actions (Finalize, findings filters, tab strip) that overflow-clip at `zoom: 2` in CSS if cheap (wrapping, not sticky overlap). Do not invent a mobile-only More for desktop.
2. Replace motion-only in-flight cues with a persistent StatusTag (“In progress”).
3. Vitest: in-flight status text present with reduced-motion class; no `ReviewWorkspaceMoreTabsMenu` on desktop.
4. PR notes the zoom check performed (browser or Playwright) — honest if only CSS inspection.

## Acceptance criteria

- Working Finalize remains reachable at 200% without a desktop More menu.
- In-flight state is visible with reduced motion.
- Guided teaching motion stays gated off in Working (LD-15).

## Constraints

- Do not collapse desktop review tabs.
- Do not use native `title` for help (TB-2147).
- Do not implement a full screen-reader audit program in this prompt.
