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
}
