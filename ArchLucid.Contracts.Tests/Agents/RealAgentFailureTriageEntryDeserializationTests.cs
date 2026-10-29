using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class RealAgentFailureTriageEntryDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "scenarioId": "timeout",
              "title": "Agent timed out",
              "failureClasses": null,
              "operatorNextSteps": null,
              "relatedDocPaths": null
            }
            """;

        RealAgentFailureTriageEntry? entry =
            JsonSerializer.Deserialize<RealAgentFailureTriageEntry>(json, ContractJson.CamelCaseCompact);

        entry.Should().NotBeNull();
        entry!.FailureClasses.Should().NotBeNull().And.BeEmpty();
        entry.OperatorNextSteps.Should().NotBeNull().And.BeEmpty();
        entry.RelatedDocPaths.Should().NotBeNull().And.BeEmpty();
    }
}
