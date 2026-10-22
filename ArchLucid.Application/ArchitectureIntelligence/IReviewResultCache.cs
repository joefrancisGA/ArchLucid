using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IReviewResultCache
{
    bool TryGet(ReviewCacheDependencyManifest manifest, out ClosedLoopReasoningResult? result);

    void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result);

    void InvalidateForRun(string runId);

    IReviewResultCachePinScope PinScope(ReviewCacheDependencyManifest manifest);

    IReviewResultCachePinScope PinScope(
        ReviewCacheDependencyManifest primaryManifest,
        ReviewCacheDependencyManifest secondaryManifest);

    Task<ClosedLoopReasoningResult> CoalesceAsync(
        ReviewCacheDependencyManifest manifest,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken,
        bool publishToProduct = false);
}
