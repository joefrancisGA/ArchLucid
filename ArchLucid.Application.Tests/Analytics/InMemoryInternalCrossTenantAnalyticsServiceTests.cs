using ArchLucid.Application.Analytics;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analytics;

public sealed class InMemoryInternalCrossTenantAnalyticsServiceTests
{
    [Fact]
    public async Task GetSummaryAsync_returns_empty_shaped_summary()
    {
        InMemoryInternalCrossTenantAnalyticsService sut = new();

        InternalCrossTenantAnalyticsSummary summary = await sut.GetSummaryAsync(CancellationToken.None);

        summary.CatalogsAggregated.Should().Be(0);
        summary.TotalRunsNonArchived.Should().Be(0);
        summary.TotalCompletedRuns.Should().Be(0);
        summary.AverageCompletedRunDurationSeconds.Should().BeNull();
        summary.TotalEstimatedEngineeringHoursSaved.Should().Be(0);
    }
}
