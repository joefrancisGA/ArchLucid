using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ReviewResultCache : IReviewResultCache
{
    private readonly ConcurrentDictionary<string, ClosedLoopReasoningResult> _cache = new(StringComparer.Ordinal);

    public bool TryGet(ReviewCacheDependencyManifest manifest, out ClosedLoopReasoningResult? result)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return _cache.TryGetValue(ReviewCacheKeyBuilder.Build(manifest), out result);
    }

    public void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(result);

        _cache[ReviewCacheKeyBuilder.Build(manifest)] = result;
    }
}
