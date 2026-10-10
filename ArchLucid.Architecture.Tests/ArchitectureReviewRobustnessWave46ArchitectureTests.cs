using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-46 architecture create/review robustness suggestions 537–548.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave46ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion537_538_artifact_descriptor_and_run_manifest_openapi_409()
    {
        string artifactExports = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArtifactExportController.RunArtifacts.cs"));
        string authorityReads = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));

        artifactExports.Should().Contain("GetArtifactDescriptor");
        artifactExports.Should().Contain("Status409Conflict");
        authorityReads.Should().Contain("GetRunManifest");
        authorityReads.Should().Contain("Status409Conflict");
        authorityReads.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion539_541_compare_and_manifest_json_409_ux()
    {
        string provenanceBand = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareProvenanceDeltaBand.tsx"));
        string manifestDiff = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "compare", "CompareRawManifestDiffSection.tsx"));
        string manifestJsonFetch = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "manifest-json-fetch.ts"));
        string compareBlockedReason = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "compare-manifest-diff-blocked-reason.ts"));

        provenanceBand.Should().Contain("compareRunPairBlockedReason");
        manifestDiff.Should().Contain("compareManifestDiffBlockedReason");
        compareBlockedReason.Should().Contain("compareManifestDiffBlockedReason");
        manifestJsonFetch.Should().Contain("signedReviewRecordBlockedReason");
    }

    [Fact]
    public void Suggestion542_544_governance_posture_and_roi_fetch_fail_closed()
    {
        string postureRegisters = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-registers.ts"));
        string postureOverview = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "posture",
                "ArchitecturePosturePillarOverview.tsx"));
        string sponsorRoiClient = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "fetch-sponsor-roi-summary-client.ts"));
        string crossTenantClient = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "fetch-cross-tenant-portfolio-client.ts"));
        string roiController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));

        postureRegisters.Should().Contain("apiGetSealedManifestAware");
        postureOverview.Should().Contain("governancePostureBlockedReason");
        sponsorRoiClient.Should().Contain("sponsorRoiSummaryBlockedReason");
        crossTenantClient.Should().Contain("crossTenantPortfolioBlockedReason");
        roiController.Should().Contain("GetCrossTenantPortfolioSummaryAsync");
        roiController.Should().Contain("ConflictException");
    }

    [Fact]
    public void Suggestion545_548_programmatic_downloads_and_server_markdown_export()
    {
        string runPackage = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-run-package.ts"));
        string runExport = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-run-export.ts"));
        string artifactSingle = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-artifact-single.ts"));
        string decisionReceipt = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-decision-receipt.ts"));
        string runDetailExports = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string artifactTable = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ArtifactListTable.tsx"));
        string decisionButton = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "draft-intake", "DecisionReceiptExportButton.tsx"));
        string exportMenu = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "GoldenManifestExportMenu.tsx"));

        runPackage.Should().Contain("downloadRunPackageExport");
        runExport.Should().Contain("downloadRunExportZip");
        artifactSingle.Should().Contain("downloadArtifactFile");
        decisionReceipt.Should().Contain("downloadRunDecisionReceiptJson");
        runDetailExports.Should().Contain("downloadRunPackageExport");
        runDetailExports.Should().Contain("downloadRunExportZip");
        artifactTable.Should().Contain("downloadArtifactFile");
        decisionButton.Should().Contain("downloadRunDecisionReceiptJson");
        exportMenu.Should().Contain("downloadManifestMarkdownExport");
        exportMenu.Should().Contain("manifestMarkdownExportBlockedReason");
    }
}
