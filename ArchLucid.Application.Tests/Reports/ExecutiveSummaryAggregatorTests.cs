using ArchLucid.Application.Reports;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.Reports;

[Trait("Category", "Unit")]
public sealed class ExecutiveSummaryAggregatorTests
{
    [Fact]
    public void Aggregate_WithOverlappingFindings_DeduplicatesByFindingId()
    {
        // Arrange
        var findings = new List<ExecutiveSummaryFinding>
        {
            new("finding-1", "run-1", 100m, 5),
            new("finding-1", "run-2", 100m, 5), // Duplicate
            new("finding-2", "run-1", 200m, 10),
            new("finding-3", "run-2", 150m, 2)
        };

        // Act
        var result = ExecutiveSummaryAggregator.Aggregate(findings);

        // Assert
        result.RawFindingCount.Should().Be(4);
        result.UniqueFindingCount.Should().Be(3);
        result.TotalCostSavingsUsd.Should().Be(450m); // 100 + 200 + 150
        result.TotalRiskReductionScore.Should().Be(17); // 5 + 10 + 2
    }

    [Fact]
    public void Aggregate_WithEmptyList_ReturnsZeros()
    {
        // Act
        var result = ExecutiveSummaryAggregator.Aggregate(new List<ExecutiveSummaryFinding>());

        // Assert
        result.RawFindingCount.Should().Be(0);
        result.UniqueFindingCount.Should().Be(0);
        result.TotalCostSavingsUsd.Should().Be(0m);
        result.TotalRiskReductionScore.Should().Be(0);
    }
}
