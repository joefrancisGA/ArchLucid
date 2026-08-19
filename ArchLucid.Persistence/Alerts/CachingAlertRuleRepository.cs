using ArchLucid.Contracts.Alerts;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Decorates <see cref="IAlertRuleRepository" /> for scope-keyed evaluation reads.</summary>
public sealed class CachingAlertRuleRepository(IAlertRuleRepository inner, IHotPathReadCache hotPathReadCache)
    : IAlertRuleRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IAlertRuleRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task CreateAsync(AlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);

        await _inner.CreateAsync(rule, ct);
        await HotPathCacheEviction.InvalidateAlertRulesScopeAsync(
            _hotPathReadCache,
            ScopeFor(rule),
            rule.RuleId,
            ct);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(AlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);

        await _inner.UpdateAsync(rule, ct);
        await HotPathCacheEviction.InvalidateAlertRulesScopeAsync(
            _hotPathReadCache,
            ScopeFor(rule),
            rule.RuleId,
            ct);
    }

    /// <inheritdoc />
    public Task<AlertRule?> GetByIdAsync(Guid ruleId, CancellationToken ct)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.AlertRuleById(ruleId),
            innerCt => _inner.GetByIdAsync(ruleId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AlertRule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        long revision = await ReadRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.AlertRuleListByScope(scope, revision);

        CachedAlertRuleList? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<AlertRule> rows =
                    await _inner.ListByScopeAsync(tenantId, workspaceId, projectId, innerCt);

                return new CachedAlertRuleList { Items = rows.ToList() };
            },
            ct);

        return cached?.Items ?? [];
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AlertRule>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        long revision = await ReadRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.AlertRuleEnabledListByScope(scope, revision);

        CachedAlertRuleList? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<AlertRule> rows =
                    await _inner.ListEnabledByScopeAsync(tenantId, workspaceId, projectId, innerCt);

                return new CachedAlertRuleList { Items = rows.ToList() };
            },
            ct);

        return cached?.Items ?? [];
    }

    private async Task<long> ReadRevisionAsync(ScopeContext scope, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.AlertRuleListScopeRevision(scope);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
    }

    private static ScopeContext ScopeFor(AlertRule rule) =>
        new()
        {
            TenantId = rule.TenantId,
            WorkspaceId = rule.WorkspaceId,
            ProjectId = rule.ProjectId,
        };
}

/// <summary>Concrete list wrapper so HybridCache can round-trip alert rules.</summary>
public sealed class CachedAlertRuleList
{
    public List<AlertRule> Items
    {
        get;
        init;
    } = [];
}
