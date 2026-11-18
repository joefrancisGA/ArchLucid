using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.SecureNow;

public sealed class InMemoryCollectionRunTriggerIdempotencyStore : ICollectionRunTriggerIdempotencyStore, IDisposable
{
    private readonly MemoryCache _entries = new(new MemoryCacheOptions());

    public bool TryGet(string key, out Guid runId) => _entries.TryGetValue(key, out runId);

    public void Set(string key, Guid runId, TimeSpan lifetime) =>
        _entries.Set(key, runId, TimeProvider.System.GetUtcNow().Add(lifetime));

    public void Dispose() => _entries.Dispose();
}
