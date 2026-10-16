using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningImprovementOpportunitiesResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_opportunities_yields_empty_list_not_null()
    {
        const string json = """
            {
              "opportunities": null
            }
            """;

        ProductLearningImprovementOpportunitiesResponse? result =
            JsonSerializer.Deserialize<ProductLearningImprovementOpportunitiesResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Opportunities.Should().NotBeNull().And.BeEmpty();
    }
}
