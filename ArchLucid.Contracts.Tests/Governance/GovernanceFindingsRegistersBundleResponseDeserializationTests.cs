using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceFindingsRegistersBundleResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_registers_yields_non_null_nested_objects()
    {
        const string json = """
            {
              "riskRegister": null,
              "decisionRegister": null
            }
            """;

        GovernanceFindingsRegistersBundleResponse? response =
            JsonSerializer.Deserialize<GovernanceFindingsRegistersBundleResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.RiskRegister.Should().NotBeNull();
        response.DecisionRegister.Should().NotBeNull();
    }
}
