using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ReviewResultCache : IReviewResultCache
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

            if (IsRunIdTombstonedUnlocked(entry.Result.RunId))
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
            PruneOrphanPinRefcounts();

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
            if (!TryDropOldestTombstoneWithoutPinnedEntries())
                return;
        }

        _deferredInvalidateRunIds.Add(normalizedRunId);
        _tombstoneOrder.Add(normalizedRunId);
    }

    private bool TryDropOldestTombstoneWithoutPinnedEntries()
    {
        for (int index = 0; index < _tombstoneOrder.Count; index++)
        {
            string candidate = _tombstoneOrder[index];

            if (HasPinnedCacheEntriesForRunUnlocked(candidate))
                continue;

            _tombstoneOrder.RemoveAt(index);
            _deferredInvalidateRunIds.Remove(candidate);

            return true;
        }

        return false;
    }

    private bool HasPinnedCacheEntriesForRunUnlocked(string normalizedRunId)
    {
        foreach (KeyValuePair<string, CacheEntry> entry in _cache)
        {
            string? storedRunId = entry.Value.Result.RunId;

            if (string.IsNullOrWhiteSpace(storedRunId))
                continue;

            if (!ClosedLoopRunIdComparer.Equals(storedRunId, normalizedRunId))
                continue;

            if (IsStorageKeyPinnedUnlocked(entry.Key))
                return true;
        }

        return false;
    }

    private void RemoveTombstonedRunId(string normalizedRunId)
    {
        if (!_deferredInvalidateRunIds.Remove(normalizedRunId))
            return;

        _tombstoneOrder.Remove(normalizedRunId);
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

        string normalizedRunId = ClosedLoopRunIdNormalizer.NormalizeRequired(runId);

        return _deferredInvalidateRunIds.Contains(normalizedRunId);
    }

    private sealed class CacheEntry
    {
        public ClosedLoopReasoningResult Result { get; init; } = new();

        public DateTime CreatedUtc { get; init; }

        public DateTime ExpiresUtc { get; init; }
    }
}
