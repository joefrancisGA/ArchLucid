using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-77 architecture create/review robustness suggestions 909–920.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave77ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion909_915_advisory_diagram_hub_compare_provenance_roi_and_stickiness_openapi_409()
    {
        string advisoryController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.cs"));
        string advisoryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "AdvisoryController.SealedManifestGuard.cs"));
        string diagramIngest = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramIngestController.cs"));
        string diagramIngestGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramIngestController.SealedManifestGuard.cs"));
        string evidenceHub = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "CloudResourceEvidenceHubController.cs"));
        string evidenceHubGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "CloudResourceEvidenceHubController.SealedManifestGuard.cs"));
        string compareExplain = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));
        string explainGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.SealedManifestGuard.cs"));
        string authorityReads = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string authorityTrail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.Trail.cs"));
        string roiController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));
        string roiGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.SealedManifestGuard.cs"));
        string crossTenantGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Roi",
                "CrossTenantPortfolioSealedManifestGuard.cs"));
        string stickinessRegisters = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Registers.cs"));
        string stickinessAttestation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Attestation.cs"));
        string stickinessGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.SealedManifestGuard.cs"));

        advisoryController.Should().Contain("ApplyRecommendationAction");
        advisoryController.Should().Contain("EnsureAdvisoryApplySealedManifestAllowedAsync");
        advisoryGuard.Should().Contain("AdvisoryApplySealedManifestHashGuard");
        diagramIngest.Should().Contain("GetModel");
        diagramIngest.Should().Contain("EnsureRunSealedManifestAllowedAsync");
        diagramIngestGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        evidenceHub.Should().Contain("GetHub");
        evidenceHub.Should().Contain("EnsureHubRunSealedManifestAllowedAsync");
        evidenceHubGuard.Should().Contain("CloudResourceEvidenceHubSealedManifestHashGuard");
        compareExplain.Should().Contain("ExplainComparison");
        compareExplain.Should().Contain("EnsureCompareRunsSealedManifestReadAllowedAsync");
        explainGuard.Should().Contain("SealedManifestReadGuard");
        authorityReads.Should().Contain("GetReviewTrailProvenance");
        authorityReads.Should().Contain("SealedManifestReadGuard");
        authorityTrail.Should().Contain("GetRunProvenance");
        authorityTrail.Should().Contain("SealedManifestReadGuard");
        roiController.Should().Contain("GetCrossTenantPortfolioSummaryAsync");
        roiController.Should().Contain("EnsureCrossTenantPortfolioSealedManifestReadAllowedAsync");
        roiGuard.Should().Contain("CrossTenantPortfolioSealedManifestGuard");
        crossTenantGuard.Should().Contain("EnsureAccessiblePortfolioRunsSealedOrThrowAsync");
        stickinessRegisters.Should().Contain("EnsureRegistersSealedManifestAllowedAsync");
        stickinessAttestation.Should().Contain("EnsureRegistersSealedManifestAllowedAsync");
        stickinessGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion916_918_share_review_artifacts_and_sponsor_collateral_blocked_reason_wiring()
    {
        string shareReview = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ShareReviewPackageButton.tsx"));
        string firstValueBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "first-value-report-mutation-blocked-reason.ts"));
        string requestJsonBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-json-mutation-blocked-reason.ts"));
        string runPackageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-package-export-mutation-blocked-reason.ts"));
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
        string sponsorExports = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "sponsor-dashboard",
                "_sections",
                "SponsorExportsSection.tsx"));
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

        shareReview.Should().Contain("firstValueReportMutationBlockedReason");
        firstValueBlocked.Should().Contain("firstValueReportMutationBlockedReason");
        requestJsonBlocked.Should().Contain("architectureRequestJsonMutationBlockedReason");
        runPackageBlocked.Should().Contain("runPackageExportMutationBlockedReason");
        artifactsSection.Should().Contain("architectureRequestJsonMutationBlockedReason");
        artifactsSection.Should().Contain("runPackageExportMutationBlockedReason");
        sponsorExports.Should().Contain("runPackageExportMutationBlockedReason");
        sponsorHandoff.Should().Contain("runPackageExportMutationBlockedReason");
    }

    [Fact]
    public void Suggestion919_920_compare_manifest_export_and_diagram_load_model_blocked_reason_wiring()
    {
        string compareExportBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "manifest-compare-export-mutation-blocked-reason.ts"));
        string comparePanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareResultsPanelDiffStack.tsx"));
        string diagramLoadBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "diagram-reconcile-load-model-blocked-reason.ts"));
        string diagramWorkbench = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "diagram-reconcile",
                "DiagramReconcileWorkbenchClient.tsx"));

        compareExportBlocked.Should().Contain("manifestCompareExportMutationBlockedReason");
        comparePanel.Should().Contain("manifestCompareExportMutationBlockedReason");
        diagramLoadBlocked.Should().Contain("diagramReconcileLoadModelBlockedReason");
        diagramWorkbench.Should().Contain("diagramReconcileLoadModelBlockedReason");
    }
}
