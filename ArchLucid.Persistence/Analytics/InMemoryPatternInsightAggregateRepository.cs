using ArchLucid.Contracts.Analytics;

namespace ArchLucid.Persistence.Analytics;

/// <summary>In-memory k-anonymous pattern aggregates for tests and in-memory storage mode (TB-880).</summary>
public sealed class InMemoryPatternInsightAggregateRepository : IPatternInsightAggregateRepository
{
    private static readonly IReadOnlyList<PatternInsightCard> SeedRows =
    [
        new PatternInsightCard
        {
            PatternKey = "private-endpoints-paas",
            IndustryVertical = "FinancialServices",
            Summary = "Peers often adopt private endpoints for SQL and storage planes in regulated workloads.",
            ContributingTenantCount = 12,
        },
        new PatternInsightCard
        {
            PatternKey = "three-tier-appservice",
            IndustryVertical = "General",
            Summary = "Three-tier App Service + Azure SQL remains a common modernization target across pilots.",
            ContributingTenantCount = 18,
        },
        new PatternInsightCard
        {
            PatternKey = "below-k-omitted",
            IndustryVertical = "General",
            Summary = "Should never surface to buyers.",
            ContributingTenantCount = 2,
        },
    ];

    /// <inheritdoc />
    public Task<IReadOnlyList<PatternInsightCard>> ListPublishedAsync(
        string? industryVertical,
        int minimumContributingTenants,
        CancellationToken cancellationToken)
    {
        IEnumerable<PatternInsightCard> query = SeedRows
            .Where(c => c.ContributingTenantCount >= minimumContributingTenants);

        if (!string.IsNullOrWhiteSpace(industryVertical))
        {
            string vertical = industryVertical.Trim();

            query = query.Where(c =>
                string.Equals(c.IndustryVertical, vertical, StringComparison.OrdinalIgnoreCase)
                || string.Equals(c.IndustryVertical, "General", StringComparison.OrdinalIgnoreCase));
        }

        return Task.FromResult<IReadOnlyList<PatternInsightCard>>(query.ToList());
    }
}
