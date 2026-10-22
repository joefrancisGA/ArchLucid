# CA-07 — List query with total count

**Do not** make `GET /v1/architecture/drafts` the architecture list. **Do not add the HTTP controller** (CA-11). Schema + repositories from CA-02–04 must exist.

## Goal

Application can list identities in workspace scope with **pagination and total count**.

1. `ListAsync(scope, skip, take)` on `IArchitectureIdentityRepository` (or a dedicated query type in its own file).
2. Return `ArchitectureId`, `DisplayName`, `UpdatedUtc`, computed child pointers (CA-05), counts of child drafts/reviews.
3. `totalCount` is exact for the scoped filter, not `page.Length`.
4. Default take 50, max 200 (same numbers CA-39 will show in the UI).

## Why

Without a list query, the Working hub cannot stop listing drafts. Casual tools page quietly. Livelihood desks need `totalCount` so CA-39 can shout incompleteness.

## Context

- `ArchitectureIdentityService.cs`
- ADR 0037 scope
- DA-03 leftover list (do not paste DA-03)

## What to build

1. Query + DTO (one type per file).
2. Tests: two identities in one workspace both list; other tenant excluded; `totalCount` is 2 when take is 1.
3. No controller.

## Acceptance criteria

- Out-of-scope workspace returns empty + total 0, never another tenant’s name.
- Draft list API still lists drafts (untouched).

## Constraints

- No public unauthenticated list.
- Check nulls. Concrete types.
- Scoped compile on Application + Persistence tests you touch.
