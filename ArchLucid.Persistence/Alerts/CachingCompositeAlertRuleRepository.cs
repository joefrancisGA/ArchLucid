using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Decorates <see cref="ICompositeAlertRuleRepository" /> for scope-keyed evaluation reads.</summary>
public sealed class CachingCompositeAlertRuleRepository(
    ICompositeAlertRuleRepository inner,
    IHotPathReadCache hotPathReadCache) : ICompositeAlertRuleRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ICompositeAlertRuleRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task CreateAsync(CompositeAlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);

        await _inner.CreateAsync(rule, ct);
        await HotPathCacheEviction.InvalidateCompositeAlertRulesScopeAsync(
            _hotPathReadCache,
            ScopeFor(rule),
            rule.CompositeRuleId,
            ct);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(CompositeAlertRule rule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(rule);

        await _inner.UpdateAsync(rule, ct);
        await HotPathCacheEviction.InvalidateCompositeAlertRulesScopeAsync(
            _hotPathReadCache,
            ScopeFor(rule),
            rule.CompositeRuleId,
            ct);
    }

    /// <inheritdoc />
    public Task<CompositeAlertRule?> GetByIdAsync(Guid compositeRuleId, CancellationToken ct)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.CompositeAlertRuleById(compositeRuleId),
            innerCt => _inner.GetByIdAsync(compositeRuleId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CompositeAlertRule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        long revision = await ReadRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.CompositeAlertRuleListByScope(scope, revision);

        CachedCompositeAlertRuleList? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<CompositeAlertRule> rows =
                    await _inner.ListByScopeAsync(tenantId, workspaceId, projectId, innerCt);

                return new CachedCompositeAlertRuleList { Items = rows.ToList() };
            },
            ct);

        return cached?.Items ?? [];
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CompositeAlertRule>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        long revision = await ReadRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.CompositeAlertRuleEnabledListByScope(scope, revision);

        CachedCompositeAlertRuleList? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<CompositeAlertRule> rows =
                    await _inner.ListEnabledByScopeAsync(tenantId, workspaceId, projectId, innerCt);

                return new CachedCompositeAlertRuleList { Items = rows.ToList() };
            },
            ct);

        return cached?.Items ?? [];
    }

    private async Task<long> ReadRevisionAsync(ScopeContext scope, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.CompositeAlertRuleListScopeRevision(scope);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
    }

    private static ScopeContext ScopeFor(CompositeAlertRule rule) =>
        new()
        {
            TenantId = rule.TenantId,
            WorkspaceId = rule.WorkspaceId,
            ProjectId = rule.ProjectId,
        };
}

/// <summary>Concrete list wrapper so HybridCache can round-trip composite alert rules.</summary>
public sealed class CachedCompositeAlertRuleList
{
    public List<CompositeAlertRule> Items
    {
        get;
        init;
    } = [];
}
