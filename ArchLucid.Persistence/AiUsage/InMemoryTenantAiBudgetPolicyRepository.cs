using ArchLucid.Core.AiUsage;

namespace ArchLucid.Persistence.AiUsage;

public sealed class InMemoryTenantAiBudgetPolicyRepository : ITenantAiBudgetPolicyRepository
{
    private readonly Dictionary<Guid, TenantAiBudgetPolicyRow> _rows = new();

    public void Upsert(TenantAiBudgetPolicyRow row) => _rows[row.TenantId] = row;

    public Task<TenantAiBudgetPolicyRow?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        _rows.TryGetValue(tenantId, out TenantAiBudgetPolicyRow? row);

        return Task.FromResult(row);
    }
}
