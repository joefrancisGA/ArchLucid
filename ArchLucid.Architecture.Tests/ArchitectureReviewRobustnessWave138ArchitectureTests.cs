using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-138 architecture create/review robustness suggestions 1641–1652.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave138ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1641_1646_pin_archive_async_replay_result_comparison_and_batch_runtime_409_mappers()
    {
        string pinRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.CommitReplayPin.Pin.cs"));
        string archiveRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Archive.cs"));
        string asyncOperations = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.AsyncOperations.cs"));
        string submitResult = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.cs"));
        string comparisonHistory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.History.cs"));
        string batchCreate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Create.Batch.cs"));
        string runsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.SealedManifestGuard.cs"));
        string comparisonsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.SealedManifestGuard.cs"));

        pinRun.Should().Contain("PinRun");
        pinRun.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        archiveRun.Should().Contain("ArchiveRun");
        archiveRun.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        archiveRun.Should().Contain("MapRunsSealedManifestConflict");
        asyncOperations.Should().Contain("ReplayRunAsync");
        asyncOperations.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        asyncOperations.Should().Contain("MapRunsSealedManifestConflict");
        submitResult.Should().Contain("SubmitAgentResult");
        submitResult.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        submitResult.Should().Contain("MapRunsSealedManifestConflict");
        comparisonHistory.Should().Contain("UpdateComparisonRecord");
        comparisonHistory.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdAsync");
        comparisonHistory.Should().Contain("MapComparisonReplaySealedManifestConflict");
        batchCreate.Should().Contain("CreateRunBatch");
        batchCreate.Should().Contain("MapRunsSealedManifestConflict");
        runsGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        comparisonsGuard.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordIdAsync");
    }

    [Fact]
    public void Suggestion1647_1649_request_lifecycle_and_review_archive_ui_wiring()
    {
        string lifecycleBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-lifecycle-mutation-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string dashboardLoadPhase = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "operator-home",
                "use-runs-dashboard-load-phase.ts"));
        string archiveBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-archive-mutation-blocked-reason.ts"));
        string archiveControl = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "ReviewArchiveControl.tsx"));

        lifecycleBlocked.Should().Contain("architectureRequestLifecycleMutationBlockedReason");
        lifecycleApi.Should().Contain("cloneArchitectureRequest");
        lifecycleApi.Should().Contain("archiveArchitectureRequest");
        lifecycleApi.Should().Contain("deleteArchitectureRequest");
        lifecycleApi.Should().Contain("restoreArchitectureRequest");
        lifecycleApi.Should().Contain("architectureRequestLifecycleMutationBlockedReason");
        dashboardLoadPhase.Should().Contain("architectureRequestLifecycleMutationBlockedReason");
        dashboardLoadPhase.Should().Contain("restoreArchitectureRequest");
        archiveBlocked.Should().Contain("reviewArchiveMutationBlockedReason");
        archiveControl.Should().Contain("reviewArchiveMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1650_1652_replay_comparison_and_governance_batch_ui_wiring()
    {
        string replayBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-replay-mutation-blocked-reason.ts"));
        string replayForm = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "internal",
                "validate-route",
                "_sections",
                "use-replay-form.ts"));
        string comparisonReplayBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-replay-mutation-blocked-reason.ts"));
        string compareResultsPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "use-compare-results-panel.ts"));
        string batchReviewBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-batch-review-mutation-blocked-reason.ts"));
        string quickApprove = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceQuickApproveButton.tsx"));

        replayBlocked.Should().Contain("reviewReplayMutationBlockedReason");
        replayForm.Should().Contain("reviewReplayMutationBlockedReason");
        comparisonReplayBlocked.Should().Contain("comparisonReplayMutationBlockedReason");
        compareResultsPanel.Should().Contain("comparisonReplayMutationBlockedReason");
        batchReviewBlocked.Should().Contain("governanceBatchReviewMutationBlockedReason");
        quickApprove.Should().Contain("governanceBatchReviewMutationBlockedReason");
    }
}
