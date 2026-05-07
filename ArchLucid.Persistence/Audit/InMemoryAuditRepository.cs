using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

/// <summary>
///     In-memory implementation of <see cref="IAuditRepository" /> for testing and storage-off mode.
///     Bounded at <see cref="MaxEvents" /> entries; when full, the oldest <see cref="EvictCount" /> events are
///     removed in a single batch rather than one at a time to amortize eviction cost.
///     All operations are thread-safe via an exclusive lock.
/// </summary>
public sealed class InMemoryAuditRepository : IAuditRepository
{
    private const int MaxEvents = 5_000;
    private const int EvictCount = 1_000;
    private readonly List<AuditEvent> _events = [];

    private readonly Lock _gate = new();

    public Task AppendAsync(AuditEvent auditEvent, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(auditEvent);
        lock (_gate)
        {
            if (_events.Count >= MaxEvents)
                _events.RemoveRange(0, EvictCount);

            _events.Add(auditEvent);
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AuditEvent>> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        int n = Math.Clamp(take <= 0 ? 100 : take, 1, 500);
        List<AuditEvent> result;
        lock (_gate)

            result = _events
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId)
                .OrderByDescending(x => x.OccurredUtc)
                .ThenByDescending(x => x.EventId)
                .Take(n)
                .ToList();


        return Task.FromResult<IReadOnlyList<AuditEvent>>(result);
    }

    public Task<IReadOnlyList<AuditEvent>> GetFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(filter);

        int take = Math.Clamp(filter.Take <= 0 ? 100 : filter.Take, 1, 500);
        List<AuditEvent> snapshot;
        lock (_gate)
        {
            snapshot = AuditEventFilterEnumerable.WhereMatches(_events, tenantId, workspaceId, projectId, filter)
                .OrderByDescending(x => x.OccurredUtc)
                .ThenByDescending(x => x.EventId)
                .Take(take)
                .ToList();
        }

        return Task.FromResult<IReadOnlyList<AuditEvent>>(snapshot);
    }

    public Task<int> CountFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(filter);

        int count;

        lock (_gate)
        {
            count = AuditEventFilterEnumerable.WhereMatches(_events, tenantId, workspaceId, projectId, filter).Count();
        }

        return Task.FromResult(count);
    }

    public Task<IReadOnlyList<AuditEvent>> GetExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime fromUtc,
        DateTime toUtc,
        int maxRows,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        int take = Math.Clamp(maxRows <= 0 ? 10_000 : maxRows, 1, 10_000);
        List<AuditEvent> result;


        lock (_gate)

            result = _events
                .Where(x =>
                    x.TenantId == tenantId
                    && x.WorkspaceId == workspaceId
                    && x.ProjectId == projectId
                    && x.OccurredUtc >= fromUtc
                    && x.OccurredUtc < toUtc)
                .OrderBy(x => x.OccurredUtc)
                .ThenBy(x => x.EventId)
                .Take(take)
                .ToList();


        return Task.FromResult<IReadOnlyList<AuditEvent>>(result);
    }
}
