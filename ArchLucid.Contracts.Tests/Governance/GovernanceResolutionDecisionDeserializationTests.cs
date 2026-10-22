using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceResolutionDecisionDeserializationTests
{
    [Fact]
    public void Deserialize_null_candidates_yields_empty_list_not_null()
    {
        const string json = """
            {
              "candidates": null
            }
            """;

        GovernanceResolutionDecision? result =
            JsonSerializer.Deserialize<GovernanceResolutionDecision>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Candidates.Should().NotBeNull().And.BeEmpty();
    }
}
