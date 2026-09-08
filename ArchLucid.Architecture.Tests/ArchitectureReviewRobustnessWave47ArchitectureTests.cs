using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-47 architecture create/review robustness suggestions 549–560.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave47ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion549_551_provenance_and_seal_delta_openapi_409()
    {
        string readHandlers = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Support", "AuthorityRunReadHandlers.cs"));
        string authorityReads = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string authorityTrail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.Trail.cs"));
        string runProvenance = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Provenance.cs"));
        string sealDeltaService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSealDeltaService.cs"));
        string architecturesController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "ArchitecturesController.cs"));

        readHandlers.Should().Contain("SealedManifestReadGuard");
        authorityReads.Should().Contain("GetReviewTrailProvenance");
        authorityReads.Should().Contain("Status409Conflict");
        authorityTrail.Should().Contain("GetRunProvenance");
        authorityTrail.Should().Contain("Status409Conflict");
        runProvenance.Should().Contain("GetArchitectureRunProvenance");
        runProvenance.Should().Contain("Status409Conflict");
        sealDeltaService.Should().Contain("SealedManifestReadGuard");
        architecturesController.Should().Contain("GetSealDelta");
        architecturesController.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion550_555_provenance_and_explain_sealed_manifest_aware_reads()
    {
        string runDetailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string provenanceBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "provenance", "run-provenance-blocked-reason.ts"));
        string provenancePage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "provenance",
                "page.tsx"));

        runDetailArtifacts.Should().Contain("apiGetSealedManifestAware");
        runDetailArtifacts.Should().Contain("getRunExplanationSummary");
        provenanceBlockedReason.Should().Contain("runProvenanceBlockedReason");
        provenancePage.Should().Contain("runProvenanceBlockedReason");
    }

    [Fact]
    public void Suggestion552_557_seal_delta_and_finding_reads_fail_closed()
    {
        string sealDeltaApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-seal-delta-api.ts"));
        string sealDeltaPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureSealDeltaPanel.tsx"));
        string compareReads = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));
        string findingsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));
        string runFindings = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Findings.cs"));

        sealDeltaApi.Should().Contain("apiGetSealedManifestAware");
        sealDeltaPanel.Should().Contain("architectureSealDeltaBlockedReason");
        compareReads.Should().Contain("apiGetSealedManifestAware");
        compareReads.Should().Contain("compareRunsEndToEnd");
        findingsApi.Should().Contain("getFindingEvidenceChain");
        findingsApi.Should().Contain("apiGetSealedManifestAware");
        runFindings.Should().Contain("GetFindingEvidenceChain");
        runFindings.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion558_560_programmatic_download_consolidation()
    {
        string bundleButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDetailBundleExportButton.tsx"));
        string emailRunExports = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string runDetailHeader = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailPageHeader.tsx"));
        string architectureDocx = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-architecture-package-docx.ts"));
        string deliverableGrid = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDeliverableGrid.tsx"));
        string sponsorHandoff = File.ReadAllText(
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
                "ReviewPackageSponsorHandoffStrip.tsx"));

        bundleButton.Should().Contain("downloadArtifactBundleZip");
        emailRunExports.Should().Contain("downloadRunPackageExport");
        emailRunExports.Should().Contain("downloadArchitecturePackageDocx");
        runDetailHeader.Should().Contain("downloadRunPackageExport");
        architectureDocx.Should().Contain("downloadArchitecturePackageDocx");
        deliverableGrid.Should().Contain("downloadArchitecturePackageDocx");
        sponsorHandoff.Should().Contain("downloadRunPackageExport");
    }
}
