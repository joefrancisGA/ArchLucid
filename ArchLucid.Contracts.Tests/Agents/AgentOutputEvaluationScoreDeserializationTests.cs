using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentOutputEvaluationScoreDeserializationTests
{
    [Fact]
    public void Deserialize_null_missing_keys_yields_empty_list_not_null()
    {
        const string json = """
            {
              "traceId": "t1",
              "agentType": 1,
              "structuralCompletenessRatio": 0.5,
              "isJsonParseFailure": false,
              "missingKeys": null
            }
            """;

        AgentOutputEvaluationScore score = JsonSerializer.Deserialize<AgentOutputEvaluationScore>(json, ContractJson.Default)!;

        score.MissingKeys.Should().NotBeNull().And.BeEmpty();
    }
}
