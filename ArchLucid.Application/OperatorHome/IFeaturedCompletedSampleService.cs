namespace ArchLucid.Application.OperatorHome;

public interface IFeaturedCompletedSampleService
{
    Task<FeaturedCompletedSampleSnapshot> GetSnapshotAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<FeaturedCompletedSampleCandidate>> ListEligibleCandidatesAsync(CancellationToken cancellationToken);

    Task<FeaturedCompletedSampleSnapshot> SetSelectedRunIdAsync(Guid runId, CancellationToken cancellationToken);

    Task<FeaturedCompletedSampleSnapshot> ClearSelectionAsync(CancellationToken cancellationToken);
}
