using System.Data;


namespace ArchLucid.Persistence.Governance;

/// <summary>
///     In-memory implementation of <see cref="IPolicyPackRepository" /> for testing and storage-off mode.
///     Capped at <see cref="MaxEntries" /> packs; oldest entry is evicted on each insert when the cap is reached.
///     All operations are thread-safe via an exclusive lock.
/// </summary>
public sealed class InMemoryPolicyPackRepository : IPolicyPackRepository
{
    private const int MaxEntries = 2_000;
    private const int ListScopeCap = 500;
    private readonly Lock _gate = new();

    private readonly List<PolicyPack> _items = [];

    public Task CreateAsync(
        PolicyPack pack,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(pack);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(Copy(pack));
        }

        return Task.CompletedTask;
    }

    public Task UpdateAsync(PolicyPack pack, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(pack);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            int i = _items.FindIndex(x => x.PolicyPackId == pack.PolicyPackId);

            if (i >= 0)
            {
                PolicyPackDistributionScopeRules.EnsureDistributionScopeUnchanged(_items[i], pack);
                _items[i] = Copy(pack);
            }
        }

        return Task.CompletedTask;
    }

    public Task<PolicyPack?> GetByIdAsync(Guid policyPackId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            PolicyPack? pack = _items.FirstOrDefault(x => x.PolicyPackId == policyPackId && !x.IsDeleted);
            return Task.FromResult(pack is null ? null : Copy(pack));
        }
    }

    public Task<IReadOnlyList<PolicyPack>> GetByIdsAsync(IReadOnlyCollection<Guid> policyPackIds, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (policyPackIds is null || policyPackIds.Count == 0)
            return Task.FromResult<IReadOnlyList<PolicyPack>>(Array.Empty<PolicyPack>());

        HashSet<Guid> idSet = policyPackIds.ToHashSet();
        lock (_gate)
        {
            List<PolicyPack> result = _items
                .Where(x => idSet.Contains(x.PolicyPackId) && !x.IsDeleted)
                .Select(Copy)
                .ToList();
            return Task.FromResult<IReadOnlyList<PolicyPack>>(result);
        }
    }

    public Task<IReadOnlyList<PolicyPack>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<PolicyPack> result = _items
                .Where(x => x.TenantId == tenantId && x.WorkspaceId == workspaceId && x.ProjectId == projectId && !x.IsDeleted)
                .OrderByDescending(x => x.CreatedUtc)
                .Take(ListScopeCap)
                .Select(Copy)
                .ToList();
            return Task.FromResult<IReadOnlyList<PolicyPack>>(result);
        }
    }

    private static PolicyPack Copy(PolicyPack pack) =>
        new()
        {
            PolicyPackId = pack.PolicyPackId,
            TenantId = pack.TenantId,
            WorkspaceId = pack.WorkspaceId,
            ProjectId = pack.ProjectId,
            Name = pack.Name,
            PackSlug = pack.PackSlug,
            Description = pack.Description,
            PackType = pack.PackType,
            DistributionScope = pack.DistributionScope,
            Status = pack.Status,
            CreatedUtc = pack.CreatedUtc,
            ActivatedUtc = pack.ActivatedUtc,
            CurrentVersion = pack.CurrentVersion,
            IsDeleted = pack.IsDeleted,
            QualityDimension = pack.QualityDimension,
        };
}
