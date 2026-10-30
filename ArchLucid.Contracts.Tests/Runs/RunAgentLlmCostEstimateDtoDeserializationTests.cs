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
        estimate.TokenCounts.Prompt.Should().Be(0);
        estimate.TokenCounts.Completion.Should().Be(0);
    }

    [Theory]
    [InlineData("{}", 0L, 0L)]
    [InlineData("{\"tokenCounts\":{\"prompt\":123,\"completion\":45}}", 123L, 45L)]
    public void Deserialize_token_counts_handles_absent_or_valid_totals(string json, long prompt, long completion)
    {
        RunAgentLlmCostEstimateDto? estimate =
            JsonSerializer.Deserialize<RunAgentLlmCostEstimateDto>(json, ContractJson.CamelCaseCompact);

        estimate.Should().NotBeNull();
        estimate!.TokenCounts.Should().NotBeNull();
        estimate.TokenCounts.Prompt.Should().Be(prompt);
        estimate.TokenCounts.Completion.Should().Be(completion);
    }
}
