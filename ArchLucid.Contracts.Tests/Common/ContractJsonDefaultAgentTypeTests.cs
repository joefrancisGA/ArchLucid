using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class ContractJsonDefaultAgentTypeTests
{
    [Fact]
    public void Default_rejects_out_of_range_agent_type_ordinal_on_agent_result()
    {
        const string json = """
                            {
                              "resultId": "r1",
                              "taskId": "t1",
                              "runId": "run1",
                              "agentType": 99,
                              "claims": [],
                              "evidenceRefs": [],
                              "confidence": 0.5
                            }
                            """;

        Action act = () => JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent type value*");
    }
}
