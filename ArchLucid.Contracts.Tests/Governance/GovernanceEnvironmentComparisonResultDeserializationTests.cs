using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Preview;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceEnvironmentComparisonResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "differences": null,
              "notes": null
            }
            """;

        GovernanceEnvironmentComparisonResult? result =
            JsonSerializer.Deserialize<GovernanceEnvironmentComparisonResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Differences.Should().NotBeNull().And.BeEmpty();
        result.Notes.Should().NotBeNull().And.BeEmpty();
    }
}
