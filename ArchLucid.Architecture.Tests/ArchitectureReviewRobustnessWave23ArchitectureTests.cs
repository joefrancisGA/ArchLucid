using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-23 architecture create/review robustness suggestions (221–230).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave23ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion221_rerun_execute_fail_closed_on_sealed_manifest_pin_inventory()
    {
        string command = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "ArchitectureRunCommandService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "ReRunExecuteSealedManifestPinGuard.cs"));
        string registrar = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "Modules",
                "RunLifecycleOrchestrationCompositionRegistrar.Coverage.cs"));

        command.Should().Contain("IReRunExecuteSealedManifestPinGate");
        guard.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");
        guard.Should().Contain("CommittedArtifactInventory");
        registrar.Should().Contain("IReRunExecuteSealedManifestPinGate");
    }

    [Fact]
    public void Suggestion222_evidence_graph_materialize_fail_closed_on_inventory_bound_pins()
    {
        string materializer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "EvidenceGraphMaterializer.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "EvidenceGraphMaterializeInventoryGuard.cs"));

        materializer.Should().Contain("EvidenceGraphMaterializeInventoryGuard");
        guard.Should().Contain("HasCreateTimeEvidencePinCommitment");
    }

    [Fact]
    public void Suggestion223_policy_pack_simulate_fail_closed_on_sealed_manifest_hash()
    {
        string dryRun = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Governance", "PolicyPackGovernanceDryRunService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "PolicyPackSimulateSealedManifestGuard.cs"));

        dryRun.Should().Contain("PolicyPackSimulateSealedManifestGuard");
        guard.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");
    }

    [Fact]
    public void Suggestion224_itsm_inbound_fail_closed_on_sealed_manifest_hash()
    {
        string pipeline = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "Itsm",
                "ItsmInboundWebhookProcessPipeline.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "Itsm",
                "ItsmInboundSealedManifestHashGuard.cs"));

        pipeline.Should().Contain("ItsmInboundSealedManifestHashGuard");
        guard.Should().Contain("EnsureRunSealedManifestHashOrThrow");
    }

    [Fact]
    public void Suggestion225_featured_sample_fail_closed_on_sealed_manifest_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "OperatorHome",
                "FeaturedCompletedSampleService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "OperatorHome",
                "FeaturedCompletedSampleSealedManifestGuard.cs"));

        service.Should().Contain("FeaturedCompletedSampleSealedManifestGuard");
        guard.Should().Contain("EnsureRunSealedManifestHashOrThrow");
    }

    [Fact]
    public void Suggestion226_draft_start_review_fail_closed_on_stale_updated_utc()
    {
        string submit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Drafts",
                "DraftAdmissionService.SubmitAndHeal.cs"));
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.AdmitSubmit.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Drafts",
                "DraftStartReviewStaleUpdatedUtcGuard.cs"));

        submit.Should().Contain("DraftStartReviewStaleUpdatedUtcGuard");
        controller.Should().Contain("ExpectedUpdatedUtc");
        guard.Should().Contain("EnsureReviewReady");
    }

    [Fact]
    public void Suggestion227_sponsor_proof_pack_zip_fail_closed_on_sealed_receipt()
    {
        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "BuyerProofPackBuilder.cs"));

        builder.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");
    }

    [Fact]
    public void Suggestion228_graph_snapshot_compare_fail_closed_on_pin_inventory()
    {
        string snapshot = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "GraphController.Snapshot.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "GraphSnapshotComparePinInventoryGuard.cs"));

        snapshot.Should().Contain("GraphSnapshotComparePinInventoryGuard");
        guard.Should().Contain("RunComparePinFingerprintGuard");
    }

    [Fact]
    public void Suggestion229_board_pack_pdf_download_rejects_json_problem_bodies()
    {
        string download = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-reports.ts"));

        download.Should().Contain("assertBinaryDownloadContentType");
        download.Should().Contain("application/pdf");
    }

    [Fact]
    public void Suggestion230_finding_inspect_fail_closed_on_inventory_bound_evidence()
    {
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingInspectController.cs"));
        string stage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Query",
                "Stages",
                "RunFindingsInspectStage.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Findings",
                "FindingInspectPinnedEvidenceGuard.cs"));

        controller.Should().Contain("FindingInspectPinnedEvidenceGuard");
        stage.Should().Contain("FindingInspectPinnedEvidenceGuard");
        guard.Should().Contain("CommittedArtifactInventory");
    }
}
