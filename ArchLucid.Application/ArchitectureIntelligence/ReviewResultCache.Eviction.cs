using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ReviewResultCache
{
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
}
