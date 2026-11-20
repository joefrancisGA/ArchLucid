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
            if (_items.Exists(item => item.RuleId == rule.RuleId))
                throw new InvalidOperationException("An alert rule with this ID already exists.");

            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(Copy(rule));
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
            {
                AlertRule updated = Copy(rule);
                updated.CreatedUtc = _items[i].CreatedUtc;
                _items[i] = updated;
            }
        }

        return Task.CompletedTask;
    }

    public Task<AlertRule?> GetByIdAsync(ScopeContext scope, Guid ruleId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AlertRule? rule = _items.FirstOrDefault(x => x.RuleId == ruleId && MatchesScope(x, scope));
            return Task.FromResult(rule is null ? null : Copy(rule));
        }
    }

    private static AlertRule Copy(AlertRule rule) => new()
    {
        RuleId = rule.RuleId,
        TenantId = rule.TenantId,
        WorkspaceId = rule.WorkspaceId,
        ProjectId = rule.ProjectId,
        Name = rule.Name,
        RuleType = rule.RuleType,
        Severity = rule.Severity,
        ThresholdValue = rule.ThresholdValue,
        IsEnabled = rule.IsEnabled,
        TargetChannelType = rule.TargetChannelType,
        MetadataJson = rule.MetadataJson,
        CreatedUtc = rule.CreatedUtc,
    };

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
                .Select(Copy)
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
                .Select(Copy)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertRule>>(result);
        }
    }
}
