using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ReviewResultCache : IReviewResultCache
{
    private const int MaxEntries = 128;
    private static readonly TimeSpan EntryTtl = TimeSpan.FromHours(4);

    private readonly ConcurrentDictionary<string, CacheEntry> _cache = new(StringComparer.Ordinal);
    private readonly TimeProvider _clock;

    public ReviewResultCache(TimeProvider? timeProvider = null)
    {
        _clock = timeProvider ?? TimeProvider.System;
    }

    public bool TryGet(ReviewCacheDependencyManifest manifest, out ClosedLoopReasoningResult? result)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        string key = ReviewCacheKeyBuilder.Build(manifest);

        if (!_cache.TryGetValue(key, out CacheEntry? entry))
        {
            result = null;
            return false;
        }

        DateTime utcNow = _clock.GetUtcNow().UtcDateTime;

        if (entry.ExpiresUtc <= utcNow)
        {
            _cache.TryRemove(key, out _);
            result = null;
            return false;
        }

        result = entry.Result;
        return true;
    }

    public void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(result);

        EvictExpiredEntries();

        if (_cache.Count >= MaxEntries)
            EvictOldestEntry();

        DateTime utcNow = _clock.GetUtcNow().UtcDateTime;
        string key = ReviewCacheKeyBuilder.Build(manifest);

        _cache[key] = new CacheEntry
        {
            Result = result,
            CreatedUtc = utcNow,
            ExpiresUtc = utcNow.Add(EntryTtl),
        };
    }

    private void EvictExpiredEntries()
    {
        DateTime utcNow = _clock.GetUtcNow().UtcDateTime;

        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            if (entry.Value.ExpiresUtc > utcNow)
                continue;

            _cache.TryRemove(entry.Key, out _);
        }
    }

    private void EvictOldestEntry()
    {
        KeyValuePair<string, CacheEntry>? oldest = null;

        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            if (oldest is null || entry.Value.CreatedUtc < oldest.Value.Value.CreatedUtc)
                oldest = entry;
        }

        if (oldest is not null)
            _cache.TryRemove(oldest.Value.Key, out _);
    }

    private sealed class CacheEntry
    {
        public ClosedLoopReasoningResult Result { get; init; } = new();

        public DateTime CreatedUtc { get; init; }

        public DateTime ExpiresUtc { get; init; }
    }
}
