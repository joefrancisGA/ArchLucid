# FND-010 run-export sharing-control reuse — 2026-11-24

## Reviewed implementation and verified gap

Compared the existing `RunsExportController` and its `SealedManifestGuard` partial with the production `ArchitectureShareAccessGate.EnsureRunReadAllowedAsync`, which already checks trusted-scoped run ownership and restricted architecture visibility. The route `GET /v1/runs/{runId}/export/{format}` already carries `ReadAuthority`, validates run format, checks sealed-manifest integrity and logs the export. It did **not** invoke the established architecture-sharing decision before calling `IArchitectureReviewExportService.GenerateReportAsync`.

The missing check is a confirmed **inconsistent adoption of the architecture-sharing control** for restricted same-scope architectures; no cross-tenant exploit is claimed. `ReadAuthority` and sealed-manifest hash integrity do not grant visibility to an otherwise restricted architecture.

## Existing-control refactor and verification

- Inject the existing, production-registered `IArchitectureShareAccessGate`; no new policy, service or claim authority.
- In the existing run-export sealed-manifest helper, return non-disclosing 404 on invalid run IDs and invoke `EnsureRunReadAllowedAsync(this, User, currentScope, runGuid, ct)` **before** any `IAuthorityQueryService` detail access or report generation. Keep the existing sealed-manifest hash gate and audit write unchanged.
- Update `RunsExportControllerTests`' existing positive test setup to explicitly permit architecture-share reads. Add a new strict-mock negative test against `N` and `D` run-ID formats. On sharing denial, the report generator, authority-query service and download audit must receive **no calls**.
- Existing `FND-010 .NET Evidence Authorization` focused workflow now selects `RunsExportControllerTests`. A checked-in test or passing static inspection is **not** proof of .NET execution; check the actual CI job and outcome.

**Files inspected:** `ArchLucid.Api/Controllers/Authority/RunsExportController.cs`, `RunsExportController.SealedManifestGuard.cs`, `ArchLucid.Api/Support/ArchitectureShareAccessGate.cs`, `IArchitectureShareAccessGate.cs`, `ArchLucid.Api.Tests/RunsExportControllerTests.cs`, and `.github/workflows/fnd010-dotnet-evidence-authorization.yml`.

**Residual:** `ExportsController` is addressed independently in PR #7966; `ProvenanceController` receives a separate audit/PR. No full inventory of all export endpoints or independent actor authenticity is claimed. The GitHub connector exposes current file/blob SHAs but not a verified complete path history; therefore oldest path appearance and last-touch timestamps are not asserted. No merge or full build on `master`; owner controls merging and full builds run on `RC49` only by request.
