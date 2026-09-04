using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-25 architecture create/review robustness suggestions (241–250).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave25ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion241_azure_boards_work_item_create_copy_fail_closed_on_sealed_hash()
    {
        string connector = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "AzureBoards",
                "Outbound",
                "AzureBoardsExternalTicketConnector.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "AzureBoards",
                "Outbound",
                "AzureBoardsOutboundSealedManifestHashGuard.cs"));
        string uiGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-work-item-sealed-manifest-guard.ts"));
        string copyButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CopyFindingAsWorkItemButton.tsx"));

        connector.Should().Contain("AzureBoardsOutboundSealedManifestHashGuard");
        guard.Should().Contain("ItsmOutboundSealedManifestHashGuard");
        uiGuard.Should().Contain("findingWorkItemSealedManifestCopyBlockedReason");
        copyButton.Should().Contain("findingWorkItemSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion242_exec_digest_compose_fail_closed_on_sealed_hash()
    {
        string composer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ExecDigest", "ExecDigestComposer.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ExecDigest", "ExecDigestSealedManifestHashGuard.cs"));

        composer.Should().Contain("ExecDigestSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion243_board_pack_pdf_fail_closed_on_sealed_receipt()
    {
        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "BoardPackPdfBuilder.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "BoardPackSealedExportReceiptGuard.cs"));
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsBoardPackController.cs"));

        builder.Should().Contain("BoardPackSealedExportReceiptGuard");
        guard.Should().Contain("ConsultingDocxExportSealedReceiptGuard");
        controller.Should().Contain("catch (ConflictException ex)");
    }

    [Fact]
    public void Suggestion244_sponsor_roi_board_pack_fail_closed_on_sealed_hash()
    {
        string exporter = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Roi", "SponsorRoiBoardPackExporter.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Roi", "SponsorRoiBoardPackSealedManifestGuard.cs"));
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));

        exporter.Should().Contain("SponsorRoiBoardPackSealedManifestGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        controller.Should().Contain("catch (ConflictException ex)");
    }

    [Fact]
    public void Suggestion245_manifest_get_export_diagram_fail_closed_on_sealed_hash()
    {
        string manifestGet = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Get.Manifest.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "ManifestGoldenReadSealedManifestHashGuard.cs"));

        manifestGet.Should().Contain("ManifestGoldenReadSealedManifestHashGuard");
        guard.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion246_recurring_review_trigger_fail_closed_on_pin_inventory()
    {
        string trigger = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "RecurringArchitectureReviewTriggerService.cs"));

        trigger.Should().Contain("IReRunExecuteSealedManifestPinGate");
        trigger.Should().Contain("EnsureReadyAsync");
    }

    [Fact]
    public void Suggestion247_replay_execute_commit_fail_closed_on_pin_inventory()
    {
        string execute = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunExecutePreparedStage.cs"));
        string commit = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunCommitStage.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunSourceSealedManifestPinGuard.cs"));

        execute.Should().Contain("ReplayRunSourceSealedManifestPinGuard");
        commit.Should().Contain("ReplayRunSourceSealedManifestPinGuard");
        guard.Should().Contain("IReRunExecuteSealedManifestPinGate");
    }

    [Fact]
    public void Suggestion248_bulk_disposition_and_merge_conflict_resolve_fail_closed_on_sealed_hash()
    {
        string dispositions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.Dispositions.cs"));
        string mergeConflicts = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.MergeConflicts.cs"));

        dispositions.Should().Contain("RecordBulkDispositionAsync");
        dispositions.Should().Contain("GovernanceDispositionSealedManifestGuard");
        mergeConflicts.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion249_exec_digest_sponsor_deep_link_read_fail_closed_on_sealed_hash()
    {
        string readService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ExecDigest", "ExecDigestSponsorDeepLinkReadService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ExecDigest",
                "ExecDigestSponsorDeepLinkSealedManifestGuard.cs"));

        readService.Should().Contain("ExecDigestSponsorDeepLinkSealedManifestGuard");
        guard.Should().Contain("EnsureRunCollateralReadyOrThrowAsync");
        guard.Should().Contain("EnsureDashboardCompositionReadyOrThrowAsync");
    }

    [Fact]
    public void Suggestion250_run_export_blob_push_outbox_drain_fail_closed_on_sealed_hash()
    {
        string processor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Coordination",
                "Export",
                "RunExportBlobPushOutboxProcessor.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "RunExportBlobPushSealedManifestHashGuard.cs"));

        processor.Should().Contain("RunExportBlobPushSealedManifestHashGuard");
        guard.Should().Contain("RunExportSealedManifestHashGuard");
    }
}
