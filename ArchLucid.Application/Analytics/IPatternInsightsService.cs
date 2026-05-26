using ArchLucid.Contracts.Analytics;

namespace ArchLucid.Application.Analytics;

public interface IPatternInsightsService
{
    Task<IReadOnlyList<PatternInsightCard>> ListPublishedAsync(
        string? industryVertical,
        CancellationToken cancellationToken);
}
