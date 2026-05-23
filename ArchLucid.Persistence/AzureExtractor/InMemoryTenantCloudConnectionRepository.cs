using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Persistence.AzureExtractor;

public sealed class InMemoryTenantCloudConnectionRepository : ITenantCloudConnectionRepository
{
    private readonly Dictionary<Guid, TenantCloudConnectionRecord> _store = new();

    public Task<TenantCloudConnectionRecord?> TryGetAsync(Guid connectionId, CancellationToken cancellationToken)
    {
        _store.TryGetValue(connectionId, out TenantCloudConnectionRecord? record);
        return Task.FromResult(record);
    }

    public Task<IReadOnlyList<TenantCloudConnectionRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var records = _store.Values.Where(r => r.TenantId == tenantId).ToList();
        return Task.FromResult<IReadOnlyList<TenantCloudConnectionRecord>>(records);
    }

    public Task UpsertAsync(TenantCloudConnectionRecord record, CancellationToken cancellationToken)
    {
        _store[record.ConnectionId] = record;
        return Task.CompletedTask;
    }
}
