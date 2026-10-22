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
}
