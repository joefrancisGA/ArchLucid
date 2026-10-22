using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ReviewResultCache
{
    public IReviewResultCachePinScope PinScope(ReviewCacheDependencyManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return new ReviewResultCachePinScope(this, ReviewCacheKeyBuilder.Build(manifest));
    }

    public IReviewResultCachePinScope PinScope(
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
            EvictExpiredEntries();
            PruneOrphanPinRefcounts();

            if (!_pinnedStorageKeyRefcounts.ContainsKey(storageKey)
                && _pinnedStorageKeyRefcounts.Count >= MaxDistinctPinnedStorageKeys)
                return false;

            _pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count);

            if (count >= MaxPinnedRefcountPerKey)
                return false;

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

    private bool IsStorageKeyPinnedUnlocked(string storageKey)
    {
        return _pinnedStorageKeyRefcounts.TryGetValue(storageKey, out int count) && count > 0;
    }

}
