# DA-03 — API: list, get, and ensure architecture identity

**Do not fork** draft CRUD (`DraftRequestsController`). **Do not** make `GET /v1/architecture/drafts` the architecture list. This is the **HTTP surface of ADR 0074**. Schema from DA-02 must exist on the branch.

## Goal

Architects (and the Working desk) can **list and open identities** without opening every draft or review.

1. **GET** collection: tenant/workspace/project scoped list — `ArchitectureId`, `DisplayName`, `UpdatedUtc`, optional `CurrentDraftId`, `LatestReviewId`, `LatestSealedManifestId`, counts of child drafts/reviews. Pagination with **total count** (DA-07 will consume `totalCount` / `hasMore`).
2. **GET by id:** identity + child summaries (not full documents). 404 if out of scope (ADR 0037), never leak cross-tenant.
3. **Ensure:** given a new draft create, return or create the parent identity (product of DA-06; this prompt at least ships the application method the controller will call).
4. RBAC: same as draft read/write (`ReadAuthority` / existing draft execute roles). No new permission names.

Prefer extending `IArchitectureIdentityRepository` with `ListAsync` / `GetWithChildrenAsync` over a second service if the existing service can stay the orchestrator. **One new class per file** if you add query types.

## Why

`ArchitectureIdentityService` today only `CreateAsync`s on Created-origin runs and links re-reviews. There is no list. The `/architecture/architectures` UI lists **drafts**. Without a list API, DA-04 cannot be an architecture desk.

## Context

- ADR 0074, DA-02 columns
- `ArchitectureIdentityService.cs` + `ArchitectureIdentityServiceTests.cs`
- `IArchitectureIdentityRepository`
- `docs/library/API_CONTRACTS.md` + OpenAPI snapshot workflow (`docs/library/OPENAPI_CONTRACT_DRIFT.md`)
- Route/tier/policy/nav matrix if a new controller is added (`docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md`)
- Existing drafts routes under `DraftRequestsController`

## What to build

1. Application queries + DTO in `ArchLucid.Contracts/Architecture/` (new files, one type per file).
2. HTTP: prefer `GET /v1/architectures` and `GET /v1/architectures/{architectureId}` (buyer vocabulary, ADR 0064). If that collides with a marketing or draft path, document the collision in the PR and use `GET /v1/architecture/identities` — say which, with a one-line Trade-off in the PR body (not a new ADR).
3. OpenAPI snapshot + generated client **if** the prompt’s compile/typecheck path requires it. Follow `Http-Surface-Docs-And-Clients.mdc`.
4. Tests: scope miss → empty/404; two identities in one workspace both list; child counts do not include other tenants.
5. Do not build the SPA desk (DA-04). Do not rename draft route params (DA-05).

## Acceptance criteria

- Working client can render a portfolio without calling draft-list and relabeling.
- Out-of-scope id does not return another tenant’s name.
- Draft list API still lists drafts.

## Constraints

- No public unauthenticated architecture list.
- Do not implement BFF (LK-05).
- Update OpenAPI if the v1 document changes; do not hand-edit generated files except via the generate script.
