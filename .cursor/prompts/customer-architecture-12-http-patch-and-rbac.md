# CA-12 — HTTP PATCH + write RBAC

**Do not invent** `Architectures.Manage` permissions. **Do not add the rename form** (CA-31). CA-10 + CA-11 must exist.

## Goal

1. `PATCH /v1/architectures/{architectureId}` (or identities path from CA-11) with display name / description.
2. Write RBAC = existing draft **execute/update** rank. Read-tier callers get 403.
3. Empty name → 400 with a field error (TB-2005 server half).
4. Scope miss → 404, not 403 that confirms existence across tenants.

## Why

The desk rename form cannot toast-only. Livelihood writes need the same rank as editing the working document, not a new admin role.

## Context

- CA-10 `RenameAsync`
- Draft update authorization filters
- `ROUTE_TIER_POLICY_NAV_MATRIX.md`

## What to build

1. PATCH action + matrix row.
2. Tests: read-tier 403; empty 400; out-of-scope 404.
3. OpenAPI snapshot may wait for CA-13 if this PR is immediately followed — otherwise update it here.

## Acceptance criteria

- Rename does not require starting a review.
- No new permission enum values unless the existing draft write role cannot be reused (justify in PR).

## Constraints

- No BFF. No CSRF work (LK-07).
- Check nulls. One class per file.
