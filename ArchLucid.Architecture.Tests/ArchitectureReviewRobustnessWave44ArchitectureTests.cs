using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-44 architecture create/review robustness suggestions 513–524.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave44ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion513_515_audit_export_and_finding_explainability()
    {
        string auditExportHook = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "audit",
                "_sections",
                "use-audit-page-export.ts"));
        string findingExplainDialog = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingExplainabilityDialog.tsx"));
        string findingExplainBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "explain", "finding-explain-blocked-reason.ts"));
        string findingExplainability = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ExplanationController.FindingExplain.cs"));

        auditExportHook.Should().Contain("auditExportBlockedReason");
        findingExplainDialog.Should().Contain("findingExplainBlockedReason");
        findingExplainBlockedReason.Should().Contain("findingExplainBlockedReason");
        findingExplainability.Should().Contain("GetFindingExplainability");
        findingExplainability.Should().Contain("Status409Conflict");
        findingExplainability.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion516_517_openapi_409_declarations()
    {
        string signedReviewRecord = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.Trail.cs"));
        string artifactExports = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ArtifactExportController.RunArtifacts.cs"));

        signedReviewRecord.Should().Contain("GetRunGoldenManifest");
        signedReviewRecord.Should().Contain("Status409Conflict");
        signedReviewRecord.Should().Contain("SealedManifestReadGuard");
        artifactExports.Should().Contain("ListArtifacts");
        artifactExports.Should().Contain("DownloadBundleForRun");
        artifactExports.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion518_521_export_409_and_anchor_consolidation()
    {
        string auditEvidencePackage = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "audit-evidence-package-api.ts"));
        string pilotsCollateral = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "pilots-collateral-download-api.ts"));
        string emailRunToSponsor = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string shareReviewPackage = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ShareReviewPackageButton.tsx"));
        string compareRuns = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));
        string sponsorRoi = File.ReadAllText(
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

        auditEvidencePackage.Should().Contain("triggerBrowserBlobDownload");
        pilotsCollateral.Should().Contain("downloadScopedProxyFileGet");
        emailRunToSponsor.Should().Contain("downloadSponsorProofPackZip");
        emailRunToSponsor.Should().Contain("downloadSponsorReviewPacketMarkdown");
        emailRunToSponsor.Should().Contain("downloadPilotFirstValueReportMarkdown");
        shareReviewPackage.Should().Contain("triggerBrowserBlobDownload");
        compareRuns.Should().Contain("formatExportSealedManifestAwareApiError");
        sponsorRoi.Should().Contain("formatExportSealedManifestAwareApiError");
        sponsorRoi.Should().Contain("triggerBrowserBlobDownload");
    }

    [Fact]
    public void Suggestion522_524_artifact_preview_and_bundle_downloads()
    {
        string artifactPreview = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-artifacts.ts"));
        string infraAskBlockedReason = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-ask-blocked-reason.ts"));
        string infraAskClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "ask",
                "InfrastructureAskClient.tsx"));
        string artifactBundleTrigger = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-artifact-bundle.ts"));
        string manifestBuyerBundle = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestBuyerBundleDownloadSection.tsx"));
        string runDetailArtifacts = File.ReadAllText(
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
        string runDetailActions = File.ReadAllText(
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
                "RunDetailRunActionsSection.tsx"));

        artifactPreview.Should().Contain("formatExportSealedManifestAwareApiError");
        infraAskBlockedReason.Should().Contain("infraEvidenceAskBlockedReason");
        infraAskClient.Should().Contain("infraEvidenceAskBlockedReason");
        artifactBundleTrigger.Should().Contain("downloadArtifactBundleZip");
        artifactBundleTrigger.Should().Contain("downloadTraceabilityBundleZip");
        manifestBuyerBundle.Should().Contain("downloadArtifactBundleZip");
        runDetailArtifacts.Should().Contain("downloadArtifactBundleZip");
        runDetailActions.Should().Contain("downloadTraceabilityBundleZip");
    }
}
