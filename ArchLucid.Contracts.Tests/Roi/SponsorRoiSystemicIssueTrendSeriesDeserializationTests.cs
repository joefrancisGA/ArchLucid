using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorRoiSystemicIssueTrendSeriesDeserializationTests
{
    [Fact]
    public void Deserialize_null_points_yields_empty_list_not_null()
    {
        const string json = """
            {
              "points": null
            }
            """;

        SponsorRoiSystemicIssueTrendSeries? result =
            JsonSerializer.Deserialize<SponsorRoiSystemicIssueTrendSeries>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Points.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_populated_series_preserves_monthly_counts_in_order()
    {
        const string json = """
            {
              "findingId": "finding-123",
              "points": [
                {"monthKey": "2026-04", "count": 2},
                {"monthKey": "2026-05", "count": 5}
              ]
            }
            """;

        SponsorRoiSystemicIssueTrendSeries result =
            JsonSerializer.Deserialize<SponsorRoiSystemicIssueTrendSeries>(json, ContractJson.CamelCaseCompact)!;

        result.FindingId.Should().Be("finding-123");
        result.Points.Select(point => (point.MonthKey, point.Count))
            .Should().Equal(("2026-04", 2), ("2026-05", 5));
    }
}
