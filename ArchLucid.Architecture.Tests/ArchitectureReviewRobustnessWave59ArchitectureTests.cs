using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-59 architecture create/review robustness suggestions 693–704.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave59ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion693_694_architecture_identity_list_and_get_openapi_409()
    {
        string architecturesController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "ArchitecturesController.cs"));
        string architecturesGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "ArchitecturesController.SealedManifestGuard.cs"));
        string identityGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureIdentitySealedManifestReadGuard.cs"));

        architecturesController.Should().Contain("ListArchitectures");
        architecturesController.Should().Contain("GetArchitecture");
        architecturesController.Should().Contain("Status409Conflict");
        architecturesController.Should().Contain("EnsureArchitectureIdentitySealedManifestReadAllowedAsync");
        architecturesController.Should().Contain("EnsureArchitectureIdentityListSealedManifestReadAllowedAsync");
        architecturesGuard.Should().Contain("ArchitectureIdentitySealedManifestReadGuard");
        identityGuard.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion695_698_compare_search_drift_and_attestation_sealed_clients()
    {
        string exportCompareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-record-compare-api.ts"));
        string exportCompareHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-record-compare-query.ts"));
        string comparisonRecordApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-record-api.ts"));
        string comparisonSearchHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-comparison-search-query.ts"));
        string driftApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-drift-api.ts"));
        string attestationApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-exceptions-schedules.ts"));
        string attestationHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-realized-value-attestation-query.ts"));

        exportCompareApi.Should().Contain("compareExportRecords");
        exportCompareApi.Should().Contain("apiGetSealedManifestAware");
        exportCompareHook.Should().Contain("exportRecordCompareBlockedReason");
        comparisonRecordApi.Should().Contain("searchComparisonRecords");
        comparisonRecordApi.Should().Contain("apiGetSealedManifestAware");
        comparisonSearchHook.Should().Contain("comparisonSearchBlockedReason");
        driftApi.Should().Contain("downloadComparisonDriftReport");
        attestationApi.Should().Contain("getRealizedValueAttestation");
        attestationApi.Should().Contain("apiGetSealedManifestAware");
        attestationHook.Should().Contain("realizedValueAttestationBlockedReason");
    }

    [Fact]
    public void Suggestion699_703_register_posture_identity_and_dashboard_fail_closed()
    {
        string registerBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-stickiness-register-blocked-reason.ts"));
        string reviewsHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-reviews-awaiting-action-query.ts"));
        string decisionsHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-decisions-needed-summary-query.ts"));
        string postureHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-posture-query.ts"));
        string postureBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-posture-blocked-reason.ts"));
        string identityApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-identity-api.ts"));
        string identityHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-identity-query.ts"));
        string identityDesk = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureIdentityDesk.tsx"));
        string dashboardHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-dashboard-query.ts"));

        registerBlocked.Should().Contain("reviewsAwaitingActionBlockedReason");
        registerBlocked.Should().Contain("decisionsNeededSummaryBlockedReason");
        reviewsHook.Should().Contain("reviewsAwaitingActionBlockedReason");
        decisionsHook.Should().Contain("decisionsNeededSummaryBlockedReason");
        postureHook.Should().Contain("governancePostureBlockedReason");
        postureBlocked.Should().Contain("governancePostureBlockedReason");
        identityApi.Should().Contain("apiGetSealedManifestAware");
        identityHook.Should().Contain("architectureIdentityBlockedReason");
        identityDesk.Should().Contain("architecture-identity-desk-blocked-reason");
        dashboardHook.Should().Contain("governanceDashboardBlockedReason");
    }

    [Fact]
    public void Suggestion702_704_end_to_end_export_and_approval_rationale_clients()
    {
        string endToEndExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-end-to-end-compare-export.ts"));
        string rationaleHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-approval-rationale-query.ts"));
        string approvalsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-approvals.ts"));
        string queryKeys = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "query", "operator-query-keys.ts"));

        endToEndExport.Should().Contain("downloadEndToEndCompareExport");
        rationaleHook.Should().Contain("getGovernanceApprovalRationale");
        rationaleHook.Should().Contain("governanceApprovalLineageBlockedReason");
        approvalsApi.Should().Contain("getGovernanceApprovalRationale");
        approvalsApi.Should().Contain("apiGetSealedManifestAware");
        queryKeys.Should().Contain("governanceApprovalRationale");
        queryKeys.Should().Contain("exportRecordCompare");
    }
}
