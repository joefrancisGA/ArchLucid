using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorRoiSummaryResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "systems": null,
              "topSystemicIssues": null,
              "historicalTrends": null
            }
            """;

        SponsorRoiSummaryResponse? result =
            JsonSerializer.Deserialize<SponsorRoiSummaryResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Systems.Should().NotBeNull().And.BeEmpty();
        result.TopSystemicIssues.Should().NotBeNull().And.BeEmpty();
        result.HistoricalTrends.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_optional_roi_nested_summaries_remain_null()
    {
        const string json = """
            {
              "realizedValue": null,
              "basisBreakdown": null,
              "orphanCandidates": null
            }
            """;

        SponsorRoiSummaryResponse? result =
            JsonSerializer.Deserialize<SponsorRoiSummaryResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.RealizedValue.Should().BeNull();
        result.BasisBreakdown.Should().BeNull();
        result.OrphanCandidates.Should().BeNull();
    }

    [Fact]
    public void Deserialize_null_business_impact_category_counts_remains_null()
    {
        const string json = """
            {
              "businessImpactCategoryCounts": null
            }
            """;

        SponsorRoiSummaryResponse? result =
            JsonSerializer.Deserialize<SponsorRoiSummaryResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.BusinessImpactCategoryCounts.Should().BeNull();
    }

    [Fact]
    public void Deserialize_populated_summary_preserves_lists_and_optional_evidence()
    {
        const string json = """
            {
              "systems": [{"systemName": "sample-system", "estimatedUsdSavings": 125.50}],
              "topSystemicIssues": [{"category": "Reliability", "count": 3}],
              "historicalTrends": [{"findingId": "finding-123"}],
              "realizedValue": {"findingsRemediatedCount30Days": 4},
              "basisBreakdown": {"openEstimatedUsd": 625.75},
              "orphanCandidates": {"candidateCount": 2},
              "businessImpactCategoryCounts": {"costThemeCount": 5}
            }
            """;

        SponsorRoiSummaryResponse result =
            JsonSerializer.Deserialize<SponsorRoiSummaryResponse>(json, ContractJson.CamelCaseCompact)!;

        SystemLatestRunRoi system = result.Systems.Should().ContainSingle().Which;
        system.SystemName.Should().Be("sample-system");
        system.EstimatedUsdSavings.Should().Be(125.50m);
        result.TopSystemicIssues.Should().ContainSingle().Which.Count.Should().Be(3);
        result.HistoricalTrends.Should().ContainSingle().Which.FindingId.Should().Be("finding-123");
        (result.RealizedValue?.FindingsRemediatedCount30Days).Should().Be(4);
        (result.BasisBreakdown?.OpenEstimatedUsd).Should().Be(625.75m);
        (result.OrphanCandidates?.CandidateCount).Should().Be(2);
        (result.BusinessImpactCategoryCounts?.CostThemeCount).Should().Be(5);
    }
}
