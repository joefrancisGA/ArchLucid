using System.Data;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Audit;

/// <summary>
///     Decorates <see cref="IAuditRepository" /> with short-TTL hot-path reads for first-page list/search queries
///     (TB-581). Export, count, and keyset pages bypass the cache.
/// </summary>
public sealed class CachingAuditRepository(IAuditRepository inner, IHotPathReadCache hotPathReadCache) : IAuditRepository
{
    /// <summary>
    ///     Short TTL for admin audit list/search; scope revision bump invalidates on append (TB-581), coalesced during
    ///     bursts (TB-2062).
    /// </summary>
    private const int ListAbsoluteExpirationSeconds = 15;

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IAuditRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task AppendAsync(
        AuditEvent auditEvent,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.AppendAsync(auditEvent, ct, connection, transaction);

        ScopeContext scope = ScopeForEvent(auditEvent);

        await HotPathCacheEviction.InvalidateAuditListScopeAsync(_hotPathReadCache, scope, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AuditEvent>> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        int safeTake = Math.Clamp(take <= 0 ? 100 : take, 1, 500);
        long revision = await ReadAuditListScopeRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.AuditListByScopeFirstPage(scope, safeTake, revision);

        IReadOnlyList<AuditEvent>? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<AuditEvent> rows =
                    await _inner.GetByScopeAsync(tenantId, workspaceId, projectId, safeTake, innerCt);

                return rows;
            },
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? [];
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AuditEvent>> GetFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(filter);

        if (!IsFirstPageListCacheEligible(filter))
            return await _inner.GetFilteredAsync(tenantId, workspaceId, projectId, filter, ct);

        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        int safeTake = Math.Clamp(filter.Take <= 0 ? 100 : filter.Take, 1, 500);
        long revision = await ReadAuditListScopeRevisionAsync(scope, ct);
        string fingerprint = AuditFilterCacheFingerprint.Build(filter);
        string key = HotPathCacheKeys.AuditListFilteredFirstPage(scope, fingerprint, safeTake, revision);

        IReadOnlyList<AuditEvent>? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<AuditEvent> rows =
                    await _inner.GetFilteredAsync(tenantId, workspaceId, projectId, filter, innerCt);

                return rows;
            },
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? [];
    }

    /// <inheritdoc />
    public Task<int> CountFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
        => _inner.CountFilteredAsync(tenantId, workspaceId, projectId, filter, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<AuditEvent>> GetExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime fromUtc,
        DateTime toUtc,
        int maxRows,
        CancellationToken ct)
        => _inner.GetExportAsync(tenantId, workspaceId, projectId, fromUtc, toUtc, maxRows, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<AuditEvent>> GetFilteredExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
        => _inner.GetFilteredExportAsync(tenantId, workspaceId, projectId, filter, ct);

    /// <inheritdoc />
    public IAsyncEnumerable<AuditEvent> StreamFilteredExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
        => _inner.StreamFilteredExportAsync(tenantId, workspaceId, projectId, filter, ct);

    private static bool IsFirstPageListCacheEligible(AuditEventFilter filter)
    {
        if (filter.IncludeDataJson)
            return false;

        if (filter.BeforeUtc.HasValue || filter.BeforeEventId.HasValue)
            return false;

        return true;
    }

    private async Task<long> ReadAuditListScopeRevisionAsync(ScopeContext scope, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.AuditListScopeRevision(scope);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
    }

    private static ScopeContext ScopeForEvent(AuditEvent auditEvent)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);

        return new ScopeContext
        {
            TenantId = auditEvent.TenantId,
            WorkspaceId = auditEvent.WorkspaceId,
            ProjectId = auditEvent.ProjectId,
        };
    }
}
