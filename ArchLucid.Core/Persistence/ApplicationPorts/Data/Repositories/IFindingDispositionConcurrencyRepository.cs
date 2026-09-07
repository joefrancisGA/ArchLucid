using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Append disposition event and advance current pointer with optimistic concurrency (ADR 0076).</summary>
public interface IFindingDispositionConcurrencyRepository
{
    Task<FindingDispositionRecordResult> RecordAsync(
        FindingReviewEventRecord reviewEvent,
        byte[]? expectedCurrentRowVersion,
        CancellationToken cancellationToken = default);
}
