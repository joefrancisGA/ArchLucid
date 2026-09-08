using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-45 architecture create/review robustness suggestions 525–536.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave45ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion525_527_signed_review_record_and_manifest_read_409_ux()
    {
        string sealedManifestAwareGet = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "api-get-sealed-manifest-aware.ts"));
        string signedReviewBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "manifest", "signed-review-record-blocked-reason.ts"));
        string runManifestRead = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string artifactReads = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-artifacts.ts"));
        string downloadManifest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "DownloadManifestButton.tsx"));

        sealedManifestAwareGet.Should().Contain("formatExportSealedManifestAwareApiError");
        signedReviewBlockedReason.Should().Contain("signedReviewRecordBlockedReason");
        runManifestRead.Should().Contain("apiGetSealedManifestAware");
        artifactReads.Should().Contain("apiGetSealedManifestAware");
        downloadManifest.Should().Contain("signedReviewRecordBlockedReason");
    }

    [Fact]
    public void Suggestion526_compare_manifest_read_409_ux()
    {
        string governanceDiff = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-compare-governance-diff-query.ts"));
        string manifestJsonForDiff = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "resolve-architecture-manifest-json-for-diff.ts"));

        governanceDiff.Should().Contain("formatExportSealedManifestAwareApiError");
        manifestJsonForDiff.Should().Contain("formatExportSealedManifestAwareApiError");
    }

    [Fact]
    public void Suggestion528_530_manifest_export_and_sponsor_dashboard_bundle()
    {
        string manifestMarkdownExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "manifest-markdown-export-api.ts"));
        string downloadsTrigger = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger.ts"));
        string sponsorBundleClient = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "fetch-sponsor-dashboard-bundle-client.ts"));
        string sponsorDashboardContext = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "sponsor", "SponsorDashboardDataContext.tsx"));
        string roiController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));

        manifestMarkdownExport.Should().Contain("downloadManifestMarkdownExport");
        downloadsTrigger.Should().Contain("downloadManifestMarkdownExport");
        sponsorBundleClient.Should().Contain("sponsorDashboardBundleBlockedReason");
        sponsorDashboardContext.Should().Contain("sponsorDashboardBundleBlockedReason");
        roiController.Should().Contain("GetSponsorDashboardBundleAsync");
        roiController.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion531_536_learning_reports_and_roi_openapi_409()
    {
        string learningPlanning = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "LearningController.PlanningReport.cs"));
        string productLearning = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "ProductLearningController.Triage.cs"));
        string planningExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "planning", "PlanningExportReadinessNote.tsx"));
        string productLearningView = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "internal",
                "product-learning",
                "_sections",
                "ProductLearningPageView.tsx"));
        string infraHubApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "infra-evidence", "infra-evidence-hub-api.ts"));
        string roiController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));

        learningPlanning.Should().Contain("GetPlanningReport");
        learningPlanning.Should().Contain("Status409Conflict");
        productLearning.Should().Contain("GetTriageReport");
        productLearning.Should().Contain("Status409Conflict");
        planningExport.Should().Contain("learningPlanningReportBlockedReason");
        productLearningView.Should().Contain("productLearningReportBlockedReason");
        infraHubApi.Should().Contain("infraEvidenceHubBlockedReason");
        roiController.Should().Contain("GetCrossTenantPortfolioSummaryAsync");
    }
}
