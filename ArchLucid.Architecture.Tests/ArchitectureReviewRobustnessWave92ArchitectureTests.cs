using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-92 architecture create/review robustness suggestions 1089–1100.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave92ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1089_1095_run_lifecycle_and_governance_action_level_sealed_manifest_conflict_mappers()
    {
        string createRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Create.Sync.cs"));
        string asyncCreate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.AsyncOperations.cs"));
        string commitRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.CommitReplayPin.Commit.cs"));
        string replayRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.CommitReplayPin.Replay.cs"));
        string approvalReview = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.ApprovalRequests.Review.cs"));
        string insights = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.Insights.cs"));

        createRun.Should().Contain("MapRunsSealedManifestConflict");
        asyncCreate.Should().Contain("MapRunsSealedManifestConflict");
        commitRun.Should().Contain("MapRunsSealedManifestConflict");
        replayRun.Should().Contain("MapRunsSealedManifestConflict");
        approvalReview.Should().Contain("MapGovernanceSealedManifestConflict");
        insights.Should().Contain("MapGovernanceSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1096_1097_governance_dashboard_and_compliance_drift_blocked_reason_wiring()
    {
        string dashboardBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-dashboard-blocked-reason.ts"));
        string dashboardApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-workflow-api-dashboard.ts"));

        dashboardBlocked.Should().Contain("governanceDashboardBlockedReason");
        dashboardBlocked.Should().Contain("complianceDriftTrendBlockedReason");
        dashboardApi.Should().Contain("governanceDashboardBlockedReason");
        dashboardApi.Should().Contain("complianceDriftTrendBlockedReason");
    }

    [Fact]
    public void Suggestion1098_1100_finalize_selective_execute_and_mutation_correction_blocked_reason_wiring()
    {
        string finalizeBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-finalize-mutation-blocked-reason.ts"));
        string selectiveBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-selective-execute-mutation-blocked-reason.ts"));
        string mutationCorrectionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-mutation-correction-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string mutationCorrectionApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-mutation-correction-api.ts"));

        finalizeBlocked.Should().Contain("reviewFinalizeMutationBlockedReason");
        selectiveBlocked.Should().Contain("reviewSelectiveExecuteMutationBlockedReason");
        mutationCorrectionBlocked.Should().Contain("governanceMutationCorrectionBlockedReason");
        lifecycleApi.Should().Contain("reviewFinalizeMutationBlockedReason");
        lifecycleApi.Should().Contain("reviewSelectiveExecuteMutationBlockedReason");
        mutationCorrectionApi.Should().Contain("governanceMutationCorrectionBlockedReason");
    }
}
