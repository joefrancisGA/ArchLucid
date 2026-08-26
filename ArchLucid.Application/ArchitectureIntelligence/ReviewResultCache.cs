using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ReviewResultCache : IReviewResultCache
{
    private const int MaxEntries = 128;
    private const int MaxPinnedRefcountPerKey = 64;
    private const int MaxDistinctPinnedStorageKeys = 64;
    private const int MaxTombstonedRunIds = 64;
    private static readonly TimeSpan EntryTtl = TimeSpan.FromHours(4);

    private readonly ConcurrentDictionary<string, CacheEntry> _cache = new(StringComparer.Ordinal);
    private readonly ReviewSingleFlightCoordinator _inFlight = new();
    private readonly TimeProvider _clock;
    private readonly object _evictionLock = new();
    private readonly Dictionary<string, int> _pinnedStorageKeyRefcounts = new(StringComparer.Ordinal);
    private readonly HashSet<string> _deferredInvalidateRunIds = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<string> _tombstoneOrder = [];
    private readonly HashSet<string> _pinReservationsWithoutCacheEntry = new(StringComparer.Ordinal);

    public ReviewResultCache(TimeProvider? timeProvider = null)
    {
        _clock = timeProvider ?? TimeProvider.System;
    }

    public bool TryGet(ReviewCacheDependencyManifest manifest, out ClosedLoopReasoningResult? result)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        string key = ReviewCacheKeyBuilder.Build(manifest);
        ClosedLoopReasoningResult? storedResult = null;

        lock (_evictionLock)
        {
            if (!_cache.TryGetValue(key, out CacheEntry? entry))
            {
                result = null;
                return false;
            }

            DateTime utcNow = _clock.GetUtcNow().UtcDateTime;

            if (entry.ExpiresUtc <= utcNow)
            {
                if (!IsStorageKeyPinnedUnlocked(key))
                {
                    _cache.TryRemove(key, out _);
                    result = null;
                    return false;
                }

                entry = new CacheEntry
                {
                    Result = entry.Result,
                    CreatedUtc = entry.CreatedUtc,
                    ExpiresUtc = utcNow.Add(EntryTtl),
                };

                _cache[key] = entry;
            }

            if (IsRunIdTombstonedUnlocked(entry.Result.RunId))
            {
                result = null;
                return false;
            }

            storedResult = entry.Result;
        }

        result = ClosedLoopReasoningResultCloner.Clone(storedResult!);
        return true;
    }

    public void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(result);

        if (IsRunIdTombstoned(result.RunId))
            return;

        ClosedLoopReasoningResult snapshot = ClosedLoopReasoningResultCloner.Clone(result);
        ClosedLoopCacheHitPublishGuard.SanitizeForStorage(snapshot);

        if (IsRunIdTombstoned(snapshot.RunId))
            return;

        string key = ReviewCacheKeyBuilder.Build(manifest);

        lock (_evictionLock)
        {
            if (IsRunIdTombstonedUnlocked(snapshot.RunId))
                return;

            EvictExpiredEntries();

            if (!_cache.ContainsKey(key)
                && _cache.Count >= MaxEntries
                && !TryEvictOldestUnpinnedEntry())
                return;

            DateTime utcNow = _clock.GetUtcNow().UtcDateTime;

            _cache[key] = new CacheEntry
            {
                Result = snapshot,
                CreatedUtc = utcNow,
                ExpiresUtc = utcNow.Add(EntryTtl),
            };

            _pinReservationsWithoutCacheEntry.Remove(key);
        }
    }

    public void InvalidateForRun(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string normalizedRunId = ClosedLoopRunIdNormalizer.NormalizeRequired(runId);

        lock (_evictionLock)
        {
            bool anyPinnedMatch = false;

            foreach (KeyValuePair<string, CacheEntry> entry in _cache)
            {
                string? storedRunId = entry.Value.Result.RunId;

                if (string.IsNullOrWhiteSpace(storedRunId))
                    continue;

                if (!ClosedLoopRunIdComparer.Equals(storedRunId, normalizedRunId))
                    continue;

                if (IsStorageKeyPinnedUnlocked(entry.Key))
                {
                    anyPinnedMatch = true;
                    continue;
                }

                _cache.TryRemove(entry.Key, out _);
            }

            if (anyPinnedMatch)
                AddTombstonedRunId(normalizedRunId);
        }
    }

    private void AddTombstonedRunId(string normalizedRunId)
    {
        if (_deferredInvalidateRunIds.Contains(normalizedRunId))
            return;

        while (_tombstoneOrder.Count >= MaxTombstonedRunIds)
        {
            string oldest = _tombstoneOrder[0];
            _tombstoneOrder.RemoveAt(0);
            _deferredInvalidateRunIds.Remove(oldest);
        }

        _deferredInvalidateRunIds.Add(normalizedRunId);
        _tombstoneOrder.Add(normalizedRunId);
    }

    private void RemoveTombstonedRunId(string normalizedRunId)
    {
        if (!_deferredInvalidateRunIds.Remove(normalizedRunId))
            return;

        _tombstoneOrder.Remove(normalizedRunId);
    }

    internal static string BuildStorageKey(ReviewCacheDependencyManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return ReviewCacheKeyBuilder.Build(manifest);
    }

    public IDisposable PinScope(ReviewCacheDependencyManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return new ReviewResultCachePinScope(this, ReviewCacheKeyBuilder.Build(manifest));
    }

    public IDisposable PinScope(
        ReviewCacheDependencyManifest primaryManifest,
        ReviewCacheDependencyManifest secondaryManifest)
    {
        ArgumentNullException.ThrowIfNull(primaryManifest);
        ArgumentNullException.ThrowIfNull(secondaryManifest);

        return new ReviewResultCacheCompositePinScope(
            this,
            [
                ReviewCacheKeyBuilder.Build(primaryManifest),
                ReviewCacheKeyBuilder.Build(secondaryManifest),
            ]);
    }

    internal bool PinStorageKey(string storageKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);

        lock (_evictionLock)
        {
            if (!_pinnedStorageKeyRefcounts.ContainsKey(storageKey)
                && _pinnedStorageKeyRefcounts.Count >= MaxDistinctPinnedStorageKeys)
                return false;

            _pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count);

            if (count >= MaxPinnedRefcountPerKey)
                _pinnedStorageKeyRefcounts[storageKey] = MaxPinnedRefcountPerKey;
            else
                _pinnedStorageKeyRefcounts[storageKey] = count + 1;

            if (!_cache.ContainsKey(storageKey))
                _pinReservationsWithoutCacheEntry.Add(storageKey);

            return true;
        }
    }

    internal void UnpinStorageKey(string storageKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);

        lock (_evictionLock)
        {
            if (!_pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count))
                return;

            if (count <= 1)
            {
                _pinnedStorageKeyRefcounts.Remove(storageKey);
                _pinReservationsWithoutCacheEntry.Remove(storageKey);
            }
            else
                _pinnedStorageKeyRefcounts[storageKey] = count - 1;

            if (!IsStorageKeyPinnedUnlocked(storageKey))
                OnStorageKeyFullyUnpinned();
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

        return await _inFlight.CoalesceAsync(
            inFlightKey,
            leaderWork,
            cancellationToken,
            stripCoalescedFollowerPublishLeaks: !publishToProduct);
    }

    private void OnStorageKeyFullyUnpinned()
    {
        FlushDeferredInvalidations();
        EvictExpiredEntries();
        PruneOrphanPinRefcounts();

        while (_cache.Count > MaxEntries && TryEvictOldestUnpinnedEntry())
        {
        }
    }

    private void PruneOrphanPinRefcounts()
    {
        foreach (string storageKey in _pinnedStorageKeyRefcounts.Keys.ToList())
        {
            if (_cache.ContainsKey(storageKey))
                continue;

            if (_pinReservationsWithoutCacheEntry.Contains(storageKey))
                continue;

            _pinnedStorageKeyRefcounts.Remove(storageKey);
        }
    }

    private void FlushDeferredInvalidations()
    {
        if (_deferredInvalidateRunIds.Count == 0)
            return;

        List<string> pending = _deferredInvalidateRunIds.ToList();

        foreach (string normalizedRunId in pending)
        {
            bool stillPinned = false;

            foreach (KeyValuePair<string, CacheEntry> entry in _cache)
            {
                string? storedRunId = entry.Value.Result.RunId;

                if (string.IsNullOrWhiteSpace(storedRunId))
                    continue;

                if (!ClosedLoopRunIdComparer.Equals(storedRunId, normalizedRunId))
                    continue;

                if (IsStorageKeyPinnedUnlocked(entry.Key))
                {
                    stillPinned = true;
                    continue;
                }

                _cache.TryRemove(entry.Key, out _);
            }

            if (!stillPinned)
                RemoveTombstonedRunId(normalizedRunId);
        }
    }

    private bool IsRunIdTombstoned(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return false;

        lock (_evictionLock)
        {
            return IsRunIdTombstonedUnlocked(runId);
        }
    }

    private bool IsRunIdTombstonedUnlocked(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return false;

        string normalizedRunId = ClosedLoopRunIdComparer.Normalize(runId);

        return _deferredInvalidateRunIds.Contains(normalizedRunId);
    }

    private bool IsStorageKeyPinnedUnlocked(string storageKey)
    {
        return _pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count) && count > 0;
    }

    private bool IsStorageKeyPinned(string storageKey)
    {
        lock (_evictionLock)
        {
            return IsStorageKeyPinnedUnlocked(storageKey);
        }
    }

    private void EvictExpiredEntries()
    {
        DateTime utcNow = _clock.GetUtcNow().UtcDateTime;

        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            if (entry.Value.ExpiresUtc > utcNow)
                continue;

            if (IsStorageKeyPinnedUnlocked(entry.Key))
                continue;

            _cache.TryRemove(entry.Key, out _);
        }
    }

    private bool TryEvictOldestUnpinnedEntry()
    {
        KeyValuePair<string, CacheEntry>? oldest = null;

        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            if (IsStorageKeyPinnedUnlocked(entry.Key))
                continue;

            if (oldest is null || entry.Value.CreatedUtc < oldest.Value.Value.CreatedUtc)
                oldest = entry;
        }

        if (oldest is null)
            return false;

        _cache.TryRemove(oldest.Value.Key, out _);
        PruneOrphanPinRefcounts();

        return true;
    }

    private sealed class CacheEntry
    {
        public ClosedLoopReasoningResult Result { get; init; } = new();

        public DateTime CreatedUtc { get; init; }

        public DateTime ExpiresUtc { get; init; }
    }
}
