using ArchLucid.Application.Reports;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.Reports;

[Trait("Category", "Unit")]
public sealed class ExecutiveSummaryAggregatorTests
{
    [Fact]
    public void Aggregate_WithOverlappingFindings_TakesMaxValuesPerFinding()
    {
        // Arrange
        var findings = new List<ExecutiveSummaryFinding>
        {
            new("finding-1", "run-1", "Cost", 100m, 5),
            new("finding-1", "run-2", "Cost", 150m, 8), // Same finding, higher values
            new("finding-1", "run-3", "Cost", 120m, 6), // Same finding, lower values
            new("finding-2", "run-1", "Security", 200m, 10),
            new("finding-3", "run-2", "Reliability", 150m, 2)
        };

        // Act
        var result = ExecutiveSummaryAggregator.Aggregate(findings);

        // Assert
        result.RawFindingCount.Should().Be(5);
        result.UniqueFindingCount.Should().Be(3);
        result.TotalCostSavingsUsd.Should().Be(500m); // 150 + 200 + 150
        result.TotalRiskReductionScore.Should().Be(20); // 8 + 10 + 2
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
