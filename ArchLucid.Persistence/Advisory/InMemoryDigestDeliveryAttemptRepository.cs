
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Advisory;

/// <summary>
/// Thread-safe in-memory implementation of <see cref="IDigestDeliveryAttemptRepository"/> used for testing and local development.
/// </summary>
public sealed class InMemoryDigestDeliveryAttemptRepository : IDigestDeliveryAttemptRepository
{
    internal const int ListByDigestCap = DigestDeliveryAttemptListCap.Value;

    private readonly List<DigestDeliveryAttempt> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(DigestDeliveryAttempt attempt, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(attempt);
        _ = ct;
        lock (_gate)
            _items.Add(attempt);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(DigestDeliveryAttempt attempt, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(attempt);
        _ = ct;
        lock (_gate)
        {
            int i = _items.FindIndex(x => x.AttemptId == attempt.AttemptId && SameScope(x, attempt));
            if (i >= 0)
                _items[i] = attempt;
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<DigestDeliveryAttempt>> ListByDigestAsync(
        ScopeContext scope,
        Guid digestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<DigestDeliveryAttempt> result = _items
                .Where(x => x.DigestId == digestId && MatchesScope(x, scope))
                .OrderByDescending(x => x.AttemptedUtc)
                .Take(ListByDigestCap)
                .ToList();

            return Task.FromResult<IReadOnlyList<DigestDeliveryAttempt>>(result);
        }
    }

    public Task<IReadOnlyList<DigestDeliveryAttempt>> ListByDigestIdsAsync(
        IReadOnlyCollection<Guid> digestIds,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(digestIds);
        ct.ThrowIfCancellationRequested();

        if (digestIds.Count == 0)
            return Task.FromResult<IReadOnlyList<DigestDeliveryAttempt>>([]);

        HashSet<Guid> idSet = digestIds as HashSet<Guid> ?? digestIds.ToHashSet();

        lock (_gate)
        {
            List<DigestDeliveryAttempt> result = _items
                .Where(x =>
                    idSet.Contains(x.DigestId) &&
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId)
                .GroupBy(x => x.DigestId)
                .SelectMany(static g => g.OrderByDescending(x => x.AttemptedUtc).Take(ListByDigestCap))
                .OrderByDescending(x => x.AttemptedUtc)
                .ToList();

            return Task.FromResult<IReadOnlyList<DigestDeliveryAttempt>>(result);
        }
    }

    public Task<IReadOnlyList<DigestDeliveryAttempt>> ListBySubscriptionAsync(
        ScopeContext scope,
        Guid subscriptionId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;
        lock (_gate)
        {
            List<DigestDeliveryAttempt> result = _items
                .Where(x => x.SubscriptionId == subscriptionId && MatchesScope(x, scope))
                .OrderByDescending(x => x.AttemptedUtc)
                .Take(take)
                .ToList();

            return Task.FromResult<IReadOnlyList<DigestDeliveryAttempt>>(result);
        }
    }

    private static bool MatchesScope(DigestDeliveryAttempt attempt, ScopeContext scope) =>
        attempt.TenantId == scope.TenantId &&
        attempt.WorkspaceId == scope.WorkspaceId &&
        attempt.ProjectId == scope.ProjectId;

    private static bool SameScope(DigestDeliveryAttempt stored, DigestDeliveryAttempt incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
