
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
            _items.Add(subscription);
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
            int i = _items.FindIndex(x => x.SubscriptionId == subscription.SubscriptionId && SameScope(x, subscription));
            if (i >= 0)
                _items[i] = subscription;
        }

        return Task.CompletedTask;
    }

    public Task<DigestSubscription?> GetByIdAsync(ScopeContext scope, Guid subscriptionId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
            return Task.FromResult(_items.FirstOrDefault(x => x.SubscriptionId == subscriptionId && MatchesScope(x, scope)));
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
                .ToList();

            return Task.FromResult<IReadOnlyList<DigestSubscription>>(result);
        }
    }

    private static bool MatchesScope(DigestSubscription subscription, ScopeContext scope) =>
        subscription.TenantId == scope.TenantId &&
        subscription.WorkspaceId == scope.WorkspaceId &&
        subscription.ProjectId == scope.ProjectId;

    private static bool SameScope(DigestSubscription stored, DigestSubscription incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
