using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Alerts;

/// <summary>In-memory <see cref="IAlertDeliveryAttemptRepository"/> for tests; thread-safe via lock.</summary>
public sealed class InMemoryAlertDeliveryAttemptRepository : IAlertDeliveryAttemptRepository
{
    private readonly List<AlertDeliveryAttempt> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(AlertDeliveryAttempt attempt, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
            _items.Add(attempt);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(AlertDeliveryAttempt attempt, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            // Mirrors the SQL UPDATE, which matches on the row key plus the entity's own scope triple.
            int i = _items.FindIndex(x =>
                x.AlertDeliveryAttemptId == attempt.AlertDeliveryAttemptId && SameScope(x, attempt));
            if (i >= 0)
                _items[i] = attempt;
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AlertDeliveryAttempt>> ListByAlertAsync(
        ScopeContext scope,
        Guid alertId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;
        lock (_gate)
        {
            List<AlertDeliveryAttempt> result = _items
                .Where(x => x.AlertId == alertId && MatchesScope(x, scope))
                .OrderByDescending(x => x.AttemptedUtc)
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
        _ = ct;
        lock (_gate)
        {
            List<AlertDeliveryAttempt> result = _items
                .Where(x => x.RoutingSubscriptionId == routingSubscriptionId && MatchesScope(x, scope))
                .OrderByDescending(x => x.AttemptedUtc)
                .Take(take)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertDeliveryAttempt>>(result);
        }
    }

    private static bool MatchesScope(AlertDeliveryAttempt attempt, ScopeContext scope) =>
        attempt.TenantId == scope.TenantId &&
        attempt.WorkspaceId == scope.WorkspaceId &&
        attempt.ProjectId == scope.ProjectId;

    private static bool SameScope(AlertDeliveryAttempt stored, AlertDeliveryAttempt incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
