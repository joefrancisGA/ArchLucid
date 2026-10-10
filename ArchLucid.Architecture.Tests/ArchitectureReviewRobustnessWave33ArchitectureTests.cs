using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-33 architecture create/review robustness suggestions 379–391.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave33ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion379_380_analysis_build_and_export_fail_closed_on_sealed_hash()
    {
        string service = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "ArchitectureAnalysisService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ArchitectureAnalysisSealedManifestHashGuard.cs"));
        string controller = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.AnalyzeExport.cs"));

        service.Should().Contain("ArchitectureAnalysisSealedManifestHashGuard");
        guard.Should().Contain("RunExportSealedManifestHashGuard");
        controller.Should().Contain("ConflictException");
        controller.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion381_run_detail_header_package_export_ui_fail_closed()
    {
        string header = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailPageHeader.tsx"));

        header.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        header.Should().Contain("manifestVersionForGuard");
    }

    [Fact]
    public void Suggestion382_findings_itsm_export_ui_fail_closed()
    {
        string toolbar = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingsItsmExportToolbar.tsx"));

        toolbar.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        toolbar.Should().Contain("manifestVersionForExportGuard");
    }

    [Fact]
    public void Suggestion383_cloud_resource_evidence_hub_fail_closed_when_run_scoped()
    {
        string service = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "CloudResourceEvidenceHubService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "CloudResourceEvidenceHubSealedManifestHashGuard.cs"));

        service.Should().Contain("CloudResourceEvidenceHubSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion384_390_outbox_processors_fail_closed_on_sealed_hash()
    {
        string retrievalProcessor = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Coordination",
                "Retrieval",
                "RetrievalIndexingOutboxProcessor.cs"));
        string cosmosProcessor = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Coordination",
                "Cosmos",
                "CosmosGraphSnapshotOutboxProcessor.cs"));

        retrievalProcessor.Should().Contain("RetrievalIndexingOutboxSealedManifestHashGuard");
        cosmosProcessor.Should().Contain("CosmosGraphSnapshotOutboxSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion385_386_391_emitters_use_verified_manifest_hash_resolver()
    {
        string manifestFinalization = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestFinalizationService.Legacy.cs"));
        string authorityFinalizer = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityCommittedPipelineFinalizer.cs"));
        string advisoryScan = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Advisory",
                "AdvisoryScanRunner.ScheduleCore.cs"));

        manifestFinalization.Should().Contain("RunIntegrationEventManifestHashResolver");
        authorityFinalizer.Should().Contain("RunIntegrationEventManifestHashResolver");
        advisoryScan.Should().Contain("RunIntegrationEventManifestHashResolver");
    }

    [Fact]
    public void Suggestion387_388_outbox_drain_and_webhook_samples_include_manifest_hash()
    {
        string outboxGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Integration",
                "IntegrationEventOutboxManifestHashGuard.cs"));
        string samples = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Integration", "IntegrationWebhookPayloadSamples.cs"));

        outboxGuard.Should().Contain("IntegrationEventTypes.GovernancePolicyPackPublishedV1");
        samples.Should().Contain("SyntheticManifestHash");
        samples.Should().Contain("manifestHash = SyntheticManifestHash");
    }

    [Fact]
    public void Suggestion389_sponsor_roi_csv_ui_fail_closed_when_scoped_review_unsealed()
    {
        string section = ArchitectureSourceProbe.ReadPathWithPartials(
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

        section.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        section.Should().Contain("exec-roi-summary-csv-download-button");
    }
}
