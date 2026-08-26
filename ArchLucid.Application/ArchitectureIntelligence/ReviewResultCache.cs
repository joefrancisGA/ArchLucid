using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ReviewResultCache : IReviewResultCache
{
    private const int MaxEntries = 128;
    private static readonly TimeSpan EntryTtl = TimeSpan.FromHours(4);

    private readonly ConcurrentDictionary<string, CacheEntry> _cache = new(StringComparer.Ordinal);
    private readonly ReviewSingleFlightCoordinator _inFlight = new();
    private readonly TimeProvider _clock;
    private readonly object _evictionLock = new();
    private readonly Dictionary<string, int> _pinnedStorageKeyRefcounts = new(StringComparer.Ordinal);

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
            if (!IsStorageKeyPinned(key))
                _cache.TryRemove(key, out _);

            result = null;
            return false;
        }

        result = ClosedLoopReasoningResultCloner.Clone(entry.Result);
        return true;
    }

    public void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(result);

        ClosedLoopReasoningResult snapshot = ClosedLoopReasoningResultCloner.Clone(result);
        ClosedLoopCacheHitPublishGuard.SanitizeForStorage(snapshot);

        string key = ReviewCacheKeyBuilder.Build(manifest);

        lock (_evictionLock)
        {
            EvictExpiredEntries();

            if (_cache.Count >= MaxEntries)
                EvictOldestEntry();

            DateTime utcNow = _clock.GetUtcNow().UtcDateTime;

            _cache[key] = new CacheEntry
            {
                Result = snapshot,
                CreatedUtc = utcNow,
                ExpiresUtc = utcNow.Add(EntryTtl),
            };
        }
    }

    public void InvalidateForRun(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string normalizedRunId = NormalizeRunId(runId);

        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            string? storedRunId = entry.Value.Result.RunId;

            if (string.IsNullOrWhiteSpace(storedRunId))
                continue;

            if (!RunIdsMatch(storedRunId, normalizedRunId))
                continue;

            if (IsStorageKeyPinned(entry.Key))
                continue;

            _cache.TryRemove(entry.Key, out _);
        }
    }

    public string BuildInFlightKey(ReviewCacheDependencyManifest manifest, bool publishToProduct)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return ReviewCacheKeyBuilder.BuildInFlight(manifest, publishToProduct);
    }

    public string BuildStorageKey(ReviewCacheDependencyManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return ReviewCacheKeyBuilder.Build(manifest);
    }

    public void PinStorageKey(string storageKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);

        lock (_evictionLock)
        {
            _pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count);
            _pinnedStorageKeyRefcounts[storageKey] = count + 1;
        }
    }

    public void UnpinStorageKey(string storageKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);

        lock (_evictionLock)
        {
            if (!_pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count))
                return;

            if (count <= 1)
                _pinnedStorageKeyRefcounts.Remove(storageKey);
            else
                _pinnedStorageKeyRefcounts[storageKey] = count - 1;
        }
    }

    public async Task<ClosedLoopReasoningResult> CoalesceAsync(
        ReviewCacheDependencyManifest manifest,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken,
        bool publishToProduct = false)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(leaderWork);

        string inFlightKey = ReviewCacheKeyBuilder.BuildInFlight(manifest, publishToProduct);
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        PinStorageKey(storageKey);

        try
        {
            return await _inFlight.CoalesceAsync(inFlightKey, leaderWork, cancellationToken);
        }
        finally
        {
            UnpinStorageKey(storageKey);
        }
    }

    private static string NormalizeRunId(string runId)
    {
        return runId.Replace("-", string.Empty, StringComparison.Ordinal);
    }

    private static bool RunIdsMatch(string storedRunId, string normalizedRequestedRunId)
    {
        if (string.IsNullOrWhiteSpace(storedRunId))
            return false;

        return string.Equals(
            NormalizeRunId(storedRunId),
            normalizedRequestedRunId,
            StringComparison.OrdinalIgnoreCase);
    }

    private bool IsStorageKeyPinned(string storageKey)
    {
        lock (_evictionLock)
        {
            return _pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count) && count > 0;
        }
    }

    private void EvictExpiredEntries()
    {
        DateTime utcNow = _clock.GetUtcNow().UtcDateTime;

        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            if (entry.Value.ExpiresUtc > utcNow)
                continue;

            if (IsStorageKeyPinned(entry.Key))
                continue;

            _cache.TryRemove(entry.Key, out _);
        }
    }

    private void EvictOldestEntry()
    {
        KeyValuePair<string, CacheEntry>? oldest = null;

        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            if (IsStorageKeyPinned(entry.Key))
                continue;

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
