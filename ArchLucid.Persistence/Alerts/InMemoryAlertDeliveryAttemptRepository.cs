using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Alerts;

/// <summary>In-memory <see cref="IAlertDeliveryAttemptRepository"/> for tests; thread-safe via lock.</summary>
public sealed class InMemoryAlertDeliveryAttemptRepository : IAlertDeliveryAttemptRepository
{
    private readonly List<AlertDeliveryAttempt> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(AlertDeliveryAttempt attempt, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (_items.Exists(item => item.AlertDeliveryAttemptId == attempt.AlertDeliveryAttemptId))
                throw new InvalidOperationException("An alert delivery attempt with this ID already exists.");

            _items.Add(Copy(attempt));
        }
        return Task.CompletedTask;
    }

    public Task UpdateAsync(AlertDeliveryAttempt attempt, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            // Mirrors the SQL UPDATE, which matches on the row key plus the entity's own scope triple.
            AlertDeliveryAttempt? stored = _items.Find(x =>
                x.AlertDeliveryAttemptId == attempt.AlertDeliveryAttemptId && SameScope(x, attempt));
            if (stored is not null)
            {
                stored.Status = attempt.Status;
                stored.ErrorMessage = attempt.ErrorMessage;
                stored.RetryCount = attempt.RetryCount;
            }
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AlertDeliveryAttempt>> ListByAlertAsync(
        ScopeContext scope,
        Guid alertId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AlertDeliveryAttempt> result = _items
                .Where(x => x.AlertId == alertId && MatchesScope(x, scope))
                .OrderByDescending(x => x.AttemptedUtc)
                .Take(PaginationDefaults.MaxPageSize)
                .Select(Copy)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertDeliveryAttempt>>(result);
        }
    }

    public Task<IReadOnlyList<AlertDeliveryAttempt>> ListBySubscriptionAsync(
        ScopeContext scope,
        Guid routingSubscriptionId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AlertDeliveryAttempt> result = _items
                .Where(x => x.RoutingSubscriptionId == routingSubscriptionId && MatchesScope(x, scope))
                .OrderByDescending(x => x.AttemptedUtc)
                .Take(take)
                .Select(Copy)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertDeliveryAttempt>>(result);
        }
    }

    private static AlertDeliveryAttempt Copy(AlertDeliveryAttempt attempt) => new()
    {
        AlertDeliveryAttemptId = attempt.AlertDeliveryAttemptId,
        AlertId = attempt.AlertId,
        RoutingSubscriptionId = attempt.RoutingSubscriptionId,
        TenantId = attempt.TenantId,
        WorkspaceId = attempt.WorkspaceId,
        ProjectId = attempt.ProjectId,
        AttemptedUtc = attempt.AttemptedUtc,
        Status = attempt.Status,
        ErrorMessage = attempt.ErrorMessage,
        ChannelType = attempt.ChannelType,
        Destination = attempt.Destination,
        RetryCount = attempt.RetryCount,
    };

    private static bool MatchesScope(AlertDeliveryAttempt attempt, ScopeContext scope) =>
        attempt.TenantId == scope.TenantId &&
        attempt.WorkspaceId == scope.WorkspaceId &&
        attempt.ProjectId == scope.ProjectId;

    private static bool SameScope(AlertDeliveryAttempt stored, AlertDeliveryAttempt incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
