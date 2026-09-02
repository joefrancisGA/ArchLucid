
namespace ArchLucid.Persistence.Alerts;

/// <summary>In-memory <see cref="ICompositeAlertRuleRepository"/> for tests; clones rules on write to mimic isolated rows.</summary>
public sealed class InMemoryCompositeAlertRuleRepository : ICompositeAlertRuleRepository
{
    private readonly List<CompositeAlertRule> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(CompositeAlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);
        _ = ct;
        lock (_gate)
            _items.Add(CompositeAlertRuleRepositoryCore.CloneRule(rule));
        return Task.CompletedTask;
    }

    public Task UpdateAsync(CompositeAlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);
        _ = ct;
        lock (_gate)
        {
            int i = _items.FindIndex(x => x.CompositeRuleId == rule.CompositeRuleId);
            if (i >= 0)
                _items[i] = CompositeAlertRuleRepositoryCore.CloneRule(rule);
        }

        return Task.CompletedTask;
    }

    public Task<CompositeAlertRule?> GetByIdAsync(Guid compositeRuleId, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            CompositeAlertRule? found = _items.FirstOrDefault(x => x.CompositeRuleId == compositeRuleId);
            return Task.FromResult(found is null ? null : CompositeAlertRuleRepositoryCore.CloneRule(found));
        }
    }

    public Task<IReadOnlyList<CompositeAlertRule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            List<CompositeAlertRule> result = CompositeAlertRuleRepositoryCore
                .FilterByScope(_items, tenantId, workspaceId, projectId)
                .Select(CompositeAlertRuleRepositoryCore.CloneRule)
                .ToList();
            return Task.FromResult<IReadOnlyList<CompositeAlertRule>>(result);
        }
    }

    public Task<IReadOnlyList<CompositeAlertRule>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            List<CompositeAlertRule> result = CompositeAlertRuleRepositoryCore
                .FilterEnabledByScope(_items, tenantId, workspaceId, projectId)
                .Select(CompositeAlertRuleRepositoryCore.CloneRule)
                .ToList();
            return Task.FromResult<IReadOnlyList<CompositeAlertRule>>(result);
        }
    }

}
