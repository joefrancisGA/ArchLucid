using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-22 architecture create/review robustness suggestions (211–220).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave22ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion211_batch_replay_zip_fail_closed_on_pin_inventory()
    {
        string batch = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ComparisonsApplicationService.DriftAndBatch.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ComparisonBatchReplayPinInventoryGuard.cs"));

        batch.Should().Contain("ComparisonBatchReplayPinInventoryGuard");
        batch.Should().Contain("catch (ConflictException)");
        guard.Should().Contain("EnsureEndToEndReplayPairReadyOrThrowAsync");
    }

    [Fact]
    public void Suggestion212_comparison_verify_fail_closed_on_sealed_manifest_hash()
    {
        string replay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "ComparisonReplayService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ComparisonReplayManifestHashGuard.cs"));

        replay.Should().Contain("ComparisonReplayManifestHashGuard");
        guard.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");
    }

    [Fact]
    public void Suggestion213_consulting_docx_fail_closed_on_sealed_receipt()
    {
        string download = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.ConsultingDocx.Download.cs"));

        download.Should().Contain("ConsultingDocxExportSealedReceiptGuard");
        download.Should().Contain("catch (ConflictException ex)");
    }

    [Fact]
    public void Suggestion214_first_value_pdf_fail_closed_on_sealed_receipt()
    {
        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "FirstValueReportBuilder.cs"));
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));

        builder.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");
        controller.Should().Contain("catch (ConflictException ex)");
    }

    [Fact]
    public void Suggestion215_terraform_advisory_export_verifies_sealed_manifest_hash()
    {
        string download = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Download.cs"));
        string push = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Push.cs"));

        download.Should().Contain("DownloadTerraformAdvisoryExport");
        download.Should().Contain("EnsureSealedManifestHashOrConflict");
        push.Should().Contain("CreateTerraformPr");
        push.Should().Contain("EnsureSealedManifestHashOrConflict");
    }

    [Fact]
    public void Suggestion216_mermaid_export_fail_closed_when_not_inventory_bound()
    {
        string download = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Download.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "MermaidDiagramExportInventoryGuard.cs"));

        download.Should().Contain("MermaidDiagramExportInventoryGuard");
        guard.Should().Contain("CommittedArtifactInventory");
    }

    [Fact]
    public void Suggestion217_export_history_fail_closed_when_lineage_unverified()
    {
        string facade = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportQueryFacade.cs"));
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));

        facade.Should().Contain("IRunExportLineageVerifier");
        facade.Should().Contain("ExportRecordLoadOutcome.LineageUnverified");
        controller.Should().Contain("LineageUnverified");
    }

    [Fact]
    public void Suggestion218_governance_disposition_binds_sealed_manifest_hash()
    {
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "GovernanceDispositionSealedManifestGuard.cs"));
        string stickiness = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.Dispositions.cs"));
        string operatorService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "RunOperatorGovernanceDispositionService.cs"));

        guard.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");
        stickiness.Should().Contain("GovernanceDispositionSealedManifestGuard");
        operatorService.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion219_digest_and_outbox_require_manifest_hash()
    {
        string outboxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Integration",
                "IntegrationEventOutboxManifestHashGuard.cs"));
        string digestGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Integration", "DigestDeliveryManifestHashGuard.cs"));
        string processor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "IntegrationOutbox",
                "IntegrationEventOutboxProcessor.cs"));
        string dispatcher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Advisory", "DigestDeliveryDispatcher.cs"));

        outboxGuard.Should().Contain("manifestHash is required");
        digestGuard.Should().Contain("manifestHash metadata is required");
        processor.Should().Contain("IntegrationEventOutboxManifestHashGuard");
        dispatcher.Should().Contain("DigestDeliveryManifestHashGuard");
    }

    [Fact]
    public void Suggestion220_draft_intake_submit_validates_architecture_request()
    {
        string submit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Drafts",
                "DraftAdmissionService.SubmitAndHeal.cs"));

        submit.Should().Contain("ValidateProjectedArchitectureRequestOrThrowAsync");
        submit.Should().Contain("_architectureRequestValidator.ValidateAsync");
    }
}
