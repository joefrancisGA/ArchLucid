# FND-011 authenticated HTTP boundary increment

Status: Draft, feature disabled unless server-side `IFeatureFlags.IsEnabledAsync("SecureNow.ReadOnlySnapshotExchange")` returns true.

## Integration
`GraphController.GetArchitectureGraphTemporalSnapshot` now accepts optional `secureNowExchange=false`. The default path retains the original response. With the option enabled, the server checks the feature flag and returns 404 when missing/disabled. If enabled, it follows the **existing** scoped run lookup, temporal resolution, manifest checks, and graph size limit before calling `SecureNowSnapshotProjection.Project`. No customer writes.

## Trust boundary
The controller already has `[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]`, tenant-tier and rate-limiting attributes. Scope comes from `IScopeContextProvider`, not a query parameter. A foreign run that is absent under the authenticated scope returns 404. The projector is not itself an authorization engine.

## Tests and limitations
`SecureNowSnapshotHttpBoundaryTests` verifies disabled feature returns 404 before repository access, enabled foreign-scope run absence returns 404, and default route behavior is unaffected. These are controller-level tests with mocked repositories and services, **not** full HTTP middleware/authentication integration tests. End-to-end HTTP tests with real authentication claims, sealed-manifest behavior, 413 and schema compatibility remain required before activation.

## Outstanding
- FND-011 schema PR #7659 and projector PR #7665 are unmerged. This branch is based on #7665.
- Verify CI and OpenAPI contract snapshot compatibility. The optional query parameter and response type can affect OpenAPI output.
- No default feature configuration enables this flag. Do not enable in production without explicit authorization and security review.
