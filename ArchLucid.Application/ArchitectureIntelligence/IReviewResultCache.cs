using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IReviewResultCache
{
    bool TryGet(ReviewCacheDependencyManifest manifest, out ClosedLoopReasoningResult? result);

    void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result);

    void InvalidateForRun(string runId);

    string BuildStorageKey(ReviewCacheDependencyManifest manifest);

    IDisposable PinScope(ReviewCacheDependencyManifest manifest);

    void PinStorageKey(string storageKey);

    void UnpinStorageKey(string storageKey);

    Task<ClosedLoopReasoningResult> CoalesceAsync(
        ReviewCacheDependencyManifest manifest,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken,
        bool publishToProduct = false);
}
