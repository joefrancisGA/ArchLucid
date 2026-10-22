using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureDecisionRegisterResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_decisions_yields_empty_list_not_null()
    {
        const string json = """
            {
              "decisions": null
            }
            """;

        ArchitectureDecisionRegisterResponse response =
            JsonSerializer.Deserialize<ArchitectureDecisionRegisterResponse>(json, ContractJson.Default)!;

        response.Decisions.Should().NotBeNull().And.BeEmpty();
    }
}
