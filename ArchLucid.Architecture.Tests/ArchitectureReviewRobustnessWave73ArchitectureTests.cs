using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-73 architecture create/review robustness suggestions 861–872.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave73ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion861_867_pilot_roi_analysis_and_governance_mutation_openapi_409()
    {
        string pilotsPacks = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));
        string pilotsGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.SealedManifestGuard.cs"));
        string roiController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));
        string roiGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.SealedManifestGuard.cs"));
        string analysisExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.AnalyzeExport.cs"));
        string analysisGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.SealedManifestGuard.cs"));
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
        string stickinessGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.SealedManifestGuard.cs"));
        string bulkDispositionFacade = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.Dispositions.cs"));

        pilotsPacks.Should().Contain("GetSponsorProofPackZip");
        pilotsPacks.Should().Contain("GetExecutiveReviewPacket");
        pilotsPacks.Should().Contain("GetFirstValueReport");
        pilotsPacks.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        pilotsPacks.Should().Contain("Status409Conflict");
        pilotsGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        roiController.Should().Contain("GetSponsorReportBoardPackAsync");
        roiController.Should().Contain("EnsureSponsorRoiBoardPackSealedManifestReadAllowedAsync");
        roiController.Should().Contain("Status409Conflict");
        roiGuard.Should().Contain("SponsorRoiBoardPackSealedManifestGuard");
        analysisExport.Should().Contain("AnalyzeRun");
        analysisExport.Should().Contain("ExportAnalysisReport");
        analysisExport.Should().Contain("DownloadAnalysisReportExport");
        analysisExport.Should().Contain("DownloadAnalysisReportDocx");
        analysisExport.Should().Contain("EnsureRunAnalysisSealedManifestAllowedAsync");
        analysisExport.Should().Contain("Status409Conflict");
        analysisGuard.Should().Contain("ArchitectureAnalysisSealedManifestHashGuard");
        stickinessExceptions.Should().Contain("CreateRiskException");
        stickinessExceptions.Should().Contain("EnsureGovernanceDispositionRunSealedManifestAllowedAsync");
        stickinessDispositions.Should().Contain("RecordDisposition");
        stickinessDispositions.Should().Contain("ResolveFindingMergeConflict");
        stickinessDispositions.Should().Contain("EnsureGovernanceDispositionRunSealedManifestAllowedAsync");
        stickinessDispositions.Should().Contain("RecordBulkDisposition");
        stickinessGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        bulkDispositionFacade.Should().Contain("RecordBulkDispositionAsync");
        bulkDispositionFacade.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion868_870_pilot_collateral_roi_board_pack_and_consulting_docx_mutation_blocked_reason_ui_wiring()
    {
        string collateralBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "pilots-collateral-mutation-blocked-reason.ts"));
        string sponsorExports = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string roiBoardPackBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-roi-board-pack-mutation-blocked-reason.ts"));
        string roiSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "sponsor-dashboard",
                "_sections",
                "SponsorRoiSummarySection.tsx"));
        string consultingBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "consulting-docx-mutation-blocked-reason.ts"));
        string consultingButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ConsultingDocxExportButton.tsx"));

        collateralBlocked.Should().Contain("pilotsCollateralMutationBlockedReason");
        sponsorExports.Should().Contain("pilotsCollateralMutationBlockedReason");
        roiBoardPackBlocked.Should().Contain("sponsorRoiBoardPackMutationBlockedReason");
        roiSection.Should().Contain("sponsorRoiBoardPackMutationBlockedReason");
        consultingBlocked.Should().Contain("consultingDocxMutationBlockedReason");
        consultingButton.Should().Contain("consultingDocxMutationBlockedReason");
    }

    [Fact]
    public void Suggestion871_872_run_exports_and_architecture_package_docx_mutation_blocked_reason_ui_wiring()
    {
        string summaryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-summary-export-mutation-blocked-reason.ts"));
        string packageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-package-export-mutation-blocked-reason.ts"));
        string architecturePackageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-package-docx-mutation-blocked-reason.ts"));
        string runHeader = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailPageHeader.tsx"));
        string manifestGrid = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDeliverableGrid.tsx"));
        string sponsorExports = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));

        summaryBlocked.Should().Contain("runSummaryExportMutationBlockedReason");
        packageBlocked.Should().Contain("runPackageExportMutationBlockedReason");
        architecturePackageBlocked.Should().Contain("architecturePackageDocxMutationBlockedReason");
        runHeader.Should().Contain("runSummaryExportMutationBlockedReason");
        runHeader.Should().Contain("runPackageExportMutationBlockedReason");
        manifestGrid.Should().Contain("architecturePackageDocxMutationBlockedReason");
        sponsorExports.Should().Contain("architecturePackageDocxMutationBlockedReason");
        sponsorExports.Should().Contain("runPackageExportMutationBlockedReason");
    }
}
