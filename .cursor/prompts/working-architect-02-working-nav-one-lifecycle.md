# WA-02 — Working nav and palette are one lifecycle, not two start products

**Do not fork LD-06, PT-03, or WD-10** for empty Home dual-path cards, Alt+N → draft editor, or drafts-in-nav. Those shipped. This file is **remaining start verbs**: command palette, Getting started, Path chooser, and any still-visible “Create architecture” / “Start review” **peer** pair in Working.

## Goal

A Working-mode architect sees **one start**: New review → dense draft editor (`WORKING_MODE_NEW_REVIEW_ROUTE`). Drafts list is **resume**. Reviews list is **packages**. Guided may keep two doors with copy that says one lifecycle. Do not delete `/architecture/reviews/new`; hide or demote it as a start product in Working.

## Why

Professionals resume or start work. Evaluators pick a wizard. LD-06 fixed empty Home. `PilotNavGroupBuilder` still includes Getting started (demoted after first commit). Palette and Path chooser can still list Create architecture and Start review as peer objects. Casual SaaS ships two funnels. A livelihood tool has one object after spawn (RS-04) and one way to begin.

## Context

- `archlucid-ui/src/lib/shortcut-registry.ts` — `WORKING_MODE_NEW_REVIEW_ROUTE` (keep)
- `archlucid-ui/src/lib/resolve-visible-command-palette-actions.ts` — Working already omits Finish setup; extend for dual-start
- `archlucid-ui/src/lib/pilot-nav-group-builder.ts` — Getting started; do not hide drafts list
- `archlucid-ui/src/lib/architecture/architecture-workflow-labels.ts`
- Path chooser / `SocraticIntakeWizard` entry from Working Home, Shift+?, palette
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Working palette: one “New review” (draft editor). Do not list “Start review (guided intake)” as a peer. Guided may keep both with “one lifecycle, two doors” helper.
2. Working nav: Getting started stays off the default strip (`hideGettingStartedFromMainNav`). Do not add a second Start review verb next to Drafts.
3. Working Path chooser / leftover “Start review (guided questions)” links from architecture-created overview: point at the draft editor, or label Guided-only.
4. Saving a draft still never starts a review. RS-04 lock unchanged.
5. Vitest: Working palette/nav snapshots have a single start href (draft editor); Guided may still show `/architecture/reviews/new`.

## Acceptance criteria

- Working user cannot start work through two peer CTAs that imply two products.
- Guided first-session wizard remains intact.
- Desktop review tabs unchanged.
- No TB-645 “run” label regression.

## Constraints

- Do not collapse desktop tabs to “simplify” start.
- Do not remove the guided intake **route**; demote it as Working identity.
- Do not implement principal-architect dismissal (**M-44**).
