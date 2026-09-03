namespace ArchLucid.Persistence.Alerts;

/// <summary>
/// Thread-safe in-memory store implementing <see cref="IAlertRecordRepository"/> for tests and local scenarios.
/// </summary>
/// <remarks>Semantics mirror <see cref="DapperAlertRecordRepository"/> for open dedup (Open + Acknowledged only).</remarks>
public sealed class InMemoryAlertRecordRepository : IAlertRecordRepository
{
    private readonly List<AlertRecord> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(AlertRecord alert, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            _items.Add(alert);
            AlertRecordRepositoryCore.TrimInMemoryEntries(_items);
        }
        return Task.CompletedTask;
    }

    public Task UpdateAsync(AlertRecord alert, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            int i = _items.FindIndex(x => x.AlertId == alert.AlertId);
            if (i >= 0)
                _items[i] = alert;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task ArchiveAsync(Guid alertId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AlertRecord? match = _items.FirstOrDefault(x => x.AlertId == alertId);

            if (match is not null)
                AlertRecordRepositoryCore.ApplyArchive(match, TimeProvider.System.UtcNowDateTime());
        }

        return Task.CompletedTask;
    }

    public Task<AlertRecord?> GetByIdAsync(Guid alertId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
            return Task.FromResult(_items.FirstOrDefault(x => x.AlertId == alertId));
    }

    public Task<AlertRecord?> GetOpenByDeduplicationKeyAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string deduplicationKey,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AlertRecord? match = AlertRecordRepositoryCore.SelectOpenByDeduplicationKey(
                _items,
                tenantId,
                workspaceId,
                projectId,
                deduplicationKey);
            return Task.FromResult(match);
        }
    }

    public Task<IReadOnlyList<AlertRecord>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        int take,
        bool includeArchived = false,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        int n = AlertRecordRepositoryCore.ClampListTake(take);
        lock (_gate)
        {
            List<AlertRecord> result = AlertRecordRepositoryCore
                .OrderForInbox(AlertRecordRepositoryCore.FilterInbox(_items, tenantId, workspaceId, projectId, status, includeArchived))
                .Take(n)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertRecord>>(result);
        }
    }

    /// <inheritdoc />
    public Task<(IReadOnlyList<AlertRecord> Items, int TotalCount)> ListByScopePagedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        int skip,
        int take,
        bool includeArchived = false,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        take = AlertRecordRepositoryCore.ClampPagedTake(take);
        skip = AlertRecordRepositoryCore.ClampPagedSkip(skip);

        lock (_gate)
        {
            List<AlertRecord> ordered = AlertRecordRepositoryCore
                .OrderForInbox(AlertRecordRepositoryCore.FilterInbox(_items, tenantId, workspaceId, projectId, status, includeArchived))
                .ToList();
            int total = ordered.Count;
            List<AlertRecord> page = ordered.Skip(skip).Take(take).ToList();
            return Task.FromResult<(IReadOnlyList<AlertRecord>, int)>((page, total));
        }
    }

    /// <inheritdoc />
    public Task<(IReadOnlyList<AlertRecord> Items, bool HasMore)> ListByScopeKeysetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        DateTime? cursorCreatedUtc,
        Guid? cursorAlertId,
        int take,
        bool includeArchived = false,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        AlertRecordRepositoryCore.ValidateAlertKeysetCursor(cursorCreatedUtc, cursorAlertId);

        int safeTake = AlertRecordRepositoryCore.ClampKeysetTake(take);
        int fetch = safeTake + 1;

        lock (_gate)
        {
            IEnumerable<AlertRecord> query = AlertRecordRepositoryCore.FilterInbox(
                _items,
                tenantId,
                workspaceId,
                projectId,
                status,
                includeArchived);

            if (cursorAlertId.HasValue)
            {
                query = AlertRecordRepositoryCore.FilterKeysetAfterCursor(
                    query,
                    cursorCreatedUtc!.Value,
                    cursorAlertId.Value);
            }

            List<AlertRecord> rows = AlertRecordRepositoryCore.OrderForInbox(query).Take(fetch).ToList();

            bool hasMore = rows.Count > safeTake;

            if (hasMore)
                rows.RemoveAt(rows.Count - 1);

            return Task.FromResult<(IReadOnlyList<AlertRecord>, bool)>((rows, hasMore));
        }
    }


    /// <inheritdoc />
    public Task<AlertsInboxSummaryDto> GetInboxSummaryByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        lock (_gate)
        {
            IEnumerable<AlertRecord> scoped = _items.Where(alert =>
                AlertRecordRepositoryCore.MatchesScope(alert, tenantId, workspaceId, projectId));

            return Task.FromResult(AlertRecordRepositoryCore.ComputeInboxSummary(scoped));
        }
    }
}
