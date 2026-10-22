using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunAgentLlmCostEstimateDtoDeserializationTests
{
    [Fact]
    public void Deserialize_null_token_counts_yields_non_null_token_counts_not_null()
    {
        const string json = """
            {
              "tokenCounts": null
            }
            """;

        RunAgentLlmCostEstimateDto? estimate =
            JsonSerializer.Deserialize<RunAgentLlmCostEstimateDto>(json, ContractJson.CamelCaseCompact);

        estimate.Should().NotBeNull();
        estimate!.TokenCounts.Should().NotBeNull();
    }
}
