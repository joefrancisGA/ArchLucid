using System.Text.Json;

using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Advisory;

[Trait("Category", "Unit")]
public sealed class ImprovementRecommendationDeserializationTests
{
    [Fact]
    public void Deserialize_null_supporting_id_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "supportingFindingIds": null,
              "supportingDecisionIds": null,
              "supportingArtifactIds": null
            }
            """;

        ImprovementRecommendation? result =
            JsonSerializer.Deserialize<ImprovementRecommendation>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SupportingFindingIds.Should().NotBeNull().And.BeEmpty();
        result.SupportingDecisionIds.Should().NotBeNull().And.BeEmpty();
        result.SupportingArtifactIds.Should().NotBeNull().And.BeEmpty();
    }
}
