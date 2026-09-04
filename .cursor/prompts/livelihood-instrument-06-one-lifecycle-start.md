# LI-06 — One lifecycle start: dense editor, not a first-run funnel

**Do not fork PT-03 / PT-04 / PT-10 for Alt+N routing or Overview queue composition.** `WORKING_MODE_NEW_REVIEW_ROUTE` already points at the draft editor. This file is **copy, dual-path cards, drafts in nav, sealed-record list**.

## Goal

Working-mode architects start and resume in one lifecycle (draft → analysis → sealed record). First-run wizard theater, collapsed “one primary CTA,” and sample-first home cards stay on Guided only. Shortcut and palette **text** match the Working route. Desktop review tabs keep fixed order and labels.

## Why

`SHORTCUTS` still sets `route: "/architecture/reviews/new"` and describes Alt+N as “open the new-review wizard” even though Working navigation already remaps to `ARCHITECTURES_NEW_PATH`. Command palette create-review href is remapped in Working, but searchValue/label still smell like wizard. Home dual-path cards (“Create an architecture” / “Review an existing architecture”) contradict one lifecycle. `/architecture/architectures` is still easy to miss in Working nav. A professional bringing a real brief should not re-learn the product every Monday.

## Context

- `archlucid-ui/src/lib/shortcut-registry.ts` — `SHORTCUTS` `alt+n` description + route
- `archlucid-ui/src/hooks/useShortcutNavigation.ts` — Working remap (keep)
- `archlucid-ui/src/lib/command-palette-actions.ts` / `resolve-visible-command-palette-actions.ts`
- `archlucid-ui/src/components/operator-home/OperatorHomeDualPathCards.tsx`
- `archlucid-ui/src/lib/architecture/architecture-routes.ts` (`ARCHITECTURES_LIST_PATH`)
- `archlucid-ui/src/lib/pilot-nav-group-builder.ts` (and Working nav builders)
- Sealed list: `/governance/sealed-records`
- `KEYBOARD_SHORTCUTS.md`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Working Overview: one primary CTA (resume last draft/review, else New review into the draft editor). Dual-path peer heroes only on Guided/empty-eval, and even there copy must say **one lifecycle, two doors**.
2. Working nav: **Drafts** (or “Architectures”) linking to `ARCHITECTURES_LIST_PATH` so Save-and-exit is not a trap.
3. Sealed records: list route renders an index (title, version, committed date, link to review + sealed record). Trimming a detail URL must not 404.
4. Shortcut overlay + `KEYBOARD_SHORTCUTS.md`: Working Alt+N is “new review / draft editor,” not “wizard.” Guided help may still say wizard. Prefer the Working remap to remain the SoT; do not send Working users to `/architecture/reviews/new` from Shift+?.
5. Desktop tab strip: all authorized tabs, one order, empty `moreTabIds`. Stage may change **default** landing tab — not visibility or label.
6. Vitest: home CTA composition; nav includes drafts in Working; shortcut description/registry tests; sealed list page exists.

## Acceptance criteria

- Working user with a draft: first viewport is resume, not “Start first review.”
- Working user with no drafts: New review / Alt+N opens the dense editor; Shift+? does not call it a wizard.
- Guided first-session behavior remains intact.
- Desktop never uses `ReviewWorkspaceMoreTabsMenu`.

## Constraints

- **Forbidden:** hiding “rare” tabs behind More.
- Do not implement principal-architect dismissal cohort (**M-44**).
- Do not delete guided intake; demote it for Working.
- Saving a draft must still never start a review.
