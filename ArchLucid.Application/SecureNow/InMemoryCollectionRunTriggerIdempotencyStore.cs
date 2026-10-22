using System.Collections.Concurrent;

namespace ArchLucid.Application.SecureNow;

public sealed class InMemoryCollectionRunTriggerIdempotencyStore : ICollectionRunTriggerIdempotencyStore
{
    private readonly ConcurrentDictionary<string, Entry> _entries = new(StringComparer.Ordinal);

    public bool TryGet(string key, out Guid runId)
    {
        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        if (_entries.TryGetValue(key, out Entry? entry) && entry.ExpiresUtc > nowUtc)
        {
            runId = entry.RunId;
            return true;
        }

        _entries.TryRemove(key, out _);
        runId = Guid.Empty;
        return false;
    }

    public void Set(string key, Guid runId, TimeSpan lifetime)
    {
        DateTime expiresUtc = TimeProvider.System.GetUtcNow().UtcDateTime.Add(lifetime);
        _entries[key] = new Entry(runId, expiresUtc);
    }

    private sealed record Entry(Guid RunId, DateTime ExpiresUtc);
}
