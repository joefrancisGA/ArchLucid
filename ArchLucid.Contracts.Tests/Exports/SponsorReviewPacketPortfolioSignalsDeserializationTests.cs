using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class SponsorReviewPacketPortfolioSignalsDeserializationTests
{
    [Fact]
    public void Deserialize_null_next_actions_yields_empty_list_not_null()
    {
        const string json = """
            {
              "nextActions": null
            }
            """;

        SponsorReviewPacketPortfolioSignals? result =
            JsonSerializer.Deserialize<SponsorReviewPacketPortfolioSignals>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.NextActions.Should().NotBeNull().And.BeEmpty();
    }
}
