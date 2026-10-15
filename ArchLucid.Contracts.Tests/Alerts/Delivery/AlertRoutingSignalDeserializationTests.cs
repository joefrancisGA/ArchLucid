using System.Text.Json;

using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts.Delivery;

[Trait("Category", "Unit")]
public sealed class AlertRoutingSignalDeserializationTests
{
    [Fact]
    public void Deserialize_null_tags_yields_empty_list_not_null()
    {
        const string json = """
            {
              "severity": "High",
              "findingType": "security",
              "tags": null
            }
            """;

        AlertRoutingSignal signal =
            JsonSerializer.Deserialize<AlertRoutingSignal>(json, ContractJson.CamelCaseCompact)!;

        signal.Tags.Should().NotBeNull().And.BeEmpty();
    }
}
