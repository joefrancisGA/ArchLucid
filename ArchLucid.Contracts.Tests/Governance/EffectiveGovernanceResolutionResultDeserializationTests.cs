using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class EffectiveGovernanceResolutionResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "decisions": null,
              "conflicts": null,
              "notes": null
            }
            """;

        EffectiveGovernanceResolutionResult? result =
            JsonSerializer.Deserialize<EffectiveGovernanceResolutionResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Decisions.Should().NotBeNull().And.BeEmpty();
        result.Conflicts.Should().NotBeNull().And.BeEmpty();
        result.Notes.Should().NotBeNull().And.BeEmpty();
    }
}
