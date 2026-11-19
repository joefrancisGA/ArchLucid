using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Alerts;

/// <summary>In-memory <see cref="IAlertRoutingSubscriptionRepository"/> for tests and storage-off hosts.</summary>
public sealed class InMemoryAlertRoutingSubscriptionRepository : IAlertRoutingSubscriptionRepository
{
    private readonly List<AlertRoutingSubscription> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(AlertRoutingSubscription subscription, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (_items.Exists(item => item.RoutingSubscriptionId == subscription.RoutingSubscriptionId))
                throw new InvalidOperationException("An alert routing subscription with this ID already exists.");

            _items.Add(Copy(subscription));
        }
        return Task.CompletedTask;
    }

    public Task UpdateAsync(AlertRoutingSubscription subscription, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AlertRoutingSubscription? stored = _items.Find(x =>
                x.RoutingSubscriptionId == subscription.RoutingSubscriptionId && SameScope(x, subscription));
            if (stored is not null)
            {
                stored.Name = subscription.Name;
                stored.ChannelType = subscription.ChannelType;
                stored.Destination = subscription.Destination;
                stored.MinimumSeverity = subscription.MinimumSeverity;
                stored.IsEnabled = subscription.IsEnabled;
                stored.LastModifiedByActor = subscription.LastModifiedByActor;
                stored.LastModifiedUtc = subscription.LastModifiedUtc;
                stored.MetadataJson = subscription.MetadataJson;

                if (stored.LastDeliveredUtc is null || subscription.LastDeliveredUtc > stored.LastDeliveredUtc)
                    stored.LastDeliveredUtc = subscription.LastDeliveredUtc;
            }
        }

        return Task.CompletedTask;
    }

    public Task RecordDeliveryAsync(AlertRoutingSubscription subscription, DateTime deliveredUtc, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(subscription);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AlertRoutingSubscription? stored = _items.Find(x =>
                x.RoutingSubscriptionId == subscription.RoutingSubscriptionId && SameScope(x, subscription));
            if (stored is not null && (stored.LastDeliveredUtc is null || stored.LastDeliveredUtc < deliveredUtc))
                stored.LastDeliveredUtc = deliveredUtc;
        }

        return Task.CompletedTask;
    }

    public Task<AlertRoutingSubscription?> GetByIdAsync(
        ScopeContext scope,
        Guid routingSubscriptionId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AlertRoutingSubscription? stored = _items.FirstOrDefault(x =>
                x.RoutingSubscriptionId == routingSubscriptionId && MatchesScope(x, scope));
            return Task.FromResult(stored is null ? null : Copy(stored));
        }
    }

    private static AlertRoutingSubscription Copy(AlertRoutingSubscription subscription) => new()
    {
        RoutingSubscriptionId = subscription.RoutingSubscriptionId,
        TenantId = subscription.TenantId,
        WorkspaceId = subscription.WorkspaceId,
        ProjectId = subscription.ProjectId,
        Name = subscription.Name,
        ChannelType = subscription.ChannelType,
        Destination = subscription.Destination,
        MinimumSeverity = subscription.MinimumSeverity,
        IsEnabled = subscription.IsEnabled,
        CreatedUtc = subscription.CreatedUtc,
        CreatedByActor = subscription.CreatedByActor,
        LastModifiedByActor = subscription.LastModifiedByActor,
        LastModifiedUtc = subscription.LastModifiedUtc,
        LastDeliveredUtc = subscription.LastDeliveredUtc,
        MetadataJson = subscription.MetadataJson,
    };

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
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AlertRoutingSubscription> result = _items
                .Where(x => x.TenantId == tenantId && x.WorkspaceId == workspaceId && x.ProjectId == projectId)
                .OrderByDescending(x => x.CreatedUtc)
                .Select(Copy)
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
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AlertRoutingSubscription> result = _items
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId &&
                    x.IsEnabled)
                .OrderByDescending(x => x.CreatedUtc)
                .Select(Copy)
                .ToList();
            return Task.FromResult<IReadOnlyList<AlertRoutingSubscription>>(result);
        }
    }
}
