using System.Text.Json;

using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts.Delivery;

[Trait("Category", "Unit")]
public sealed class AlertRoutingCriteriaDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "severities": null,
              "findingTypes": null,
              "tags": null
            }
            """;

        AlertRoutingCriteria criteria =
            JsonSerializer.Deserialize<AlertRoutingCriteria>(json, ContractJson.CamelCaseCompact)!;

        criteria.Severities.Should().NotBeNull().And.BeEmpty();
        criteria.FindingTypes.Should().NotBeNull().And.BeEmpty();
        criteria.Tags.Should().NotBeNull().And.BeEmpty();
    }
}
