using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IFindingReviewTrailRepository
{
    Task AppendAsync(FindingReviewEventRecord reviewEvent, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FindingReviewEventRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken cancellationToken = default);
}
