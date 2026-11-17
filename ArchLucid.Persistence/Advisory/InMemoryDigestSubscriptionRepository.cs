
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Advisory;

/// <summary>
/// In-memory implementation of <see cref="IDigestSubscriptionRepository"/> for testing and storage-off mode.
/// Size-bounded at <see cref="MaxEntries"/>; oldest entries are trimmed from the front when the cap is exceeded.
/// All operations are thread-safe via an exclusive lock.
/// </summary>
public sealed class InMemoryDigestSubscriptionRepository : IDigestSubscriptionRepository
{
    private const int MaxEntries = 500;
    private readonly List<DigestSubscription> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(DigestSubscription subscription, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(subscription);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            _items.Add(Copy(subscription));
            if (_items.Count > MaxEntries)
                _items.RemoveRange(0, _items.Count - MaxEntries);
        }
        return Task.CompletedTask;
    }

    public Task UpdateAsync(DigestSubscription subscription, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(subscription);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            DigestSubscription? stored = _items.Find(x =>
                x.SubscriptionId == subscription.SubscriptionId && SameScope(x, subscription));
            if (stored is not null)
            {
                stored.Name = subscription.Name;
                stored.ChannelType = subscription.ChannelType;
                stored.Destination = subscription.Destination;
                stored.IsEnabled = subscription.IsEnabled;
                stored.CreatedUtc = subscription.CreatedUtc;
                stored.MetadataJson = subscription.MetadataJson;

                if (stored.LastDeliveredUtc is null || subscription.LastDeliveredUtc > stored.LastDeliveredUtc)
                    stored.LastDeliveredUtc = subscription.LastDeliveredUtc;
            }
        }

        return Task.CompletedTask;
    }

    public Task RecordDeliveryAsync(DigestSubscription subscription, DateTime deliveredUtc, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(subscription);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            DigestSubscription? stored = _items.Find(x =>
                x.SubscriptionId == subscription.SubscriptionId && SameScope(x, subscription));
            if (stored is not null && (stored.LastDeliveredUtc is null || stored.LastDeliveredUtc < deliveredUtc))
                stored.LastDeliveredUtc = deliveredUtc;
        }

        return Task.CompletedTask;
    }

    public Task<DigestSubscription?> GetByIdAsync(ScopeContext scope, Guid subscriptionId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            DigestSubscription? stored = _items.FirstOrDefault(x =>
                x.SubscriptionId == subscriptionId && MatchesScope(x, scope));
            return Task.FromResult(stored is null ? null : Copy(stored));
        }
    }

    public Task<IReadOnlyList<DigestSubscription>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<DigestSubscription> result = _items
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId)
                .OrderByDescending(x => x.CreatedUtc)
                .Select(Copy)
                .ToList();

            return Task.FromResult<IReadOnlyList<DigestSubscription>>(result);
        }
    }

    public Task<IReadOnlyList<DigestSubscription>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<DigestSubscription> result = _items
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId &&
                    x.IsEnabled)
                .OrderByDescending(x => x.CreatedUtc)
                .Select(Copy)
                .ToList();

            return Task.FromResult<IReadOnlyList<DigestSubscription>>(result);
        }
    }

    private static DigestSubscription Copy(DigestSubscription subscription) => new()
    {
        SubscriptionId = subscription.SubscriptionId,
        TenantId = subscription.TenantId,
        WorkspaceId = subscription.WorkspaceId,
        ProjectId = subscription.ProjectId,
        Name = subscription.Name,
        ChannelType = subscription.ChannelType,
        Destination = subscription.Destination,
        IsEnabled = subscription.IsEnabled,
        CreatedUtc = subscription.CreatedUtc,
        LastDeliveredUtc = subscription.LastDeliveredUtc,
        MetadataJson = subscription.MetadataJson,
    };

    private static bool MatchesScope(DigestSubscription subscription, ScopeContext scope) =>
        subscription.TenantId == scope.TenantId &&
        subscription.WorkspaceId == scope.WorkspaceId &&
        subscription.ProjectId == scope.ProjectId;

    private static bool SameScope(DigestSubscription stored, DigestSubscription incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
