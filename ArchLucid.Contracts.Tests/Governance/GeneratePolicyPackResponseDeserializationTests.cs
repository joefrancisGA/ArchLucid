using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GeneratePolicyPackResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_validation_warnings_yields_empty_list_not_null()
    {
        const string json = """
            {
              "curatedRulesDocumentJson": "{}",
              "validationWarnings": null
            }
            """;

        GeneratePolicyPackResponse response =
            JsonSerializer.Deserialize<GeneratePolicyPackResponse>(json, ContractJson.CamelCaseCompact)!;

        response.ValidationWarnings.Should().NotBeNull().And.BeEmpty();
    }
}
