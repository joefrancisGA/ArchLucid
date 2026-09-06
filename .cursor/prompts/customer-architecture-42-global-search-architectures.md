# CA-42 — Global search includes architectures

**Do not** search draft document bodies as if they were sealed records. **Do not** fork package-scoped review search (WA-19).

## Goal

Header `/` search on Working:

1. Architecture identities are first-class hits (name) → identity desk.
2. Draft hits are labeled **Draft** and go to the draft child URL.
3. Review hits stay reviews.
4. Disambiguation copy updated (`search-surface-disambiguation.ts`).

## Why

If search cannot find the system by the name you use in meetings, the customer object is not real.

## Context

- `GlobalSearchBar.tsx`
- `search-surface-disambiguation.ts`
- CA-11 list (reuse; do not add an unscoped search API if list+filter is enough for V1)

## What to build

1. Search adapter + Vitest: name match → architecture href.
2. Out-of-scope identities never appear.

## Acceptance criteria

- Working search for a DisplayName opens CA-20 path.
- Draft titled the same is a separate hit labeled draft.

## Constraints

- Tenant isolation. No unauthenticated search.
- No live presence of other searchers.
