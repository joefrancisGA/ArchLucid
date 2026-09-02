using ArchLucid.Core.Pagination;

namespace ArchLucid.Persistence.Alerts;

/// <summary>
/// Thread-safe in-memory store implementing <see cref="IAlertRecordRepository"/> for tests and local scenarios.
/// </summary>
/// <remarks>Semantics mirror <see cref="DapperAlertRecordRepository"/> for open dedup (Open + Acknowledged only).</remarks>
public sealed class InMemoryAlertRecordRepository : IAlertRecordRepository
{
    private const int MaxEntries = 500;
    private readonly List<AlertRecord> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(AlertRecord alert, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            _items.Add(alert);
            if (_items.Count > MaxEntries)
                _items.RemoveRange(0, _items.Count - MaxEntries);
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
            {
                match.IsArchived = true;
                match.LastUpdatedUtc = TimeProvider.System.UtcNowDateTime();
            }
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
            AlertRecord? match = _items
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId &&
                    !x.IsArchived &&
                    string.Equals(x.DeduplicationKey, deduplicationKey, StringComparison.Ordinal) &&
                    (string.Equals(x.Status, AlertStatus.Open, StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(x.Status, AlertStatus.Acknowledged, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(x => x.CreatedUtc)
                .FirstOrDefault();
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
            List<AlertRecord> result = AlertRecordRepositoryCore.OrderForInbox(AlertRecordRepositoryCore.FilterInbox(_items, tenantId, workspaceId, projectId, status, includeArchived)).Take(n).ToList();
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
            List<AlertRecord> ordered = AlertRecordRepositoryCore.OrderForInbox(AlertRecordRepositoryCore.FilterInbox(_items, tenantId, workspaceId, projectId, status, includeArchived)).ToList();
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
            IEnumerable<AlertRecord> q = AlertRecordRepositoryCore.FilterInbox(_items, tenantId, workspaceId, projectId, status, includeArchived);

            if (cursorAlertId.HasValue)
            {
                DateTime cursorUtc = cursorCreatedUtc!.Value;
                Guid cursorId = cursorAlertId.Value;

                q = q.Where(x =>
                    x.AlertId != cursorId
                    && (x.CreatedUtc < cursorUtc
                        || (x.CreatedUtc == cursorUtc && x.AlertId.CompareTo(cursorId) < 0)));
            }

            List<AlertRecord> rows = AlertRecordRepositoryCore.OrderForInbox(q).Take(fetch).ToList();

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
            List<AlertRecord> scoped = _items
                .Where(x =>
                    x.TenantId == tenantId
                    && x.WorkspaceId == workspaceId
                    && x.ProjectId == projectId
                    && !x.IsArchived)
                .ToList();

            int open = scoped.Count(x =>
                string.Equals(x.Status, AlertStatus.Open, StringComparison.OrdinalIgnoreCase));
            int acknowledged = scoped.Count(x =>
                string.Equals(x.Status, AlertStatus.Acknowledged, StringComparison.OrdinalIgnoreCase));
            int resolved = scoped.Count(x =>
                string.Equals(x.Status, AlertStatus.Resolved, StringComparison.OrdinalIgnoreCase));
            int blocking = scoped.Count(x =>
                string.Equals(x.Status, AlertStatus.Open, StringComparison.OrdinalIgnoreCase)
                && (string.Equals(x.Severity, AlertSeverity.Critical, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(x.Severity, AlertSeverity.High, StringComparison.OrdinalIgnoreCase)));

            DateTime? lastEvaluated = scoped
                .Select(x => x.LastUpdatedUtc ?? x.CreatedUtc)
                .DefaultIfEmpty()
                .Max();

            if (scoped.Count == 0)
                lastEvaluated = null;

            return Task.FromResult(
                new AlertsInboxSummaryDto
                {
                    OpenCount = open,
                    AcknowledgedCount = acknowledged,
                    ResolvedCount = resolved,
                    BlockingCount = blocking,
                    LastEvaluatedUtc = lastEvaluated,
                });
        }
    }
}
