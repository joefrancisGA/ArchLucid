using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Alerts;

/// <summary>In-memory <see cref="IAlertRuleRepository"/> for tests; uses a lock for thread safety.</summary>
public sealed class InMemoryAlertRuleRepository : IAlertRuleRepository
{
    private const int MaxEntries = 2_000;

    private readonly List<AlertRule> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(AlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(rule);
        }

        return Task.CompletedTask;
    }

    public Task UpdateAsync(AlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            // Mirrors the SQL UPDATE, which matches on the row key plus the entity's own scope triple.
            int i = _items.FindIndex(x => x.RuleId == rule.RuleId && SameScope(x, rule));
            if (i >= 0)
                _items[i] = rule;
        }

        return Task.CompletedTask;
    }

    public Task<AlertRule?> GetByIdAsync(ScopeContext scope, Guid ruleId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
            return Task.FromResult(_items.FirstOrDefault(x => x.RuleId == ruleId && MatchesScope(x, scope)));
    }

    private static bool MatchesScope(AlertRule rule, ScopeContext scope) =>
        rule.TenantId == scope.TenantId && rule.WorkspaceId == scope.WorkspaceId && rule.ProjectId == scope.ProjectId;

    private static bool SameScope(AlertRule stored, AlertRule incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;

    public Task<IReadOnlyList<AlertRule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AlertRule> result = _items
                .Where(x => x.TenantId == tenantId && x.WorkspaceId == workspaceId && x.ProjectId == projectId)
                .OrderByDescending(x => x.CreatedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertRule>>(result);
        }
    }

    public Task<IReadOnlyList<AlertRule>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AlertRule> result = _items
                .Where(x => x.TenantId == tenantId && x.WorkspaceId == workspaceId && x.ProjectId == projectId && x.IsEnabled)
                .OrderByDescending(x => x.CreatedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertRule>>(result);
        }
    }
}
