using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class ComplianceFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_affected_resources_yields_empty_list_not_null()
    {
        const string json = """
            {
              "rulePackId": "pack",
              "rulePackVersion": "1",
              "ruleId": "rule",
              "controlId": "ctrl",
              "controlName": "name",
              "appliesToCategory": "cat",
              "affectedResources": null
            }
            """;

        ComplianceFindingPayload? payload =
            JsonSerializer.Deserialize<ComplianceFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.AffectedResources.Should().NotBeNull().And.BeEmpty();
    }
}
