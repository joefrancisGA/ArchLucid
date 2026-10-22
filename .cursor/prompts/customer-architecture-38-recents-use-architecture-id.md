# CA-38 — Recents / favorites use ArchitectureId

**Do not** invent live presence. **Do not** store draft ids under an `architectureId` key.

## Goal

`operator-recent-views` / favorite reviews (and any “recent architectures” list):

1. Architecture recents store `ArchitectureId` + display name.
2. Review recents stay review ids and may include parent `architectureId` as a **parent** field.
3. Opening an architecture recent goes to the desk, not the draft editor.

## Why

Browser-local recents that replay draft GUIDs undo CA-22 every session.

## Context

- `operator-recent-views.ts`
- `FavoriteReviewsList.tsx`
- CA-25 / CA-26

## What to build

1. Shape + migration of stored keys (version the storage key if needed).
2. Tests: old draft-shaped entries are not labeled architectures (drop or honesty).

## Acceptance criteria

- New views written after this prompt cannot put a draft id in `architectureId`.
- Favorites of reviews still open reviews.

## Constraints

- Prefer server identity list over new localStorage (DA-04). Recents may stay local if already local — then honesty + correct ids.
- No chat.
