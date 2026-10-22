using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureDecisionRegisterEntryDeserializationTests
{
    [Fact]
    public void Deserialize_null_supporting_finding_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "supportingFindingIds": null
            }
            """;

        ArchitectureDecisionRegisterEntry? result =
            JsonSerializer.Deserialize<ArchitectureDecisionRegisterEntry>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SupportingFindingIds.Should().NotBeNull().And.BeEmpty();
    }
}
