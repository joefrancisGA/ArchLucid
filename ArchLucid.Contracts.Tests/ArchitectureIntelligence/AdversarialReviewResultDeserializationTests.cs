using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class AdversarialReviewResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "substantiatedFindings": null,
              "challenges": null
            }
            """;

        AdversarialReviewResult? result =
            JsonSerializer.Deserialize<AdversarialReviewResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SubstantiatedFindings.Should().NotBeNull().And.BeEmpty();
        result.Challenges.Should().NotBeNull().And.BeEmpty();
    }
}
