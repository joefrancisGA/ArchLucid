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
        cached.ModelId = cached.Model.ModelId;
        cached.Interview.ModelId = cached.Model.ModelId;

        StripProductPayloads(cached);

        cached.PublishedToProduct = false;
        cached.PublishedFindingsSnapshotId = null;
        cached.PublishedRecommendationCount = 0;

        if (request.PublishToProduct)
            cached.PublishSkipReason = SkipReason;
    }

    public static bool ShouldApplyCacheHitPolicyOnCoalescedResult(
        ClosedLoopReasoningRequest request,
        string runId,
        ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(result);

        return !request.PublishToProduct
            || !result.PublishedToProduct
            || string.IsNullOrWhiteSpace(result.RunId)
            || !ClosedLoopRunIdComparer.Equals(result.RunId, runId);
    }

    public static void ApplyAnalysisOnlyCoalescedIsolation(
        ClosedLoopReasoningRequest request,
        ClosedLoopReasoningResult isolated)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(isolated);

        if (request.PublishToProduct)
            return;

        ClearAnalysisOnlyPublishIsolation(isolated);
    }

    public static void ClearAnalysisOnlyPublishIsolation(ClosedLoopReasoningResult isolated)
    {
        ArgumentNullException.ThrowIfNull(isolated);

        isolated.PublishBlocked = false;
        isolated.PublishBlockReasons = [];
        isolated.PublishSkipReason = null;
    }

    public static void ClearCoalescedFollowerPublishLeaks(ClosedLoopReasoningResult isolated)
    {
        ArgumentNullException.ThrowIfNull(isolated);

        ClearAnalysisOnlyPublishIsolation(isolated);
        isolated.ReviewCompleteBlocked = false;
        isolated.IntegrityPassedFindingIds = [];
        isolated.MustNotFailViolations = [];
    }

    public static void SanitizeForStorage(ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        result.PublishedToProduct = false;
        result.PublishedFindingsSnapshotId = null;
        result.PublishedRecommendationCount = 0;
        result.PublishSkipReason = null;
        result.PublishBlocked = false;
        result.PublishBlockReasons = [];
        result.CacheHit = false;
        result.CacheReuseReason = null;
        result.RunId = ClosedLoopRunIdNormalizer.NormalizeOptional(result.RunId);
        StripProductPayloads(result);
    }

    private static void StripProductPayloads(ClosedLoopReasoningResult cached)
    {
        cached.ProductFindings = [];
        cached.ProductRecommendations = [];
    }
}
