using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IFindingReviewTrailRepository
{
    Task AppendAsync(FindingReviewEventRecord reviewEvent, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FindingReviewEventRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FindingReviewEventRecord>> ListSinceUtcAsync(
        Guid tenantId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Events for the given finding ids only. Preferred over <see cref="ListSinceUtcAsync" /> on run-scoped
    ///     paths (run detail disposition coverage): it seeks the (TenantId, FindingId, OccurredAtUtc) index
    ///     instead of scanning the tenant's whole event history.
    /// </summary>
    Task<IReadOnlyList<FindingReviewEventRecord>> ListForFindingIdsSinceUtcAsync(
        Guid tenantId,
        IReadOnlyCollection<string> findingIds,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default);
}
