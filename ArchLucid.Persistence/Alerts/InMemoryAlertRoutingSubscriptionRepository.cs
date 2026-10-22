using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Alerts;

/// <summary>In-memory <see cref="IAlertRoutingSubscriptionRepository"/> for tests and storage-off hosts.</summary>
public sealed class InMemoryAlertRoutingSubscriptionRepository : IAlertRoutingSubscriptionRepository
{
    private readonly List<AlertRoutingSubscription> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(AlertRoutingSubscription subscription, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
            _items.Add(subscription);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(AlertRoutingSubscription subscription, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            // Mirrors the SQL UPDATE, which matches on the row key plus the entity's own scope triple.
            int i = _items.FindIndex(x =>
                x.RoutingSubscriptionId == subscription.RoutingSubscriptionId && SameScope(x, subscription));
            if (i >= 0)
                _items[i] = subscription;
        }

        return Task.CompletedTask;
    }

    public Task<AlertRoutingSubscription?> GetByIdAsync(
        ScopeContext scope,
        Guid routingSubscriptionId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;
        lock (_gate)
            return Task.FromResult(_items.FirstOrDefault(x =>
                x.RoutingSubscriptionId == routingSubscriptionId && MatchesScope(x, scope)));
    }

    private static bool MatchesScope(AlertRoutingSubscription subscription, ScopeContext scope) =>
        subscription.TenantId == scope.TenantId &&
        subscription.WorkspaceId == scope.WorkspaceId &&
        subscription.ProjectId == scope.ProjectId;

    private static bool SameScope(AlertRoutingSubscription stored, AlertRoutingSubscription incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;

    public Task<IReadOnlyList<AlertRoutingSubscription>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            List<AlertRoutingSubscription> result = _items
                .Where(x => x.TenantId == tenantId && x.WorkspaceId == workspaceId && x.ProjectId == projectId)
                .OrderByDescending(x => x.CreatedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertRoutingSubscription>>(result);
        }
    }

    public Task<IReadOnlyList<AlertRoutingSubscription>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            List<AlertRoutingSubscription> result = _items
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId &&
                    x.IsEnabled)
                .OrderByDescending(x => x.CreatedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertRoutingSubscription>>(result);
        }
    }
}
