using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class CrossTenantPortfolioSummaryResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_top_systemic_issues_yields_empty_list_not_null()
    {
        const string json = """
            {
              "totalEstimatedUsdSavings": 0,
              "totalSystemCount": 0,
              "totalCriticalFindings": 0,
              "topSystemicIssues": null,
              "isKAnonymitySatisfied": true
            }
            """;

        CrossTenantPortfolioSummaryResponse response =
            JsonSerializer.Deserialize<CrossTenantPortfolioSummaryResponse>(json, ContractJson.CamelCaseCompact)!;

        response.TopSystemicIssues.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_populated_portfolio_preserves_systemic_issue()
    {
        const string json = """
            {
              "totalSystemCount": 6,
              "isKAnonymitySatisfied": true,
              "topSystemicIssues": [{"category": "Reliability", "severity": "High", "count": 3}]
            }
            """;

        CrossTenantPortfolioSummaryResponse response =
            JsonSerializer.Deserialize<CrossTenantPortfolioSummaryResponse>(json, ContractJson.CamelCaseCompact)!;

        response.TotalSystemCount.Should().Be(6);
        response.IsKAnonymitySatisfied.Should().BeTrue();
        SystemicIssueSummary issue = response.TopSystemicIssues.Should().ContainSingle().Which;
        (issue.Category, issue.Severity, issue.Count).Should().Be(("Reliability", "High", 3));
    }
}
