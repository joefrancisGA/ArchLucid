using Microsoft.Extensions.Caching.Distributed;

namespace ArchLucid.Host.Composition.ValueReports;

public sealed class DistributedCacheValueReportJobPollStateCache(IDistributedCache distributedCache)
    : IValueReportJobPollStateCache
{
    private readonly IDistributedCache _distributedCache =
        distributedCache ?? throw new ArgumentNullException(nameof(distributedCache));

    public void Set(string key, byte[] payload, DistributedCacheEntryOptions options)
    {
        ArgumentException.ThrowIfNullOrEmpty(key);

        if (payload is null)
            throw new ArgumentNullException(nameof(payload));

        if (options is null)
            throw new ArgumentNullException(nameof(options));

        _distributedCache.Set(key, payload, options);
    }

    public byte[]? Get(string key)
    {
        ArgumentException.ThrowIfNullOrEmpty(key);

        return _distributedCache.Get(key);
    }
}
