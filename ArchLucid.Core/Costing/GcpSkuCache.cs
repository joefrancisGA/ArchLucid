using System.Collections.Concurrent;

namespace ArchLucid.Core.Costing;

internal sealed class GcpSkuCache
{
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromHours(24);

    private readonly ConcurrentDictionary<string, CachedLookup> _entries = new();

    public bool TryGetFresh(string cacheKey, DateTimeOffset nowUtc, out decimal? monthlyUsd)
    {
        if (_entries.TryGetValue(cacheKey, out CachedLookup? reuse)
            && reuse is not null
            && reuse.ExpiresUtc > nowUtc)
        {
            monthlyUsd = reuse.MonthlyUsd;

            return true;
        }

        monthlyUsd = null;

        return false;
    }

    public void RememberMiss(string cacheKey, DateTimeOffset nowUtc) =>
        _entries[cacheKey] = new CachedLookup(nowUtc.AddMinutes(30));

    public void RememberHit(string cacheKey, decimal monthlyUsd, DateTimeOffset nowUtc) =>
        _entries[cacheKey] = new CachedLookup(monthlyUsd, nowUtc.Add(CacheLifetime));

    private sealed record CachedLookup
    {
        public CachedLookup(DateTimeOffset expiresUtc)
        {
            ExpiresUtc = expiresUtc;
        }

        public CachedLookup(decimal monthlyUsd, DateTimeOffset expiresUtc)
        {
            MonthlyUsd = monthlyUsd;
            ExpiresUtc = expiresUtc;
        }

        public decimal? MonthlyUsd
        {
            get;
        }

        public DateTimeOffset ExpiresUtc
        {
            get;
        }
    }
}
