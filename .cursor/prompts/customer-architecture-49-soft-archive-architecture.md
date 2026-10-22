# CA-49 — Soft-archive an architecture

**Do not hard-delete** drafts, reviews, or sealed records. **Do not unseal.** **Do not invent** per-architecture ACL.

## Goal

A retired system can leave the **default** Working portfolio without destroying history.

1. `dbo.Architectures.ArchivedUtc DATETIME2 NULL` (or reuse an existing archive pattern on sibling tables).
2. List API default: `archived=false`. Query flag to include archived.
3. Desk action **Archive** / **Restore** — confirm copy: children stay; they remain openable from the desk or an archived filter.
4. Same write RBAC as rename (CA-12).

## Why

Portfolios accumulate. Casual tools delete. Livelihood tools hide. Deleting the identity would orphan reviews or invite a cascade the sealed record cannot survive.

## Context

- `ArchitectureRequests_IsArchived` / run archival patterns — **do not** cascade-archive sealed reviews unless an existing archival job already does that for runs; this prompt only archives the **identity**
- CA-07 list filter
- CA-25 hub

## What to build

1. Migration + repository + PATCH/POST archive + hub filter.
2. Tests: archived hidden by default; get-by-id still works; other tenant cannot archive.
3. Showing N of M includes archived-hidden count if the filter is on (CA-39/40 pattern).

## Acceptance criteria

- Archive does not delete `DraftRequests` or `Reviews` rows.
- Working default hub does not show archived identities.

## Constraints

- Tenant isolation. Check nulls. One class per file.
- No purge of sealed bytes.
- Next migration NNN after whatever CA-02/03 used.
