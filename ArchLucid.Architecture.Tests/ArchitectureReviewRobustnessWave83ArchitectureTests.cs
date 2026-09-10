using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-83 architecture create/review robustness suggestions 981–992.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave83ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion981_987_roi_replay_export_review_trail_analysis_artifact_and_clarification_openapi_409()
    {
        string roi = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));
        string roiGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.SealedManifestGuard.cs"));
        string comparisonReplay = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.Replay.cs"));
        string comparisonGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.SealedManifestGuard.cs"));
        string exportReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));
        string exportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ExportsController.SealedManifestGuard.cs"));
        string reviewTrail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string reviewTrailGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReadsController.SealedManifestGuard.cs"));
        string analysisExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.AnalyzeExport.cs"));
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
        string artifactExport = File.ReadAllText(
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
        string clarification = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewClarificationQuestionsController.cs"));
        string clarificationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewClarificationQuestionsController.SealedManifestGuard.cs"));

        roi.Should().Contain("MapRoiReadSealedManifestConflict");
        roiGuard.Should().Contain("MapRoiReadSealedManifestConflict");
        comparisonReplay.Should().Contain("MapComparisonReplaySealedManifestConflict");
        comparisonGuard.Should().Contain("MapComparisonReplaySealedManifestConflict");
        exportReplay.Should().Contain("MapExportReplaySealedManifestConflict");
        exportGuard.Should().Contain("MapExportReplaySealedManifestConflict");
        reviewTrail.Should().Contain("MapReviewTrailSealedManifestConflict");
        reviewTrailGuard.Should().Contain("MapReviewTrailSealedManifestConflict");
        analysisExport.Should().Contain("MapAnalysisReportExportSealedManifestConflict");
        consultingDocx.Should().Contain("MapAnalysisReportExportSealedManifestConflict");
        analysisGuard.Should().Contain("MapAnalysisReportExportSealedManifestConflict");
        artifactExport.Should().Contain("MapArtifactExportSealedManifestConflict");
        artifactGuard.Should().Contain("MapArtifactExportSealedManifestConflict");
        clarification.Should().Contain("MapClarificationQuestionsSealedManifestConflict");
        clarificationGuard.Should().Contain("MapClarificationQuestionsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion988_991_api_get_compare_load_run_export_and_terraform_blocked_reason_wiring()
    {
        string apiGetBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "api-get-sealed-manifest-aware-blocked-reason.ts"));
        string apiGet = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "api-get-sealed-manifest-aware.ts"));
        string compareLoadBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "compare-runs-load-blocked-reason.ts"));
        string compareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));
        string runExportBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-export-zip-mutation-blocked-reason.ts"));
        string runExportApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-run-export.ts"));
        string terraformBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "terraform-advisory-export-mutation-blocked-reason.ts"));
        string terraformApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-terraform.ts"));

        apiGetBlocked.Should().Contain("apiGetSealedManifestAwareBlockedReason");
        apiGet.Should().Contain("apiGetSealedManifestAwareBlockedReason");
        compareLoadBlocked.Should().Contain("compareRunsLoadBlockedReason");
        compareApi.Should().Contain("compareRunsLoadBlockedReason");
        runExportBlocked.Should().Contain("runExportZipMutationBlockedReason");
        runExportApi.Should().Contain("runExportZipMutationBlockedReason");
        terraformBlocked.Should().Contain("terraformAdvisoryExportMutationBlockedReason");
        terraformApi.Should().Contain("terraformAdvisoryExportMutationBlockedReason");
    }

    [Fact]
    public void Suggestion992_consulting_docx_blocked_reason_wiring()
    {
        string consultingBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "consulting-docx-mutation-blocked-reason.ts"));
        string reportsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-reports.ts"));

        consultingBlocked.Should().Contain("consultingDocxMutationBlockedReason");
        reportsApi.Should().Contain("consultingDocxMutationBlockedReason");
    }
}
