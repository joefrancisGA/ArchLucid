using ArchLucid.Application.Analytics;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Persistence.Analytics;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analytics;

[Trait("Category", "Unit")]
public sealed class PatternInsightsServiceTests
{
    [Fact]
    public async Task ListPublishedAsync_omits_rows_below_k_threshold()
    {
        PatternInsightsService service = new(new InMemoryPatternInsightAggregateRepository());

        IReadOnlyList<PatternInsightCard> cards =
            await service.ListPublishedAsync(null, CancellationToken.None);

        cards.Should().NotContain(c => c.PatternKey == "below-k-omitted");
        cards.Should().OnlyContain(c => c.ContributingTenantCount >= PatternInsightsService.DefaultMinimumContributingTenants);
    }
}
