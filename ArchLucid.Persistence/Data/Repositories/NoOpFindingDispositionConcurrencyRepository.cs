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
}
