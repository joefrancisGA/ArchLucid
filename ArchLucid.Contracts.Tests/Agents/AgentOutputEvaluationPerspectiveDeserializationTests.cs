using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentOutputEvaluationPerspectiveDeserializationTests
{
    [Fact]
    public void Deserialize_null_scores_yields_empty_list_not_null()
    {
        const string json = """
            {
              "authority": "recorded",
              "scores": null
            }
            """;

        AgentOutputEvaluationPerspective? result =
            JsonSerializer.Deserialize<AgentOutputEvaluationPerspective>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Scores.Should().NotBeNull().And.BeEmpty();
    }
}
