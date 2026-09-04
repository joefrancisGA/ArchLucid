# LD-15 — Working teaching-chrome inventory has no leftover traps

**Do not fork LI-15 or WD-12** for `useTeachingChromeVisible()` or finding-graph outline. This file is **remaining auto-open / coach / “where to go next” mounts that ignore the gate**.

## Goal

Every id in the Guided teaching-chrome inventory fails closed in Working. First-visit help, shortcut coaches, and “where to go next” strips do not auto-open for Working seats. Shift+? and F1 remain available. Focus order on review workspace tabs stays a single strip (no desktop More).

## Why

`use-teaching-chrome-visible.ts` fails closed until Guided. `FirstVisitHelpAutoOpen` already skips some full-shell paths. Remaining coaches can still mount if they ignore the hook. Eight-hour use cannot fight a tour every Monday. Casual products auto-open help; livelihood tools wait to be asked.

## Context

- `archlucid-ui/src/lib/workspace-mode/guided-teaching-chrome-inventory.ts`
- `archlucid-ui/src/lib/workspace-mode/use-teaching-chrome-visible.ts`
- `archlucid-ui/src/components/usability/FirstVisitHelpAutoOpen.tsx`
- `archlucid-ui/src/components/shell/AppShellMainAffordances.tsx`
- Grep `FirstVisit`, `WhereToGoNext`, `shortcut coach`, `GUIDED_TEACHING_CHROME_SURFACE_IDS`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Gate every id in `GUIDED_TEACHING_CHROME_SURFACE_IDS` so Working does not mount them. Fix any mount that ignores `useTeachingChromeVisible()`.
2. Add a Vitest inventory: for each teaching surface id, Working render does not include the auto-open node; Guided may.
3. Dialogs used on review-detail and draft: no keyboard trap; focus restore on close (Radix). Add a focused test if missing.
4. Keep skip link + post-navigation focus to `#main-content` (do not regress `live-api-accessibility-focus.spec.ts` contract).
5. Do not claim VPAT “Supports” upgrades without evidence.

## Acceptance criteria

- Working first visit does not auto-open help or shortcut coaches. Shift+? and F1 still work.
- Inventory test fails CI if a new teaching surface mounts in Working without the gate.
- Desktop review tabs remain a full strip.
- Guided teaching behavior remains intact.

## Constraints

- Do not collapse desktop tabs to reduce focus stops.
- Do not use native `title` for help (TB-2147 / design system).
- Do not implement a full screen-reader audit program in this prompt.
- Help links stay in-app `/help/{topic}`, not GitHub blob URLs.
- Do not auto-switch stored Guided users to Working.
