using ArchLucid.Contracts.Analytics;

namespace ArchLucid.Application.Analytics;

/// <summary>
///     Serves k-anon pattern library cards (RAG-V1.1-004). Returns published aggregates only; nightly ETL fills SQL in a
///     follow-on change.
/// </summary>
public sealed class PatternInsightsService : IPatternInsightsService
{
    private static readonly IReadOnlyList<PatternInsightCard> SeedCards =
    [
        new PatternInsightCard
        {
            PatternKey = "private-endpoints-paas",
            IndustryVertical = "FinancialServices",
            Summary = "Peers often adopt private endpoints for SQL and storage planes in regulated workloads.",
            ContributingTenantCount = 12
        },
        new PatternInsightCard
        {
            PatternKey = "three-tier-appservice",
            IndustryVertical = "General",
            Summary = "Three-tier App Service + Azure SQL remains a common modernization target across pilots.",
            ContributingTenantCount = 18
        }
    ];

    public Task<IReadOnlyList<PatternInsightCard>> ListPublishedAsync(
        string? industryVertical,
        CancellationToken cancellationToken)
    {
        IEnumerable<PatternInsightCard> query = SeedCards.Where(c => c.ContributingTenantCount >= 5);

        if (!string.IsNullOrWhiteSpace(industryVertical))
        {
            string vertical = industryVertical.Trim();

            query = query.Where(c =>
                string.Equals(c.IndustryVertical, vertical, StringComparison.OrdinalIgnoreCase)
                || string.Equals(c.IndustryVertical, "General", StringComparison.OrdinalIgnoreCase));
        }

        IReadOnlyList<PatternInsightCard> result = query.ToList();

        return Task.FromResult(result);
    }
}
