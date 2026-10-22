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
}
