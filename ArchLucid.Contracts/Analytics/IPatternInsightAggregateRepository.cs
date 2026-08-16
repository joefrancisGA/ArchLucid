namespace ArchLucid.Contracts.Analytics;

/// <summary>Reads k-anonymous cross-tenant pattern aggregates (TB-880).</summary>
public interface IPatternInsightAggregateRepository
{
    Task<IReadOnlyList<PatternInsightCard>> ListPublishedAsync(
        string? industryVertical,
        int minimumContributingTenants,
        CancellationToken cancellationToken);
}
