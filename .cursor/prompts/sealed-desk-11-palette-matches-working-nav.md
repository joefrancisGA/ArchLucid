# SD-11 — Command palette matches Working nav

**Do not fork IS-08** (eval grandfather inventory on page chrome). **Do not fork CD-08** (Guided hide vs palette dual map). This file is **leftover destinations**: Ctrl+K still lists routes Working sidebar omits (or lists two start products) so muscle memory opens empty Ask/Compare, stranded drafts, or eval tools.

## Goal

Working-mode command palette rows for navigation agree with `useOperatorShellNavRows` / Working nav visibility: no destination the sidebar would hide, except explicit **Search workspace** / Report Problem / help. Palette **work** actions (save, finalize, disposition) stay. Guided may list teaching destinations.

## Why

A livelihood desk’s goto is the same map as the sidebar. A casual app’s palette is a dump of every route. IS-08 can clean page chrome while Ctrl+K still teaches the mode matrix.

## Context

- `CommandPalette.tsx` / `command-palette-handler-actions.ts`
- `useOperatorShellNavRows` / nav group builders
- LS-05 — Ask/Compare empty without run id: palette must not add a third empty entry; if a review is open, prefer scoped actions already added by IS-10
- CD-08 dual map — do not re-implement Guided hide; this is Working-only leftover rows
- `operator-primary-cta-inventory.ts`

## What to build

1. Inventory palette navigation items vs Working nav rows. Diff is the leftover list.
2. Filter Working palette nav through the same visibility helper the sidebar uses (reuse, don’t copy flags).
3. If two “start” rows remain (Create architecture + Start review), collapse to IS-03’s one work action.
4. Vitest: Working palette fixture does not include a nav href that Working sidebar omits (allow-list the exceptions: help, Report Problem, sign out).

## Acceptance criteria

- Ctrl+K on Working Overview does not offer a hidden Insights route the sidebar would hide at that unlock phase.
- Guided palette may still teach locked destinations if that is current Guided behavior — document it.
- No desktop More menu for review tabs.

## Constraints

- Do not restore breadcrumbs.
- Do not invent live presence.
- Do not add a 40th engine.
