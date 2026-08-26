using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ReviewResultCache : IReviewResultCache
{
    private const int MaxEntries = 128;
    private static readonly TimeSpan EntryTtl = TimeSpan.FromHours(4);

    private readonly ConcurrentDictionary<string, CacheEntry> _cache = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, InFlightEntry> _inFlight = new(StringComparer.Ordinal);
    private readonly TimeProvider _clock;
    private readonly object _evictionLock = new();

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

        result = ClosedLoopReasoningResultCloner.Clone(entry.Result);
        return true;
    }

    public void Set(ReviewCacheDependencyManifest manifest, ClosedLoopReasoningResult result)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(result);

        ClosedLoopReasoningResult snapshot = ClosedLoopReasoningResultCloner.Clone(result);
        ClosedLoopCacheHitPublishGuard.SanitizeForStorage(snapshot);

        lock (_evictionLock)
        {
            EvictExpiredEntries();

            if (_cache.Count >= MaxEntries)
                EvictOldestEntry();

            DateTime utcNow = _clock.GetUtcNow().UtcDateTime;
            string key = ReviewCacheKeyBuilder.Build(manifest);

            _cache[key] = new CacheEntry
            {
                Result = snapshot,
                CreatedUtc = utcNow,
                ExpiresUtc = utcNow.Add(EntryTtl),
            };
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

        string key = ReviewCacheKeyBuilder.BuildInFlight(manifest, publishToProduct);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            InFlightEntry entry = new()
            {
                Completion = new TaskCompletionSource<ClosedLoopReasoningResult>(
                    TaskCreationOptions.RunContinuationsAsynchronously),
            };

            if (_inFlight.TryAdd(key, entry))
            {
                try
                {
                    ClosedLoopReasoningResult result = await leaderWork(cancellationToken).ConfigureAwait(false);
                    entry.Completion.TrySetResult(result);

                    return result;
                }
                catch (OperationCanceledException)
                {
                    entry.Completion.TrySetException(new ReviewCacheSingleFlightLeaderAbortedException());

                    throw;
                }
                catch (Exception exception)
                {
                    entry.Completion.TrySetException(exception);

                    throw;
                }
                finally
                {
                    _inFlight.TryRemove(new KeyValuePair<string, InFlightEntry>(key, entry));
                }
            }

            if (!_inFlight.TryGetValue(key, out InFlightEntry? existing))
                continue;

            try
            {
                return await existing.Completion.Task.WaitAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (ReviewCacheSingleFlightLeaderAbortedException)
            {
                continue;
            }
        }
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

    private sealed class InFlightEntry
    {
        public required TaskCompletionSource<ClosedLoopReasoningResult> Completion
        {
            get;
            init;
        }
    }
}
