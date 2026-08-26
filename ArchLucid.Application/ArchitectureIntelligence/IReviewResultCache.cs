using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IReviewResultCache
{
    bool TryGet(ReviewCacheDependencyManifest manifest, out ClosedLoopReasoningResult? result);

    void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result);

    void InvalidateForRun(string runId);

    string BuildInFlightKey(ReviewCacheDependencyManifest manifest, bool publishToProduct);

    void MarkCoalesceLeaderReviewCacheHit(string inFlightKey, string? reuseReason);

    bool TryConsumeCoalesceLeaderReviewCacheHit(string inFlightKey, out string? reuseReason);

    Task<ClosedLoopReasoningResult> CoalesceAsync(
        ReviewCacheDependencyManifest manifest,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken,
        bool publishToProduct = false);
}
