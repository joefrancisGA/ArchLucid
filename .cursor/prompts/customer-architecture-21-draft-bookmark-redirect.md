# CA-21 — Compatibility redirect for draft bookmarks

**Do not** silently break `/architecture/architectures/{draftId}`. CA-20 route split must exist or land in this PR.

## Goal

Working GET `/architecture/architectures/{id}`:

1. If `id` is a known **ArchitectureId** → identity desk (CA-26).
2. If `id` is a known **DraftId** → redirect or rewrite to the parent identity + draft child (CA-20). If identity is missing (legacy), keep the draft editor and show CA-19 honesty.
3. If `id` is unknown → 404, not a blank editor that autosaves a new draft under a garbage id.

## Why

Weeks of bookmarks and Slack links point at draft GUIDs. 404 is worse than a handoff. Leaving the old URL as a live second editor is the ADR 0072 failure mode.

## Context

- `architecture-routes.ts` `parseArchitectureDraftIdFromPath`
- ADR 0072 `ArchitectureDraftHandoffPanel`
- CA-08 get-by-id / draft get

## What to build

1. Server or client resolver (prefer server redirect when both lookups are cheap).
2. Vitest/Playwright mock: `draft-001` is not passed to identity GET as if it were an architecture id.
3. Helper `isDraftRouteId` only for this compatibility path.

## Acceptance criteria

- Old draft bookmarks open something useful (child editor or parent desk), not 404.
- Working spawn-locked draft URL still hands off (ADR 0072).

## Constraints

- Do not merge tables to make ids collide on purpose.
- Tenant isolation on both lookups.
