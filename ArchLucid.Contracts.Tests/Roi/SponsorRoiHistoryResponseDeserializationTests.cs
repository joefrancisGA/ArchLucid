using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorRoiHistoryResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_points_yields_empty_list_not_null()
    {
        const string json = """
            {
              "points": null
            }
            """;

        SponsorRoiHistoryResponse? result =
            JsonSerializer.Deserialize<SponsorRoiHistoryResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Points.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_populated_history_preserves_snapshot_value_and_run_mix()
    {
        const string json = """
            {
              "points": [
                {
                  "snapshotUtc": "2026-05-01T00:00:00Z",
                  "totalEstimatedUsdSavings": 125.50,
                  "realRunCount": 3,
                  "simulatorRunCount": 2,
                  "isMixedMode": true
                }
              ]
            }
            """;

        SponsorRoiHistoryResponse result =
            JsonSerializer.Deserialize<SponsorRoiHistoryResponse>(json, ContractJson.CamelCaseCompact)!;

        SponsorRoiHistoryPoint point = result.Points.Should().ContainSingle().Which;
        point.SnapshotUtc.Should().Be(new DateTimeOffset(2026, 5, 1, 0, 0, 0, TimeSpan.Zero));
        point.TotalEstimatedUsdSavings.Should().Be(125.50m);
        (point.RealRunCount, point.SimulatorRunCount, point.IsMixedMode).Should().Be((3, 2, true));
    }
}
