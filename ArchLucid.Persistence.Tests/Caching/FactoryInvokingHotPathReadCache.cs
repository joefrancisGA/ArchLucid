using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Tests.Caching;

/// <summary>Test double that always invokes the cache factory (cache miss).</summary>
internal sealed class FactoryInvokingHotPathReadCache : IHotPathReadCache
{
    public Task<T?> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T?>> factory,
        CancellationToken ct,
        int? absoluteExpirationSecondsOverride = null)
        where T : class
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(factory);

        return factory(ct);
    }

    public Task RemoveAsync(string key, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        return Task.CompletedTask;
    }
}
