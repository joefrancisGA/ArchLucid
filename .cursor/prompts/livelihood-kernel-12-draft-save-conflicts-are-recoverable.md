# LK-12 — Draft save conflicts are recoverable

**Do not fork CR-10** (harness vs catalog CI guard). **Do not fork SD-08 / WA-16** last-saved. **Do not fork LK-02** undo stack. This file changes a casual-SPA bet: architecture-draft autosave **last-write-wins** without a conflict. Two tabs, a restored crash, or a second machine (IS-13 last-open) can silently clobber livelihood work.

## Goal

Working draft autosave uses an optimistic concurrency token (existing ETag / rowversion / `updatedUtc` if the API already has one; add one if not). On 409/precondition failure, the editor does **not** overwrite. It shows the server document vs local unsaved, with Retry (reload server + re-apply if trivial) or Keep mine / Keep theirs as explicit choices. Guided may keep a simpler error toast; Working must not silent-win.

## Why

Undo (LK-02) restores *this tab’s* stack. It does not restore the other window. All-day use includes dual monitors and a laptop plus the conference-room machine (R4). Last-write-wins is how people lose the paragraph they will defend at the ARB.

## Context

- `use-architecture-draft-autosave.ts`
- Draft PATCH/PUT API (`ArchLucid.Api` draft controllers) — If-Match / concurrency
- `ArchitectureDraftWorkspace.tsx`
- IS-13 desk continuity (second machine)
- TB-2005: conflict UI on the form, not only a toast
- ADR 0037 tenant isolation — do not leak the other tenant’s document

## What to build

1. Wire or add a concurrency token on draft writes. Single DDL file if a column is required. One class per file on the C# side.
2. Client: on conflict, stop autosave loop from retrying overwrite. Surface Keep mine (force with token) vs Keep server (reload) vs Retry merge if the payload is still a single document JSON you can three-way only on field level you already understand — **do not invent a general merge engine**. Prefer Keep mine / Keep server if field merge is unclear.
3. Vitest + API tests: two sequential writes with stale token → 409; Working UI fixture shows choices; Keep server reloads without calling force.
4. Last-saved label still updates after a successful resolved save.

## Acceptance criteria

- A Working architect with two tabs cannot lose tab A’s save with no explanation when tab B autosaves.
- Sealed reviews are untouched.
- No `ConfigureAwait(false)` in tests.

## Constraints

- Do not implement a draft-diff/compare engine (R12 / LS-06).
- Do not store the whole undo stack as the conflict document.
- Do not collapse review tabs.
