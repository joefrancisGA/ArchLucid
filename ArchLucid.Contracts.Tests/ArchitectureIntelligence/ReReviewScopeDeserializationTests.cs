using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReReviewScopeDeserializationTests
{
    [Fact]
    public void Deserialize_null_affected_element_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "affectedElementIds": null
            }
            """;

        ReReviewScope? scope =
            JsonSerializer.Deserialize<ReReviewScope>(json, ContractJson.CamelCaseCompact);

        scope.Should().NotBeNull();
        scope!.AffectedElementIds.Should().NotBeNull().And.BeEmpty();
    }
}
