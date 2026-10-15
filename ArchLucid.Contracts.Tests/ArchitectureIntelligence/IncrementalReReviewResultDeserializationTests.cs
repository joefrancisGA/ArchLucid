using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class IncrementalReReviewResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "specialistResults": null,
              "globalInvariantResults": null,
              "mergedFindingIds": null
            }
            """;

        IncrementalReReviewResult? result =
            JsonSerializer.Deserialize<IncrementalReReviewResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SpecialistResults.Should().NotBeNull().And.BeEmpty();
        result.GlobalInvariantResults.Should().NotBeNull().And.BeEmpty();
        result.MergedFindingIds.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_scope_yields_non_null_scope_not_null()
    {
        const string json = """
            {
              "scope": null
            }
            """;

        IncrementalReReviewResult? result =
            JsonSerializer.Deserialize<IncrementalReReviewResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Scope.Should().NotBeNull();
    }
}
