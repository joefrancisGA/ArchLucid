using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunManifestDecisionExplainabilityRowDeserializationTests
{
    [Fact]
    public void Deserialize_null_supporting_finding_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "supportingFindingIds": null
            }
            """;

        RunManifestDecisionExplainabilityRow? row =
            JsonSerializer.Deserialize<RunManifestDecisionExplainabilityRow>(json, ContractJson.CamelCaseCompact);

        row.Should().NotBeNull();
        row!.SupportingFindingIds.Should().NotBeNull().And.BeEmpty();
    }
}
