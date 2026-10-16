using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingCorrelationResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "matchedPairs": null,
              "unmatchedLeftFindingIds": null,
              "unmatchedRightFindingIds": null
            }
            """;

        CrossReviewFindingCorrelationResult? result =
            JsonSerializer.Deserialize<CrossReviewFindingCorrelationResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.MatchedPairs.Should().NotBeNull().And.BeEmpty();
        result.UnmatchedLeftFindingIds.Should().NotBeNull().And.BeEmpty();
        result.UnmatchedRightFindingIds.Should().NotBeNull().And.BeEmpty();
    }
}
