# FND-010 / architecture-share reuse audit: authority export surfaces

**Date:** 2026-11-24  
**Branch:** `audit/fnd010-export-share-access-reuse-20261124`, draft PR targeting `master`  
**Scope:** Reuse an established read-authorization control on `ExportsController` without extending the SecureNow-only `evidence.read` entitlement to unrelated product endpoints.

## Control distinction and source inventory

The existing `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync` resolves a run in its current trusted scope and checks read access to its associated restricted architecture; it returns a non-disclosing 404 when sharing does not authorize the principal. This is a separate, narrower resource-level decision than `[Authorize(Policy = ReadAuthority)]` and separate from `SealedManifestReadGuard`, which validates integrity rather than visibility.

The `ExportsController` production code uses class-level ReadAuthority, scoped export query facade and a sealed-manifest guard, but **none of its run-specific export endpoints called the existing architecture-sharing gate**. The inspected repository source confirms the following consumers of the original `EnsureSealedManifestReadAllowedAsync` and export-record-derived guard:

| Controller action | Existing guard | Reused sharing gate after correction |
| --- | --- | --- |
| `GetRunExportHistory` | Sealed-manifest read for a direct run identifier | Scoped share decision on the same run |
| `GetExportRecord` | Resolve export record to source run, then sealed-manifest guard | Scoped share decision on the source run |
| `CompareExportRecords` | Left and right source-run sealed guards | Separate sharing decisions for each run before comparison |
| `CompareExportRecordsSummary` | Left and right source-run sealed guards | Separate sharing decisions before any summary persist/audit |
| `ReplayExportRecord` | Source-run sealed guard | Sharing decision before replay generation/persistence |
| `ReplayExportRecordMetadata` | Source-run sealed guard | Sharing decision before replay metadata generation |

**Finding:** the established share authorization was not reused on six export actions. This is an **authorization-consistency gap** for a restricted architecture in an otherwise permitted tenant/project scope, **not** evidence of a proven cross-tenant leak. Existing query-service scoping, lineage, lifecycle, and sealed-hash checks remain intact.

## Narrow implementation

Inject the existing DI-registered `IArchitectureShareAccessGate` into `ExportsController`. In the existing shared `ExportsController.SealedManifestGuard.cs` helper, reject invalid run IDs before any protected facade call; use the existing gate with `User`, trusted `IScopeContextProvider` scope and parsed run GUID; return its denial before resolving run detail and checking the sealed-manifest hash. Export records with missing or malformed run linkage now return a 404 instead of skipping the guard. Records not found remain delegated to the scoped facade for its normal 404 result.

This creates **no new authorization service or policy**, and does not change general `ReadAuthority` or SecureNow's separately scoped central `evidence.read` contract. It preserves the existing export record lookup needed to resolve a run ID prior to sharing authorization; that read is not itself returned to the caller. A later audit may consider moving export-record resolution into a fully scoped service API.

## Regression proofs

- New `ExportsControllerShareAccessTests`: denies direct history, record, left- and right-sided comparisons, persistent summary, replay and replay metadata; asserts no export query facade calls after denial and no protected run-detail retrieval for denied runs. Tests reject malformed direct run IDs and orphaned/malformed export-record-to-run links.
- Existing `ExportsControllerScopeTests`, `ExportsControllerReplayExportAuditTests`, and `ExportsControllerCompareSummaryAuditTests` explicitly configure allowed sharing where their prior scope, career posture, lineage and audit behavior remains the subject.
- The existing `FND-010 .NET Evidence Authorization` focused PR workflow now selects all four export suites. Test execution and status must be established from CI; a source-level assertion is not a passing .NET proof.

## Further work and limitations

The sibling `RunsExportController` and `ProvenanceController` expose separate run-derived artifact paths and were inspected but **not modified** here; assess their access contracts individually without assuming the SecureNow-only gate should apply globally. Other endpoints or alternate code paths may remain. The oldest source file and its last modification timestamp **cannot be established from the file/blob SHA returned by the available GitHub content connector**; no historical date is claimed without actual Git path-history verification.

Merges remain the user's decision. No full build of `master`; full builds are reserved for `RC49` only at explicit request.
