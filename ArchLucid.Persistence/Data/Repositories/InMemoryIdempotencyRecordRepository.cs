using System.Collections.Concurrent;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class InMemoryIdempotencyRecordRepository : IIdempotencyRecordRepository
{
    private readonly ConcurrentDictionary<string, IdempotencyRecordRow> _store = new(StringComparer.Ordinal);

    public Task<IdempotencyRecordRow?> TryGetAsync(Guid tenantId, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        string key = $"{tenantId:N}_{idempotencyKey}";
        _store.TryGetValue(key, out IdempotencyRecordRow? row);
        return Task.FromResult(row);
    }

    public Task<bool> TryInsertAsync(Guid tenantId, string idempotencyKey, int statusCode, string responseBody, CancellationToken cancellationToken = default)
    {
        string key = $"{tenantId:N}_{idempotencyKey}";
        IdempotencyRecordRow row = new()
        {
            IdempotencyKey = idempotencyKey,
            TenantId = tenantId,
            StatusCode = statusCode,
            ResponseBody = responseBody,
            CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
        };

        return Task.FromResult(_store.TryAdd(key, row));
    }
}
