# FND-011 verification gate: tenant and OpenAPI

## Implemented
- Two independent tenant-scoped HTTP clients using existing `TenantIsolationScenario.WithTwoScopedClientsAsync` and `GreenfieldSqlApiFactory` exercise the existing graph route for an unknown run.
- Added a dedicated CI workflow that builds the .NET 10 test project, runs focused controller/projection tests, and calls the repository's authoritative `scripts/ci/check_openapi_contract_snapshot.sh` drift check.
- Existing controller tests exercise the optional exchange flag, authenticated scope passed to the repository, 413 limit, and legacy response.

## Explicitly not yet demonstrated
- A seeded graph owned by tenant B, visible to B but denied to A. Unknown-run 404 for both tenants is not a substitute.
- Real HTTP with the exchange flag **enabled** under authenticated tenant A/B sessions.
- A regenerated OpenAPI snapshot committed after the actual host generator runs. The optional `secureNowExchange` query parameter can cause drift, even though the existing 200 response metadata was retained.
- Passing CI. GitHub workflow queues have been congested.

## Mandatory release criteria
1. Seed a persisted B-owned graph through the existing test factory/repository, prove B receives 200 and A receives 404 under separate authenticated scopes, including the exchange enabled.
2. Verify unauthorized/unauthenticated HTTP 401/403, sealed-manifest rejection, 413, and pagination.
3. Run `bash scripts/ci/update_openapi_contract_snapshot.sh` in a fully provisioned .NET/Node test environment, review the generated diff, and rerun the drift check.
4. Verify required CI/security and merge stacked PRs in dependency order. Keep feature disabled until then.

Do not mark these requirements passed on the basis of controller mocks or unknown-run tests.
