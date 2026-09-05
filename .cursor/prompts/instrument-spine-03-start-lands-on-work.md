# IS-03 — Start and Alt+N land on the work, not a chooser

**Do not fork PT-03 or WA-02** for `WORKING_MODE_NEW_REVIEW_ROUTE`. This file is the leftover: Working start can still open Path chooser, Guided intake, or dual-intent `/reviews/new` instead of the object the architect already has.

## Goal

In Working, **Start** and **Alt+N** open the **current work object**: last-open in-flight review if one exists, else last-open draft editor, else a new draft editor. Guided keeps the intake wizard at `/architecture/reviews/new`. Do not add a third start route. Do not merge draft and review in the database.

## Why

All-day software resumes. A chooser is first-session. After IS-02 the primary CTA is correct only if the route behind it is the work, not a wizard that re-asks “create or review?”

## Context

- `WORKING_MODE_NEW_REVIEW_ROUTE` in `shortcut-registry.ts`
- `archlucid-ui/src/hooks/useShortcutNavigation.ts`
- `archlucid-ui/src/app/(operator)/architecture/reviews/new/` (Path chooser / guided)
- Last-open package helpers (CD-11 / WA-15 — extend, do not fork)
- `architecture-draft-handoff-gate.ts` spawn lock
- `PathChooserCreateObjectVocabularyRail.tsx`

## What to build

1. Working resolver: `resolveWorkingStartHref({ lastOpenReviewId, lastOpenDraftId, inFlight })` (name as you like). Priority: in-flight review → last draft editor → `/architecture/architectures/new`.
2. Wire Alt+N, Architecture nav start, Home primary, palette New work through that resolver.
3. Path chooser and Socratic wizard remain on Guided / explicit `?path=guided-intake` links. Working must not mount Path chooser as the default start.
4. After spawn, Start still opens the **review**, not the spawned draft (spawn lock). New version is clone-from-snapshot, already shipped.
5. Vitest: Working with in-flight → review URL; Working empty → architectures/new; Guided Alt+N still wizard; spawn-locked draft is not the Start target.

## Acceptance criteria

- A Working architect with an in-flight review never lands on Path chooser from Alt+N.
- Empty Working tenant still can create work (draft editor), not a dead primary.
- Guided wizard still exists for teaching seats.
- Desktop review tabs unchanged.

## Constraints

- Do not invent `?view=meeting` (IS-11).
- Do not auto-switch stored Guided users.
- Do not implement **M-90**.
