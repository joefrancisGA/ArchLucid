# FND-010 artifact-export architecture-share adoption audit (2026-11-24)

## Scope and evidence

This source audit inspected production `ArchLucid.Api/Controllers/Authority/ArtifactExportController.Export.Download.cs`, `ArtifactExportController.cs`, `ArtifactExportController.SealedManifestGuard.cs`, existing `IArchitectureShareAccessGate` and `ArchitectureShareAccessGate`, and focused API test coverage. The source used for the audit was `master` when branch `audit/fnd010-artifact-receipt-terraform-share-20261124` was created. It does **not** establish a full inventory of all API evidence readers or a runtime exploit.

`ArtifactExportController` is class-level protected by `ArchLucidPolicies.ReadAuthority` and already has `_architectureShareAccessGate` injected. The `DownloadRunExport` ZIP route calls `EnsureRunReadAllowedAsync(this, User, scope, runId, ct)` before sealed-manifest or run-detail reads; the two sibling download routes did not:

| Existing route | Existing checks before change | Discovered reuse gap |
| --- | --- | --- |
| `GET /v1/artifacts/reviews/{runId}/decision-receipt` | Tenant/project scope, sealed-manifest read, downstream decision receipt generation and audit | Did **not** call architecture-specific share-read gate before looking up run data |
| `GET /v1/artifacts/reviews/{runId}/terraform-advisory-export` (also `/runs/{runId}/terraform-advisory-export`) | Tenant/project scope, run detail, complete lifecycle, sealed hash, career-posture gate and download audit | Did **not** call architecture-specific share-read gate before run detail or downloadable package generation |
| `GET /v1/artifacts/reviews/{runId}/export` and `/runs/{runId}/export` | Existing architecture-share gate followed by integrity and lifecycle checks | Already reuses the appropriate control; left unchanged |

**Confirmed finding:** the two sibling run-specific downloads lacked the established **restricted-architecture sharing check** in their controller paths. Tenant scope and sealed-manifest integrity serve separate purposes, and are not sufficient substitutes. No proven cross-tenant leak or bypass of production persistence is claimed.

## Narrow reuse correction

The two specific actions now invoke the **already registered** `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync`, using the authenticated `User`, trusted `scopeProvider.GetCurrentScope()`, exact `runId`, and request cancellation token. On a non-null denial result they return immediately **before** any `IAuthorityQueryService`, `IDecisionReceiptService`, or artifact packaging call. The established 404/no-disclosure policy remains the gate's responsibility. No new claims, control implementation, DI registration, SecureNow-only `evidence.read` policy, or normal ZIP export code changed.

`ArchLucid.Api.Tests/ArtifactExportSealedManifestRuntimeConflictTests.cs` extends its existing fixture to accept a strict mock share gate. New tests exercise both affected actions with a denied run, asserting unchanged non-disclosing denial and that strict authority, receipt, and packaging services receive **zero** calls. Existing positive/sealed-conflict tests have an explicit permissive share-gate fixture. The existing `ArchLucid.Api.Tests/Controllers/ArtifactExportControllerRunExportTests.cs` tests are included in the existing focused FND-010 .NET workflow for compatibility.

## Verification / limitations

The test and workflow changes are authored on a draft PR branch. **Do not claim the .NET tests ran or passed until GitHub focused jobs complete**. The PR targets `master` but no comprehensive/full `master` build or merge was authorized; full builds remain on `RC49` only if explicitly requested. A workflow may run automatically as a PR check.

As in earlier adoption audits, the GitHub file-content connector provides blob SHA, not complete source-file path history. The oldest source-file initial appearance and latest-modified timestamp are **unverified**; do not invent dates. Source-level review coverage is three download actions, of which two omitted sharing checks, not a whole-repository numerical adoption rate.

**Next independent audit candidate:** `AuthorityQueryController` buyer-summary, retrieval-grounding and other run-derived routes; check any pre-existing access filters before changing security behavior.
