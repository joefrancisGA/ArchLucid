using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IReviewResultCache
{
    bool TryGet(ReviewCacheDependencyManifest manifest, out ClosedLoopReasoningResult? result);

    void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result);

    Task<ClosedLoopReasoningResult> CoalesceAsync(
        ReviewCacheDependencyManifest manifest,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken);
}
