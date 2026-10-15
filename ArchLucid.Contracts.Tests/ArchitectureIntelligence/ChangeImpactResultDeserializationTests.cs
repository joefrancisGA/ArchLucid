using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ChangeImpactResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_impacted_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "recommendationId": "rec-1",
              "impactedItems": null
            }
            """;

        ChangeImpactResult? result =
            JsonSerializer.Deserialize<ChangeImpactResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ImpactedItems.Should().NotBeNull().And.BeEmpty();
    }
}
