using System.Collections.Concurrent;

using Microsoft.Extensions.Caching.Distributed;

namespace ArchLucid.Host.Composition.ValueReports;

/// <summary>
///     Process-wide poll state so load-balanced replicas in the same OS process can share job status without Redis.
/// </summary>
public sealed class ProcessSharedValueReportJobPollStateCache : IValueReportJobPollStateCache
{
    public static ProcessSharedValueReportJobPollStateCache Instance { get; } = new();

    private readonly ConcurrentDictionary<string, CacheEntry> _entries = new();

    private ProcessSharedValueReportJobPollStateCache()
    {
    }

    public void Set(string key, byte[] payload, DistributedCacheEntryOptions options)
    {
        ArgumentException.ThrowIfNullOrEmpty(key);

        if (payload is null)
            throw new ArgumentNullException(nameof(payload));

        if (options is null)
            throw new ArgumentNullException(nameof(options));

        DateTimeOffset expiresAtUtc = ResolveExpiresAtUtc(options);

        _entries[key] = new CacheEntry(payload, expiresAtUtc);
    }

    public byte[]? Get(string key)
    {
        ArgumentException.ThrowIfNullOrEmpty(key);

        if (!_entries.TryGetValue(key, out CacheEntry? entry))
            return null;

        if (entry.ExpiresAtUtc <= DateTimeOffset.UtcNow)
        {
            _entries.TryRemove(key, out _);

            return null;
        }

        return entry.Payload;
    }

    private static DateTimeOffset ResolveExpiresAtUtc(DistributedCacheEntryOptions options)
    {
        if (options.AbsoluteExpirationRelativeToNow is TimeSpan relative)
            return DateTimeOffset.UtcNow.Add(relative);

        if (options.AbsoluteExpiration is DateTimeOffset absolute)
            return absolute;

        return DateTimeOffset.UtcNow.AddHours(2);
    }

    private sealed record CacheEntry(byte[] Payload, DateTimeOffset ExpiresAtUtc);
}
