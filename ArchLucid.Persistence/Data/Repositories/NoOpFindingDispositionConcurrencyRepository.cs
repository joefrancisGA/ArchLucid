using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory storage fallback — append trail without pointer CAS (non-SQL demos).</summary>
public sealed class NoOpFindingDispositionConcurrencyRepository(IFindingReviewTrailRepository trailRepository)
    : IFindingDispositionConcurrencyRepository
{
    public async Task<FindingDispositionRecordResult> RecordAsync(
        FindingReviewEventRecord reviewEvent,
        byte[]? expectedCurrentRowVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvent);
        await trailRepository.AppendAsync(reviewEvent, cancellationToken);

        return new FindingDispositionRecordResult
        {
            Status = FindingDispositionRecordStatus.Recorded,
            NewCurrentRowVersion = [],
        };
    }

    public async Task<FindingDispositionBulkRecordResult> RecordBulkAsync(
        IReadOnlyList<FindingReviewEventRecord> reviewEvents,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvents);

        if (reviewEvents.Count == 0)
            throw new ArgumentException("At least one review event is required.", nameof(reviewEvents));

        List<byte[]> rowVersions = new(reviewEvents.Count);

        foreach (FindingReviewEventRecord reviewEvent in reviewEvents)
        {
            FindingDispositionRecordResult result = await RecordAsync(reviewEvent, expectedCurrentRowVersion: null, cancellationToken);

            if (result.Status == FindingDispositionRecordStatus.Conflict)
            {
                return new FindingDispositionBulkRecordResult
                {
                    Status = FindingDispositionRecordStatus.Conflict,
                    Conflict = result.Conflict,
                };
            }

            rowVersions.Add(result.NewCurrentRowVersion ?? []);
        }

        return new FindingDispositionBulkRecordResult
        {
            Status = FindingDispositionRecordStatus.Recorded,
            NewCurrentRowVersions = rowVersions,
        };
    }
}
