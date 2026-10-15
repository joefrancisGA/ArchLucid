using System.Text.Json;

using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts.Delivery;

[Trait("Category", "Unit")]
public sealed class AlertRoutingSignalDeserializationTests
{
    [Fact]
    public void Deserialize_null_finding_type_yields_empty_string_not_null()
    {
        const string json = """
            {
              "severity": "High",
              "findingType": null,
              "tags": []
            }
            """;

        AlertRoutingSignal signal =
            JsonSerializer.Deserialize<AlertRoutingSignal>(json, ContractJson.CamelCaseCompact)!;

        signal.FindingType.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_severity_yields_empty_string_not_null()
    {
        const string json = """
            {
              "severity": null,
              "findingType": "security",
              "tags": []
            }
            """;

        AlertRoutingSignal signal =
            JsonSerializer.Deserialize<AlertRoutingSignal>(json, ContractJson.CamelCaseCompact)!;

        signal.Severity.Should().BeEmpty();
    }

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
