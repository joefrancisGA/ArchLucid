using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-74 architecture create/review robustness suggestions 873–884.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave74ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion873_882_governance_roi_export_and_analysis_mutation_openapi_409()
    {
        string stickinessExceptions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Exceptions.cs"));
        string stickinessDispositions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Dispositions.cs"));
        string stickinessSchedules = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Schedules.cs"));
        string stickinessGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.SealedManifestGuard.cs"));
        string artifactDownload = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Download.cs"));
        string artifactGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.SealedManifestGuard.cs"));
        string roiController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));
        string roiGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.SealedManifestGuard.cs"));
        string draftController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.cs"));
        string policyAssignment = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Assignment.cs"));
        string policyGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.SealedManifestGuard.cs"));
        string consultingDocx = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.ConsultingDocx.Download.cs"));
        string analysisGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.SealedManifestGuard.cs"));

        stickinessExceptions.Should().Contain("RenewRiskException");
        stickinessExceptions.Should().Contain("RevokeRiskException");
        stickinessExceptions.Should().Contain("EnsureRiskExceptionRunSealedManifestAllowedAsync");
        stickinessDispositions.Should().Contain("RecordBulkDisposition");
        stickinessDispositions.Should().Contain("EnsureBulkDispositionSealedManifestAllowedAsync");
        stickinessSchedules.Should().Contain("CreateRecurrenceSchedule");
        stickinessSchedules.Should().Contain("UpdateRecurrenceSchedule");
        stickinessSchedules.Should().Contain("EnsureRecurrenceScheduleSourceRunSealedManifestAllowedAsync");
        stickinessSchedules.Should().Contain("EnsureRecurrenceScheduleUpdateSealedManifestAllowedAsync");
        stickinessGuard.Should().Contain("RecurrenceScheduleCreateSealedManifestHashGuard");
        artifactDownload.Should().Contain("DownloadRunExport");
        artifactDownload.Should().Contain("DownloadRunDecisionReceipt");
        artifactDownload.Should().Contain("EnsureRunSealedManifestHashOrConflictAsync");
        artifactGuard.Should().Contain("EnsureRunSealedManifestHashOrConflictAsync");
        roiController.Should().Contain("GetSponsorDashboardBundleAsync");
        roiController.Should().Contain("GetSponsorReportAsync");
        roiController.Should().Contain("GetSponsorReportExportAsync");
        roiController.Should().Contain("GetSponsorReportHistoryAsync");
        roiController.Should().Contain("EnsureSponsorRoiSealedManifestReadAllowedAsync");
        roiGuard.Should().Contain("SponsorRoiBoardPackSealedManifestGuard");
        draftController.Should().Contain("PatchDraft");
        draftController.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        policyAssignment.Should().Contain("Assign");
        policyAssignment.Should().Contain("ArchiveAssignment");
        policyAssignment.Should().Contain("EnsurePolicyPackMutationSealedManifestAllowedAsync");
        policyGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
        consultingDocx.Should().Contain("DownloadConsultingDocx");
        consultingDocx.Should().Contain("EnsureRunAnalysisSealedManifestAllowedAsync");
        analysisGuard.Should().Contain("ArchitectureAnalysisSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion883_artifact_bundle_mutation_blocked_reason_ui_wiring()
    {
        string bundleBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "artifact-bundle-mutation-blocked-reason.ts"));
        string manifestGrid = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDeliverableGrid.tsx"));
        string sponsorExports = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string artifactsSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "RunDetailArtifactsExportsSection.tsx"));

        bundleBlocked.Should().Contain("artifactBundleMutationBlockedReason");
        manifestGrid.Should().Contain("artifactBundleMutationBlockedReason");
        sponsorExports.Should().Contain("artifactBundleMutationBlockedReason");
        artifactsSection.Should().Contain("artifactBundleMutationBlockedReason");
    }

    [Fact]
    public void Suggestion884_run_export_zip_mutation_blocked_reason_ui_wiring()
    {
        string exportZipBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-export-zip-mutation-blocked-reason.ts"));
        string sponsorExports = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string artifactsSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "RunDetailArtifactsExportsSection.tsx"));

        exportZipBlocked.Should().Contain("runExportZipMutationBlockedReason");
        sponsorExports.Should().Contain("runExportZipMutationBlockedReason");
        artifactsSection.Should().Contain("runExportZipMutationBlockedReason");
    }
}
