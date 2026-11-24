# FND-010 manifest-ID lookup: run-share authorization and exact sealed identity

**Date:** 2026-11-24  
**Branch:** `audit/fnd010-manifest-id-run-share-seal-20261124`  
**Target:** `master`, draft PR; no automatic merges, no comprehensive `master` builds.

## Existing route and verified adoption gap

`GET /v1/authority/signed-review-records/{manifestId:guid}/summary` in `AuthorityQueryController.Trail.cs` used `IAuthorityQueryService.GetManifestSummaryAsync(scope, manifestId)` to resolve a `ManifestSummaryDto`, then loaded the related run's **current** `GoldenManifest` with `GetRunDetailForManifestCompareAsync(scope, summary.RunId)`, checked that manifest's hash, and returned the summary. **It did not invoke the existing scoped architecture-sharing gate.**

`DapperAuthorityQueryService.Manifest.cs` and `InMemoryAuthorityQueryService.Manifest.cs` both resolve the supplied manifest ID through `IGoldenManifestRepository.GetByIdAsync(scope, manifestId)`, so the first lookup is scoped to tenant/workspace/project. Its mapper projects `ManifestDocument.RunId` and `ManifestDocument.ManifestId`. This provides a grounded run identifier for the existing `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync`; a manifest ID must never be passed to the run gate as though it were a run ID.

**Security distinction:** `ReadAuthority` authenticates/authorizes the general HTTP operation; repository scope isolates tenants/projects; `SealedManifestReadGuard` proves hash integrity; the existing architecture-share gate enforces *additional restricted-architecture visibility*. Missing the last check can disclose metadata about a restricted architecture within a legitimately authorized scope. No actual cross-tenant leak is asserted.

## Two complementary reuse changes

1. **Authorize resolved run before protected reads.** Reject empty manifest IDs, missing scoped summaries, a summary's wrong `ManifestId`, or an empty `RunId` with manifest-not-found. Apply the already DI-injected `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync(this, User, scope, summary.RunId, ct)`. On any denial, map to a generic **manifest 404** rather than forwarding a run-specific error containing the run ID. No run detail, exact manifest payload or hash read is performed after denial.
2. **Bind the hash to the requested manifest, not an arbitrary/current document.** The existing `GetRunDetailForManifestCompareAsync` read still requires a scoped run header and a valid current pinned `GoldenManifest`, with matching current pointer and run ID. If the current pinned manifest has the requested ID, reuse the already-loaded document and its hash check without another manifest lookup. Otherwise **historical/superseded manifest IDs remain supported**: use the existing scoped golden-manifest repository to fetch the exact requested manifest via new `IAuthorityQueryService.GetManifestForSummaryVerificationAsync`, implemented in SQL and in-memory service partials by direct delegation. Check its `ManifestId`, `RunId`, three-part scope and hash string against the resolved summary, and run the existing `SealedManifestReadGuard` on **that exact document**, also checking the current pinned document's sealed hash. A missing/unverified/mismatched association fails closed with **409 conflict**. No silent rewriting to the current manifest, and no requirement that a historical ID equal the run's current pointer.

The additional method is a **narrow reuse of an existing repository capability**, not a new authorization service or entitlement. It enforces scoped document lookup; the HTTP caller must independently authorize sharing beforehand. Avoid conflating the API authorization check with the repository lookup.

## Focused regression / quality gate

New `ArchLucid.Api.Tests/AuthorityManifestSummaryShareAccessTests.cs` covers:
- Missing, empty, mismatched or cross-scope-equivalent summary results fail before sharing or run detail.
- A restricted run yields a non-disclosing manifest-not-found response; exact payload and run detail are never queried.
- An authorized **current** manifest returns the expected summary, with one hash computation and no extra exact-ID repository read.
- An authorized **historical** manifest with a different current pointer loads and hashes the requested and current documents separately, returning the requested ID.
- Wrong requested manifest identity, wrong run, wrong tenant/scope, wrong summary hash, missing requested document, tampered seal, mismatched pinned header, or mismatched run detail returns conflict.
- The existing general FND-010 authorization tests, and in-memory/SQL manifest scope protections, remain distinct.

The existing `.github/workflows/fnd010-dotnet-evidence-authorization.yml` now selects this test class. **Do not claim focused .NET tests passed until real CI runs compile and execute them.** No full `master` build may be dispatched. Changes are isolated from draft PR #7978; when either PR is merged, reconcile `AuthorityQueryController.Trail.cs`, its sealed helper, and the focused test selector on the remaining branch without dropping either protection.

## Provenance and limits

Source-inspected files: `AuthorityQueryController.Trail.cs`, `AuthorityQueryController.SealedManifestGuard.cs`, `IAuthorityQueryService.cs`, `DapperAuthorityQueryService.Manifest.cs`, `InMemoryAuthorityQueryService.Manifest.cs`, `AuthorityRunMapper.cs`, `GoldenManifestReadSql.cs`, `SqlGoldenManifestRepository.Read.cs`, `InMemoryGoldenManifestRepository.cs`, `ArchitectureShareAccessGate.cs`, `SealedManifestReadGuard.cs`, and scope regression tests.

Previously verified GitHub path histories (no rename following): `AuthorityQueryController.Trail.cs` earliest visible path commit 2026-08-26T13:19:04Z, last baseline-master path modification 2026-09-10T19:19:17Z; `DapperAuthorityQueryService.Manifest.cs` first/last visible path modification 2026-08-26T21:19:41Z; `InMemoryAuthorityQueryService.Manifest.cs` first/last visible 2026-08-27T00:33:45Z. No claim about older renamed paths or production tenancy configuration.

**Residual:** This does not atomically bind authorization and source data in one database transaction, nor certify all other manifest-derived HTTP readers. Further inventory should inspect artifact and governance manifest-ID routes; do not assume their policy is identical without consumer review.
