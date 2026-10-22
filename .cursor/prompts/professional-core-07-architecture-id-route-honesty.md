# PC-07 — Every Working deep link uses ArchitectureId ≠ DraftId

**Do not fork CA-20–24** if shipped — verify only. **Do not fork CA-22** stop draftId-as-architectureId if shipped.

## Goal

Audit and fix Working routes, hooks, search hits, CLI deep links, and palette rows so:

- `architectureId` in URLs and API bodies means **`dbo.Architectures.ArchitectureId`**.
- `draftId` means **`DraftRequests`** child only.
- Global search, bookmarks, and “Open architecture” palette open the **identity desk** or canonical review URL (ADR 0072), never a draft GUID labeled architecture.

## Why

When draft id masquerades as architecture id, Monday resume opens the wrong object — livelihood defense fails before seal.

## Context

- `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/page.tsx`
- `global-search-architecture-hits.ts`, `architecture-draft-id-drift-guard.test.ts`
- OpenAPI list/get/ensure architecture endpoints (CA-07–13)
- ADR 0074

## What to build

1. Grep `architectureId` assignments from `draftId` in SPA; fix remaining leaks (test already guards persist path).
2. Redirect or handoff: old draft bookmarks → handoff panel (LK-04), not silent wrong editor.
3. Vitest inventory: no `architectureId={draftId}` in production paths.
4. Update `KEYBOARD_SHORTCUTS.md` / help if open targets changed.

## Acceptance criteria

- Working Ctrl+K “Open architecture” searches identity rows.
- Legacy draft URLs still resolve (handoff), not 404.

## Constraints

- Do not merge tables. Guided draft-first list may remain.
