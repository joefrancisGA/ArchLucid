using ArchiForge.Decisioning.Governance.PolicyPacks;

namespace ArchiForge.Persistence.Governance;

public sealed class InMemoryPolicyPackRepository : IPolicyPackRepository
{
    private readonly List<PolicyPack> _items = [];
    private readonly object _gate = new();

    public Task CreateAsync(PolicyPack pack, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
            _items.Add(pack);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(PolicyPack pack, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            var i = _items.FindIndex(x => x.PolicyPackId == pack.PolicyPackId);
            if (i >= 0)
                _items[i] = pack;
        }

        return Task.CompletedTask;
    }

    public Task<PolicyPack?> GetByIdAsync(Guid policyPackId, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
            return Task.FromResult(_items.FirstOrDefault(x => x.PolicyPackId == policyPackId));
    }

    public Task<IReadOnlyList<PolicyPack>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            var result = _items
                .Where(x => x.TenantId == tenantId && x.WorkspaceId == workspaceId && x.ProjectId == projectId)
                .OrderByDescending(x => x.CreatedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<PolicyPack>>(result);
        }
    }
}
