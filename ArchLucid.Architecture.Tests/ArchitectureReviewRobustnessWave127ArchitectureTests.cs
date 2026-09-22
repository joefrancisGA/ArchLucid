using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-127 architecture create/review robustness suggestions 1509–1520.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave127ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1509_1510_architecture_identity_list_and_get_sealed_manifest_mappers()
    {
        string architecturesController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "ArchitecturesController.cs"));
        string architecturesGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "ArchitecturesController.SealedManifestGuard.cs"));
        string identityGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Architecture",
                "ArchitectureIdentitySealedManifestReadGuard.cs"));

        architecturesController.Should().Contain("ListArchitectures");
        architecturesController.Should().Contain("GetArchitecture");
        architecturesController.Should().Contain("MapArchitectureSealedManifestConflict");
        architecturesController.Should().Contain("EnsureArchitectureIdentitySealedManifestReadAllowedAsync");
        architecturesController.Should().Contain("EnsureArchitectureIdentityListSealedManifestReadAllowedAsync");
        architecturesGuard.Should().Contain("ArchitectureIdentitySealedManifestReadGuard");
        architecturesGuard.Should().Contain("MapArchitectureSealedManifestConflict");
        identityGuard.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion1511_1518_compare_search_drift_attestation_identity_and_end_to_end_export_blocked_reason_wiring()
    {
        string exportCompareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-record-compare-api.ts"));
        string comparisonRecordApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-record-api.ts"));
        string driftApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-drift-api.ts"));
        string attestationApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-exceptions-schedules.ts"));
        string registersApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-registers.ts"));
        string identityApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-identity-api.ts"));
        string endToEndExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-end-to-end-compare-export.ts"));

        exportCompareApi.Should().Contain("compareExportRecords");
        exportCompareApi.Should().Contain("apiGet");
        exportCompareApi.Should().Contain("exportRecordCompareBlockedReason");
        comparisonRecordApi.Should().Contain("searchComparisonRecords");
        comparisonRecordApi.Should().Contain("apiGet");
        comparisonRecordApi.Should().Contain("comparisonSearchBlockedReason");
        driftApi.Should().Contain("downloadComparisonDriftReport");
        driftApi.Should().Contain("comparisonDriftReportBlockedReason");
        attestationApi.Should().Contain("getRealizedValueAttestation");
        attestationApi.Should().Contain("apiGet");
        attestationApi.Should().Contain("realizedValueAttestationBlockedReason");
        registersApi.Should().Contain("getGovernanceReviewsAwaitingAction");
        registersApi.Should().Contain("getGovernanceDecisionsNeededSummary");
        registersApi.Should().Contain("getGovernancePosture");
        registersApi.Should().Contain("reviewsAwaitingActionBlockedReason");
        registersApi.Should().Contain("decisionsNeededSummaryBlockedReason");
        registersApi.Should().Contain("governancePostureBlockedReason");
        identityApi.Should().Contain("listArchitectureIdentities");
        identityApi.Should().Contain("getArchitectureIdentity");
        identityApi.Should().Contain("apiGet");
        identityApi.Should().Contain("architectureIdentityBlockedReason");
        identityApi.Should().Contain("architectureIdentityListBlockedReason");
        endToEndExport.Should().Contain("downloadEndToEndCompareExport");
        endToEndExport.Should().Contain("resolveBlockedReason");
    }

    [Fact]
    public void Suggestion1515_1520_register_posture_identity_dashboard_and_approval_rationale_fail_closed_hooks()
    {
        string registerBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-stickiness-register-blocked-reason.ts"));
        string reviewsHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-reviews-awaiting-action-query.ts"));
        string decisionsHook = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "hooks",
                "use-governance-decisions-needed-summary-query.ts"));
        string postureHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-posture-query.ts"));
        string identityHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-identity-query.ts"));
        string identityDesk = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureIdentityDesk.tsx"));
        string dashboardHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-dashboard-query.ts"));
        string rationaleHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-approval-rationale-query.ts"));
        string attestationHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-realized-value-attestation-query.ts"));
        string queryKeys = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "query", "operator-query-keys.ts"));

        registerBlocked.Should().Contain("reviewsAwaitingActionBlockedReason");
        registerBlocked.Should().Contain("decisionsNeededSummaryBlockedReason");
        reviewsHook.Should().Contain("reviewsAwaitingActionBlockedReason");
        decisionsHook.Should().Contain("decisionsNeededSummaryBlockedReason");
        postureHook.Should().Contain("governancePostureBlockedReason");
        identityHook.Should().Contain("architectureIdentityBlockedReason");
        identityDesk.Should().Contain("architecture-identity-desk-blocked-reason");
        dashboardHook.Should().Contain("governanceDashboardBlockedReason");
        rationaleHook.Should().Contain("getGovernanceApprovalRationale");
        rationaleHook.Should().Contain("governanceApprovalLineageBlockedReason");
        attestationHook.Should().Contain("realizedValueAttestationBlockedReason");
        queryKeys.Should().Contain("governanceApprovalRationale");
        queryKeys.Should().Contain("exportRecordCompare");
    }
}
