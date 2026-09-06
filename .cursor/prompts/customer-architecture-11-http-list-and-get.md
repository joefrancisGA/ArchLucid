# CA-11 — HTTP GET list and get

**Do not fork** `DraftRequestsController` into an architecture list. **Do not** make `GET /v1/architecture/drafts` the identity collection. Application queries from CA-07–08 must exist.

## Goal

Ship buyer-vocabulary HTTP:

1. `GET /v1/architectures` — scoped list + `totalCount` + pagination.
2. `GET /v1/architectures/{architectureId}` — identity + child summaries.

If `/v1/architectures` collides with a marketing or draft path, use `GET /v1/architecture/identities` and say why in the PR body (one-line trade-off, not a new ADR).

RBAC: same as draft **read** (`ReadAuthority` / existing draft read roles). No new permission names.

## Why

Without HTTP, CA-25 cannot replace `ArchitectureDraftListClient`. The `/architecture/architectures` UI today lists drafts.

## Context

- `docs/library/API_CONTRACTS.md`
- `docs/library/OPENAPI_CONTRACT_DRIFT.md` — snapshot update is CA-13 if you split; include a stub comment in the controller if you defer snapshot to CA-13 **in the same PR prefer CA-13 immediately after**
- `docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md`
- `DraftRequestsController`

## What to build

1. Controller (one class) + DTOs already from CA-07–08.
2. Tests: scope miss → 404/empty; two identities list; unauthenticated 401.
3. Do not add PATCH (CA-12).

## Acceptance criteria

- Working client can render a portfolio without calling draft-list and relabeling.
- Draft list API still lists drafts.

## Constraints

- No public unauthenticated architecture list.
- Do not hand-edit generated client files (CA-13).
- Tenant isolation on every query.
