using System.Collections.Concurrent;

using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition.Support;

/// <summary>
/// Thread-safe in-memory trail for TB-988 concurrent disposition race tests.
/// </summary>
internal sealed class ConcurrentFindingReviewTrailRepository : IFindingReviewTrailRepository
{
    private readonly ConcurrentBag<FindingReviewEventRecord> _events = [];

    public Task AppendAsync(FindingReviewEventRecord reviewEvent, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvent);
        _events.Add(Clone(reviewEvent));
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<FindingReviewEventRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        List<FindingReviewEventRecord> matches = _events
            .Where(record =>
                record.TenantId == tenantId &&
                string.Equals(record.FindingId, findingId.Trim(), StringComparison.Ordinal))
            .OrderByDescending(record => record.OccurredAtUtc)
            .Select(Clone)
            .ToList();

        return Task.FromResult<IReadOnlyList<FindingReviewEventRecord>>(matches);
    }

    public Task<IReadOnlyList<FindingReviewEventRecord>> ListSinceUtcAsync(
        Guid tenantId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default)
    {
        List<FindingReviewEventRecord> matches = _events
            .Where(record => record.TenantId == tenantId && record.OccurredAtUtc >= sinceUtc)
            .OrderByDescending(record => record.OccurredAtUtc)
            .Select(Clone)
            .ToList();

        return Task.FromResult<IReadOnlyList<FindingReviewEventRecord>>(matches);
    }

    public Task<IReadOnlyList<FindingReviewEventRecord>> ListForFindingIdsSinceUtcAsync(
        Guid tenantId,
        IReadOnlyCollection<string> findingIds,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findingIds);

        HashSet<string> normalizedIds = findingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<FindingReviewEventRecord> matches = _events
            .Where(record =>
                record.TenantId == tenantId &&
                normalizedIds.Contains(record.FindingId) &&
                record.OccurredAtUtc >= sinceUtc)
            .OrderByDescending(record => record.OccurredAtUtc)
            .Select(Clone)
            .ToList();

        return Task.FromResult<IReadOnlyList<FindingReviewEventRecord>>(matches);
    }

    public int EventCount => _events.Count;

    private static FindingReviewEventRecord Clone(FindingReviewEventRecord source)
    {
        return new FindingReviewEventRecord
        {
            EventId = source.EventId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            FindingId = source.FindingId,
            ReviewerUserId = source.ReviewerUserId,
            Action = source.Action,
            Notes = source.Notes,
            OccurredAtUtc = source.OccurredAtUtc,
            RunId = source.RunId,
            Disposition = source.Disposition,
            RevisitDueUtc = source.RevisitDueUtc,
            EvidenceRequestText = source.EvidenceRequestText,
        };
    }
}
