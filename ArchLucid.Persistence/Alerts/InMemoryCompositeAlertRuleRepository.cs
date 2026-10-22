using ArchLucid.Core.Scoping;

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
            // Mirrors the SQL UPDATE, which matches on the row key plus the entity's own scope triple.
            int i = _items.FindIndex(x =>
                x.CompositeRuleId == rule.CompositeRuleId &&
                x.TenantId == rule.TenantId &&
                x.WorkspaceId == rule.WorkspaceId &&
                x.ProjectId == rule.ProjectId);
            if (i >= 0)
                _items[i] = CompositeAlertRuleRepositoryCore.CloneRule(rule);
        }

        return Task.CompletedTask;
    }

    public Task<CompositeAlertRule?> GetByIdAsync(ScopeContext scope, Guid compositeRuleId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;
        lock (_gate)
        {
            CompositeAlertRule? found = CompositeAlertRuleRepositoryCore
                .FilterByScope(_items, scope.TenantId, scope.WorkspaceId, scope.ProjectId)
                .FirstOrDefault(x => x.CompositeRuleId == compositeRuleId);
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
