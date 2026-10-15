using System.Text.Json;

using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class CompositeAlertRuleDeserializationTests
{
    [Fact]
    public void Deserialize_null_conditions_yields_empty_list_not_null()
    {
        const string json = """
            {
              "name": "test",
              "conditions": null
            }
            """;

        CompositeAlertRule? result =
            JsonSerializer.Deserialize<CompositeAlertRule>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Conditions.Should().NotBeNull().And.BeEmpty();
    }
}
