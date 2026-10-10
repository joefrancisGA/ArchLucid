using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-104 architecture create/review robustness suggestions 1233–1244.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave104ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1233_1234_workspace_prior_compare_lifecycle_incomplete_blocked_reason_mappers()
    {
        string workspaceContext = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.WorkspaceContext.cs"));

        workspaceContext.Should().Contain("LeftLifecycleIncomplete");
        workspaceContext.Should().Contain("RightLifecycleIncomplete");
        workspaceContext.Should().Contain("MapRunDetailPageBundlePriorCompareSealedManifestBlockedReason");
    }

    [Fact]
    public void Suggestion1235_1239_recommendation_learning_saved_views_and_insight_signal_sealed_manifest_mappers()
    {
        string recLearningMutate = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "RecommendationLearningController.Mutate.cs"));
        string recLearningOps = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "RecommendationLearningController.Ops.cs"));
        string recLearningGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "RecommendationLearningController.SealedManifestGuard.cs"));
        string savedViews = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Operator",
                "OperatorSavedViewsController.cs"));
        string savedViewsGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Operator",
                "OperatorSavedViewsController.SealedManifestGuard.cs"));
        string insightSignal = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingInsightSignalController.cs"));
        string insightSignalGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingInsightSignalController.SealedManifestGuard.cs"));

        recLearningMutate.Should().Contain("MapRecommendationLearningSealedManifestConflict");
        recLearningOps.Should().Contain("MapRecommendationLearningSealedManifestConflict");
        recLearningGuard.Should().Contain("MapRecommendationLearningSealedManifestConflict");
        savedViews.Should().Contain("MapOperatorSavedViewsSealedManifestConflict");
        savedViewsGuard.Should().Contain("MapOperatorSavedViewsSealedManifestConflict");
        insightSignal.Should().Contain("EnsureFindingInsightSignalRunSealedManifestAllowedAsync");
        insightSignalGuard.Should().Contain("MapFindingInsightSignalSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1240_1244_holistic_ask_insight_recommendation_learning_and_saved_view_blocked_reason_wiring()
    {
        string holisticApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "holistic-critic-api.ts"));
        string holisticBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "explain",
                "holistic-critic-blocked-reason.ts"));
        string findingAskApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "finding-ask-api.ts"));
        string findingAskBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "finding-ask-blocked-reason.ts"));
        string insightSignalApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "finding-insight-signal-api.ts"));
        string insightSignalBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-insight-signal-mutation-blocked-reason.ts"));
        string recLearningOpsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "recommendation-learning-operational-api.ts"));
        string recLearningReplayApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "recommendation-replay-api.ts"));
        string recLearningBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "internal",
                "recommendation-learning-mutation-blocked-reason.ts"));
        string savedViewsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "operator-saved-views.ts"));
        string savedViewsBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "operator",
                "operator-saved-view-mutation-blocked-reason.ts"));

        holisticApi.Should().Contain("holisticCriticBlockedReason");
        holisticBlocked.Should().Contain("holisticCriticBlockedReason");
        findingAskApi.Should().Contain("findingAskBlockedReason");
        findingAskBlocked.Should().Contain("findingAskBlockedReason");
        insightSignalApi.Should().Contain("findingInsightSignalMutationBlockedReason");
        insightSignalBlocked.Should().Contain("findingInsightSignalMutationBlockedReason");
        recLearningOpsApi.Should().Contain("recommendationLearningMutationBlockedReason");
        recLearningReplayApi.Should().Contain("recommendationLearningMutationBlockedReason");
        recLearningBlocked.Should().Contain("recommendationLearningMutationBlockedReason");
        savedViewsApi.Should().Contain("operatorSavedViewMutationBlockedReason");
        savedViewsBlocked.Should().Contain("operatorSavedViewMutationBlockedReason");
    }
}
