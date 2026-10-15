using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "resultId": "r1",
              "taskId": "t1",
              "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              "agentType": 1,
              "claims": null,
              "evidenceRefs": null,
              "findings": null,
              "checklistCoverage": null,
              "withheldFindings": null
            }
            """;

        AgentResult result = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default)!;

        result.Claims.Should().NotBeNull().And.BeEmpty();
        result.EvidenceRefs.Should().NotBeNull().And.BeEmpty();
        result.Findings.Should().NotBeNull().And.BeEmpty();
        result.ChecklistCoverage.Should().NotBeNull().And.BeEmpty();
        result.WithheldFindings.Should().NotBeNull().And.BeEmpty();
    }
}
