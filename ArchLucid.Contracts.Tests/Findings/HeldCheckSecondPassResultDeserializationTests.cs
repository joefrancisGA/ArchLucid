using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class HeldCheckSecondPassResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_unblocked_engine_types_yields_empty_list_not_null()
    {
        const string json = """
            {
              "inputCode": 0,
              "status": 0,
              "unblockedEngineTypes": null,
              "newDecisionGradeCount": 0
            }
            """;

        HeldCheckSecondPassResult? result =
            JsonSerializer.Deserialize<HeldCheckSecondPassResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.UnblockedEngineTypes.Should().NotBeNull().And.BeEmpty();
    }
}
