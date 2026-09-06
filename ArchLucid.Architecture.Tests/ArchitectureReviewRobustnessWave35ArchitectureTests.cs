using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-35 architecture create/review robustness suggestions 405–416.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave35ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion405_export_replay_lifecycle_fail_closed()
    {
        string replayService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "ExportReplayService.cs"));

        replayService.Should().Contain("AuthorityLifecycleCompareExportGuard");
        replayService.Should().Contain("RunExportSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion406_export_replay_maps_conflict_to_409()
    {
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));

        controller.Should().Contain("ReplayExportRecord");
        controller.Should().Contain("ConflictException");
        controller.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion407_blob_push_sealed_hash_preflight_at_accept()
    {
        string pushController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Push.cs"));

        pushController.Should().Contain("EnsureSealedManifestHashOrConflict");
        pushController.Should().Contain("PushRunExportToBlob");
    }

    [Fact]
    public void Suggestion408_410_drift_workbench_fail_closed_when_run_cited()
    {
        string driftService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "InfraEvidenceDriftWorkbenchQueryService.cs"));
        string snapshotsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceSnapshotsController.cs"));
        string diffsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceDiffsController.cs"));

        driftService.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        driftService.Should().Contain("ListSnapshotsAsync");
        driftService.Should().Contain("ListDiffsForSnapshotAsync");
        driftService.Should().Contain("ListChangesForDiffAsync");
        snapshotsController.Should().Contain("ConflictException");
        snapshotsController.Should().Contain("ConflictProblem");
        diffsController.Should().Contain("ConflictException");
        diffsController.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion411_comparison_replay_maps_conflict_to_409()
    {
        string replayController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.Replay.cs"));

        replayController.Should().Contain("ReplayComparison");
        replayController.Should().Contain("ConflictException");
        replayController.Should().Contain("ConflictProblem");
    }

    [Fact]
    public void Suggestion412_comparison_replay_regenerate_lifecycle_parity()
    {
        string replayService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "ComparisonReplayService.cs"));

        replayService.Should().Contain("AuthorityLifecycleCompareExportGuard");
        replayService.Should().Contain("RegenerateEndToEndAsync");
    }

    [Fact]
    public void Suggestion413_board_export_execution_mode_honesty()
    {
        string resolver = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "BoardExportExecutionModeNoticeResolver.cs"));
        string factory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Exports",
                "ArchitectureReviewBoard",
                "ArchitectureReviewBoardExportDocumentFactory.StableId.cs"));

        resolver.Should().Contain("StructuralExecutionMode.Fallback");
        resolver.Should().Contain("StructuralExecutionMode.Mixed");
        factory.Should().Contain("BoardExportExecutionModeNoticeResolver");
    }

    [Fact]
    public void Suggestion414_416_share_deliverable_presenter_ui_fail_closed()
    {
        string shareLink = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "usability", "ShareableReviewLinkButton.tsx"));
        string deliverable = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "usability", "ExportDeliverableDialog.tsx"));
        string presenter = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "ReviewPresenterHeaderButton.tsx"));

        shareLink.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        deliverable.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        presenter.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }
}
