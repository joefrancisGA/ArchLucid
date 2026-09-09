using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     In-memory storage fallback — append trail without pointer CAS (non-SQL demos).
///     This is <strong>not</strong> ADR 0076 current-pointer CAS. Register only on the in-memory demo host
///     (<c>InMemoryStorageProviderRegistrar.GovernanceFindings.FindingsInspect</c>). Working production uses
///     <see cref="SqlFindingDispositionConcurrencyRepository"/>.
/// </summary>
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
        IReadOnlyList<byte[]?> expectedCurrentRowVersions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvents);
        ArgumentNullException.ThrowIfNull(expectedCurrentRowVersions);

        if (reviewEvents.Count == 0)
            throw new ArgumentException("At least one review event is required.", nameof(reviewEvents));

        if (expectedCurrentRowVersions.Count != reviewEvents.Count)
        {
            throw new ArgumentException(
                "Expected row version count must match review event count.",
                nameof(expectedCurrentRowVersions));
        }

        List<byte[]> rowVersions = new(reviewEvents.Count);

        foreach (FindingReviewEventRecord reviewEvent in reviewEvents)
        {
            // Demo host: ignore expectedCurrentRowVersions — do not fake CAS success.
            FindingDispositionRecordResult result = await RecordAsync(
                reviewEvent,
                expectedCurrentRowVersion: null,
                cancellationToken);

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
