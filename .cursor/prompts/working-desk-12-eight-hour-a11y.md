# WD-12 — Eight-hour accessibility: list-first, no Working teaching traps

## Goal

Working-mode evidence/graph surfaces default to a **keyboard-reachable list/outline**; the canvas is optional. Working does not auto-open first-visit help, shortcut coaches, or “where to go next” strips. Focus order on review workspace tabs stays a single strip (no desktop More). VPAT honest limits stay honest — do not claim full SR coverage.

## Why

VPAT (`docs/security/VPAT_2_5_WCAG_2_1_AA.md`) does not claim comprehensive keyboard coverage of wizards, tables, and custom controls; complex graphics may pass axe and still fail as a work surface. All-day use is list + keyboard + predictable focus. `FindingEvidenceGraphOutline` exists as a toggle. `FirstVisitHelpAutoOpen` still mounts from `AppShellMainAffordances`. Teaching chrome in Working is the opposite of an eight-hour instrument.

## Context

- `docs/security/VPAT_2_5_WCAG_2_1_AA.md`, `docs/security/VPAT_EVIDENCE_MAP.md`
- `archlucid-ui/src/components/findings/FindingEvidenceGraph.tsx` / `FindingEvidenceGraphOutline.tsx`
- Insights evidence-graph page (`archlucid-ui/src/app/(operator)/insights/evidence-graph/`)
- `archlucid-ui/src/lib/workspace-mode/guided-teaching-chrome-inventory.ts`
- `archlucid-ui/src/components/usability/FirstVisitHelpAutoOpen.tsx`
- `archlucid-ui/src/components/shell/AppShellMainAffordances.tsx`
- `use-teaching-chrome-visible.ts` — fail closed until Guided
- Review tab strip (WD-10): do not reintroduce More
- `docs/quality/ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md` — do not pretend this prompt completes manual NVDA

## What to build

1. Working: evidence graph **defaults to outline/list**. Canvas behind an explicit control. Outline is a real list (links/buttons), not a screenshot of nodes. Guided may default to canvas.
2. Gate every id in `GUIDED_TEACHING_CHROME_SURFACE_IDS` so Working does not mount them. Fix any mount that ignores `useTeachingChromeVisible()` (especially `FirstVisitHelpAutoOpen`).
3. Dialogs: no keyboard trap; focus restore on close (Radix). Add a focused test for the review-detail and draft most-used dialogs if missing.
4. Keep skip link + post-navigation focus to `#main-content` (do not regress `live-api-accessibility-focus.spec.ts` contract).
5. Vitest: Working graph default is outline; Working does not render first-visit auto-open; teaching inventory ids are gated. Do not claim VPAT “Supports” upgrades without evidence.

## Acceptance criteria

- Keyboard-only Working user can triage evidence nodes from the outline without using the canvas.
- Working first visit does not auto-open help or shortcut coaches. Shift+? and F1 still work.
- Desktop review tabs remain a full strip.
- VPAT remarks stay accurate (no false “comprehensive keyboard” claim).

## Constraints

- Do not collapse desktop tabs to reduce focus stops.
- Do not use native `title` for help (TB-2147 / design system).
- Do not implement a full screen-reader audit program in this prompt.
- Help links stay in-app `/help/{topic}`, not GitHub blob URLs.
