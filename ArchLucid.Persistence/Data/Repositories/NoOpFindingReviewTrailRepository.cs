using ArchLucid.Persistence.Models;



namespace ArchLucid.Persistence.Data.Repositories;



/// <summary>In-memory / non-SQL hosts: review trail append and list no-op so composition can resolve the interface.</summary>

public sealed class NoOpFindingReviewTrailRepository : IFindingReviewTrailRepository

{

    public Task AppendAsync(FindingReviewEventRecord reviewEvent, CancellationToken cancellationToken = default)

        => Task.CompletedTask;



    public Task<IReadOnlyList<FindingReviewEventRecord>> ListByFindingAsync(

        Guid tenantId,

        string findingId,

        CancellationToken cancellationToken = default)

        => Task.FromResult<IReadOnlyList<FindingReviewEventRecord>>([]);

}


