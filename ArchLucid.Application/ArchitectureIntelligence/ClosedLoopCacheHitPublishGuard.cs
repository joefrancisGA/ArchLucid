using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Cache hits must not publish product findings unless the original run already published after a live adversarial pass.
/// </summary>
public static class ClosedLoopCacheHitPublishGuard
{
    public const string SkipReason =
        "Cache hit does not publish product findings without a fresh adversarial pass.";

    public static void ApplyCacheHitPolicy(
        ClosedLoopReasoningRequest request,
        string runId,
        ClosedLoopReasoningResult cached)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(cached);

        cached.RunId = runId;
        cached.Model.RunId = runId;

        cached.PublishedToProduct = false;
        cached.PublishedFindingsSnapshotId = null;
        cached.PublishedRecommendationCount = 0;

        if (request.PublishToProduct)
            cached.PublishSkipReason = SkipReason;
    }

    public static void SanitizeForStorage(ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        result.PublishedToProduct = false;
        result.PublishedFindingsSnapshotId = null;
        result.PublishedRecommendationCount = 0;
        result.PublishSkipReason = null;
    }
}
