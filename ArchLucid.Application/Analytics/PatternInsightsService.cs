using ArchLucid.Contracts.Analytics;

namespace ArchLucid.Application.Analytics;

/// <summary>
///     Serves k-anon pattern library cards (RAG-V1.1-004 / TB-880). Returns published SQL aggregates only.
/// </summary>
public sealed class PatternInsightsService(IPatternInsightAggregateRepository repository) : IPatternInsightsService
{
    public const int DefaultMinimumContributingTenants = 5;

    private readonly IPatternInsightAggregateRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public Task<IReadOnlyList<PatternInsightCard>> ListPublishedAsync(
        string? industryVertical,
        CancellationToken cancellationToken) =>
        _repository.ListPublishedAsync(
            industryVertical,
            DefaultMinimumContributingTenants,
            cancellationToken);
}
