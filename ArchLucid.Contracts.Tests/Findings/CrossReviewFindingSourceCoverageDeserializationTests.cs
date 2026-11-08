using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingSourceCoverageDeserializationTests
{
    [Fact]
    public void Deserialize_null_agent_type_sets_yields_empty_sets_not_null()
    {
        const string json = """
            {
              "priorAgentTypes": null,
              "currentAgentTypes": null
            }
            """;

        CrossReviewFindingSourceCoverage? coverage =
            JsonSerializer.Deserialize<CrossReviewFindingSourceCoverage>(json, ContractJson.CamelCaseCompact);

        coverage.Should().NotBeNull();
        coverage!.PriorAgentTypes.Should().NotBeNull().And.BeEmpty();
        coverage.CurrentAgentTypes.Should().NotBeNull().And.BeEmpty();
        coverage.HasReducedCoverage.Should().BeFalse();
    }
}
