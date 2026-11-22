# FND-011 seeded tenant isolation verification

## Added test
`ArchLucid.Api.Tests/SecureNowSnapshotSeededTenantIsolationTests.cs` creates an in-memory tenant-B-owned `RunRecord` and populated `GraphSnapshot`. Under an enabled exchange flag, it invokes the actual graph controller twice:
- Scope A: repository lookup returns no matching run; expected HTTP action result 404 and no authority detail lookup.
- Scope B: repository lookup resolves the owned run and graph; expected HTTP action result 200 with B-scoped exchange and B's node.

The test is included in the focused FND-011 .NET build/test workflow.

## Trust limitation
This is a **seeded controller test using mocked repositories and authenticated scope providers**, not a full HTTP test with a persisted two-tenant graph. The previously added two-client HTTP test still covers unknown-run 404 only. It would be inaccurate to claim a complete end-to-end isolation proof.

## OpenAPI
The existing official generator is `scripts/ci/update_openapi_contract_snapshot.sh`, with drift check `scripts/ci/check_openapi_contract_snapshot.sh`. The focused CI now runs the drift check, but this branch does not contain a regenerated snapshot. Review the generated change for the optional `secureNowExchange` query parameter and regenerate using the official host-backed process.

## Blockers before activation
1. Confirm focused .NET compilation/tests and required security/CI checks pass.
2. Implement seeded persistent graph B visible to B and denied to A through real authenticated HTTP clients.
3. Regenerate and approve OpenAPI v1 snapshot and generated clients where necessary.
4. Merge stacked dependencies and keep the feature flag off until security sign-off.
