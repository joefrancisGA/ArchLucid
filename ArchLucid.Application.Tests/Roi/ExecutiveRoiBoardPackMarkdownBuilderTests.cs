using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecutiveRoiBoardPackMarkdownBuilderTests
{
    [Fact]
    public void Build_includes_hero_savings_top_issues_and_system_table()
    {
        ExecutiveRoiSummaryResponse summary = new()
        {
            TotalEstimatedUsdSavings = 12500m,
            SystemCount = 1,
            LatestRunCount = 1,
            TopSystemicIssues =
            [
                new SystemicIssueSummary { Category = "Security", Severity = "Critical", Count = 3 }
            ],
            EaDiscountMultiplier = 0.85m,
            SavingsPricingBasis = ExecutiveRoiSavingsPricingBasis.EaAdjusted,
            Systems =
            [
                new SystemLatestRunRoi
                {
                    SystemName = "Payments",
                    RunId = "11111111-1111-1111-1111-111111111111",
                    CommittedUtc = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc),
                    EstimatedUsdSavings = 12500m
                }
            ]
        };

        string markdown = ExecutiveRoiBoardPackMarkdownBuilder.Build(
            "Acme Corp",
            new DateTime(2026, 5, 24, 10, 0, 0, DateTimeKind.Utc),
            summary,
            "00-abc-trace");

        markdown.Should().Contain("Acme Corp");
        markdown.Should().Contain("$12,500");
        markdown.Should().Contain("EA-adjusted");
        markdown.Should().Contain("0.85");
        markdown.Should().Contain("Security");
        markdown.Should().Contain("Payments");
        markdown.Should().Contain("00-abc-trace");
    }
}
